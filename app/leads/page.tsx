"use client";

import Link from "next/link";
import { ArrowLeft, Phone, Trash2, Check } from "lucide-react";
import { useLeads, LeadSubmission } from "@/lib/leads";

function relTime(t: number): string {
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function LeadsPage() {
  const submissions = useLeads((s) => s.submissions);
  const del = useLeads((s) => s.deleteSubmission);
  const markCalled = useLeads((s) => s.markCalled);

  const sorted = [...submissions].sort((a, b) => b.submittedAt - a.submittedAt);

  return (
    <main className="min-h-[100dvh] mx-auto max-w-3xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="btn-ghost h-9">
          <ArrowLeft className="size-4" /> Home
        </Link>
        <Link href="/quick" className="btn-ghost h-9">
          Make another ad
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-black">Leads</h1>
        <p className="text-white/60 mt-1 text-sm">
          Every form submission from every ad you&apos;ve shipped. Stored locally on this device
          {process.env.NEXT_PUBLIC_LEAD_WEBHOOK ? " and forwarded to your CRM webhook" : " (set NEXT_PUBLIC_LEAD_WEBHOOK to forward to your CRM)"}.
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="panel p-6 text-center text-sm text-white/60">
          No leads yet. Ship an ad and put the lead-form URL in its CTA — submissions show up here.
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((l: LeadSubmission) => (
            <li key={l.id} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black">{l.name || "(no name)"}</span>
                    <span
                      className={`chip ${
                        l.urgency === "asap"
                          ? "bg-red-500/15 text-red-200 border-red-500/30"
                          : l.urgency === "this-week"
                          ? "bg-amber-500/15 text-amber-200 border-amber-500/30"
                          : "bg-white/5"
                      }`}
                    >
                      {l.urgency}
                    </span>
                    {/CALLED/i.test(l.notes) && <span className="chip bg-emerald-500/15 text-emerald-200 border-emerald-500/30">called ✓</span>}
                  </div>
                  <div className="text-sm text-white/70 mt-0.5">{l.jobType}</div>
                  <div className="text-xs text-white/50 mt-1">{l.address}</div>
                  {l.notes && !/CALLED/i.test(l.notes) && (
                    <div className="text-xs text-white/60 mt-1">&ldquo;{l.notes.replace(/CALLED/gi, "").trim()}&rdquo;</div>
                  )}
                  <div className="text-[11px] text-white/40 mt-2">
                    from {l.source.companyName} · {l.source.offer} · {relTime(l.submittedAt)}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col gap-1">
                  <a
                    href={`tel:${l.phone.replace(/[^0-9+]/g, "")}`}
                    className="btn-primary h-9 px-3 text-xs"
                  >
                    <Phone className="size-3" /> Call
                  </a>
                  {!/CALLED/i.test(l.notes) && (
                    <button onClick={() => markCalled(l.id)} className="btn-ghost h-8 px-2 text-[11px]">
                      <Check className="size-3" /> Mark called
                    </button>
                  )}
                  <button onClick={() => del(l.id)} className="btn-ghost h-8 px-2 text-[11px]">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
