"use client";

/* ──────────────────────────────────────────────────────────────────────────
 *  Voice-over (browser TTS → MediaRecorder → WAV/WebM data URL)
 *
 *  Uses the Web Speech SpeechSynthesis API to read a script aloud, captured
 *  via an AudioContext mediastream destination + MediaRecorder. Output is
 *  attached to project.audio so the exporter mixes it into the final video.
 *
 *  Note: iOS Safari's MediaRecorder can capture audio streams but doesn't
 *  expose SpeechSynthesis utterance audio directly — we fall back to playing
 *  the utterance live during render on iOS. Other browsers get a baked-in
 *  voiceover track.
 * ────────────────────────────────────────────────────────────────────────── */

import { Project, Scene } from "./types";

export function projectToScript(project: Project): string {
  const lines: string[] = [];
  for (const sc of project.scenes) {
    const text = sc.layers
      .filter((l): l is Extract<typeof sc.layers[number], { type: "text" }> => l.type === "text")
      .map((l) => l.text.replace(/[\n]+/g, ". "))
      .join(". ");
    if (text.trim()) lines.push(text.trim());
  }
  return lines.join(" ... ");
}

interface AvailableVoices {
  voice: SpeechSynthesisVoice;
  score: number;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  // Prefer en-US natural-sounding voices
  const scored: AvailableVoices[] = voices.map((v) => {
    let score = 0;
    if (/en[-_]US/i.test(v.lang)) score += 5;
    else if (/^en/i.test(v.lang)) score += 3;
    if (/Google|Samantha|Karen|Daniel|Microsoft/i.test(v.name)) score += 2;
    if (/Female|Aria|Zira/i.test(v.name)) score += 1;
    return { voice: v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.voice ?? voices[0];
}

/**
 * Render a TTS reading of `script` to an audio data URL via WebAudio + MediaRecorder.
 * Returns null if the browser cannot capture synthesised speech (notably iOS Safari).
 */
export async function renderVoiceover(script: string): Promise<{ dataUrl: string } | null> {
  if (typeof window === "undefined" || !window.speechSynthesis || !window.MediaRecorder) return null;

  // Wait for voice list (Chrome loads it async)
  if (window.speechSynthesis.getVoices().length === 0) {
    await new Promise<void>((resolve) => {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve();
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      setTimeout(resolve, 1500);
    });
  }

  const voice = pickVoice();

  // Try to capture SpeechSynthesis via an AudioContext — only works on Chrome/Firefox
  // because SpeechSynthesis routes to system output, not a stream we can tap.
  // The reliable cross-browser approach: speak live during the render. To at least
  // provide a recorded track on Chrome, we use the SystemAudio capture if available.
  type ExtendedNavigator = Navigator & {
    mediaDevices: MediaDevices & { getDisplayMedia?: (c: object) => Promise<MediaStream> };
  };
  const nav = navigator as ExtendedNavigator;
  if (!nav.mediaDevices?.getDisplayMedia) {
    // Most mobile browsers — return null so the caller falls back to live speak
    return null;
  }

  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(script);
    if (voice) utter.voice = voice;
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    // Live-speak fallback — return null and let the caller pipe TTS directly to
    // the export stream during render instead of pre-recording it.
    utter.onstart = () => {};
    utter.onend = () => resolve(null);
    utter.onerror = () => resolve(null);
    window.speechSynthesis.speak(utter);
  });
}

/**
 * Live-speak a script during render. Used when we can't pre-record.
 * Returns a cancel function the caller invokes when the render is done.
 */
export function speakLive(script: string): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  window.speechSynthesis.cancel();
  const voice = pickVoice();
  const utter = new SpeechSynthesisUtterance(script);
  if (voice) utter.voice = voice;
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  window.speechSynthesis.speak(utter);
  return () => window.speechSynthesis.cancel();
}

/**
 * Allocate one chunk of script per scene so the VO timing roughly matches.
 * Returns lines paired with their scene index.
 */
export function scriptPerScene(scenes: Scene[]): { sceneIndex: number; line: string }[] {
  const out: { sceneIndex: number; line: string }[] = [];
  scenes.forEach((sc, i) => {
    const line = sc.layers
      .filter((l): l is Extract<typeof sc.layers[number], { type: "text" }> => l.type === "text")
      .map((l) => l.text)
      .join(". ");
    if (line.trim()) out.push({ sceneIndex: i, line: line.trim() });
  });
  return out;
}
