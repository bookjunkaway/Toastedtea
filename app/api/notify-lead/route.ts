import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────
 *  Lead notification email
 *
 *  POST {
 *    to: string,                // operator's email (embedded in form spec)
 *    payload: { name, phone, email, address, jobType, urgency, notes, source }
 *  }
 *
 *  Sends an HTML email via Resend (https://resend.com — free tier 3000/mo).
 *  Requires RESEND_API_KEY env var. From address is configurable via
 *  RESEND_FROM (defaults to "leads@bookjunkaway.com" — must be verified in
 *  Resend or use the onboarding sender "onboarding@resend.dev" for testing).
 *
 *  If RESEND_API_KEY is missing, returns 200 with { sent: false, reason }
 *  so the customer-facing flow still works — the lead is still saved to
 *  the operator's localStorage and shows up in /leads.
 * ────────────────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = process.env.RESEND_FROM ?? "Book Junk Away Leads <onboarding@resend.dev>";

interface Payload {
  name: string;
  phone: string;
  email: string;
  address: string;
  jobType: string;
  urgency: string;
  notes: string;
  source?: {
    companyName?: string;
    category?: string;
    offer?: string;
  };
}

function buildHtml(p: Payload): string {
  const esc = (s: string) =>
    (s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const phoneLink = p.phone ? `<a href="tel:${esc(p.phone.replace(/[^0-9+]/g, ""))}">${esc(p.phone)}</a>` : "—";
  const emailLink = p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : "—";
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0a0a0a">
      <div style="background:#FBBF24;padding:18px 20px;border-radius:14px 14px 0 0">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:900;color:#0a0a0a">NEW LEAD</div>
        <div style="font-size:24px;font-weight:900;color:#0a0a0a;margin-top:4px">${esc(p.name) || "(no name)"}</div>
        <div style="font-size:13px;color:#0a0a0a;opacity:0.7;margin-top:2px">
          ${esc(p.source?.companyName ?? "")} · ${esc(p.source?.category ?? "")}
        </div>
      </div>
      <div style="background:#0a0a0a;color:#fff;padding:20px;border-radius:0 0 14px 14px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#9ca3af;width:90px">Phone</td><td style="padding:6px 0;font-weight:700;color:#FBBF24">${phoneLink}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Email</td><td style="padding:6px 0;font-weight:700">${emailLink}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Address</td><td style="padding:6px 0;font-weight:700">${esc(p.address) || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Job</td><td style="padding:6px 0;font-weight:700">${esc(p.jobType) || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af">Urgency</td><td style="padding:6px 0;font-weight:700;color:${p.urgency === "asap" ? "#fca5a5" : "#fff"}">${esc(p.urgency) || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;vertical-align:top">Notes</td><td style="padding:6px 0">${esc(p.notes) || "—"}</td></tr>
        </table>
        <div style="margin-top:18px;padding:12px;background:#FBBF24;border-radius:10px;text-align:center">
          <a href="tel:${esc((p.phone || "").replace(/[^0-9+]/g, ""))}" style="color:#0a0a0a;text-decoration:none;font-weight:900;font-size:16px">
            📞 Call ${esc(p.name.split(" ")[0] || "lead")} now
          </a>
        </div>
        <div style="font-size:11px;color:#6b7280;margin-top:14px">
          From your ad: <b style="color:#FBBF24">${esc(p.source?.offer ?? "")}</b><br/>
          Sent by Book Junk Away Meta Ad Studio
        </div>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { to?: string; payload?: Payload } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const to = (body.to ?? "").trim();
  const payload = body.payload;
  if (!to) return NextResponse.json({ sent: false, reason: "No destination email configured" });
  if (!payload) return NextResponse.json({ error: "Missing payload" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({
      sent: false,
      reason: "RESEND_API_KEY not set on the server. Set it in Vercel env vars to enable email forwarding. The lead is still saved locally.",
    });
  }

  const subject = `🚨 NEW LEAD — ${payload.name || "(no name)"} · ${payload.urgency || "—"}${
    payload.source?.companyName ? ` (${payload.source.companyName})` : ""
  }`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      reply_to: payload.email || undefined,
      subject,
      html: buildHtml(payload),
    }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    return NextResponse.json(
      { sent: false, reason: `Resend ${r.status}: ${errText.slice(0, 300)}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ sent: true });
}
