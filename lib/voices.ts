/* ──────────────────────────────────────────────────────────────────────────
 *  Voiceover presets
 *
 *  Each preset maps a friendly label to a backend voice id for both
 *  ElevenLabs (voiceId) and Gemini TTS (prebuilt voiceName), so the same
 *  selection works regardless of which TTS backend the server uses.
 *  ElevenLabs IDs are the public default-library voices.
 * ────────────────────────────────────────────────────────────────────────── */

export interface VoicePreset {
  id: string;
  label: string;
  gender: "female" | "male";
  vibe: string;
  elevenLabsId: string;
  geminiVoice: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "energetic-f",
    label: "Energetic — Female",
    gender: "female",
    vibe: "Upbeat, punchy, great for Reels",
    elevenLabsId: "EXAVITQu4vr4xnSDxMaL", // Bella
    geminiVoice: "Aoede",
  },
  {
    id: "warm-f",
    label: "Warm — Female",
    gender: "female",
    vibe: "Friendly, trustworthy, conversational",
    elevenLabsId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    geminiVoice: "Kore",
  },
  {
    id: "confident-m",
    label: "Confident — Male",
    gender: "male",
    vibe: "Deep, authoritative, closer",
    elevenLabsId: "pNInz6obpgDQGcFmaJgB", // Adam
    geminiVoice: "Charon",
  },
  {
    id: "friendly-m",
    label: "Friendly — Male",
    gender: "male",
    vibe: "Approachable, casual, relatable",
    elevenLabsId: "ErXwobaYiN019PkySvjV", // Antoni
    geminiVoice: "Puck",
  },
  {
    id: "hype-m",
    label: "Hype — Male",
    gender: "male",
    vibe: "High-energy announcer for offers",
    elevenLabsId: "yoZ06aMxZJJ28mfd3POQ", // Sam
    geminiVoice: "Fenrir",
  },
  {
    id: "soft-f",
    label: "Soft — Female",
    gender: "female",
    vibe: "Calm, premium, for cinematic tone",
    elevenLabsId: "MF3mGyEYCl7XYWbV9V6O", // Elli
    geminiVoice: "Leda",
  },
];

export function getVoicePreset(id: string): VoicePreset | undefined {
  return VOICE_PRESETS.find((v) => v.id === id);
}
