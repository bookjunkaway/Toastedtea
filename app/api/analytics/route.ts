import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, listAdIds } from "@/lib/analyticsServer";
import { AdEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const ids = await listAdIds();
  const ads = await Promise.all(ids.map((id) => getAnalytics(id)));
  const totals: Record<AdEvent, number> = { view: 0, cta_click: 0, submit: 0, share: 0, preview_open: 0 };
  for (const a of ads) {
    for (const k of Object.keys(totals) as AdEvent[]) totals[k] += a.counters[k] ?? 0;
  }
  return NextResponse.json({ ads, totals });
}
