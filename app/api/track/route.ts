import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/analyticsServer";
import { AdEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: AdEvent[] = ["view", "cta_click", "submit", "share", "preview_open"];

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { adId?: string; event?: string; source?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const adId = (body.adId ?? "").trim();
  const event = body.event as AdEvent;
  if (!adId || !VALID.includes(event)) {
    return NextResponse.json({ ok: false, reason: "missing/invalid fields" }, { status: 400 });
  }
  await recordEvent(adId, event, body.source).catch(() => {});
  return NextResponse.json({ ok: true });
}
