"use client";

/* ──────────────────────────────────────────────────────────────────────────
 *  Client-side analytics tracker
 *
 *  Fires events to /api/track. The endpoint persists in Upstash Redis if
 *  UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are configured;
 *  otherwise it returns 200 and the operator's per-ad metrics are missing
 *  cross-device visits (still works for same-device visits via /api/track's
 *  in-memory fallback).
 * ────────────────────────────────────────────────────────────────────────── */

export type AdEvent = "view" | "cta_click" | "submit" | "share" | "preview_open";

export interface TrackPayload {
  adId: string;
  event: AdEvent;
  source?: string;
  meta?: Record<string, string | number | boolean | undefined>;
}

export async function track(payload: TrackPayload): Promise<void> {
  try {
    // Capture UTM-like source from the URL if present
    let source = payload.source;
    if (!source && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      source =
        params.get("utm_source") ||
        params.get("src") ||
        (document.referrer ? new URL(document.referrer).hostname : undefined) ||
        undefined;
    }
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ ...payload, source }),
    });
  } catch {
    /* tracking errors must never block the user flow */
  }
}

export interface AdAnalytics {
  adId: string;
  counters: {
    view: number;
    cta_click: number;
    submit: number;
    share: number;
    preview_open: number;
  };
  recent: Array<{
    event: AdEvent;
    at: number;
    source?: string;
  }>;
  /** Derived: submits / views */
  conversionRate: number;
  /** Derived: cta_click / views */
  ctaClickRate: number;
}

export interface AnalyticsRollup {
  ads: AdAnalytics[];
  totals: AdAnalytics["counters"];
}

export async function fetchAnalytics(adId: string): Promise<AdAnalytics | null> {
  try {
    const r = await fetch(`/api/analytics/${encodeURIComponent(adId)}`);
    if (!r.ok) return null;
    return (await r.json()) as AdAnalytics;
  } catch {
    return null;
  }
}

export async function fetchAnalyticsRollup(): Promise<AnalyticsRollup | null> {
  try {
    const r = await fetch("/api/analytics");
    if (!r.ok) return null;
    return (await r.json()) as AnalyticsRollup;
  } catch {
    return null;
  }
}
