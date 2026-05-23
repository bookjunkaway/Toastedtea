import Link from "next/link";
import { ArrowRight, Sparkles, Wand2, Eye, Phone, Globe } from "lucide-react";
import { listTemplates } from "@/lib/templates";

export default function LandingPage() {
  const templates = listTemplates();
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-10 sm:pb-16">
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Book Junk Away" className="h-10 w-10 sm:h-12 sm:w-12" />
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight">Book Junk Away</div>
              <div className="text-[10px] sm:text-xs text-white/50">Meta Ad Studio · Tampa Edition</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link className="btn-ghost hidden md:inline-flex" href="/inspiration">
              <Eye className="size-4" /> Ad Inspiration
            </Link>
            <Link className="btn-ghost hidden sm:inline-flex" href="/live">
              🚚 Live 3D
            </Link>
            <Link className="btn-primary" href="/editor">
              Open Studio <ArrowRight className="size-4" />
            </Link>
          </nav>
        </header>

        <div className="mt-8 sm:mt-14 grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div>
            <span className="chip">
              <Sparkles className="size-3" /> Powered by Nano Banana
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] sm:leading-[1.02] tracking-tight">
              Dominate Tampa with{" "}
              <span className="bg-gradient-to-r from-brand-300 via-brand to-red-500 bg-clip-text text-transparent">
                stunning Meta ads
              </span>{" "}
              that convert.
            </h1>
            <p className="mt-5 text-lg text-white/70 max-w-xl">
              Studio-quality video ads for Book Junk Away — proven junk-removal
              hooks, on-brand templates, AI-generated before/after shots, and
              one-click export for Reels, Stories & Feed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="btn-primary text-base px-5 py-3" href="/quick">
                <Wand2 className="size-4" /> One-prompt ad
              </Link>
              <Link className="btn-ghost text-base px-5 py-3" href="/playbook">
                📒 Playbook
              </Link>
              <Link className="btn-ghost text-base px-5 py-3" href="/leads">
                📥 Leads
              </Link>
              <Link className="btn-ghost text-base px-5 py-3" href="/settings">
                ⚙️ Settings
              </Link>
              <Link className="btn-ghost text-base px-5 py-3" href="/live">
                🚚 Live 3D
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <Phone className="size-4 text-brand" /> (727) 288-4847
              </span>
              <span className="flex items-center gap-2">
                <Globe className="size-4 text-brand" /> www.bookjunkaway.com
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[9/16] mx-auto max-w-xs panel overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400 via-brand to-red-600" />
              <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                <div className="text-[10px] font-black tracking-[0.25em] text-black/80">TAMPA SPECIAL</div>
                <div className="mt-3 text-7xl font-black text-ink-950">$50</div>
                <div className="text-xl font-black text-ink-950 -mt-1">OFF</div>
                <div className="mt-3 text-sm font-bold text-ink-900">Your First Pickup</div>
                <div className="mt-auto mb-2 text-xs font-bold text-ink-900/80">www.bookjunkaway.com</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template gallery */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black">7 proven Tampa templates</h2>
            <p className="text-white/60 text-sm mt-1">
              Every template is a battle-tested junk-removal ad pattern. Tap to load it into the studio.
            </p>
          </div>
          <Link href="/editor" className="hidden sm:inline-flex btn-ghost text-sm">
            All templates →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const bgStyle =
              t.preview.background.kind === "gradient"
                ? {
                    backgroundImage: `linear-gradient(${t.preview.background.angle}deg, ${t.preview.background.from}, ${t.preview.background.to})`,
                  }
                : t.preview.background.kind === "solid"
                ? { backgroundColor: t.preview.background.color }
                : { backgroundImage: `url(${t.preview.background.src})`, backgroundSize: "cover" };
            return (
              <Link
                key={t.id}
                href={`/editor?tpl=${t.id}`}
                className="panel overflow-hidden group hover:border-brand/50 transition-colors"
              >
                <div className="aspect-[4/5] relative" style={bgStyle as React.CSSProperties}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <div
                      className="text-2xl font-black leading-tight drop-shadow-md"
                      style={{ color: t.preview.accent }}
                    >
                      {t.preview.headline}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white/90 drop-shadow">
                      {t.preview.sub}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-sm">{t.name}</div>
                    <span className="chip uppercase">{t.recommendedAspect}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/60 line-clamp-2">{t.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/40">
        Book Junk Away — Tampa Bay&apos;s junk removal. Studio v0.1 ·
        Build it. Ship it. Dominate the market.
      </footer>
    </main>
  );
}
