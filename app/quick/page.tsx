"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useEditor, sceneAtTime, totalDuration } from "@/lib/store";
import { ASPECT_RATIOS, AspectRatioKey, BrandInputs, COMMON_CATEGORIES } from "@/lib/types";
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
import { Mood, generateTrack } from "@/lib/music";
import { projectToScript, speakLive, generateTtsAudio, mixAudio } from "@/lib/voiceover";
import { VOICE_PRESETS, getVoicePreset } from "@/lib/voices";
import { leadFormUrl, useLeads, LeadFormSpec } from "@/lib/leads";
import { canShareFiles, shareToSheet, PLATFORM_UPLOAD_URLS } from "@/lib/share";
import { Share2, ExternalLink, Copy } from "lucide-react";
import { track } from "@/lib/analytics";

type StepKey = "copy" | "imagery" | "music" | "polish" | "render" | "done";

interface Step {
  key: StepKey;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

const INITIAL_STEPS: Step[] = [
  { key: "copy", label: "Writing your ad copy", status: "pending" },
  { key: "imagery", label: "Generating imagery", status: "pending" },
  { key: "music", label: "Composing music", status: "pending" },
  { key: "polish", label: "Polishing for Meta", status: "pending" },
  { key: "render", label: "Rendering video", status: "pending" },
];

const SUGGESTED_PROMPTS = [
  "15-second Reels ad for a same-day garage cleanout with $50 off",
  "FUNNY tier list of stuff in a Tampa garage",
  'FUNNY "things our crew heard" testimonial ad',
  "Before/after hoarder cleanout in South Tampa with 5-star reviews",
  "Hurricane debris cleanup ad — book today, gone today",
  "Estate cleanout ad targeted at realtors in Tampa Bay",
];

type Tone = "punchy" | "funny" | "cinematic" | "chill";
const TONES: { id: Tone; label: string; mood: Mood }[] = [
  { id: "punchy", label: "Punchy", mood: "punchy" },
  { id: "funny", label: "Funny", mood: "funny" },
  { id: "cinematic", label: "Cinematic", mood: "cinematic" },
  { id: "chill", label: "Chill", mood: "chill" },
];

function QuickBody() {
  const search = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [leadForm, setLeadForm] = useState<LeadFormSpec | null>(null);
  const [leadUrlCopied, setLeadUrlCopied] = useState(false);
  const createForm = useLeads((s) => s.createFormFromProject);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("ad.mp4");
  const [resultMime, setResultMime] = useState<string>("video/mp4");
  const [exportAll, setExportAll] = useState(true);
  const [bulkResults, setBulkResults] = useState<PlatformExportResult[]>([]);
  const [tone, setTone] = useState<Tone>("punchy");
  const [addVoice, setAddVoice] = useState(false);
  const [voiceId, setVoiceId] = useState<string>(VOICE_PRESETS[0].id);

  // Pre-fill from playbook deep-link: /quick?brief=...&tone=...
  useEffect(() => {
    const brief = search.get("brief");
    if (brief) setPrompt(brief);
    const t = search.get("tone");
    if (t === "punchy" || t === "funny" || t === "cinematic" || t === "chill") {
      setTone(t);
    }
  }, [search]);

  // Caption that travels with a shared post — includes the lead-form link so a
  // tap on the post leads straight to the capture form.
  const shareCaption = (): string => {
    const b = useEditor.getState().project.brand;
    const link = leadForm ? leadFormUrl(leadForm) : b.website;
    return `${b.offer} — ${b.companyName}\n👉 ${link}`;
  };
  const [showBrandQuick, setShowBrandQuick] = useState(false);
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
      const currentBrand = useEditor.getState().project.brand;
      const adRes = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: prompt,
          currentAspect: "9:16",
          tone,
          brand: {
            companyName: currentBrand.companyName,
            category: currentBrand.category,
            serviceArea: currentBrand.serviceArea,
          },
        }),
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

      const editor = useEditor.getState();
      editor.setAspectRatio(spec.aspectRatio as AspectRatioKey);
      if (spec.brandPatch) editor.updateBrand(spec.brandPatch);

      // 2. Imagery — generate distinct hero / before / after shots in parallel
      //    BEFORE building the template, so before/after templates pick them up.
      //    Cinematic, category-aware, scene-aware prompts. Free Pollinations.
      setStep("imagery", { status: "running", detail: "generating 3 shots…" });
      let heroImg: string | undefined;
      try {
        const ar = spec.aspectRatio as AspectRatioKey;
        const cat = useEditor.getState().project.brand.category;
        const subject = prompt.trim();

        const heroPrompt = `A proud uniformed crew / happy customer scene for a ${cat} business. Context: ${subject}. Warm, trustworthy, premium local-business hero shot.`;
        const beforePrompt = `The "before" problem state for a ${cat} job — the mess / clutter / damage a customer wants gone. Context: ${subject}. Realistic, slightly moody, mid-afternoon light.`;
        const afterPrompt = `The "after" result for a ${cat} job — spotless, transformed, satisfying. Context: ${subject}. Bright, clean, golden-hour glow.`;

        const settle = await Promise.allSettled([
          generateBananaImage(heroPrompt, ar, "pollinations"),
          generateBananaImage(beforePrompt, ar, "pollinations"),
          generateBananaImage(afterPrompt, ar, "pollinations"),
        ]);
        const [hero, before, after] = settle;
        const patch: Partial<BrandInputs> = {};
        if (hero.status === "fulfilled") {
          patch.heroImage = hero.value.dataUrl;
          heroImg = hero.value.dataUrl;
        }
        if (before.status === "fulfilled") patch.beforeImage = before.value.dataUrl;
        if (after.status === "fulfilled") patch.afterImage = after.value.dataUrl;
        if (Object.keys(patch).length) useEditor.getState().updateBrand(patch);

        const ok = settle.filter((s) => s.status === "fulfilled").length;
        setStep("imagery", { status: "done", detail: `${ok}/3 cinematic shots` });
      } catch (e) {
        setStep("imagery", { status: "done", detail: "skipped (no generator available)" });
      }

      // Now build the template — it reads the brand's before/after/hero images
      const ed2 = useEditor.getState();
      ed2.loadTemplate(spec.templateId);
      // Give scene 0 the hero image background if it's still a plain gradient
      const built = useEditor.getState().project;
      const firstScene = built.scenes[0];
      if (heroImg && firstScene && firstScene.background.kind === "gradient") {
        ed2.updateScene(firstScene.id, {
          background: { kind: "image", src: heroImg, fit: "cover", overlay: "rgba(0,0,0,0.4)" },
        });
      }
      // sceneOverrides from the AI copy
      const fresh = useEditor.getState().project;
      for (const o of spec.sceneOverrides ?? []) {
        const sc = fresh.scenes[o.sceneIndex];
        if (!sc) continue;
        const layer = sc.layers[o.layerIndex];
        if (!layer || layer.type !== "text") continue;
        ed2.updateLayer(sc.id, layer.id, { text: o.text });
      }

      // 2b. Music (based on tone) — and optional neural voiceover mixed in
      setStep("music", { status: "running" });
      let musicUrl: string | undefined;
      try {
        const moodMap: Record<Tone, Mood> = {
          punchy: "punchy",
          funny: "funny",
          cinematic: "cinematic",
          chill: "chill",
        };
        const mood = moodMap[tone];
        const track = await generateTrack(mood, 30);
        musicUrl = track.dataUrl;
        useEditor.getState().setAudio({ src: track.dataUrl, name: track.name, volume: 0.65 });
        setStep("music", { status: "done", detail: `${mood} track` });
      } catch (e) {
        setStep("music", { status: "done", detail: "skipped" });
      }

      // 3. Polish: brand sting + magic fix (do this before voiceover so the
      //    script reflects the final scene copy)
      setStep("polish", { status: "running" });
      useEditor.setState((s) => ({ project: wrapWithBrandSting(magicFix(s.project)) }));
      setStep("polish", { status: "done", detail: "brand sting + policy fixes applied" });

      // 3b. Neural voiceover (ElevenLabs / Gemini) — baked into the audio track,
      //     mixed over ducked music. Falls back to browser speak at render time.
      let useLiveSpeak = false;
      if (addVoice) {
        const script = projectToScript(useEditor.getState().project);
        const preset = getVoicePreset(voiceId);
        const tts = script
          ? await generateTtsAudio(script, {
              elevenLabsId: preset?.elevenLabsId,
              geminiVoice: preset?.geminiVoice,
            })
          : null;
        if (tts) {
          const mixed = await mixAudio(tts.dataUrl, musicUrl, { voiceGain: 1.0, musicGain: 0.16 });
          useEditor.getState().setAudio({
            src: mixed ?? tts.dataUrl,
            name: `voiceover-${tts.source}`,
            volume: 1.0,
          });
        } else {
          // No server TTS configured → fall back to live browser speak at render
          useLiveSpeak = true;
        }
      }

      // 4. Render
      setStep("render", { status: "running" });
      const project = useEditor.getState().project;

      // Only live-speak when neural TTS wasn't available (no ElevenLabs/Gemini
      // key). Otherwise the human voiceover is already baked into project.audio.
      let cancelVoice: (() => void) | null = null;
      if (useLiveSpeak) {
        const script = projectToScript(project);
        if (script) cancelVoice = speakLive(script);
      }

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
        // Only auto-download if direct share isn't available (e.g. desktop)
        // — on iOS we want the operator to use the Share button per platform.
        if (!canShareFiles()) {
          for (const r of results) {
            downloadBlob(r.blob, `${safeName}__${r.platform.id}.${extensionFor(r.mimeType)}`);
          }
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

      if (cancelVoice) cancelVoice();

      // Generate a shareable lead form for this ad
      const formSpec = createForm(useEditor.getState().project);
      setLeadForm(formSpec);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error", detail: msg } : s)));
    } finally {
      setBusy(false);
      // Always cancel any pending speech if we crashed mid-render
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
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
        {/* Inline brand quick-edit — company, category, website, phone, offer */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-white/60">Your business</div>
            <button
              type="button"
              onClick={() => setShowBrandQuick((v) => !v)}
              className="text-[11px] text-brand"
            >
              {showBrandQuick ? "Hide" : "Edit"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1 text-[11px]">
            <span className="chip">{project.brand.companyName}</span>
            <span className="chip">{project.brand.category}</span>
            <span className="chip">{project.brand.serviceArea.split("•")[0].trim() || "—"}</span>
          </div>
          {showBrandQuick && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                className="input col-span-2"
                placeholder="Company name"
                value={project.brand.companyName}
                onChange={(e) =>
                  useEditor.getState().updateBrand({ companyName: e.target.value })
                }
              />
              <select
                className="input col-span-2"
                value={project.brand.category}
                onChange={(e) => useEditor.getState().updateBrand({ category: e.target.value })}
              >
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Website"
                value={project.brand.website}
                onChange={(e) => useEditor.getState().updateBrand({ website: e.target.value })}
              />
              <input
                className="input"
                placeholder="Phone"
                value={project.brand.phone}
                onChange={(e) => useEditor.getState().updateBrand({ phone: e.target.value })}
              />
              <input
                className="input col-span-2"
                placeholder="Service area (e.g. Tampa • St. Pete • Brandon)"
                value={project.brand.serviceArea}
                onChange={(e) => useEditor.getState().updateBrand({ serviceArea: e.target.value })}
              />
              <input
                className="input col-span-2"
                placeholder="Offer (e.g. $50 OFF first pickup)"
                value={project.brand.offer}
                onChange={(e) => useEditor.getState().updateBrand({ offer: e.target.value })}
              />
            </div>
          )}
        </div>

        <textarea
          className="input min-h-[100px] text-base"
          placeholder='Describe your ad — e.g. "15s Reels for same-day garage cleanout with $50 off"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
        />
        <div className="mt-3">
          <div className="label mb-1">Tone</div>
          <div className="grid grid-cols-4 gap-1">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                disabled={busy}
                className={`btn-ghost h-9 text-xs ${
                  tone === t.id ? "ring-1 ring-brand/60 bg-brand/10" : ""
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-white/40 mt-1">
            {tone === "funny"
              ? "Picks a comedy template (tier list, things-our-crew-heard, etc.) + bouncy shuffle music."
              : tone === "cinematic"
              ? "Slow build, evocative imagery, swelling pads."
              : tone === "chill"
              ? "Calm, friendly, trustworthy. Mellow loop."
              : "Tight hook + urgency + drum-driven track."}
          </div>
        </div>
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
        <label className="flex items-start gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={addVoice}
            onChange={(e) => setAddVoice(e.target.checked)}
            disabled={busy}
            className="mt-1 size-4 accent-brand"
          />
          <div className="text-sm">
            <div className="font-semibold">Add voiceover (reads your captions aloud)</div>
            <div className="text-[11px] text-white/50">
              Human neural voice (ElevenLabs / Gemini) baked over ducked music.
              Falls back to the browser voice if no TTS key is set.
            </div>
          </div>
        </label>
        {addVoice && (
          <div className="mt-2 pl-6">
            <div className="label mb-1">Voice</div>
            <select
              className="input"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={busy}
            >
              {VOICE_PRESETS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {v.vibe}
                </option>
              ))}
            </select>
          </div>
        )}
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
                <div className="grid grid-cols-2 gap-2">
                  <a href={resultUrl} download={resultName} className="btn-primary">
                    <Download className="size-4" /> Download
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        const r = await fetch(resultUrl);
                        const blob = await r.blob();
                        await shareToSheet({
                          blob,
                          filename: resultName,
                          title: project.brand.companyName,
                          text: shareCaption(),
                        });
                      } catch {}
                    }}
                    disabled={!canShareFiles()}
                    className="btn-ghost"
                    title={canShareFiles() ? "Share to IG / TikTok / FB" : "Direct share not supported on this browser"}
                  >
                    <Share2 className="size-4" /> Share
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="label">{bulkResults.length} platform files ready</div>
                  <ul className="space-y-1 max-h-56 overflow-auto">
                    {bulkResults.map((r) => {
                      const fname = `${(resultName.split("__")[0]) || "ad"}__${r.platform.id}.${extensionFor(r.mimeType)}`;
                      const composerKey =
                        r.platform.id === "meta-reels"
                          ? "ig-reels"
                          : r.platform.id === "meta-stories"
                          ? "ig-reels"
                          : r.platform.id === "meta-feed-portrait" || r.platform.id === "meta-feed-square"
                          ? "fb-feed"
                          : r.platform.id === "tiktok"
                          ? "tiktok"
                          : r.platform.id === "yt-shorts"
                          ? "yt-shorts"
                          : r.platform.id === "yt-standard"
                          ? "yt-standard"
                          : r.platform.id.startsWith("linkedin")
                          ? "linkedin"
                          : r.platform.id.startsWith("pinterest")
                          ? "pinterest"
                          : r.platform.id === "snapchat"
                          ? "snapchat"
                          : null;
                      const composer = composerKey ? PLATFORM_UPLOAD_URLS[composerKey] : null;
                      return (
                        <li key={r.platform.id} className="bg-white/5 rounded-lg px-2 py-2">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate">
                              <span className="text-brand font-semibold">{r.platform.name}</span>
                              <span className="text-white/40 ml-2">
                                {r.platform.width}×{r.platform.height} · {r.durationSeconds.toFixed(1)}s
                              </span>
                              {r.trimmed && <span className="ml-2 text-amber-300">trimmed</span>}
                            </span>
                          </div>
                          <div className="mt-1.5 grid grid-cols-3 gap-1">
                            <button
                              onClick={async () => {
                                if (leadForm) track({ adId: leadForm.id, event: "share", meta: { platform: r.platform.id } });
                                await shareToSheet({
                                  blob: r.blob,
                                  filename: fname,
                                  title: project.brand.companyName,
                                  text: shareCaption(),
                                });
                              }}
                              disabled={!canShareFiles()}
                              className="btn-primary h-8 px-2 text-[11px]"
                            >
                              <Share2 className="size-3" /> Share
                            </button>
                            <a
                              href={URL.createObjectURL(r.blob)}
                              download={fname}
                              className="btn-ghost h-8 px-2 text-[11px]"
                            >
                              <Download className="size-3" /> Save
                            </a>
                            {composer && (
                              <a
                                href={composer.url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-ghost h-8 px-2 text-[11px]"
                                title={`Open ${composer.label} composer`}
                              >
                                <ExternalLink className="size-3" /> Post
                              </a>
                            )}
                          </div>
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

          {leadForm && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="label mb-1">Lead capture URL — paste this as your ad&apos;s destination</div>
              <div className="rounded-md bg-white/5 border border-white/10 p-2 text-[10px] break-all">
                {leadFormUrl(leadForm)}
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(leadFormUrl(leadForm));
                    setLeadUrlCopied(true);
                    setTimeout(() => setLeadUrlCopied(false), 1500);
                  }}
                  className="btn-primary h-8 text-[11px]"
                >
                  <Copy className="size-3" /> {leadUrlCopied ? "Copied!" : "Copy"}
                </button>
                <a
                  href={leadFormUrl(leadForm)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track({ adId: leadForm.id, event: "preview_open" })}
                  className="btn-ghost h-8 text-[11px]"
                >
                  <ExternalLink className="size-3" /> Preview
                </a>
              </div>
              {!leadForm.notifyEmail && (
                <div className="text-[10px] text-amber-300 mt-1">
                  ⚠ No notify email set. <Link href="/settings" className="underline">Set it</Link> so leads land in your inbox.
                </div>
              )}
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
