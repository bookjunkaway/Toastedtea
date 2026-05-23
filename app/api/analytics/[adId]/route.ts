import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analyticsServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { adId: string } }): Promise<NextResponse> {
  const data = await getAnalytics(decodeURIComponent(params.adId));
  return NextResponse.json(data);
}
