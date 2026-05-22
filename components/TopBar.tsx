"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, Loader2, Menu, Package, Pause, Play, Users, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);

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
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        {/* Row 1: brand + project name + primary actions */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="size-8 sm:size-9" />
            <div className="hidden md:block leading-tight">
              <div className="text-sm font-black">Book Junk Away</div>
              <div className="text-[10px] text-white/50">Meta Ad Studio</div>
            </div>
          </Link>

          <input
            className="input h-9 flex-1 min-w-0"
            value={project.name}
            onChange={(e) => renameProject(e.target.value)}
            aria-label="Project name"
          />

          {/* Mobile primary actions */}
          <div className="flex items-center gap-1 sm:hidden">
            <button onClick={isPlaying ? pause : play} className="btn-ghost h-9 w-9 px-0 justify-center" aria-label="Play">
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button onClick={handleExport} disabled={exporting} className="btn-primary h-9 px-2" aria-label="Export">
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="btn-ghost h-9 w-9 px-0 justify-center"
              aria-label="Menu"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>

          {/* Desktop right cluster */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="hidden md:inline-flex chip">⏱ {total}s</span>
            <PolicyBadge />
            <Link href="/clients" className="btn-ghost h-9 hidden md:inline-flex">
              <Users className="size-4" /> Clients
            </Link>
            <Link href="/inspiration" className="btn-ghost h-9 hidden md:inline-flex">
              <Eye className="size-4" /> Inspiration
            </Link>
            <button onClick={isPlaying ? pause : play} className="btn-ghost h-9 w-9 px-0 justify-center">
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button onClick={() => setMultiOpen(true)} className="btn-ghost h-9">
              <Package className="size-4" /> <span className="hidden lg:inline">All platforms</span>
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
        </div>

        {/* Row 2: aspect ratios — always visible */}
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setAspectRatio(k)}
              className={`btn-ghost h-8 px-2 text-[11px] whitespace-nowrap ${
                project.aspectRatio === k ? "ring-1 ring-brand/60 bg-brand/10" : ""
              }`}
              title={ASPECT_RATIOS[k].description}
            >
              {k}
            </button>
          ))}
          <span className="chip ml-auto">⏱ {total}s</span>
        </div>

        {/* Mobile-only collapsible menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-white/10 bg-black/60 px-3 py-2 space-y-2">
            <div className="flex justify-center">
              <PolicyBadge />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setMultiOpen(true); setMenuOpen(false); }} className="btn-ghost h-9">
                <Package className="size-4" /> All platforms
              </button>
              <Link href="/clients" onClick={() => setMenuOpen(false)} className="btn-ghost h-9">
                <Users className="size-4" /> Clients
              </Link>
              <Link href="/inspiration" onClick={() => setMenuOpen(false)} className="btn-ghost h-9 col-span-2">
                <Eye className="size-4" /> Tampa ad inspiration
              </Link>
            </div>
          </div>
        )}
      </header>
      <MultiExportDialog open={multiOpen} onClose={() => setMultiOpen(false)} />
    </>
  );
}
