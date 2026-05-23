"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Loader2, RefreshCcw } from "lucide-react";
import { AnalyticsRollup, fetchAnalyticsRollup } from "@/lib/analytics";
import { useLeads } from "@/lib/leads";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function relTime(t: number): string {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const forms = useLeads((s) => s.forms);

  const load = async () => {
    setLoading(true);
    const r = await fetchAnalyticsRollup();
    setData(r);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const formById = (id: string) => forms.find((f) => f.id === id);

  const sortedAds = data
    ? [...data.ads].sort((a, b) => (b.counters.view ?? 0) - (a.counters.view ?? 0))
    : [];

  return (
    <main className="min-h-[100dvh] mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="btn-ghost h-9">
          <ArrowLeft className="size-4" /> Home
        </Link>
        <button onClick={load} className="btn-ghost h-9">
          <RefreshCcw className="size-4" /> Refresh
        </button>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-black flex items-center gap-2">
          <BarChart3 className="size-7 text-brand" /> Analytics
        </h1>
        <p className="text-white/60 mt-1 text-sm">
          Views, CTA taps, form submissions, and shares per ad.
        </p>
      </header>

      {loading ? (
        <div className="panel p-6 text-center text-white/60">
          <Loader2 className="size-4 animate-spin inline mr-2" /> Loading…
        </div>
      ) : !data || data.ads.length === 0 ? (
        <div className="panel p-6 text-sm text-white/60 text-center">
          No analytics yet. Ship an ad → use its lead-form URL in your Meta/IG/TikTok bio →
          views and submits start showing here.
          <div className="mt-3 text-[11px] text-white/40">
            Persistent storage needs <code className="text-brand">UPSTASH_REDIS_REST_URL</code> +
            <code className="text-brand ml-1">UPSTASH_REDIS_REST_TOKEN</code> in Vercel env vars
            (free tier).
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {(["view", "cta_click", "submit", "share"] as const).map((k) => (
              <div key={k} className="panel p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-white/40">{k.replace("_", " ")}</div>
                <div className="text-2xl font-black text-white mt-1">{data.totals[k] ?? 0}</div>
              </div>
            ))}
          </div>

          <ul className="space-y-2">
            {sortedAds.map((a) => {
              const f = formById(a.adId);
              return (
                <li key={a.adId} className="panel p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">
                        {f?.brand.companyName ?? "Ad"} — {f?.brand.offer ?? a.adId}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        id {a.adId}
                        {f && ` · ${relTime(f.createdAt)}`}
                      </div>
                    </div>
                    <div className="text-xs text-white/60 shrink-0">
                      conv {pct(a.conversionRate)}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-1 text-[11px]">
                    {(["view", "cta_click", "submit", "share", "preview_open"] as const).map((k) => (
                      <div key={k} className="rounded bg-white/5 px-1 py-1.5 text-center">
                        <div className="text-white/40 text-[9px] uppercase">{k.replace("_", " ")}</div>
                        <div className="font-bold text-white">{a.counters[k] ?? 0}</div>
                      </div>
                    ))}
                  </div>
                  {a.recent.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-[11px] text-brand cursor-pointer">
                        Recent events
                      </summary>
                      <ul className="mt-1 space-y-0.5 text-[10px] text-white/60 max-h-32 overflow-auto">
                        {a.recent
                          .slice()
                          .reverse()
                          .map((e, i) => (
                            <li key={i}>
                              {relTime(e.at)} ago · <b className="text-white/80">{e.event}</b>
                              {e.source ? ` · from ${e.source}` : ""}
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
