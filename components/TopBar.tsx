"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, Loader2, Package, Pause, Play, Users } from "lucide-react";
import { useEditor, totalDuration } from "@/lib/store";
import { ASPECT_RATIOS, AspectRatioKey } from "@/lib/types";
import { downloadBlob, exportProjectVideo, extensionFor } from "@/lib/exporter";
import { PolicyBadge } from "./PolicyBadge";
import { MultiExportDialog } from "./MultiExportDialog";

export function TopBar() {
  const project = useEditor((s) => s.project);
  const isPlaying = useEditor((s) => s.isPlaying);
  const play = useEditor((s) => s.play);
  const pause = useEditor((s) => s.pause);
  const setAspectRatio = useEditor((s) => s.setAspectRatio);
  const renameProject = useEditor((s) => s.renameProject);

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [multiOpen, setMultiOpen] = useState(false);

  const total = totalDuration(project).toFixed(1);

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);
    try {
      const out = await exportProjectVideo(project, {
        fps: 30,
        onProgress: (p) => setProgress(p),
      });
      const safeName = project.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "ad";
      downloadBlob(out.blob, `${safeName}.${extensionFor(out.mimeType)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Export failed: ${msg}`);
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b border-white/10 bg-black/40 backdrop-blur px-4 py-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="size-9" />
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-black">Book Junk Away</div>
            <div className="text-[10px] text-white/50">Meta Ad Studio</div>
          </div>
        </Link>

        <input
          className="input max-w-xs h-9"
          value={project.name}
          onChange={(e) => renameProject(e.target.value)}
          aria-label="Project name"
        />

        <div className="ml-2 flex items-center gap-1">
          {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setAspectRatio(k)}
              className={`btn-ghost h-9 px-2 text-xs ${
                project.aspectRatio === k ? "ring-1 ring-brand/60 bg-brand/10" : ""
              }`}
              title={ASPECT_RATIOS[k].description}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden md:inline-flex chip">⏱ {total}s</span>
          <PolicyBadge />
          <Link href="/clients" className="btn-ghost h-9 hidden sm:inline-flex">
            <Users className="size-4" /> Clients
          </Link>
          <Link href="/inspiration" className="btn-ghost h-9 hidden sm:inline-flex">
            <Eye className="size-4" /> Inspiration
          </Link>
          <button onClick={isPlaying ? pause : play} className="btn-ghost h-9 w-9 px-0 justify-center">
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button onClick={() => setMultiOpen(true)} className="btn-ghost h-9">
            <Package className="size-4" /> All platforms
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary h-9">
            {exporting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {Math.round(progress * 100)}%
              </>
            ) : (
              <>
                <Download className="size-4" /> Export
              </>
            )}
          </button>
        </div>
      </header>
      <MultiExportDialog open={multiOpen} onClose={() => setMultiOpen(false)} />
    </>
  );
}
