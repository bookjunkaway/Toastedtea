"use client";

import { useEffect, useRef } from "react";
import { useEditor, sceneAtTime, totalDuration } from "@/lib/store";
import { ASPECT_RATIOS } from "@/lib/types";
import { preloadScenes, renderScene } from "@/lib/renderer";

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const project = useEditor((s) => s.project);
  const isPlaying = useEditor((s) => s.isPlaying);
  const previewTime = useEditor((s) => s.previewTime);
  const selectedSceneId = useEditor((s) => s.selectedSceneId);
  const pause = useEditor((s) => s.pause);
  const setPreviewTime = useEditor((s) => s.setPreviewTime);

  const ar = ASPECT_RATIOS[project.aspectRatio];

  // Preload images so first paint is solid
  useEffect(() => {
    preloadScenes(project.scenes).then(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const slot = selectedSceneId
        ? { scene: project.scenes.find((s) => s.id === selectedSceneId)!, localTime: previewTime, index: 0 }
        : sceneAtTime(project, previewTime);
      if (slot?.scene) renderScene(ctx, slot.scene, slot.localTime, c.width, c.height);
    });
  }, [project, selectedSceneId, previewTime]);

  // Per-frame animation loop while playing
  useEffect(() => {
    if (!isPlaying) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const start = performance.now();
    const t0 = previewTime;

    const playingScene = selectedSceneId
      ? project.scenes.find((s) => s.id === selectedSceneId)
      : null;
    const scope: "scene" | "all" = playingScene ? "scene" : "all";
    const sceneDuration = playingScene?.duration ?? 0;
    const projectDuration = totalDuration(project);

    function frame(now: number) {
      const elapsed = (now - start) / 1000;
      const t = t0 + elapsed;
      if (scope === "scene") {
        if (t >= sceneDuration) {
          renderScene(ctx!, playingScene!, sceneDuration, c!.width, c!.height);
          setPreviewTime(0);
          pause();
          return;
        }
        renderScene(ctx!, playingScene!, t, c!.width, c!.height);
        setPreviewTime(t);
      } else {
        if (t >= projectDuration) {
          setPreviewTime(0);
          pause();
          return;
        }
        const slot = sceneAtTime(project, t);
        if (slot) renderScene(ctx!, slot.scene, slot.localTime, c!.width, c!.height);
        setPreviewTime(t);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // We intentionally re-create the loop only when play state or selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, selectedSceneId]);

  return (
    <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
      <div
        className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/10"
        style={{ aspectRatio: `${ar.width} / ${ar.height}`, maxHeight: "100%", maxWidth: "100%", minHeight: 0 }}
      >
        <canvas
          ref={canvasRef}
          width={ar.width}
          height={ar.height}
          className="block h-full w-full"
        />
      </div>
    </div>
  );
}
