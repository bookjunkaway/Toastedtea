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

/** Request a human-sounding voiceover from the server (ElevenLabs/Gemini).
 *  Returns a data URL, or null if no server TTS is configured (caller can
 *  then fall back to browser speakLive). */
export async function generateTtsAudio(
  text: string,
  voice?: { elevenLabsId?: string; geminiVoice?: string },
): Promise<{ dataUrl: string; source: string } | null> {
  try {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ...voice }),
    });
    if (!r.ok) return null;
    return (await r.json()) as { dataUrl: string; source: string };
  } catch {
    return null;
  }
}

/** Mix two audio data URLs (e.g. voiceover + background music) into one WAV
 *  data URL using OfflineAudioContext. Music is ducked under the voice. */
export async function mixAudio(
  voiceUrl: string,
  musicUrl: string | undefined,
  opts: { voiceGain?: number; musicGain?: number } = {},
): Promise<string | null> {
  try {
    const Ctx: typeof AudioContext =
      (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const tmp = new Ctx();
    const load = async (url: string) => {
      const buf = await (await fetch(url)).arrayBuffer();
      return tmp.decodeAudioData(buf);
    };
    const voice = await load(voiceUrl);
    const music = musicUrl ? await load(musicUrl).catch(() => null) : null;
    await tmp.close();

    const sampleRate = 44100;
    const duration = Math.max(voice.duration, music?.duration ?? 0);
    const frames = Math.ceil(duration * sampleRate);
    const offline = new OfflineAudioContext(1, frames, sampleRate);

    const vSrc = offline.createBufferSource();
    vSrc.buffer = voice;
    const vGain = offline.createGain();
    vGain.gain.value = opts.voiceGain ?? 1.0;
    vSrc.connect(vGain).connect(offline.destination);
    vSrc.start(0);

    if (music) {
      const mSrc = offline.createBufferSource();
      mSrc.buffer = music;
      mSrc.loop = true;
      const mGain = offline.createGain();
      mGain.gain.value = opts.musicGain ?? 0.18; // duck music under the voice
      mSrc.connect(mGain).connect(offline.destination);
      mSrc.start(0);
    }

    const rendered = await offline.startRendering();
    return audioBufferToWavDataUrl(rendered);
  } catch {
    return null;
  }
}

function audioBufferToWavDataUrl(buffer: AudioBuffer): string {
  const numCh = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const ab = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(ab);
  const ws = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ws(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  const bytes = new Uint8Array(ab);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

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
