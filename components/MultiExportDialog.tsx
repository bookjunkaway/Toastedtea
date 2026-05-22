"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Download, Loader2, Package, X, XCircle } from "lucide-react";
import { useEditor } from "@/lib/store";
import { DEFAULT_PLATFORM_BUNDLE, PLATFORMS, PlatformSpec, getPlatform } from "@/lib/platforms";
import {
  BulkExportProgress,
  downloadBlob,
  exportProjectForPlatforms,
  extensionFor,
  PlatformExportResult,
} from "@/lib/exporter";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PLATFORM_GROUPS = [
  { name: "Meta", ids: PLATFORMS.filter((p) => p.platform === "Meta").map((p) => p.id) },
  { name: "TikTok", ids: PLATFORMS.filter((p) => p.platform === "TikTok").map((p) => p.id) },
  { name: "YouTube", ids: PLATFORMS.filter((p) => p.platform === "YouTube").map((p) => p.id) },
  { name: "LinkedIn", ids: PLATFORMS.filter((p) => p.platform === "LinkedIn").map((p) => p.id) },
  { name: "Pinterest", ids: PLATFORMS.filter((p) => p.platform === "Pinterest").map((p) => p.id) },
  { name: "Snapchat", ids: PLATFORMS.filter((p) => p.platform === "Snapchat").map((p) => p.id) },
  { name: "Google", ids: PLATFORMS.filter((p) => p.platform === "Google").map((p) => p.id) },
];

export function MultiExportDialog({ open, onClose }: Props) {
  const project = useEditor((s) => s.project);
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_PLATFORM_BUNDLE));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<BulkExportProgress[]>([]);
  const [results, setResults] = useState<PlatformExportResult[]>([]);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setProgress([]);
      setResults([]);
    }
  }, [open]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(PLATFORMS.map((p) => p.id)));
  const selectNone = () => setSelected(new Set());
  const selectMetaBundle = () => setSelected(new Set(DEFAULT_PLATFORM_BUNDLE));

  const runExport = async () => {
    if (busy || selected.size === 0) return;
    setBusy(true);
    setResults([]);
    const platforms = [...selected].map((id) => getPlatform(id)!).filter(Boolean) as PlatformSpec[];
    try {
      const out = await exportProjectForPlatforms(project, platforms, (s) => setProgress(s));
      setResults(out);
      // Auto-download each
      for (const r of out) {
        const safeName = project.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 50) || "ad";
        downloadBlob(r.blob, `${safeName}__${r.platform.id}.${extensionFor(r.mimeType)}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-brand" />
            <div>
              <div className="font-black">Export to every platform</div>
              <div className="text-xs text-white/50">
                {selected.size} selected · ~{project.scenes.reduce((a, b) => a + b.duration, 0).toFixed(0)}s source
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost h-8 w-8 px-0 justify-center">
            <X className="size-4" />
          </button>
        </header>

        <div className="p-4 overflow-auto flex-1 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={selectMetaBundle} className="btn-ghost h-7 text-xs">
              Meta + TikTok + Shorts bundle
            </button>
            <button onClick={selectAll} className="btn-ghost h-7 text-xs">
              All platforms
            </button>
            <button onClick={selectNone} className="btn-ghost h-7 text-xs">
              None
            </button>
          </div>

          {PLATFORM_GROUPS.map((g) => (
            <div key={g.name}>
              <div className="label mb-2">{g.name}</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {g.ids.map((id) => {
                  const p = getPlatform(id)!;
                  const active = selected.has(id);
                  const prog = progress.find((s) => s.platformId === id);
                  const total = project.scenes.reduce((a, b) => a + b.duration, 0);
                  const willTrim = total > p.maxDurationSec;
                  return (
                    <button
                      key={id}
                      onClick={() => toggle(id)}
                      className={`text-left rounded-lg p-3 border transition-colors ${
                        active
                          ? "border-brand/60 bg-brand/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-[11px] text-white/50">
                            {p.width}×{p.height} · {p.aspect} · ≤{p.maxDurationSec}s
                          </div>
                        </div>
                        {active && <Check className="size-4 text-brand" />}
                      </div>
                      <p className="text-[11px] text-white/60 mt-1">{p.notes}</p>
                      {willTrim && (
                        <p className="text-[11px] text-amber-300 mt-1">
                          ⚠ Will be trimmed to {p.maxDurationSec}s
                        </p>
                      )}
                      {prog && prog.status !== "pending" && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {prog.status === "exporting" && (
                            <>
                              <Loader2 className="size-3 animate-spin text-brand" />
                              {Math.round(prog.progress * 100)}%
                            </>
                          )}
                          {prog.status === "done" && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> done
                            </span>
                          )}
                          {prog.status === "error" && (
                            <span className="text-red-400 flex items-center gap-1">
                              <XCircle className="size-3" /> {prog.error}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-white/50">
            Files auto-download as <code className="text-brand">name__platform.mp4</code> (or webm fallback).
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">
              Close
            </button>
            <button onClick={runExport} disabled={busy || selected.size === 0} className="btn-primary">
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Exporting {progress.filter((p) => p.status === "done").length}/{selected.size}
                </>
              ) : (
                <>
                  <Download className="size-4" /> Export {selected.size} file{selected.size === 1 ? "" : "s"}
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
