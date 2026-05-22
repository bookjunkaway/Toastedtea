"use client";

import { listTemplates } from "@/lib/templates";
import { useEditor } from "@/lib/store";

export function TemplateGallery() {
  const loadTemplate = useEditor((s) => s.loadTemplate);
  const templates = listTemplates();
  return (
    <div className="panel p-3">
      <div className="label mb-2">Templates</div>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((t) => {
          const bg =
            t.preview.background.kind === "gradient"
              ? `linear-gradient(${t.preview.background.angle}deg, ${t.preview.background.from}, ${t.preview.background.to})`
              : t.preview.background.kind === "solid"
              ? t.preview.background.color
              : "#0f172a";
          return (
            <button
              key={t.id}
              onClick={() => loadTemplate(t.id)}
              className="text-left rounded-lg overflow-hidden border border-white/10 hover:border-brand/40 transition-colors group"
              title={t.description}
            >
              <div
                className="aspect-[4/5] relative"
                style={{ background: bg }}
              >
                <div className="absolute inset-0 p-2 flex flex-col items-center justify-center text-center">
                  <div
                    className="text-sm font-black leading-tight drop-shadow"
                    style={{ color: t.preview.accent }}
                  >
                    {t.preview.headline}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-white/90 drop-shadow">
                    {t.preview.sub}
                  </div>
                </div>
                <span className="absolute top-1 right-1 text-[9px] bg-black/60 rounded px-1 font-bold">
                  {t.recommendedAspect}
                </span>
              </div>
              <div className="px-2 py-1.5 bg-black/30 text-[11px] font-semibold line-clamp-1 group-hover:text-brand transition-colors">
                {t.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
