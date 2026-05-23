"use client";

/* ──────────────────────────────────────────────────────────────────────────
 *  Procedural music generator
 *
 *  Uses OfflineAudioContext to synthesise short looping background tracks
 *  in the browser. No file hosting needed — output is a data: URL the
 *  exporter can mix into the video.
 *
 *  Four moods, each tuned for a different kind of ad:
 *    - punchy    → up-tempo Reels / urgency ads
 *    - funny     → bouncy off-beat shuffle for comedy templates
 *    - cinematic → slow build for before/after reveals
 *    - chill     → mellow loop for trust-builder spots
 * ────────────────────────────────────────────────────────────────────────── */

export type Mood = "punchy" | "funny" | "cinematic" | "chill";

interface TrackSpec {
  bpm: number;
  bassNotes: number[];
  leadNotes: number[];
  drumPattern: number[]; // 1 = kick, 2 = snare, 3 = hat, 0 = silence
  swing: number;
  /** Lead waveform shape */
  leadShape: OscillatorType;
  /** Bass waveform shape */
  bassShape: OscillatorType;
}

const TRACKS: Record<Mood, TrackSpec> = {
  punchy: {
    bpm: 120,
    bassNotes: [55, 55, 65, 55, 55, 55, 73, 55],
    leadNotes: [220, 0, 220, 0, 330, 0, 247, 0, 220, 0, 220, 0, 277, 0, 330, 0],
    drumPattern: [1, 3, 2, 3, 1, 3, 2, 3, 1, 3, 2, 3, 1, 1, 2, 3],
    swing: 0,
    leadShape: "square",
    bassShape: "sawtooth",
  },
  funny: {
    bpm: 105,
    bassNotes: [49, 49, 0, 49, 55, 0, 49, 0],
    leadNotes: [262, 330, 392, 330, 262, 330, 440, 392, 262, 330, 392, 523, 440, 392, 330, 262],
    drumPattern: [1, 3, 2, 3, 0, 3, 2, 3, 1, 3, 2, 3, 1, 0, 2, 3],
    swing: 0.18, // bouncy shuffle
    leadShape: "triangle",
    bassShape: "square",
  },
  cinematic: {
    bpm: 88,
    bassNotes: [41, 41, 41, 49, 49, 49, 55, 55],
    leadNotes: [330, 0, 0, 0, 392, 0, 0, 0, 440, 0, 0, 0, 392, 0, 330, 0],
    drumPattern: [1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 1, 0],
    swing: 0,
    leadShape: "sine",
    bassShape: "sine",
  },
  chill: {
    bpm: 90,
    bassNotes: [55, 0, 55, 0, 62, 0, 65, 0],
    leadNotes: [330, 0, 392, 0, 440, 0, 392, 0, 330, 0, 294, 0, 330, 0, 392, 0],
    drumPattern: [1, 0, 3, 0, 2, 0, 3, 0, 1, 0, 3, 0, 2, 0, 3, 0],
    swing: 0,
    leadShape: "sine",
    bassShape: "triangle",
  },
};

/** Synthesise one step into the buffer. Cheap-but-musical voices. */
function paintStep(
  buf: Float32Array,
  startSample: number,
  durSamples: number,
  sampleRate: number,
  freq: number,
  amp: number,
  shape: OscillatorType,
): void {
  if (freq <= 0 || amp <= 0) return;
  const attack = Math.min(0.01 * sampleRate, durSamples * 0.1);
  const release = Math.min(0.15 * sampleRate, durSamples * 0.4);
  const sustain = Math.max(0, durSamples - attack - release);
  for (let i = 0; i < durSamples; i++) {
    if (startSample + i >= buf.length) break;
    const t = i / sampleRate;
    let env = 1;
    if (i < attack) env = i / attack;
    else if (i < attack + sustain) env = 1;
    else env = Math.max(0, 1 - (i - attack - sustain) / release);
    let sample = 0;
    const phase = 2 * Math.PI * freq * t;
    if (shape === "sine") sample = Math.sin(phase);
    else if (shape === "square") sample = Math.sin(phase) >= 0 ? 1 : -1;
    else if (shape === "sawtooth") sample = 2 * (freq * t - Math.floor(0.5 + freq * t));
    else if (shape === "triangle") sample = 1 - 4 * Math.abs(Math.round(freq * t) - freq * t);
    buf[startSample + i] += sample * env * amp;
  }
}

