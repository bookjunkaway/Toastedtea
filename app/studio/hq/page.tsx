"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Download, Info } from "lucide-react";
import { useEditor } from "@/lib/store";
import { ASPECT_RATIOS } from "@/lib/types";
import { PovPatternInterrupt, POV_DURATION_FRAMES } from "@/remotion/PovPatternInterrupt";

const Player = dynamic(() => import("@remotion/player").then((m) => m.Player), { ssr: false });

const FPS = 30;

export default function HqPage() {
  const project = useEditor((s) => s.project);
  const ar = ASPECT_RATIOS[project.aspectRatio];
  const inputProps = {
    companyName: project.brand.companyName,
    tagline: project.brand.tagline,
    offer: project.brand.offer,
    cta: project.brand.cta,
    website: project.brand.website,
    phone: project.brand.phone,
    beforeImage: project.brand.beforeImage,
    afterImage: project.brand.afterImage,
  };
  const dur = POV_DURATION_FRAMES(FPS);

  return (
    <main className="min-h-[100dvh] mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/editor" className="btn-ghost h-9">
          <ArrowLeft className="size-4" /> Back to studio
        </Link>
        <div className="flex items-center gap-2">
          <span className="chip">Remotion HQ preview</span>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black">High-quality preview</h1>
      <p className="text-white/60 text-sm mt-1 max-w-xl">
        Frame-perfect Remotion render of the POV Pattern Interrupt template using your current brand inputs.
        Production-quality MP4 export ships via the Remotion render path below.
      </p>

      <div className="mt-6 mx-auto" style={{ maxWidth: 380 }}>
        <div
          className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-black"
          style={{ aspectRatio: `${ar.width} / ${ar.height}` }}
        >
          <Player
            component={PovPatternInterrupt}
            inputProps={inputProps}
            durationInFrames={dur}
            fps={FPS}
            compositionWidth={ar.width}
            compositionHeight={ar.height}
            style={{ width: "100%", height: "100%" }}
            controls
            loop
            autoPlay
          />
        </div>
      </div>

      <div className="mt-6 panel p-4">
        <div className="flex items-start gap-3">
          <Info className="size-4 text-brand shrink-0 mt-0.5" />
          <div className="text-sm text-white/80 space-y-2">
            <p>
              <b>Two render paths</b> are now in the project:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-white/70">
              <li>
                <b className="text-white">Browser export</b> (current default, top-right of the studio) — uses MediaRecorder.
                Fast, WebM in most browsers, no server. Good for drafts and A/B variants.
              </li>
              <li>
                <b className="text-white">Remotion HQ render</b> — produces true MP4 with frame-perfect timing.
                Requires a renderer host:
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    <b>Remotion Lambda</b> on AWS (~$0.01–0.03 per video, pay-as-you-go) — recommended.
                  </li>
                  <li>
                    Or self-host with <code className="text-brand">@remotion/renderer</code> on Render.com / Railway / VPS.
                  </li>
                </ul>
              </li>
            </ol>
            <p className="text-white/60">
              When you're ready to wire the Lambda renderer, ping me — it&apos;s a 30-minute setup (AWS account, deploy
              the Lambda site, add three env vars) and exports become a one-click "Render HQ MP4" button right here.
            </p>
          </div>
        </div>
        <button
          disabled
          className="btn-primary w-full mt-4"
          title="Connect Remotion Lambda to enable production-quality MP4 render"
        >
          <Download className="size-4" /> Render HQ MP4 (requires Remotion Lambda — coming soon)
        </button>
      </div>
    </main>
  );
}
