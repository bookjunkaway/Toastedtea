"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useEditor } from "@/lib/store";
import { AspectRatioKey, BrandInputs } from "@/lib/types";

interface AdSpecResponse {
  spec: {
    templateId: string;
    aspectRatio: string;
    brandPatch: Partial<BrandInputs>;
    sceneOverrides: Array<{ sceneIndex: number; layerIndex: number; text: string }>;
    notes?: string;
  };
  warning?: string;
}

const SUGGESTIONS = [
  "Make me a 15-second Reels ad for storm-damaged debris cleanup with a $50 off offer",
  "Build a 5-star social proof ad for South Tampa homeowners",
  "Create a before/after garage cleanout ad with a 'book by 2pm' urgency",
  "Show a snowbird condo cleanout ad targeting realtors",
  "Highlight that we're family-owned, insured, and serve all of Tampa Bay",
];

export function PromptBar() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const project = useEditor((s) => s.project);
  const loadTemplate = useEditor((s) => s.loadTemplate);
  const setAspectRatio = useEditor((s) => s.setAspectRatio);
  const updateBrand = useEditor((s) => s.updateBrand);
  const updateLayer = useEditor((s) => s.updateLayer);

  // ⌘/Ctrl-K to focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = async () => {
    const instruction = value.trim();
    if (!instruction || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, currentAspect: project.aspectRatio }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdSpecResponse;
      const spec = json.spec;

      // 1) aspect
      if (spec.aspectRatio && spec.aspectRatio !== project.aspectRatio) {
        setAspectRatio(spec.aspectRatio as AspectRatioKey);
      }
      // 2) template
      loadTemplate(spec.templateId);
      // 3) brand patch
      if (spec.brandPatch && Object.keys(spec.brandPatch).length > 0) {
        updateBrand(spec.brandPatch);
      }
      // 4) scene overrides (run after a microtask so loadTemplate state lands)
      queueMicrotask(() => {
        const fresh = useEditor.getState().project;
        for (const o of spec.sceneOverrides ?? []) {
          const sc = fresh.scenes[o.sceneIndex];
          if (!sc) continue;
          const layer = sc.layers[o.layerIndex];
          if (!layer || layer.type !== "text") continue;
          updateLayer(sc.id, layer.id, { text: o.text });
        }
      });

      setNote(json.warning ?? spec.notes ?? "Ad rebuilt from your prompt.");
      setValue("");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-white/10 bg-gradient-to-b from-black/60 to-black/30 px-3 py-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1 min-w-0">
          <Sparkles className="size-4 text-brand absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Describe your ad — e.g. "15s Reels storm debris $50 off"'
            className="input pl-9 pr-3 sm:pr-24 h-10 text-base sm:text-sm"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/40 hidden sm:inline">
            ⌘K
          </kbd>
        </div>
        <button type="submit" disabled={busy || !value.trim()} className="btn-primary h-10 px-3 shrink-0">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          <span className="hidden sm:inline">{busy ? "Generating…" : "Generate"}</span>
        </button>
      </form>
      <div className="mt-1.5 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setValue(s)}
            className="chip whitespace-nowrap hover:bg-white/10 cursor-pointer text-[11px] shrink-0"
          >
            {s}
          </button>
        ))}
        {note && (
          <span className="ml-auto text-[11px] text-white/50 whitespace-nowrap truncate max-w-[40%] hidden sm:inline">
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
