"use client";

import { useMemo } from "react";
import { useEditor } from "@/lib/store";
import { Layer, LayerAnimation, Scene, ShapeLayer, StickerLayer, TextLayer } from "@/lib/types";
import { uid } from "@/lib/id";
import { Plus, Trash2 } from "lucide-react";

const ANIMS: LayerAnimation[] = [
  "none",
  "fadeIn",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "zoomIn",
  "zoomOut",
  "kenBurns",
  "pulse",
];

export function Inspector() {
  const project = useEditor((s) => s.project);
  const selectedSceneId = useEditor((s) => s.selectedSceneId);
  const selectedLayerId = useEditor((s) => s.selectedLayerId);
  const selectLayer = useEditor((s) => s.selectLayer);
  const updateScene = useEditor((s) => s.updateScene);
  const updateLayer = useEditor((s) => s.updateLayer);
  const addLayer = useEditor((s) => s.addLayer);
  const deleteLayer = useEditor((s) => s.deleteLayer);

  const scene = useMemo(
    () => project.scenes.find((s) => s.id === selectedSceneId) ?? project.scenes[0],
    [project, selectedSceneId],
  );
  const layer = useMemo(() => scene?.layers.find((l) => l.id === selectedLayerId), [scene, selectedLayerId]);

  if (!scene) {
    return <div className="panel p-4 text-sm text-white/60">No scene selected.</div>;
  }

  const addTextLayer = () => {
    const t: TextLayer = {
      id: uid("t"),
      type: "text",
      text: "Your headline",
      x: 0.08,
      y: 0.4,
      width: 0.84,
      height: 0.15,
      rotation: 0,
      opacity: 1,
      animation: "fadeIn",
      animationDelay: 0,
      animationDuration: 0.5,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontWeight: 800,
      fontSize: 0.07,
      lineHeight: 1.1,
      letterSpacing: 0,
      color: "#ffffff",
      align: "center",
      paddingX: 0,
      paddingY: 0,
      borderRadius: 0,
    };
    addLayer(scene.id, t);
  };

  const addShapeLayer = () => {
    const s: ShapeLayer = {
      id: uid("s"),
      type: "shape",
      shape: "rect",
      fill: "#FBBF24",
      x: 0.15,
      y: 0.55,
      width: 0.7,
      height: 0.1,
      rotation: 0,
      opacity: 1,
      animation: "fadeIn",
      animationDelay: 0,
      animationDuration: 0.4,
      borderRadius: 0.05,
    };
    addLayer(scene.id, s);
  };

  const addStickerLayer = () => {
    const s: StickerLayer = {
      id: uid("st"),
      type: "sticker",
      emoji: "🚚",
      x: 0.4,
      y: 0.1,
      width: 0.2,
      height: 0.2,
      fontSize: 0.16,
      rotation: 0,
      opacity: 1,
      animation: "pulse",
      animationDelay: 0,
      animationDuration: 1,
    };
    addLayer(scene.id, s);
  };

  return (
    <div className="space-y-3 text-sm">
      {/* Scene properties */}
      <div className="panel p-3">
        <div className="label mb-2">Scene</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="label mb-1">Name</div>
            <input
              className="input"
              value={scene.name}
              onChange={(e) => updateScene(scene.id, { name: e.target.value })}
            />
          </div>
          <div>
            <div className="label mb-1">Duration (s)</div>
            <input
              className="input"
              type="number"
              min={0.5}
              step={0.1}
              value={scene.duration}
              onChange={(e) => updateScene(scene.id, { duration: Math.max(0.5, parseFloat(e.target.value) || 0.5) })}
            />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <div className="label mb-1">Transition</div>
            <select
              className="input"
              value={scene.transitionIn}
              onChange={(e) => updateScene(scene.id, { transitionIn: e.target.value as Scene["transitionIn"] })}
            >
              {(["none", "fade", "slideLeft", "slideUp", "zoom"] as Scene["transitionIn"][]).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="label mb-1">Transition dur (s)</div>
            <input
              className="input"
              type="number"
              min={0}
              step={0.05}
              value={scene.transitionInDuration}
              onChange={(e) => updateScene(scene.id, { transitionInDuration: Math.max(0, parseFloat(e.target.value) || 0) })}
            />
          </div>
        </div>
        <BackgroundEditor scene={scene} />
      </div>

      {/* Layers list */}
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="label">Layers</div>
          <div className="flex gap-1">
            <button className="btn-ghost h-7 px-2 text-xs" onClick={addTextLayer}>
              <Plus className="size-3" /> Text
            </button>
            <button className="btn-ghost h-7 px-2 text-xs" onClick={addShapeLayer}>
              <Plus className="size-3" /> Shape
            </button>
            <button className="btn-ghost h-7 px-2 text-xs" onClick={addStickerLayer}>
              <Plus className="size-3" /> Emoji
            </button>
          </div>
        </div>
        <ul className="space-y-1 max-h-40 overflow-auto">
          {scene.layers.map((l) => (
            <li
              key={l.id}
              onClick={() => selectLayer(l.id)}
              className={`flex items-center justify-between gap-2 rounded px-2 py-1 cursor-pointer ${
                l.id === selectedLayerId ? "bg-brand/15 ring-1 ring-brand/40" : "hover:bg-white/5"
              }`}
            >
              <span className="truncate">
                <span className="text-white/40 mr-2 uppercase text-[10px]">{l.type}</span>
                {l.type === "text" ? l.text : l.type === "sticker" ? l.emoji : l.type === "image" ? l.src : l.shape}
              </span>
              <button
                className="text-white/40 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayer(scene.id, l.id);
                }}
                aria-label="Delete layer"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
          {scene.layers.length === 0 && (
            <li className="text-xs text-white/40 px-1">No layers yet — add text, a shape, or an emoji.</li>
          )}
        </ul>
      </div>

      {/* Selected layer properties */}
      {layer && <LayerEditor sceneId={scene.id} layer={layer} />}
    </div>
  );
}

function BackgroundEditor({ scene }: { scene: Scene }) {
  const updateScene = useEditor((s) => s.updateScene);
  const bg = scene.background;
  return (
    <div className="mt-3">
      <div className="label mb-1">Background</div>
      <div className="flex gap-2">
        {(["solid", "gradient", "image"] as const).map((kind) => (
          <button
            key={kind}
            className={`btn-ghost h-7 px-2 text-xs flex-1 ${bg.kind === kind ? "ring-1 ring-brand/40 bg-brand/10" : ""}`}
            onClick={() => {
              if (kind === "solid") updateScene(scene.id, { background: { kind: "solid", color: "#0f172a" } });
              if (kind === "gradient")
                updateScene(scene.id, {
                  background: { kind: "gradient", from: "#FBBF24", to: "#dc2626", angle: 135 },
                });
              if (kind === "image")
                updateScene(scene.id, {
                  background: { kind: "image", src: "/logo.svg", fit: "contain", overlay: "rgba(0,0,0,0.4)" },
                });
            }}
          >
            {kind}
          </button>
        ))}
      </div>
      {bg.kind === "solid" && (
        <div className="mt-2">
          <input
            type="color"
            value={bg.color}
            onChange={(e) => updateScene(scene.id, { background: { kind: "solid", color: e.target.value } })}
            className="h-9 w-full rounded"
          />
        </div>
      )}
      {bg.kind === "gradient" && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div>
            <div className="label mb-1">From</div>
            <input
              type="color"
              value={bg.from}
              onChange={(e) => updateScene(scene.id, { background: { ...bg, from: e.target.value } })}
              className="h-9 w-full rounded"
            />
          </div>
          <div>
            <div className="label mb-1">To</div>
            <input
              type="color"
              value={bg.to}
              onChange={(e) => updateScene(scene.id, { background: { ...bg, to: e.target.value } })}
              className="h-9 w-full rounded"
            />
          </div>
          <div>
            <div className="label mb-1">Angle</div>
            <input
              type="number"
              className="input"
              value={bg.angle}
              onChange={(e) => updateScene(scene.id, { background: { ...bg, angle: parseInt(e.target.value || "0", 10) } })}
            />
          </div>
        </div>
      )}
      {bg.kind === "image" && (
        <div className="mt-2 space-y-2">
          <input
            className="input"
            placeholder="/logo.svg or data:image/..."
            value={bg.src}
            onChange={(e) => updateScene(scene.id, { background: { ...bg, src: e.target.value } })}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input"
              value={bg.fit}
              onChange={(e) => updateScene(scene.id, { background: { ...bg, fit: e.target.value as "cover" | "contain" } })}
            >
              <option value="cover">cover</option>
              <option value="contain">contain</option>
            </select>
            <input
              className="input"
              placeholder="overlay rgba()"
              value={bg.overlay ?? ""}
              onChange={(e) => updateScene(scene.id, { background: { ...bg, overlay: e.target.value || undefined } })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LayerEditor({ sceneId, layer }: { sceneId: string; layer: Layer }) {
  const updateLayer = useEditor((s) => s.updateLayer);
  return (
    <div className="panel p-3 space-y-3">
      <div className="label">Selected layer · {layer.type}</div>

      {layer.type === "text" && (
        <>
          <div>
            <div className="label mb-1">Text</div>
            <textarea
              className="input min-h-[60px]"
              value={layer.text}
              onChange={(e) => updateLayer(sceneId, layer.id, { text: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="label mb-1">Color</div>
              <input
                type="color"
                value={layer.color}
                onChange={(e) => updateLayer(sceneId, layer.id, { color: e.target.value })}
                className="h-9 w-full rounded"
              />
            </div>
            <div>
              <div className="label mb-1">Weight</div>
              <select
                className="input"
                value={layer.fontWeight}
                onChange={(e) => updateLayer(sceneId, layer.id, { fontWeight: parseInt(e.target.value, 10) })}
              >
                {[400, 500, 600, 700, 800, 900].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label mb-1">Align</div>
              <select
                className="input"
                value={layer.align}
                onChange={(e) => updateLayer(sceneId, layer.id, { align: e.target.value as "left" | "center" | "right" })}
              >
                <option value="left">left</option>
                <option value="center">center</option>
                <option value="right">right</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Font %H" value={layer.fontSize} step={0.005} onChange={(v) => updateLayer(sceneId, layer.id, { fontSize: v })} />
            <NumField label="Line height" value={layer.lineHeight} step={0.05} onChange={(v) => updateLayer(sceneId, layer.id, { lineHeight: v })} />
            <NumField label="Letter spacing" value={layer.letterSpacing} step={0.005} onChange={(v) => updateLayer(sceneId, layer.id, { letterSpacing: v })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!layer.uppercase}
                onChange={(e) => updateLayer(sceneId, layer.id, { uppercase: e.target.checked })}
              />
              UPPERCASE
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!layer.italic}
                onChange={(e) => updateLayer(sceneId, layer.id, { italic: e.target.checked })}
              />
              Italic
            </label>
          </div>
        </>
      )}

      {layer.type === "shape" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="label mb-1">Shape</div>
              <select
                className="input"
                value={layer.shape}
                onChange={(e) => updateLayer(sceneId, layer.id, { shape: e.target.value as ShapeLayer["shape"] })}
              >
                <option value="rect">rect</option>
                <option value="ellipse">ellipse</option>
                <option value="ribbon">ribbon</option>
              </select>
            </div>
            <div>
              <div className="label mb-1">Fill</div>
              <input
                type="color"
                value={layer.fill}
                onChange={(e) => updateLayer(sceneId, layer.id, { fill: e.target.value })}
                className="h-9 w-full rounded"
              />
            </div>
          </div>
        </>
      )}

      {layer.type === "sticker" && (
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <div className="label mb-1">Emoji</div>
            <input
              className="input text-2xl"
              value={layer.emoji}
              onChange={(e) => updateLayer(sceneId, layer.id, { emoji: e.target.value })}
            />
          </div>
          <NumField label="Size %H" value={layer.fontSize} step={0.01} onChange={(v) => updateLayer(sceneId, layer.id, { fontSize: v })} />
        </div>
      )}

      {layer.type === "image" && (
        <div>
          <div className="label mb-1">Image src</div>
          <input
            className="input"
            value={layer.src}
            onChange={(e) => updateLayer(sceneId, layer.id, { src: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <NumField label="X" value={layer.x} step={0.01} onChange={(v) => updateLayer(sceneId, layer.id, { x: v })} />
        <NumField label="Y" value={layer.y} step={0.01} onChange={(v) => updateLayer(sceneId, layer.id, { y: v })} />
        <NumField label="W" value={layer.width} step={0.01} onChange={(v) => updateLayer(sceneId, layer.id, { width: v })} />
        <NumField label="H" value={layer.height} step={0.01} onChange={(v) => updateLayer(sceneId, layer.id, { height: v })} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="label mb-1">Animation</div>
          <select
            className="input"
            value={layer.animation}
            onChange={(e) => updateLayer(sceneId, layer.id, { animation: e.target.value as LayerAnimation })}
          >
            {ANIMS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <NumField label="Delay (s)" value={layer.animationDelay} step={0.05} onChange={(v) => updateLayer(sceneId, layer.id, { animationDelay: Math.max(0, v) })} />
        <NumField label="Dur (s)" value={layer.animationDuration} step={0.05} onChange={(v) => updateLayer(sceneId, layer.id, { animationDuration: Math.max(0.05, v) })} />
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <input
        className="input"
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}
