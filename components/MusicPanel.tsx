"use client";

import { useState } from "react";
import { Loader2, Music, Pause, Play, Trash2 } from "lucide-react";
import { useEditor } from "@/lib/store";
import { Mood, generateTrack } from "@/lib/music";

const MOODS: { id: Mood; label: string; description: string }[] = [
  { id: "punchy", label: "Punchy", description: "Up-tempo Reels / urgency ads" },
  { id: "funny", label: "Funny", description: "Bouncy shuffle for comedy templates" },
  { id: "cinematic", label: "Cinematic", description: "Slow build for before/after reveals" },
  { id: "chill", label: "Chill", description: "Mellow loop for trust-builders" },
];

export function MusicPanel() {
  const project = useEditor((s) => s.project);
  const setAudio = useEditor((s) => s.setAudio);
  const [busy, setBusy] = useState<Mood | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const audio = project.audio;

  const generate = async (mood: Mood) => {
    setBusy(mood);
    try {
      const { dataUrl, name } = await generateTrack(mood, 30);
      setAudio({ src: dataUrl, name, volume: 0.7 });
    } finally {
      setBusy(null);
    }
  };

  const togglePreview = () => {
    if (!audio?.src) return;
    const id = "music-preview-audio";
    let el = document.getElementById(id) as HTMLAudioElement | null;
    if (!el) {
      el = document.createElement("audio");
      el.id = id;
      el.loop = true;
      document.body.appendChild(el);
    }
    if (previewing) {
      el.pause();
      setPreviewing(false);
    } else {
      el.src = audio.src;
      el.volume = audio.volume ?? 0.7;
      el.play();
      setPreviewing(true);
    }
  };

  return (
    <div className="panel p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="label flex items-center gap-1">
          <Music className="size-3 text-brand" /> Background music
        </div>
        {audio && <span className="chip">{audio.name}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => generate(m.id)}
            disabled={busy !== null}
            className="text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{m.label}</span>
              {busy === m.id && <Loader2 className="size-3 animate-spin text-brand" />}
            </div>
            <div className="text-[10px] text-white/50 mt-0.5">{m.description}</div>
          </button>
        ))}
      </div>

      {audio && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={togglePreview} className="btn-ghost h-9">
              {previewing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {previewing ? "Pause" : "Preview"}
            </button>
            <button onClick={() => setAudio(undefined)} className="btn-ghost h-9">
              <Trash2 className="size-4" /> Remove
            </button>
          </div>
          <div>
            <div className="label mb-1">Volume</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audio.volume ?? 0.7}
              onChange={(e) => setAudio({ ...audio, volume: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </>
      )}

      <div className="text-[10px] text-white/40">
        Generated procedurally — no external files. Mixed into every export automatically.
      </div>
    </div>
  );
}
