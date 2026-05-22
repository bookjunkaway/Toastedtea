"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useEditor } from "@/lib/store";

export function SceneStrip() {
  const project = useEditor((s) => s.project);
  const selectedSceneId = useEditor((s) => s.selectedSceneId);
  const selectScene = useEditor((s) => s.selectScene);
  const addScene = useEditor((s) => s.addScene);
  const duplicateScene = useEditor((s) => s.duplicateScene);
  const deleteScene = useEditor((s) => s.deleteScene);
  const moveScene = useEditor((s) => s.moveScene);

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="label">Scenes</div>
        <button onClick={() => addScene(selectedSceneId ?? undefined)} className="btn-ghost h-7 px-2 text-xs">
          <Plus className="size-3" /> Add
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {project.scenes.map((sc, i) => {
          const selected = sc.id === selectedSceneId;
          const bg =
            sc.background.kind === "gradient"
              ? `linear-gradient(${sc.background.angle}deg, ${sc.background.from}, ${sc.background.to})`
              : sc.background.kind === "solid"
              ? sc.background.color
              : `url(${sc.background.src}) center/cover`;
          const headline =
            (sc.layers.find((l) => l.type === "text") as { text?: string } | undefined)?.text ?? sc.name;
          return (
            <div
              key={sc.id}
              className={clsx(
                "shrink-0 w-28 rounded-lg overflow-hidden border cursor-pointer relative group",
                selected ? "border-brand" : "border-white/10 hover:border-white/30",
              )}
              onClick={() => selectScene(sc.id)}
            >
              <div className="aspect-[9/16] relative" style={{ background: bg }}>
                <div className="absolute inset-0 p-1 flex flex-col justify-end text-[9px] font-bold text-white drop-shadow-md text-center leading-tight">
                  <span className="line-clamp-3">{headline}</span>
                </div>
                <div className="absolute top-1 left-1 text-[9px] bg-black/60 rounded px-1 font-bold">
                  {i + 1}
                </div>
                <div className="absolute top-1 right-1 text-[9px] bg-black/60 rounded px-1 font-bold">
                  {sc.duration.toFixed(1)}s
                </div>
              </div>
              <div className="flex items-center justify-between bg-black/40 px-1 py-0.5">
                <button
                  className="text-white/70 hover:text-white p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveScene(sc.id, -1);
                  }}
                  aria-label="Move scene left"
                >
                  <ArrowUp className="size-3 -rotate-90" />
                </button>
                <button
                  className="text-white/70 hover:text-white p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateScene(sc.id);
                  }}
                  aria-label="Duplicate scene"
                >
                  <Copy className="size-3" />
                </button>
                <button
                  className="text-white/70 hover:text-red-400 p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (project.scenes.length > 1) deleteScene(sc.id);
                  }}
                  aria-label="Delete scene"
                >
                  <Trash2 className="size-3" />
                </button>
                <button
                  className="text-white/70 hover:text-white p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveScene(sc.id, 1);
                  }}
                  aria-label="Move scene right"
                >
                  <ArrowDown className="size-3 -rotate-90" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
