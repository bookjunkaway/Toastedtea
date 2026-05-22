"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Wrench, XCircle } from "lucide-react";
import { useEditor } from "@/lib/store";
import { Finding, lintProject, policyScore } from "@/lib/policyLint";

export function PolicyBadge() {
  const project = useEditor((s) => s.project);
  const [open, setOpen] = useState(false);

  const findings = useMemo<Finding[]>(() => lintProject(project), [project]);
  const score = useMemo(() => policyScore(findings), [findings]);

  const applyFix = (fix: NonNullable<Finding["autoFix"]>) => {
    useEditor.setState((s) => ({ project: fix(s.project) }));
  };

  const applyAll = () => {
    useEditor.setState((s) => {
      let p = s.project;
      for (const f of findings) if (f.autoFix) p = f.autoFix(p);
      return { project: p };
    });
  };

  const Icon =
    score.status === "safe" ? ShieldCheck : score.status === "review" ? ShieldAlert : XCircle;
  const tone =
    score.status === "safe"
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
      : score.status === "review"
      ? "text-amber-300 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
      : "text-red-300 bg-red-500/10 border-red-500/30 hover:bg-red-500/20";

  const blockCount = findings.filter((f) => f.severity === "block").length;
  const warnCount = findings.filter((f) => f.severity === "warn").length;
  const tipCount = findings.filter((f) => f.severity === "tip").length;
  const fixableCount = findings.filter((f) => !!f.autoFix).length;

  const label =
    score.status === "safe"
      ? "Meta-safe"
      : blockCount > 0
      ? `${blockCount} blocker${blockCount === 1 ? "" : "s"}`
      : `${warnCount} warning${warnCount === 1 ? "" : "s"}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`btn h-9 px-3 text-xs gap-1.5 border ${tone}`}
        title="Meta Ad Policy linter"
      >
        <Icon className="size-4" />
        {label}
        <span className="opacity-60 ml-1">· {score.score}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[420px] panel p-3 shadow-2xl z-50 max-h-[70vh] overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand" /> Meta Ad Policy Linter
            </div>
            <div className="text-[11px] text-white/50">
              {blockCount} block · {warnCount} warn · {tipCount} tip
            </div>
          </div>
          <p className="text-[11px] text-white/60 mb-3">
            Scans your project for the most common reasons junk-removal ads get
            rejected. Block-level issues will almost always fail Meta review —
            fix those first.
          </p>

          {fixableCount > 0 && (
            <button onClick={applyAll} className="btn-primary w-full mb-3 h-8 text-xs">
              <Wrench className="size-3" /> Auto-fix {fixableCount} issue{fixableCount === 1 ? "" : "s"}
            </button>
          )}

          {findings.length === 0 ? (
            <div className="text-sm flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="size-4" /> Clean pass — likely to ship.
            </div>
          ) : (
            <ul className="space-y-2">
              {findings.map((f) => (
                <li
                  key={f.id}
                  className={`rounded-lg p-2 border text-xs ${
                    f.severity === "block"
                      ? "bg-red-500/10 border-red-500/30"
                      : f.severity === "warn"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 ${
                        f.severity === "block"
                          ? "text-red-400"
                          : f.severity === "warn"
                          ? "text-amber-300"
                          : "text-white/60"
                      }`}
                    >
                      {f.severity === "block" ? (
                        <XCircle className="size-3.5" />
                      ) : (
                        <AlertTriangle className="size-3.5" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{f.title}</div>
                      <div className="text-white/70 mt-0.5">{f.description}</div>
                      {f.autoFix && (
                        <button
                          onClick={() => applyFix(f.autoFix!)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-brand hover:text-brand-300"
                        >
                          <Wrench className="size-3" /> Apply auto-fix
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
