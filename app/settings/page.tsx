"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { useLeads } from "@/lib/leads";

export default function SettingsPage() {
  const notifyEmail = useLeads((s) => s.notifyEmail);
  const setNotifyEmail = useLeads((s) => s.setNotifyEmail);
  const [draft, setDraft] = useState(notifyEmail);
  const [saved, setSaved] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifyEmail(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-[100dvh] mx-auto max-w-md px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="btn-ghost h-9">
          <ArrowLeft className="size-4" /> Home
        </Link>
        <Link href="/leads" className="btn-ghost h-9">
          See leads
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="text-white/60 mt-1 text-sm">
          Configure where leads from your ads land.
        </p>
      </header>

      <form onSubmit={save} className="panel p-4 space-y-3">
        <div>
          <div className="label mb-1 flex items-center gap-1">
            <Mail className="size-3 text-brand" /> Lead destination email
          </div>
          <input
            type="email"
            className="input"
            placeholder="charles@awsomemoves.com"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="text-[11px] text-white/50 mt-1">
            Every lead form submission gets emailed here with the name, phone, address, and urgency. The lead is also saved in <Link href="/leads" className="text-brand">/leads</Link>.
          </div>
        </div>
        <button type="submit" className="btn-primary w-full">
          {saved ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : (
            "Save"
          )}
        </button>
      </form>

      <details className="mt-4 panel p-4">
        <summary className="cursor-pointer text-sm font-bold">Setup notes</summary>
        <div className="mt-2 text-xs text-white/70 space-y-2">
          <p>
            Email delivery uses <a className="text-brand underline" href="https://resend.com" target="_blank" rel="noreferrer">Resend</a> (free 3000 emails/month).
            Set <code className="text-brand">RESEND_API_KEY</code> in Vercel env vars to enable forwarding.
          </p>
          <p>
            If you skip the key, lead submissions still save to <Link className="text-brand" href="/leads">/leads</Link>.
          </p>
          <p>
            For testing, the sender starts as <code className="text-brand">onboarding@resend.dev</code> — verify your own domain in Resend and set <code className="text-brand">RESEND_FROM</code> to send from <code className="text-brand">leads@bookjunkaway.com</code>.
          </p>
        </div>
      </details>

      {!notifyEmail && (
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-amber-100 text-xs">
          ⚠ No destination email set yet — leads will be saved locally but no email will be sent.
        </div>
      )}
    </main>
  );
}
