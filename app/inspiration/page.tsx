import Link from "next/link";
import { ArrowLeft, ExternalLink, Wand2, MapPin, Search } from "lucide-react";
import { SPY_ADS, TAMPA_COMPETITORS } from "@/lib/spyLibrary";
import { getTemplate } from "@/lib/templates";

export const metadata = {
  title: "Top Tampa Junk Removal Ads — Inspiration · Book Junk Away Studio",
};

export default function InspirationPage() {
  return (
    <main className="min-h-screen mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="btn-ghost h-8 mb-3">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Top Tampa Junk-Removal Ads</h1>
          <p className="text-white/60 mt-1 max-w-2xl">
            Curated, structurally-decoded patterns from the highest-performing
            Meta video ads in your niche. Each card includes the hook, the
            storyboard, why it converts, and a one-click swipe into the studio.
          </p>
        </div>
        <Link href="/editor" className="btn-primary">
          <Wand2 className="size-4" /> Open Studio
        </Link>
      </header>

      {/* Competitor quick scan */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="size-4 text-brand" /> Tampa competitors to watch
          </h2>
          <span className="text-xs text-white/40">Deep links into Meta Ads Library</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TAMPA_COMPETITORS.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="panel p-4 hover:border-brand/40 transition-colors block"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-sm">{c.name}</div>
                <ExternalLink className="size-3 text-white/40" />
              </div>
              <p className="text-xs text-white/60 mt-1">{c.note}</p>
              <div className="mt-3 chip">
                <Search className="size-3" /> View live ads
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Ad swipe library */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Swipe-file: 8 proven hooks</h2>
          <span className="text-xs text-white/40">Click “Use this template” to load into the studio</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {SPY_ADS.map((ad) => {
            const tpl = getTemplate(ad.swipeTemplateId);
            return (
              <article key={ad.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-brand-300 font-semibold uppercase tracking-wider">
                      {ad.advertiser} · {ad.market}
                    </div>
                    <h3 className="mt-1 text-lg font-black leading-tight">&ldquo;{ad.hook}&rdquo;</h3>
                  </div>
                  <span className="chip whitespace-nowrap">{ad.format}</span>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="label mb-2">Storyboard</div>
                    <ol className="space-y-1 text-xs text-white/80 list-decimal pl-4">
                      {ad.beats.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="label mb-2">Why it works</div>
                    <ul className="space-y-1 text-xs text-white/80 list-disc pl-4">
                      {ad.whyItWorks.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {ad.estimatedSpendRange && (
                  <div className="mt-3 text-[11px] text-white/50">
                    Est. spend: {ad.estimatedSpendRange}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {tpl && (
                    <Link href={`/editor?tpl=${tpl.id}`} className="btn-primary h-9">
                      <Wand2 className="size-4" /> Use this template
                    </Link>
                  )}
                  <a href={ad.adLibraryUrl} target="_blank" rel="noreferrer" className="btn-ghost h-9">
                    <ExternalLink className="size-4" /> View live in Meta Ads Library
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <p className="mt-10 text-[11px] text-white/40">
        Data sources: Meta Ads Library (public). Strategy analysis is curated by
        Book Junk Away Studio and updated as the Tampa market shifts. Numbers
        cited are directional estimates, not Meta-disclosed values.
      </p>
    </main>
  );
}
