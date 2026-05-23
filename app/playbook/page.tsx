"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Wand2 } from "lucide-react";
import { PLAYBOOK, Platform, platformsInPlaybook } from "@/lib/playbook";
import { useEditor } from "@/lib/store";

const ALL_PLATFORMS: Platform[] = platformsInPlaybook();

export default function PlaybookPage() {
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const category = useEditor((s) => s.project.brand.category);
  const [showOnlyForCategory, setShowOnlyForCategory] = useState(false);

  const filtered = useMemo(() => {
    return PLAYBOOK.filter((p) => {
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (showOnlyForCategory) {
        const cat = category.toLowerCase();
        return p.goodFor.some((g) => cat.includes(g) || g.includes(cat));
      }
      return true;
    });
  }, [platformFilter, showOnlyForCategory, category]);

  const useInQuick = (id: string) => {
    const p = PLAYBOOK.find((x) => x.id === id);
    if (!p) return;
    const params = new URLSearchParams({
      brief: p.promptBrief,
      tone: p.tone,
      aspect: p.aspect,
    });
    window.location.href = `/quick?${params.toString()}`;
  };

  return (
    <main className="min-h-[100dvh] mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Link href="/" className="btn-ghost h-9">
          <ArrowLeft className="size-4" /> Home
        </Link>
        <Link href="/quick" className="btn-primary h-9">
          <Wand2 className="size-4" /> One-prompt mode
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Cross-platform Ad Playbook</h1>
        <p className="text-white/60 mt-2 text-sm max-w-2xl">
          Every battle-tested ad format across Meta, TikTok, YouTube Shorts, YouTube Standard, LinkedIn,
          Pinterest, and Snapchat. Tap <span className="text-brand">Use in /quick</span> on any pattern
          to pre-fill the one-prompt page with its brief.
        </p>
      </header>

      <div className="flex gap-1 flex-wrap mb-3">
        <button
          onClick={() => setPlatformFilter("all")}
          className={`btn-ghost h-8 text-xs ${platformFilter === "all" ? "ring-1 ring-brand/60 bg-brand/10" : ""}`}
        >
          all
        </button>
        {ALL_PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={`btn-ghost h-8 text-xs ${platformFilter === p ? "ring-1 ring-brand/60 bg-brand/10" : ""}`}
          >
            {p}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-white/70 mb-5">
        <input
          type="checkbox"
          className="accent-brand"
          checked={showOnlyForCategory}
          onChange={(e) => setShowOnlyForCategory(e.target.checked)}
        />
        Only show patterns that fit my category ({category})
      </label>

      <ul className="grid lg:grid-cols-2 gap-3">
        {filtered.map((p) => (
          <li key={p.id} className="panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                {p.platform} · {p.funnel}
              </div>
              <span className="chip">{p.aspect} · {p.durationSec}s</span>
            </div>
            <h3 className="mt-1 font-black text-base leading-snug">{p.name}</h3>
            <div className="mt-1 italic text-sm text-white/80">&ldquo;{p.hook}&rdquo;</div>
            <p className="text-xs text-white/60 mt-1">{p.why}</p>

            <details className="mt-3 group">
              <summary className="text-[11px] text-brand cursor-pointer">Beats + benchmarks</summary>
              <div className="mt-2 space-y-2">
                <ol className="list-decimal pl-5 text-[11px] text-white/80 space-y-0.5">
                  {p.beats.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ol>
                <div className="flex flex-wrap gap-1 text-[10px] text-white/60">
                  {Object.entries(p.benchmarks).map(([k, v]) => (
                    <span key={k} className="chip">
                      {k}: <b className="text-white ml-1">{v}</b>
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-white/40">
                  Good for: {p.goodFor.join(", ")}
                </div>
              </div>
            </details>

            <button onClick={() => useInQuick(p.id)} className="btn-primary w-full mt-3 h-9 text-sm">
              <Wand2 className="size-4" /> Use in /quick
            </button>
          </li>
        ))}
      </ul>

      <p className="text-[10px] text-white/40 mt-6">
        Benchmarks are directional industry blends (Meta Ads Reporting, TikTok Creator Insights, Motion
        Insights, CTC public reports). Your numbers will vary with offer + targeting.
      </p>
    </main>
  );
}