function paintDrum(
  buf: Float32Array,
  startSample: number,
  sampleRate: number,
  kind: 0 | 1 | 2 | 3,
): void {
  if (kind === 0) return;
  // Kick: 60Hz sine + click
  if (kind === 1) {
    const dur = Math.floor(0.18 * sampleRate);
    for (let i = 0; i < dur; i++) {
      if (startSample + i >= buf.length) break;
      const t = i / sampleRate;
      const env = Math.max(0, 1 - i / dur);
      const freq = 60 + 80 * Math.pow(env, 4);
      buf[startSample + i] += Math.sin(2 * Math.PI * freq * t) * env * 0.65;
    }
  }
  // Snare: noise burst
  if (kind === 2) {
    const dur = Math.floor(0.12 * sampleRate);
    for (let i = 0; i < dur; i++) {
      if (startSample + i >= buf.length) break;
      const env = Math.max(0, 1 - i / dur);
      buf[startSample + i] += (Math.random() * 2 - 1) * env * 0.35;
    }
  }
  // Hi-hat: short bright noise
  if (kind === 3) {
    const dur = Math.floor(0.04 * sampleRate);
    for (let i = 0; i < dur; i++) {
      if (startSample + i >= buf.length) break;
      const env = Math.max(0, 1 - i / dur);
      buf[startSample + i] += (Math.random() * 2 - 1) * env * 0.12;
    }
  }
}

function encodeWavDataUrl(samples: Float32Array, sampleRate: number): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  // Base64 encode in chunks to avoid call-stack issues on large buffers
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(bin)}`;
}

/**
 * Generate a track of the given mood lasting `durationSec` seconds.
 * The buffer is exactly one bar long internally and the exporter loops
 * the audio source — so even a short generation tile a long video.
 */
export async function generateTrack(mood: Mood, durationSec = 30): Promise<{ dataUrl: string; name: string }> {
  const spec = TRACKS[mood];
  const sampleRate = 22050;
  const totalSamples = Math.floor(durationSec * sampleRate);
  const buf = new Float32Array(totalSamples);

  const beatsPerBar = 16; // 16th notes
  const stepDur = 60 / spec.bpm / 4; // seconds per 16th
  const stepSamples = Math.floor(stepDur * sampleRate);

  let step = 0;
  let pos = 0;
  while (pos < totalSamples) {
    const swingOffset = step % 2 === 1 ? Math.floor(spec.swing * stepSamples) : 0;
    const sPos = pos + swingOffset;

    // Drums (always at every step)
    const drum = spec.drumPattern[step % spec.drumPattern.length] as 0 | 1 | 2 | 3;
    paintDrum(buf, sPos, sampleRate, drum);

    // Bass on each 8th (every 2 steps)
    if (step % 2 === 0) {
      const bassFreq = spec.bassNotes[(step / 2) % spec.bassNotes.length];
      paintStep(buf, sPos, stepSamples * 2, sampleRate, bassFreq, 0.22, spec.bassShape);
    }

    // Lead at 16th rate
    const leadFreq = spec.leadNotes[step % spec.leadNotes.length];
    paintStep(buf, sPos, stepSamples, sampleRate, leadFreq, 0.14, spec.leadShape);

    pos += stepSamples;
    step++;
  }

  // Soft limiter
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  if (peak > 0.95) {
    const k = 0.95 / peak;
    for (let i = 0; i < buf.length; i++) buf[i] *= k;
  }

  const dataUrl = encodeWavDataUrl(buf, sampleRate);
  return { dataUrl, name: `${mood}-track` };
}
