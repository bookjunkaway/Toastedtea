"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Loader2, Phone } from "lucide-react";
import { LeadFormSpec, decodeLeadForm, useLeads } from "@/lib/leads";
import { track } from "@/lib/analytics";

const URGENCY_OPTIONS = [
  { id: "asap", label: "ASAP (today)" },
  { id: "this-week", label: "This week" },
  { id: "this-month", label: "This month" },
  { id: "browsing", label: "Just browsing" },
] as const;

function LeadBody() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [spec, setSpec] = useState<LeadFormSpec | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [jobType, setJobType] = useState("");
  const [urgency, setUrgency] = useState<(typeof URGENCY_OPTIONS)[number]["id"]>("this-week");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const recordSubmission = useLeads((s) => s.recordSubmission);

  useEffect(() => {
    const encoded = search.get("f");
    if (!encoded) return;
    const s = decodeLeadForm(encoded);
    setSpec(s);
    if (s) track({ adId: s.id, event: "view" });
  }, [search]);

  const palette = spec?.palette ?? { primary: "#FBBF24", secondary: "#0a0a0a", accent: "#dc2626", surface: "#fafafa", onSurface: "#0a0a0a" };

  const heroStyle = useMemo(
    () => ({
      background: `linear-gradient(160deg, ${palette.primary}, ${palette.secondary})`,
    }),
    [palette],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spec || submitting) return;
    setSubmitting(true);
    const payload = {
      formId: spec.id,
      name,
      phone,
      email,
      address,
      jobType: jobType || spec.brand.category,
      urgency,
      notes,
      source: {
        companyName: spec.brand.companyName,
        category: spec.brand.category,
        offer: spec.brand.offer,
      },
    };
    recordSubmission(payload);
    track({ adId: spec.id, event: "submit", meta: { urgency } });

    // Fire-and-forget: email the operator if a notify address is in the form spec
    if (spec.notifyEmail) {
      try {
        await fetch("/api/notify-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: spec.notifyEmail, payload }),
        });
      } catch {
        /* don't block the customer on email errors */
      }
    }

    // Optional generic webhook (legacy / Zapier)
    const hook = process.env.NEXT_PUBLIC_LEAD_WEBHOOK;
    if (hook) {
      try {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
        });
      } catch {
        /* ignore */
      }
    }
    setDone(true);
    setSubmitting(false);
  };

  if (!spec) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-white/60">
        <Loader2 className="size-5 animate-spin mr-2" /> Loading form…
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-black">
      <div className="mx-auto max-w-md">
        <header className="relative px-5 pt-8 pb-10 text-center" style={heroStyle}>
          {spec.brand.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={spec.brand.heroImage}
              alt={spec.brand.companyName}
              className="mx-auto size-20 rounded-full bg-white p-1 mb-3 shadow-xl"
            />
          )}
          <div className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: palette.secondary }}>
            {spec.brand.category}
          </div>
          <h1 className="mt-2 text-3xl font-black leading-tight" style={{ color: palette.secondary }}>
            {spec.brand.companyName}
          </h1>
          <div className="mt-3 inline-block bg-black/85 text-white text-sm font-bold px-3 py-1 rounded-full">
            {spec.brand.offer}
          </div>
        </header>

        <div className="px-5 py-6">
          {!done ? (
            <form onSubmit={submit} className="space-y-3">
              <h2 className="text-xl font-black text-white">Get your free quote</h2>
              <p className="text-sm text-white/60">{spec.brand.serviceArea}</p>
              <div className="space-y-2">
                <input
                  required
                  className="input"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  required
                  type="tel"
                  className="input"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  type="email"
                  className="input"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  required
                  className="input"
                  placeholder="Service address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <input
                  className="input"
                  placeholder={`What do you need? (e.g. ${spec.brand.category.toLowerCase()})`}
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                />
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">
                    How soon?
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {URGENCY_OPTIONS.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setUrgency(u.id)}
                        className={`h-9 rounded-lg text-xs font-bold border transition-colors ${
                          urgency === u.id ? "bg-brand/15 text-white border-brand/40" : "bg-white/5 text-white/70 border-white/10"
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Any details? (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                disabled={submitting}
                type="submit"
                className="w-full h-12 rounded-lg font-black text-base"
                style={{ background: palette.primary, color: palette.secondary }}
              >
                {submitting ? <Loader2 className="inline size-5 animate-spin" /> : spec.brand.cta || "Get my quote"}
              </button>
              <a
                href={`tel:${spec.brand.phone.replace(/[^0-9+]/g, "")}`}
                onClick={() => track({ adId: spec.id, event: "cta_click", meta: { kind: "phone" } })}
                className="block w-full h-11 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-center pt-3"
              >
                <Phone className="inline size-4 mr-1 text-brand" /> Or call {spec.brand.phone}
              </a>
              <p className="text-[10px] text-white/40 text-center">
                We&apos;ll only use your info to send you a quote. No spam.
              </p>
            </form>
          ) : (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-emerald-100">
              <div className="size-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="size-6 text-emerald-300" />
              </div>
              <div className="text-center mt-3 font-black text-xl text-white">Got it, {name.split(" ")[0]}.</div>
              <p className="text-center text-sm mt-2">
                We&apos;ll call you within the hour with a quote. Want it sooner?
              </p>
              <a
                href={`tel:${spec.brand.phone.replace(/[^0-9+]/g, "")}`}
                onClick={() => track({ adId: spec.id, event: "cta_click", meta: { kind: "phone-post-submit" } })}
                className="mt-4 flex items-center justify-center gap-2 h-12 rounded-lg font-black text-base"
                style={{ background: palette.primary, color: palette.secondary }}
              >
                <Phone className="size-4" /> Call {spec.brand.phone}
              </a>
            </div>
          )}
        </div>

        <footer className="px-5 pb-6 text-center text-[10px] text-white/40">
          Lead form id {params.id}
        </footer>
      </div>
    </main>
  );
}

export default function LeadPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white/60">Loading…</div>}>
      <LeadBody />
    </Suspense>
  );
}
