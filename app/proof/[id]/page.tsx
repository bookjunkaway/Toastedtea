"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Loader2, Phone, Wand2, X } from "lucide-react";
import { ProofPlayer } from "@/components/ProofPlayer";
import { ShareToWin } from "@/components/ShareToWin";
import { Project } from "@/lib/types";
import { decodeProjectFromUrl } from "@/lib/proof";

function ProofBody() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [decision, setDecision] = useState<"accepted" | "declined" | null>(null);
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    const p = search.get("p");
    if (!p) return;
    setProject(decodeProjectFromUrl(p));
    if (typeof window !== "undefined") setProofUrl(window.location.href);
  }, [search]);

  const brand = project?.brand;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/60">
        <Loader2 className="size-5 animate-spin mr-2" /> Loading your proof…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-ink-950 to-black">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="text-center mb-8">
          <div className="text-xs font-semibold tracking-[0.25em] text-brand uppercase">A custom ad proof for</div>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{brand?.companyName}</h1>
          <p className="text-white/60 mt-2">{brand?.tagline}</p>
        </header>

        <ProofPlayer project={project} />

        {/* Acceptance block */}
        <section className="mt-10 panel p-6">
          <h2 className="text-xl font-black">Here&apos;s what you get</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-white/80">
            <li>✓ The final MP4 in every platform spec — Meta Reels, Feed, Stories, TikTok, YouTube Shorts.</li>
            <li>✓ Two free revisions in the first week.</li>
            <li>✓ A Meta-policy-safe pass so it doesn&apos;t get blocked in review.</li>
            <li>✓ Delivery within 24 hours of accepting.</li>
          </ul>
          {decision === null && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => setDecision("accepted")} className="btn-primary text-base px-5 py-3">
                <Check className="size-4" /> I want this — send the files
              </button>
              <button onClick={() => setDecision("declined")} className="btn-ghost text-base px-5 py-3">
                <X className="size-4" /> Not a fit
              </button>
            </div>
          )}
          {decision === "accepted" && (
            <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-200">
              <div className="font-black text-lg">Awesome — you&apos;ll get an invoice within the hour.</div>
              <p className="text-sm mt-1">
                Want it faster? Text or call to lock it in:{" "}
                <a href="tel:7272884847" className="underline">
                  <Phone className="inline size-3.5 mr-1" /> (727) 288-4847
                </a>
              </p>
            </div>
          )}
          {decision === "declined" && (
            <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-white/80">
              <div className="font-black">No problem.</div>
              <p className="text-sm mt-1">
                Anything I can change to make it work for you? Reply to the email or text{" "}
                <a href="tel:7272884847" className="underline">(727) 288-4847</a>.
              </p>
            </div>
          )}
        </section>

        {/* Want one for your business CTA — turns the proof into a lead funnel */}
        <section className="panel p-6 mt-6 bg-gradient-to-br from-red-500/10 via-transparent to-brand/10 border-brand/30">
          <div className="flex items-center gap-2">
            <Wand2 className="size-5 text-brand" />
            <h3 className="text-xl font-black">Want a custom video like this for YOUR business?</h3>
          </div>
          <p className="text-sm text-white/80 mt-1">
            We build stunning Meta video ads that actually convert — designed to be Meta-policy-safe so they don&apos;t get blocked. Templates for every niche, exported in every platform spec.
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            <a
              href="mailto:charles@awsomemoves.com?subject=Want%20a%20video%20like%20this&body=Hi%20Charles%2C%20I%20just%20saw%20your%20proof%20for%20a%20Meta%20video%20ad%20and%20I%20want%20one%20for%20my%20business.%20Here%27s%20what%20I%20do%3A%20___________"
              className="btn-primary"
            >
              <Wand2 className="size-4" /> Email me about a video
            </a>
            <a href="tel:7272884847" className="btn-ghost">
              <Phone className="size-4" /> Text or call (727) 288-4847
            </a>
          </div>
        </section>

        {/* Viral share-to-win */}
        <ShareToWin proofUrl={proofUrl || window.location.href} brandName={brand?.companyName ?? ""} />

        <p className="text-center text-[11px] text-white/40 mt-6">
          Built with Book Junk Away Meta Ad Studio · Proof id {params.id}
        </p>
      </div>
    </main>
  );
}

export default function ProofPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white/60">Loading…</div>}>
      <ProofBody />
    </Suspense>
  );
}
