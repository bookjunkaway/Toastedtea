import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────
 *  Text-to-speech — human-sounding voiceover
 *
 *  POST { text: string, voice?: string }
 *  Returns { dataUrl: "data:audio/...", source: "gemini" | "elevenlabs" }
 *
 *  Order of preference:
 *    1. ElevenLabs (most human) if ELEVENLABS_API_KEY is set
 *    2. Gemini TTS (gemini-2.5-flash-preview-tts) if GEMINI_API_KEY is set
 *    3. 501 → client falls back to the browser SpeechSynthesis voice
 * ────────────────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function elevenLabs(text: string, voice?: string): Promise<string | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;
  // Default voice: "Rachel" (warm, natural). Override via ELEVENLABS_VOICE_ID.
  const voiceId = voice || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.3 },
    }),
  });
  if (!r.ok) return null;
  const ab = await r.arrayBuffer();
  const b64 = Buffer.from(ab).toString("base64");
  return `data:audio/mpeg;base64,${b64}`;
}

async function geminiTts(text: string, voice?: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) return null;
  const voiceName = voice || "Kore"; // warm, natural Gemini prebuilt voice
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";
  const r = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Say this in a warm, upbeat, natural advertising voice: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    }),
  });
  if (!r.ok) return null;
  type Part = { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } };
  const data = (await r.json()) as { candidates?: Array<{ content?: { parts?: Part[] } }> };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    const inline = p.inlineData ?? p.inline_data;
    const b64 = inline?.data;
    const mime = (p.inlineData?.mimeType ?? p.inline_data?.mime_type) ?? "";
    if (b64) {
      // Gemini returns raw PCM (L16) — wrap in WAV. Rate is in the mime string.
      const rateMatch = /rate=(\d+)/.exec(mime);
      const rate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      const pcm = Buffer.from(b64, "base64");
      const wav = pcmToWav(pcm, rate);
      return `data:audio/wav;base64,${wav.toString("base64")}`;
    }
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { text?: string; elevenLabsId?: string; geminiVoice?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = (body.text ?? "").trim().slice(0, 1500);
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  // 1. ElevenLabs (best)
  try {
    const el = await elevenLabs(text, body.elevenLabsId);
    if (el) return NextResponse.json({ dataUrl: el, source: "elevenlabs" });
  } catch {
    /* fall through */
  }

  // 2. Gemini TTS
  try {
    const g = await geminiTts(text, body.geminiVoice);
    if (g) return NextResponse.json({ dataUrl: g, source: "gemini" });
  } catch {
    /* fall through */
  }

  return NextResponse.json(
    { error: "No server TTS available. Set ELEVENLABS_API_KEY or GEMINI_API_KEY. Falling back to browser voice." },
    { status: 501 },
  );
}
