import { AdEvent } from "./analytics";

/* ──────────────────────────────────────────────────────────────────────────
 *  Server-side analytics store
 *
 *  Backed by Upstash Redis (REST API, no client library, free tier 10K
 *  req/day) when env vars are set; otherwise uses an in-memory map that
 *  persists within a single serverless container's lifetime.
 *
 *  Required env vars for persistence:
 *    UPSTASH_REDIS_REST_URL   e.g. https://us1-pet-12345.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN
 * ────────────────────────────────────────────────────────────────────────── */

const COUNTER_KEYS: AdEvent[] = ["view", "cta_click", "submit", "share", "preview_open"];

interface MemoryStore {
  counters: Map<string, Partial<Record<AdEvent, number>>>;
  events: Map<string, Array<{ event: AdEvent; at: number; source?: string }>>;
  ads: Set<string>;
}

const memory: MemoryStore =
  (globalThis as unknown as { __bjaMemory?: MemoryStore }).__bjaMemory ?? {
    counters: new Map(),
    events: new Map(),
    ads: new Set(),
  };
(globalThis as unknown as { __bjaMemory?: MemoryStore }).__bjaMemory = memory;

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function hasUpstash(): boolean {
  return !!(UP_URL && UP_TOKEN);
}

async function up(...command: (string | number)[]): Promise<unknown> {
  if (!hasUpstash()) throw new Error("Upstash not configured");
  const r = await fetch(`${UP_URL}/${command.map((c) => encodeURIComponent(String(c))).join("/")}`, {
    headers: { Authorization: `Bearer ${UP_TOKEN}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Upstash ${r.status}: ${await r.text()}`);
  const data = (await r.json()) as { result: unknown };
  return data.result;
}

export async function recordEvent(
  adId: string,
  event: AdEvent,
  source?: string,
): Promise<void> {
  const at = Date.now();
  const eventJson = JSON.stringify({ event, at, source });

  if (hasUpstash()) {
    // Fire and forget — don't block client on network
    await Promise.all([
      up("hincrby", `ad:${adId}:counters`, event, 1),
      up("rpush", `ad:${adId}:events`, eventJson),
      up("ltrim", `ad:${adId}:events`, -100, -1),
      up("sadd", "ads", adId),
    ]).catch(() => {
      // Network failure — fall through to memory
      writeMemory(adId, event, at, source);
    });
    return;
  }
  writeMemory(adId, event, at, source);
}

function writeMemory(adId: string, event: AdEvent, at: number, source?: string): void {
  memory.ads.add(adId);
  const cur = memory.counters.get(adId) ?? {};
  cur[event] = (cur[event] ?? 0) + 1;
  memory.counters.set(adId, cur);
  const evs = memory.events.get(adId) ?? [];
  evs.push({ event, at, source });
  while (evs.length > 100) evs.shift();
  memory.events.set(adId, evs);
}

export interface StoredAnalytics {
  adId: string;
  counters: Record<AdEvent, number>;
  recent: Array<{ event: AdEvent; at: number; source?: string }>;
  conversionRate: number;
  ctaClickRate: number;
}

function buildEmpty(adId: string): StoredAnalytics {
  return {
    adId,
    counters: { view: 0, cta_click: 0, submit: 0, share: 0, preview_open: 0 },
    recent: [],
    conversionRate: 0,
    ctaClickRate: 0,
  };
}

function deriveRates(out: StoredAnalytics): StoredAnalytics {
  const v = out.counters.view || 0;
  out.conversionRate = v ? out.counters.submit / v : 0;
  out.ctaClickRate = v ? out.counters.cta_click / v : 0;
  return out;
}

export async function getAnalytics(adId: string): Promise<StoredAnalytics> {
  if (hasUpstash()) {
    try {
      const [countersRaw, eventsRaw] = await Promise.all([
        up("hgetall", `ad:${adId}:counters`) as Promise<string[] | Record<string, string>>,
        up("lrange", `ad:${adId}:events`, 0, -1) as Promise<string[]>,
      ]);
      const counters = buildEmpty(adId).counters;
      // Upstash returns either an array [k1, v1, k2, v2, ...] or a record
      if (Array.isArray(countersRaw)) {
        for (let i = 0; i < countersRaw.length; i += 2) {
          const k = countersRaw[i] as AdEvent;
          const v = parseInt(String(countersRaw[i + 1] ?? "0"), 10) || 0;
          if (COUNTER_KEYS.includes(k)) counters[k] = v;
        }
      } else if (countersRaw && typeof countersRaw === "object") {
        for (const [k, v] of Object.entries(countersRaw)) {
          if (COUNTER_KEYS.includes(k as AdEvent)) counters[k as AdEvent] = parseInt(String(v), 10) || 0;
        }
      }
      const recent = (eventsRaw ?? [])
        .slice(-30)
        .map((s) => {
          try {
            return JSON.parse(s) as { event: AdEvent; at: number; source?: string };
          } catch {
            return null;
          }
        })
        .filter((e): e is { event: AdEvent; at: number; source?: string } => !!e);
      return deriveRates({ adId, counters, recent, conversionRate: 0, ctaClickRate: 0 });
    } catch {
      // Fall through to memory
    }
  }
  const out = buildEmpty(adId);
  const mc = memory.counters.get(adId);
  if (mc) for (const k of COUNTER_KEYS) out.counters[k] = mc[k] ?? 0;
  out.recent = (memory.events.get(adId) ?? []).slice(-30);
  return deriveRates(out);
}

export async function listAdIds(): Promise<string[]> {
  if (hasUpstash()) {
    try {
      const r = (await up("smembers", "ads")) as string[];
      return r ?? [];
    } catch {
      // fall through
    }
  }
  return Array.from(memory.ads);
}
