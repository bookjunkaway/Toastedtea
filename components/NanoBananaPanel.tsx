"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { BANANA_PRESETS, ImageSource, generateBananaImage } from "@/lib/nanoBanana";
import { useEditor } from "@/lib/store";

type Target = "background" | "before" | "after" | "hero";

export function NanoBananaPanel() {
  const [prompt, setPrompt] = useState(BANANA_PRESETS[0].prompt);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>("background");
  const [source, setSource] = useState<ImageSource>("auto");
  const project = useEditor((s) => s.project);
  const selectedSceneId = useEditor((s) => s.selectedSceneId);
  const updateScene = useEditor((s) => s.updateScene);
  const updateBrand = useEditor((s) => s.updateBrand);

  const generate = async () => {
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      const result = await generateBananaImage(prompt, project.aspectRatio, source);
      const { dataUrl } = result;
      if (target === "background") {
        const sceneId = selectedSceneId ?? project.scenes[0]?.id;
        if (sceneId)
          updateScene(sceneId, {
            background: { kind: "image", src: dataUrl, fit: "cover", overlay: "rgba(0,0,0,0.35)" },
          });
      } else if (target === "before") {
        updateBrand({ beforeImage: dataUrl });
      } else if (target === "after") {
        updateBrand({ afterImage: dataUrl });
      } else {
        updateBrand({ heroImage: dataUrl });
      }
      setNote(result.note ?? `Generated via ${result.source === "nano-banana" ? "Nano Banana" : "Pollinations (free)"}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const errorIsQuota = err && /429|quota|billing/i.test(err);
  const errorIsAuth = err && /api[_ ]?key|GEMINI_API_KEY/i.test(err);

  return (
    <div className="panel p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="label flex items-center gap-1">
          <Sparkles className="size-3 text-brand" /> AI imagery
        </div>
        <span className="chip">{source === "pollinations" ? "free" : "auto"}</span>
      </div>

      <div>
        <div className="label mb-1">Renderer</div>
        <div className="grid grid-cols-3 gap-1">
          {(["auto", "nano-banana", "pollinations"] as ImageSource[]).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`btn-ghost h-7 px-2 text-[11px] ${source === s ? "ring-1 ring-brand/60 bg-brand/10" : ""}`}
              title={
                s === "auto"
                  ? "Try Nano Banana, fall back to Pollinations if quota / no key"
                  : s === "nano-banana"
                  ? "Gemini 2.5 Flash Image — paid Google Cloud billing required"
                  : "Pollinations (Flux) — genuinely free, no key needed"
              }
            >
              {s === "auto" ? "auto" : s === "nano-banana" ? "Nano Banana" : "Free"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-1">Apply to</div>
        <div className="grid grid-cols-4 gap-1">
          {(["background", "before", "after", "hero"] as Target[]).map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`btn-ghost h-7 px-2 text-[11px] ${target === t ? "ring-1 ring-brand/60 bg-brand/10" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-1">Tampa presets</div>
        <div className="grid grid-cols-1 gap-1 max-h-40 overflow-auto pr-1">
          {BANANA_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPrompt(p.prompt)}
              className="text-left rounded-md px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5"
              title={p.prompt}
            >
              <div className="text-[12px] font-semibold">{p.label}</div>
              <div className="text-[10px] text-white/50 line-clamp-1">{p.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-1">Prompt</div>
        <textarea
          className="input min-h-[80px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the photo you want…"
        />
      </div>

      {err && (
        <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">
          <div>{err}</div>
          {errorIsQuota && (
            <div className="mt-1 text-white/60">
              Nano Banana requires paid Google Cloud billing. Switch the renderer above to <b className="text-brand">Free</b> and try again — uses Pollinations (Flux), no key, no cost.
            </div>
          )}
          {errorIsAuth && (
            <div className="mt-1 text-white/60">
              Set <code className="text-brand">GEMINI_API_KEY</code> in Vercel env vars, or switch the renderer to <b className="text-brand">Free</b>.
            </div>
          )}
        </div>
      )}

      {note && !err && (
        <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
          ✓ {note}
        </div>
      )}

      <button onClick={generate} disabled={busy || !prompt.trim()} className="btn-primary w-full">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Generating…
          </>
        ) : (
          <>
            <Wand2 className="size-4" /> Generate image
          </>
        )}
      </button>
    </div>
  );
}
