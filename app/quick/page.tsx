"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useEditor, sceneAtTime, totalDuration } from "@/lib/store";
import { ASPECT_RATIOS, AspectRatioKey, BrandInputs } from "@/lib/types";
import {
  exportProjectVideo,
  exportProjectForPlatforms,
  downloadBlob,
  extensionFor,
  canPlayInline,
  BulkExportProgress,
  PlatformExportResult,
} from "@/lib/exporter";
import { DEFAULT_PLATFORM_BUNDLE, PLATFORMS, getPlatform } from "@/lib/platforms";
import { magicFix } from "@/lib/convertScore";
import { wrapWithBrandSting } from "@/lib/memorability";
import { renderScene, preloadScenes } from "@/lib/renderer";
import { generateBananaImage } from "@/lib/nanoBanana";

type StepKey = "copy" | "imagery" | "polish" | "render" | "done";

interface Step {
  key: StepKey;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

const INITIAL_STEPS: Step[] = [
  { key: "copy", label: "Writing your ad copy", status: "pending" },
  { key: "imagery", label: "Generating Tampa imagery", status: "pending" },
  { key: "polish", label: "Polishing for Meta", status: "pending" },
  { key: "render", label: "Rendering video", status: "pending" },
];

const SUGGESTED_PROMPTS = [
  "15-second Reels ad for a same-day garage cleanout with $50 off",
  "Before/after hoarder cleanout in South Tampa with 5-star reviews",
  "Hurricane debris cleanup ad — book today, gone today",
  "Estate cleanout ad targeted at realtors in Tampa Bay",
  "Family-owned, insured Tampa junk removal — trust builder",
];

function QuickBody() {
  const [prompt, setPrompt] = useState("");
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("ad.mp4");
  const [resultMime, setResultMime] = useState<string>("video/mp4");
  const [exportAll, setExportAll] = useState(true);
  const [bulkResults, setBulkResults] = useState<PlatformExportResult[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live preview during render
  const previewProgressRef = useRef(0);

  const setStep = (key: StepKey, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setBulkResults([]);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));

    try {
      // 1. Ad copy via /api/generate-ad
      setStep("copy", { status: "running" });
      const adRes = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: prompt, currentAspect: "9:16" }),
      });
      if (!adRes.ok) throw new Error(`Copy generation failed: HTTP ${adRes.status}`);
      const adJson = await adRes.json();
      const spec = adJson.spec as {
        templateId: string;
        aspectRatio: string;
        brandPatch: Partial<BrandInputs>;
        sceneOverrides: Array<{ sceneIndex: number; layerIndex: number; text: string }>;
      };
      setStep("copy", { status: "done", detail: `${spec.templateId} · ${spec.aspectRatio}` });

      // Apply to the editor store
      const editor = useEditor.getState();
      editor.setAspectRatio(spec.aspectRatio as AspectRatioKey);
      editor.loadTemplate(spec.templateId);
      if (spec.brandPatch) editor.updateBrand(spec.brandPatch);
      // sceneOverrides
      const fresh = useEditor.getState().project;
      for (const o of spec.sceneOverrides ?? []) {
        const sc = fresh.scenes[o.sceneIndex];
        if (!sc) continue;
        const layer = sc.layers[o.layerIndex];
        if (!layer || layer.type !== "text") continue;
        editor.updateLayer(sc.id, layer.id, { text: o.text });
      }

      // 2. Imagery (free Pollinations fallback works even without Gemini billing)
      setStep("imagery", { status: "running" });
      try {
        const ar = useEditor.getState().project.aspectRatio;
        const heroPrompt = `Hero shot for: ${prompt}. Photoreal Tampa Florida.`;
        const img = await generateBananaImage(heroPrompt, ar, "auto");
        const sceneId = useEditor.getState().project.scenes[0]?.id;
        if (sceneId) {
          useEditor.getState().updateScene(sceneId, {
            background: { kind: "image", src: img.dataUrl, fit: "cover", overlay: "rgba(0,0,0,0.45)" },
          });
        }
        setStep("imagery", { status: "done", detail: `via ${img.source}` });
      } catch (e) {
        setStep("imagery", {
          status: "done",
          detail: "skipped (no generator available)",
        });
      }

      // 3. Polish: brand sting + magic fix
      setStep("polish", { status: "running" });
      useEditor.setState((s) => ({ project: wrapWithBrandSting(magicFix(s.project)) }));
      setStep("polish", { status: "done", detail: "brand sting + policy fixes applied" });

      // 4. Render
      setStep("render", { status: "running" });
      const project = useEditor.getState().project;
      const safeName =
        prompt
          .replace(/[^a-z0-9-_ ]+/gi, "")
          .replace(/\s+/g, "_")
          .slice(0, 40)
          .toLowerCase() || "ad";

      if (exportAll) {
        const platforms = DEFAULT_PLATFORM_BUNDLE.map((id) => getPlatform(id)!).filter(Boolean);
        const results = await exportProjectForPlatforms(project, platforms, (state: BulkExportProgress[]) => {
          const done = state.filter((s) => s.status === "done").length;
          const running = state.find((s) => s.status === "exporting");
          const overall = (done + (running?.progress ?? 0)) / platforms.length;
          previewProgressRef.current = overall;
          const label =
            running?.status === "exporting"
              ? `${getPlatform(running.platformId)?.name ?? running.platformId} · ${Math.round((running.progress ?? 0) * 100)}%`
              : `${done}/${platforms.length} platforms done`;
          setStep("render", { status: "running", detail: label });
        });
        for (const r of results) {
          downloadBlob(r.blob, `${safeName}__${r.platform.id}.${extensionFor(r.mimeType)}`);
        }
        setBulkResults(results);
        // Pick a representative one to show in the inline player (prefer Reels)
        const hero = results.find((r) => r.platform.id === "meta-reels") ?? results[0];
        if (hero) {
          const url = URL.createObjectURL(hero.blob);
          setResultUrl(url);
          setResultName(`${safeName}__${hero.platform.id}.${extensionFor(hero.mimeType)}`);
          setResultMime(hero.mimeType);
        }
        setStep("render", {
          status: "done",
          detail: `${results.length} platform files exported`,
        });
      } else {
        const out = await exportProjectVideo(project, {
          fps: 30,
          onProgress: (p) => {
            previewProgressRef.current = p;
            setStep("render", { status: "running", detail: `${Math.round(p * 100)}%` });
          },
        });
        const filename = `${safeName}.${extensionFor(out.mimeType)}`;
        const url = URL.createObjectURL(out.blob);
        setResultUrl(url);
        setResultName(filename);
        setResultMime(out.mimeType);
        setStep("render", {
          status: "done",
          detail: `${out.durationSeconds.toFixed(1)}s · ${out.width}×${out.height}`,
        });
        downloadBlob(out.blob, filename);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error", detail: msg } : s)));
    } finally {
      setBusy(false);
    }
  };

  // Live preview canvas during render
  useEffect(() => {
    if (!busy) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const tick = () => {
      const project = useEditor.getState().project;
      if (project.scenes.length) {
        const total = totalDuration(project);
        const t = (previewProgressRef.current ?? 0) * total;
        const slot = sceneAtTime(project, t);
        if (slot) {
          // preload images on the fly (best-effort)
          preloadScenes([slot.scene]).then(() => {
            renderScene(ctx, slot.scene, slot.localTime, c.width, c.height);
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [busy]);

  // Initial preview frame
  useEffect(() => {
    if (busy || resultUrl) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const project = useEditor.getState().project;
    const slot = sceneAtTime(project, 0);
    if (slot) {
      preloadScenes([slot.scene]).then(() => renderScene(ctx, slot.scene, 0, c.width, c.height));
    }
  }, [busy, resultUrl]);

  const project = useEditor((s) => s.project);
  const ar = ASPECT_RATIOS[project.aspectRatio];

  return (
    <main className="min-h-[100dvh] mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="btn-ghost h-9">
          <ArrowLeft className="size-4" /> Home
        </Link>
        <Link href="/editor" className="btn-ghost h-9">
          Open full studio
        </Link>
      </div>

      <header className="text-center mb-6">
        <div className="inline-flex items-center gap-1 chip">
          <Sparkles className="size-3 text-brand" /> One-prompt mode
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight leading-[1.05]">
          Describe an ad. Get an MP4.
        </h1>
        <p className="text-white/60 text-sm mt-2 max-w-lg mx-auto">
          One sentence. We write the copy, generate the imagery, polish it Meta-safe, and download a finished video.
        </p>
      </header>

      {/* Prompt + suggestions */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="panel p-4"
      >
        <textarea
          className="input min-h-[100px] text-base"
          placeholder='Describe your ad — e.g. "15s Reels for same-day garage cleanout with $50 off"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
        />
        <div className="mt-2 -mx-1 flex gap-1 overflow-x-auto pb-1 px-1">
          {SUGGESTED_PROMPTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              disabled={busy}
              className="chip whitespace-nowrap shrink-0 hover:bg-white/10"
            >
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-start gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={exportAll}
            onChange={(e) => setExportAll(e.target.checked)}
            disabled={busy}
            className="mt-1 size-4 accent-brand"
          />
          <div className="text-sm">
            <div className="font-semibold">Export to every platform automatically</div>
            <div className="text-[11px] text-white/50">
              Downloads {DEFAULT_PLATFORM_BUNDLE.length} files — Meta Reels, Feed Portrait + Square, TikTok, YT Shorts.
              Uncheck for a single render in the current aspect.
            </div>
          </div>
        </label>
        <button
          type="submit"
          disabled={busy || !prompt.trim()}
          className="btn-primary w-full mt-3 h-12 text-base"
        >
          {busy ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Building your ad…
            </>
          ) : (
            <>
              <Wand2 className="size-5" /> {exportAll ? "Make + export everywhere" : "Make me an ad"}
            </>
          )}
        </button>
        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </form>

      {/* Preview + progress */}
      <div className="mt-6 grid sm:grid-cols-[1fr_1.2fr] gap-4 items-start">
        <div
          className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black mx-auto"
          style={{
            aspectRatio: `${ar.width} / ${ar.height}`,
            width: "100%",
            maxWidth: 280,
          }}
        >
          <canvas ref={canvasRef} width={ar.width} height={ar.height} className="w-full h-full block" />
        </div>

        <div className="panel p-4">
          <div className="label mb-2">Pipeline</div>
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s.key} className="flex items-start gap-2 text-sm">
                {s.status === "done" ? (
                  <CheckCircle2 className="size-4 text-emerald-400 mt-0.5" />
                ) : s.status === "running" ? (
                  <Loader2 className="size-4 animate-spin text-brand mt-0.5" />
                ) : s.status === "error" ? (
                  <span className="size-4 inline-block rounded-full bg-red-500 mt-0.5" />
                ) : (
                  <span className="size-4 inline-block rounded-full border border-white/20 mt-0.5" />
                )}
                <div>
                  <div className={s.status === "pending" ? "text-white/50" : "text-white"}>{s.label}</div>
                  {s.detail && <div className="text-[11px] text-white/50">{s.detail}</div>}
                </div>
              </li>
            ))}
          </ul>

          {resultUrl && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              {canPlayInline(resultMime) ? (
                <video
                  src={resultUrl}
                  controls
                  playsInline
                  muted
                  autoPlay
                  loop
                  className="w-full rounded-lg ring-1 ring-white/10 bg-black"
                />
              ) : (
                <div className="rounded-lg ring-1 ring-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <div className="font-bold">Your browser can&apos;t play this format inline.</div>
                  <div className="mt-1">
                    iPhones can&apos;t preview <code>.webm</code> in the page. The file has already been downloaded — open it from your downloads folder, or tap below to open it in a new tab (it&apos;ll play in the Files app).
                  </div>
                  <a
                    href={resultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost w-full mt-2 h-9 text-xs"
                  >
                    Open video in a new tab
                  </a>
                </div>
              )}
              {bulkResults.length === 0 ? (
                <a href={resultUrl} download={resultName} className="btn-primary w-full">
                  <Download className="size-4" /> Download {resultName}
                </a>
              ) : (
                <div className="space-y-1">
                  <div className="label">Downloaded {bulkResults.length} platform files</div>
                  <ul className="space-y-1 max-h-44 overflow-auto">
                    {bulkResults.map((r) => {
                      const fname = `${(resultName.split("__")[0]) || "ad"}__${r.platform.id}.${extensionFor(r.mimeType)}`;
                      return (
                        <li key={r.platform.id} className="flex items-center justify-between gap-2 text-xs bg-white/5 rounded px-2 py-1.5">
                          <span className="truncate">
                            <span className="text-brand font-semibold">{r.platform.name}</span>
                            <span className="text-white/40 ml-2">
                              {r.platform.width}×{r.platform.height} · {r.durationSeconds.toFixed(1)}s
                            </span>
                            {r.trimmed && <span className="ml-2 text-amber-300">trimmed</span>}
                          </span>
                          <a
                            href={URL.createObjectURL(r.blob)}
                            download={fname}
                            className="text-brand hover:text-brand-300"
                            aria-label={`Re-download ${r.platform.name}`}
                          >
                            <Download className="size-3.5" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <Link href="/editor" className="btn-ghost w-full">
                Tweak in the full studio →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function QuickPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white/60">Loading…</div>}>
      <QuickBody />
    </Suspense>
  );
}
