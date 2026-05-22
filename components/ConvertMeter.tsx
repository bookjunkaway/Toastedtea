"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, Sparkles, Wand2, Zap } from "lucide-react";
import { useEditor } from "@/lib/store";
import { ConvertScoreBreakdown, convertScore, magicFix } from "@/lib/convertScore";
import { buildVariantProjects, generateHookVariants } from "@/lib/variants";
import { downloadBlob, exportProjectVideo, extensionFor } from "@/lib/exporter";

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-white/60">
        <span>{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="h-1.5 mt-0.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function ConvertMeter() {
  const project = useEditor((s) => s.project);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const breakdown: ConvertScoreBreakdown = useMemo(() => convertScore(project), [project]);
  const variants = useMemo(() => generateHookVariants(project.brand), [project.brand]);

  const exportAllVariants = async () => {
    if (busy) return;
    setBusy(true);
    setProgress(0);
    try {
      const projects = buildVariantProjects(project, variants);
      let i = 0;
      for (const p of projects) {
        const out = await exportProjectVideo(p, {
          onProgress: (frac) => setProgress((i + frac) / projects.length),
        });
        const safe = p.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
        downloadBlob(out.blob, `${safe}.${extensionFor(out.mimeType)}`);
        i++;
      }
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const applyMagic = () => {
    useEditor.setState((s) => ({ project: magicFix(s.project) }));
  };

  const applyVariantHook = (hook: string) => {
    useEditor.setState((s) => {
      const first = s.project.scenes[0];
      if (!first) return s;
      const text = first.layers.find((l) => l.type === "text");
      if (!text) return s;
      return {
        project: {
          ...s.project,
          updatedAt: Date.now(),
          scenes: s.project.scenes.map((sc) =>
            sc.id !== first.id
              ? sc
              : {
                  ...sc,
                  layers: sc.layers.map((l) =>
                    l.id === text.id && l.type === "text" ? { ...l, text: hook } : l,
                  ),
                },
          ),
        },
      };
    });
  };

  const tone =
    breakdown.status === "excellent"
      ? "text-emerald-300"
      : breakdown.status === "good"
      ? "text-brand-300"
      : breakdown.status === "needs-work"
      ? "text-amber-300"
      : "text-red-300";

  return (
    <div className="panel p-3 space-y-3 bg-gradient-to-br from-brand/10 via-transparent to-red-500/5 border-brand/40">
      <div className="flex items-center justify-between">
        <div className="label flex items-center gap-1">
          <Zap className="size-3 text-brand" /> Convert-O-Meter
        </div>
        <div className={`text-3xl font-black ${tone}`}>{breakdown.overall}</div>
      </div>
      <div className="space-y-1.5">
        <Bar label="Hook (3-sec stop)" value={breakdown.hook} color="#dc2626" />
        <Bar label="Viral shape" value={breakdown.viral} color="#FBBF24" />
        <Bar label="Brand recall" value={breakdown.recall} color="#a855f7" />
        <Bar label="Meta policy safety" value={breakdown.policy} color="#10b981" />
      </div>
      <div className="text-[11px] text-white/70 rounded-md bg-white/5 border border-white/10 p-2">
        <span className="text-brand font-bold">Top action:</span> {breakdown.topAction}
      </div>

      <button onClick={applyMagic} className="btn-primary w-full">
        <Wand2 className="size-4" /> Magic fix — make this convert
      </button>

      <div className="pt-2 border-t border-white/10">
        <div className="label mb-2 flex items-center gap-1">
          <Sparkles className="size-3 text-brand" /> 5 hook A/B variants
        </div>
        <ul className="space-y-1 max-h-44 overflow-auto pr-1">
          {variants.map((v, i) => (
            <li key={i} className="rounded-md bg-white/5 p-2 border border-white/5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-brand-300 font-bold">
                    v{i + 1} · {v.label}
                  </div>
                  <div className="text-[12px] text-white leading-snug">{v.hook}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">{v.rationale}</div>
                </div>
                <button
                  onClick={() => applyVariantHook(v.hook)}
                  className="btn-ghost h-7 px-2 text-[11px] shrink-0"
                  title="Apply this hook to the current ad"
                >
                  Apply
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={exportAllVariants} disabled={busy} className="btn-ghost w-full mt-2">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Exporting variants… {Math.round(progress * 100)}%
            </>
          ) : (
            <>
              <Download className="size-4" /> Export all 5 variants
            </>
          )}
        </button>
      </div>
    </div>
  );
}
