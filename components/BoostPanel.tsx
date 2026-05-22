"use client";

import { useMemo } from "react";
import { Flame, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { useEditor } from "@/lib/store";
import { viralScore, VIRAL_HOOKS } from "@/lib/viral";
import { recallScore, wrapWithBrandSting, prependBrandSting, appendBrandSting } from "@/lib/memorability";
import { ConvertMeter } from "./ConvertMeter";

function ScoreRing({ value, color }: { value: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <svg viewBox="0 0 64 64" className="size-16">
      <circle cx="32" cy="32" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
      <circle
        cx="32"
        cy="32"
        r={r}
        stroke={color}
        strokeWidth="6"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="38" textAnchor="middle" className="fill-white font-black text-[16px]">
        {value}
      </text>
    </svg>
  );
}

export function BoostPanel() {
  const project = useEditor((s) => s.project);
  const setAspectRatio = useEditor((s) => s.setAspectRatio);

  const viral = useMemo(() => viralScore(project), [project]);
  const recall = useMemo(() => recallScore(project), [project]);

  const applyHook = (hook: string) => {
    useEditor.setState((s) => {
      const firstScene = s.project.scenes[0];
      if (!firstScene) return s;
      const firstText = firstScene.layers.find((l) => l.type === "text");
      if (!firstText) return s;
      return {
        project: {
          ...s.project,
          updatedAt: Date.now(),
          scenes: s.project.scenes.map((sc) =>
            sc.id !== firstScene.id
              ? sc
              : {
                  ...sc,
                  layers: sc.layers.map((l) =>
                    l.id === firstText.id && l.type === "text" ? { ...l, text: hook } : l,
                  ),
                },
          ),
        },
      };
    });
  };

  return (
    <div className="space-y-3 text-sm">
      <ConvertMeter />
      <div className="panel p-3">
        <div className="flex items-center justify-between">
          <div className="label flex items-center gap-1">
            <Flame className="size-3 text-red-400" /> Viral Score
          </div>
          <ScoreRing value={viral.score} color="#dc2626" />
        </div>
        <ul className="mt-2 space-y-1.5">
          {viral.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-[11px]">
              <span className={c.passed ? "text-emerald-400" : "text-white/40"}>{c.passed ? "✓" : "○"}</span>
              <div>
                <div className={c.passed ? "text-white" : "text-white/70"}>{c.title}</div>
                {!c.passed && <div className="text-white/40">{c.hint}</div>}
              </div>
            </li>
          ))}
        </ul>
        {project.aspectRatio !== "9:16" && (
          <button onClick={() => setAspectRatio("9:16")} className="btn-ghost w-full mt-2 h-8 text-xs">
            <TrendingUp className="size-3" /> Switch to 9:16 (Reels)
          </button>
        )}
      </div>

      <div className="panel p-3">
        <div className="label mb-2 flex items-center gap-1">
          <Sparkles className="size-3 text-brand" /> Viral hook bank
        </div>
        <div className="space-y-1 max-h-44 overflow-auto pr-1">
          {VIRAL_HOOKS.map((h, i) => (
            <button
              key={i}
              onClick={() => applyHook(h.hook)}
              className="text-left w-full rounded-md px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5"
              title={h.followUp}
            >
              <div className="text-[10px] text-brand-300 font-bold uppercase tracking-wider">{h.format}</div>
              <div className="text-[12px] text-white leading-snug">{h.hook}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="flex items-center justify-between">
          <div className="label flex items-center gap-1">
            <Sparkles className="size-3 text-brand" /> Recall Score
          </div>
          <ScoreRing value={recall.score} color="#FBBF24" />
        </div>
        <ul className="mt-2 space-y-1.5">
          {recall.rules.map((r) => (
            <li key={r.id} className="flex items-start gap-2 text-[11px]">
              <span className={r.passed ? "text-emerald-400" : "text-white/40"}>{r.passed ? "✓" : "○"}</span>
              <div>
                <div className={r.passed ? "text-white" : "text-white/70"}>{r.title}</div>
                {!r.passed && <div className="text-white/40">{r.hint}</div>}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-3 gap-1">
          <button
            onClick={() => useEditor.setState((s) => ({ project: prependBrandSting(s.project) }))}
            className="btn-ghost h-8 text-[11px]"
          >
            + Open sting
          </button>
          <button
            onClick={() => useEditor.setState((s) => ({ project: appendBrandSting(s.project) }))}
            className="btn-ghost h-8 text-[11px]"
          >
            + Close sting
          </button>
          <button
            onClick={() => useEditor.setState((s) => ({ project: wrapWithBrandSting(s.project) }))}
            className="btn-primary h-8 text-[11px]"
          >
            <Wand2 className="size-3" /> Wrap
          </button>
        </div>
      </div>
    </div>
  );
}
