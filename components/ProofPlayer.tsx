"use client";

import { useEffect, useRef, useState } from "react";
import { Play, RefreshCcw } from "lucide-react";
import { Project, ASPECT_RATIOS } from "@/lib/types";
import { preloadScenes, renderScene } from "@/lib/renderer";

interface Props {
  project: Project;
}

function durationOf(p: Project): number {
  return p.scenes.reduce((a, b) => a + b.duration, 0);
}

function sceneAt(p: Project, t: number) {
  let acc = 0;
  for (const sc of p.scenes) {
    if (t < acc + sc.duration) return { scene: sc, localTime: t - acc };
    acc += sc.duration;
  }
  return null;
}

export function ProofPlayer({ project }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const ar = ASPECT_RATIOS[project.aspectRatio];

  useEffect(() => {
    preloadScenes(project.scenes).then(() => {
      setReady(true);
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      renderScene(ctx, project.scenes[0], 0, c.width, c.height);
    });
  }, [project]);

  useEffect(() => {
    if (!playing) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const start = performance.now();
    const total = durationOf(project);
    let raf = 0;
    function tick(now: number) {
      const t = (now - start) / 1000;
      if (t >= total) {
        setPlaying(false);
        return;
      }
      const slot = sceneAt(project, t);
      if (slot) renderScene(ctx!, slot.scene, slot.localTime, c!.width, c!.height);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, project]);

  return (
    <div className="relative mx-auto" style={{ maxWidth: 480 }}>
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black"
        style={{ aspectRatio: `${ar.width} / ${ar.height}` }}
      >
        <canvas ref={ref} width={ar.width} height={ar.height} className="block h-full w-full" />
        {!playing && (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
            aria-label="Play"
          >
            <span className="size-16 rounded-full bg-brand text-ink-950 flex items-center justify-center shadow-2xl">
              <Play className="size-8 ml-1" />
            </span>
          </button>
        )}
      </div>
      <div className="flex justify-center mt-3 gap-2">
        <button
          onClick={() => {
            setPlaying(false);
            setTimeout(() => setPlaying(true), 50);
          }}
          className="btn-ghost h-9 text-xs"
          disabled={!ready}
        >
          <RefreshCcw className="size-3" /> Replay
        </button>
      </div>
    </div>
  );
}
