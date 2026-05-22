import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────
 *  Natural-language ad spec generator
 *
 *  POST { instruction, brand, palette, currentAspect }
 *  Returns a structured patch:
 *    { templateId, aspectRatio, brandPatch, sceneOverrides[] }
 *
 *  Uses Gemini 2.5 Flash text (same API key as Nano Banana). Constrained
 *  with response_mime_type=application/json + strict schema.
 *  Falls back to a heuristic builder if the API key is missing — the
 *  prompt bar still works without internet.
 * ────────────────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const TEMPLATE_IDS = [
  "tpl-free-quote",
  "tpl-before-after",
  "tpl-social-proof",
  "tpl-same-day",
  "tpl-offer",
  "tpl-trust",
  "tpl-service-area",
];

const ASPECTS = ["1:1", "4:5", "9:16", "16:9"];

interface Body {
  instruction?: string;
  brand?: Record<string, unknown>;
  currentAspect?: string;
}

interface AdSpec {
  templateId: string;
  aspectRatio: string;
  brandPatch: {
    tagline?: string;
    offer?: string;
    cta?: string;
    reviewQuote?: string;
    reviewerName?: string;
  };
  sceneOverrides: Array<{ sceneIndex: number; layerIndex: number; text: string }>;
  notes?: string;
}

function heuristicSpec(instruction: string, currentAspect: string): AdSpec {
  const lower = instruction.toLowerCase();
  let templateId = "tpl-free-quote";
  if (/(before|after|reveal|transform)/.test(lower)) templateId = "tpl-before-after";
  else if (/(review|star|testimonial|social|trust)/.test(lower)) templateId = "tpl-social-proof";
  else if (/(same.?day|today|urgent|now|quick)/.test(lower)) templateId = "tpl-same-day";
  else if (/(off|discount|sale|deal|\$)/.test(lower)) templateId = "tpl-offer";
  else if (/(local|family|insured|license|veteran|tampa)/.test(lower)) templateId = "tpl-trust";
  else if (/(neighborhood|area|service|st\.? pete|clearwater|brandon)/.test(lower)) templateId = "tpl-service-area";

  let aspect = currentAspect;
  if (/reels?|story|stories|tiktok|vertical/.test(lower)) aspect = "9:16";
  else if (/feed.*square|square/.test(lower)) aspect = "1:1";
  else if (/feed|portrait/.test(lower)) aspect = "4:5";
  else if (/landscape|wide|youtube/.test(lower)) aspect = "16:9";

  const dollarMatch = instruction.match(/\$\s?(\d{2,4})/);
  const offer = dollarMatch ? `$${dollarMatch[1]} OFF Your First Pickup` : "$50 OFF Your First Pickup";

  return {
    templateId,
    aspectRatio: aspect,
    brandPatch: {
      offer,
      cta: /book|quote/.test(lower) ? "Book Online in 60 Seconds" : "Get a Free Quote",
    },
    sceneOverrides: [],
    notes: "Built heuristically (no API key set).",
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const instruction = (body.instruction ?? "").trim();
  if (!instruction) {
    return NextResponse.json({ error: "Missing 'instruction'" }, { status: 400 });
  }
  const currentAspect = (body.currentAspect as string) ?? "9:16";

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ spec: heuristicSpec(instruction, currentAspect) });
  }

  const sys = [
    "You are the ad director for Book Junk Away — a Tampa, Florida junk-removal company.",
    "Convert the operator's plain-English instruction into a JSON ad spec.",
    `Allowed template ids: ${TEMPLATE_IDS.join(", ")}.`,
    `Allowed aspect ratios: ${ASPECTS.join(", ")}.`,
    "Pick the template whose pattern best matches the instruction.",
    "Keep all copy Meta-policy-safe: no sensational claims, no negative self-image phrasing,",
    "no '#1/best/guaranteed' without substantiation, no excessive caps or punctuation.",
    "Use punchy junk-removal hooks. Mention Tampa or neighborhoods only when relevant.",
  ].join(" ");

  const schema = {
    type: "object",
    properties: {
      templateId: { type: "string", enum: TEMPLATE_IDS },
      aspectRatio: { type: "string", enum: ASPECTS },
      brandPatch: {
        type: "object",
        properties: {
          tagline: { type: "string" },
          offer: { type: "string" },
          cta: { type: "string" },
          reviewQuote: { type: "string" },
          reviewerName: { type: "string" },
        },
      },
      sceneOverrides: {
        type: "array",
        items: {
          type: "object",
          properties: {
            sceneIndex: { type: "integer" },
            layerIndex: { type: "integer" },
            text: { type: "string" },
          },
          required: ["sceneIndex", "layerIndex", "text"],
        },
      },
      notes: { type: "string" },
    },
    required: ["templateId", "aspectRatio", "brandPatch", "sceneOverrides"],
  };

  const upstream = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Operator instruction:\n"""${instruction}"""\n\nCurrent aspect: ${currentAspect}.\n\nReturn JSON matching the schema.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    // Fall back instead of failing
    return NextResponse.json({
      spec: heuristicSpec(instruction, currentAspect),
      warning: `Gemini API ${upstream.status}: ${errText.slice(0, 200)}`,
    });
  }

  const data = (await upstream.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  try {
    const spec = JSON.parse(raw) as AdSpec;
    if (!TEMPLATE_IDS.includes(spec.templateId)) spec.templateId = "tpl-free-quote";
    if (!ASPECTS.includes(spec.aspectRatio)) spec.aspectRatio = currentAspect;
    spec.sceneOverrides = spec.sceneOverrides ?? [];
    return NextResponse.json({ spec });
  } catch {
    return NextResponse.json({
      spec: heuristicSpec(instruction, currentAspect),
      warning: "Failed to parse Gemini JSON response; used heuristic.",
    });
  }
}
