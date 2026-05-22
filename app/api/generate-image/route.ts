import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────
 *  Nano Banana — Google Gemini 2.5 Flash Image proxy
 *
 *  POST { prompt: string, aspectRatio?: "1:1"|"4:5"|"9:16"|"16:9" }
 *  Returns { dataUrl: "data:image/png;base64,..." }
 *
 *  Requires environment variable GEMINI_API_KEY (or GOOGLE_API_KEY).
 *  Model: gemini-2.5-flash-image (publicly known as "Nano Banana").
 * ────────────────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function aspectGuidance(ar?: string): string {
  switch (ar) {
    case "9:16":
      return "Vertical 9:16 composition optimized for mobile Reels & Stories. Tall portrait framing.";
    case "1:1":
      return "Square 1:1 composition optimized for Meta Feed. Balanced, centered subject.";
    case "4:5":
      return "Portrait 4:5 composition optimized for Meta Feed. Subject slightly above center.";
    case "16:9":
      return "Wide 16:9 composition for in-stream placements. Cinematic horizontal framing.";
    default:
      return "Balanced 1:1 composition.";
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY (or GOOGLE_API_KEY) is not set on the server. Add it to .env.local to enable Nano Banana image generation.",
      },
      { status: 500 },
    );
  }

  let body: { prompt?: string; aspectRatio?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing 'prompt' in body" }, { status: 400 });
  }

  const fullPrompt = [
    "Photorealistic Meta video-ad still for a Tampa, Florida junk removal company called Book Junk Away.",
    "Brand cues: bright yellow accents, professional, trustworthy, family-owned.",
    aspectGuidance(body.aspectRatio),
    "No on-image text, no logos, no watermarks — leave space for text overlays.",
    `Subject: ${prompt}`,
  ].join(" ");

  const upstream = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseModalities: ["Image"],
      },
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Gemini API ${upstream.status}: ${errText.slice(0, 500)}` },
      { status: 502 },
    );
  }

  type Part = { inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
  type GeminiResp = {
    candidates?: Array<{ content?: { parts?: Part[] } }>;
  };

  const data = (await upstream.json()) as GeminiResp;
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      const mime = (part.inlineData?.mimeType ?? part.inline_data?.mime_type) || "image/png";
      return NextResponse.json({ dataUrl: `data:${mime};base64,${inline.data}` });
    }
  }
  return NextResponse.json(
    { error: "Gemini returned no image. Try rephrasing your prompt." },
    { status: 502 },
  );
}
