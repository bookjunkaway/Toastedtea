import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────
 *  Image generation
 *
 *  POST { prompt, aspectRatio?, source? }
 *  Returns { dataUrl, source: "nano-banana" | "pollinations" }
 *
 *  Default behavior:
 *    1. If GEMINI_API_KEY is set, try Nano Banana (gemini-2.5-flash-image).
 *       Note: this model requires paid Google Cloud billing on the key's
 *       project — the free tier has limit 0 for image generation.
 *    2. If Nano Banana returns 429 / quota / unavailable, or no key set,
 *       fall back to Pollinations.ai which is genuinely free and keyless.
 *
 *  Pass `source: "pollinations"` to force the free path even when a key
 *  is set (useful for cost control).
 * ────────────────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NANO_MODEL = "gemini-2.5-flash-image";
const NANO_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${NANO_MODEL}:generateContent`;

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

function aspectDimensions(ar?: string): { width: number; height: number } {
  switch (ar) {
    case "9:16":
      return { width: 720, height: 1280 };
    case "16:9":
      return { width: 1280, height: 720 };
    case "4:5":
      return { width: 1024, height: 1280 };
    case "1:1":
    default:
      return { width: 1024, height: 1024 };
  }
}

interface GenResult {
  dataUrl: string;
  source: "nano-banana" | "pollinations";
}

async function tryNanoBanana(prompt: string, aspect: string | undefined, apiKey: string): Promise<GenResult> {
  const fullPrompt = [
    "Photorealistic Meta video-ad still for a Tampa, Florida junk removal company called Book Junk Away.",
    "Brand cues: bright yellow accents, professional, trustworthy, family-owned.",
    aspectGuidance(aspect),
    "No on-image text, no logos, no watermarks — leave space for text overlays.",
    `Subject: ${prompt}`,
  ].join(" ");

  const upstream = await fetch(`${NANO_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: { responseModalities: ["Image"] },
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    const err = new Error(`Gemini API ${upstream.status}: ${errText.slice(0, 400)}`);
    (err as Error & { status?: number }).status = upstream.status;
    throw err;
  }

  type Part = { inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
  const data = (await upstream.json()) as { candidates?: Array<{ content?: { parts?: Part[] } }> };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      const mime = (part.inlineData?.mimeType ?? part.inline_data?.mime_type) || "image/png";
      return { dataUrl: `data:${mime};base64,${inline.data}`, source: "nano-banana" };
    }
  }
  throw new Error("Gemini returned no image. Try rephrasing your prompt.");
}

async function tryPollinations(prompt: string, aspect: string | undefined): Promise<GenResult> {
  const { width, height } = aspectDimensions(aspect);
  const styled = [
    "Photorealistic Meta video-ad still for a Tampa Florida junk removal company.",
    "Bright Florida light, family-owned vibe.",
    aspectGuidance(aspect),
    "No on-image text. Leave space for overlay copy.",
    `Subject: ${prompt}`,
  ].join(" ");
  const seed = Math.floor(Math.random() * 1_000_000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(styled)}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;

  const resp = await fetch(url, { headers: { Accept: "image/*" } });
  if (!resp.ok) {
    throw new Error(`Pollinations ${resp.status}: ${await resp.text().catch(() => "")}`);
  }
  const ab = await resp.arrayBuffer();
  const b64 = Buffer.from(ab).toString("base64");
  const mime = resp.headers.get("content-type") ?? "image/jpeg";
  return { dataUrl: `data:${mime};base64,${b64}`, source: "pollinations" };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { prompt?: string; aspectRatio?: string; source?: "nano-banana" | "pollinations" | "auto" } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing 'prompt' in body" }, { status: 400 });
  }
  const source = body.source ?? "auto";
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  // Forced free path
  if (source === "pollinations") {
    try {
      return NextResponse.json(await tryPollinations(prompt, body.aspectRatio));
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
    }
  }

  // Auto path: try Nano Banana if key present, fall back to Pollinations otherwise / on quota
  if (apiKey) {
    try {
      return NextResponse.json(await tryNanoBanana(prompt, body.aspectRatio, apiKey));
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      // 429 (quota) or 403 (billing not enabled) → silently fall back to free path
      if (status === 429 || status === 403) {
        try {
          const result = await tryPollinations(prompt, body.aspectRatio);
          return NextResponse.json({
            ...result,
            note:
              status === 429
                ? "Gemini Nano Banana hit its quota / requires paid billing — used the free Pollinations renderer instead."
                : "Gemini Nano Banana needs paid Google Cloud billing on this key — used the free Pollinations renderer instead.",
          });
        } catch (free) {
          return NextResponse.json(
            { error: `Both renderers failed. Nano Banana: ${(e as Error).message}. Pollinations: ${(free as Error).message}` },
            { status: 502 },
          );
        }
      }
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
    }
  }

  // No API key → use Pollinations directly
  try {
    return NextResponse.json(await tryPollinations(prompt, body.aspectRatio));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
