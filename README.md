# Book Junk Away — Meta Ad Studio

Stunning, high-conversion Meta video ad generator built for **Book Junk Away**
to dominate the Tampa Bay junk-removal market — and to be sold as a service to
other businesses too.

Designed end-to-end so you can go from blank canvas to a Meta-policy-safe,
multi-platform-exported, viral-shaped video ad in minutes, not days.

## What's in the box

- **Scene-based video editor** — Canvas-rendered timeline with text/shape/image/emoji
  layers, animations (fade, slide, zoom, Ken Burns, pulse), and scene transitions.
- **7 proven junk-removal templates + 3 viral templates** — Free-quote, before/after,
  social proof, same-day urgency, limited offer, trust builder, service-area dominator,
  POV pattern-interrupt, "Tell me you...", "Rate this".
- **Natural-language Prompt Bar (⌘K)** — Describe the ad in plain English; the studio
  picks the template, aspect, and copy. Powered by Gemini 2.5 Flash with a heuristic
  fallback so it still works without an API key.
- **Nano Banana AI imagery** — Generates photoreal before/after Tampa garages,
  hero shots, and backgrounds via Gemini 2.5 Flash Image (`gemini-2.5-flash-image`).
- **Meta-policy linter** — Catches the exact reasons junk-removal ads get rejected:
  sensational language, personal-attribute phrasing, unsubstantiated "#1/best",
  excessive caps/punctuation, profanity, brand-trademark mentions, ALL-CAPS sentences,
  missing destination URL when phone is shown. One-click auto-fix for many.
- **Viral score + hook bank** — Predicts 3-second-view performance and ships proven
  Reels/TikTok hook formulas adapted for junk removal in Tampa.
- **Memorability score + brand sting** — One-click "wrap" adds a signature open + close
  card with logo + tagline so every ad builds the distinctive brand asset.
- **Multi-platform export** — One click sends the video to every spec: Meta Reels,
  Stories, Feed Portrait, Feed Square, TikTok, YouTube Shorts, YouTube Standard,
  LinkedIn (square + landscape), Pinterest, Snapchat, Google Display.
- **Ad Inspiration library** — Curated, structurally-decoded swipe file from top Tampa
  competitors (1-800-GOT-JUNK, College Hunks, Junk King, JDog, LoadUp, Junkluggers)
  with deep links into Meta Ads Library + one-click "swipe into the studio".
- **Client mode** — Save any company's brand, swap it into your current ad, generate a
  shareable proof link, and copy ready-to-send Email / SMS / LinkedIn pitch templates.
  Track leads → pitched → proof-sent → won/lost with pipeline value.
- **Shareable proof pages** — `/proof/[id]?p=...` plays the ad live in any browser, with
  an Accept / Decline flow, a "Want a video like this for YOUR business?" CTA, and a
  **share-to-win viral mechanic** so every viewer becomes a customer or a sharer.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Visit http://localhost:3000.

### Environment variables (all optional)

- `GEMINI_API_KEY` — enables Nano Banana image generation and AI prompt-bar.
  Without it, both features degrade gracefully.
- `NEXT_PUBLIC_GIVEAWAY_WEBHOOK` — receives every share-to-win entry as JSON.
  Wire to a Zapier/Make.com hook to forward into your CRM/Sheet.

## Branding

Default brand is preset to **Book Junk Away** with the real phone, website,
service area, and yellow/black/red logo palette. Drop a `public/logo.png`
to override the SVG logo used in brand stings.

## Architecture

```
app/                   Next.js App Router pages
  page.tsx             Landing
  editor/page.tsx      Studio editor
  inspiration/page.tsx Tampa competitor swipe file
  clients/page.tsx     Pipeline / client roster
  proof/[id]/page.tsx  Shareable client proof viewer
  api/
    generate-image/    Nano Banana (Gemini 2.5 Flash Image) proxy
    generate-ad/       Natural-language → ad spec
components/            Editor UI (TopBar, PromptBar, PreviewCanvas, …)
lib/
  types.ts             Project + layer model
  templates.ts         Junk-removal + viral templates
  store.ts             Zustand editor store (persisted to localStorage)
  renderer.ts          Pure-Canvas scene renderer with animations
  exporter.ts          MediaRecorder export + multi-platform render
  platforms.ts         Meta/TikTok/YT/LinkedIn/Pinterest/Snap/Google specs
  spyLibrary.ts        Curated Tampa competitor ad analysis
  nanoBanana.ts        Client wrapper for the Nano Banana API
  viral.ts             Viral hook bank + viral score
  memorability.ts      Recall score + signature brand sting builder
  policyLint.ts        Meta Ad Policy linter with auto-fixes
  clients.ts           Client roster + pitch templates (persisted)
  proof.ts             Shareable proof URL encoder
public/
  logo.svg             Generated Book Junk Away logo (overridable)
```

## Roadmap ideas

- Browser-native MP4 muxing via `mp4-muxer` for non-WebM platforms.
- Captions/subtitle layer baked into export.
- Stock B-roll library tied to Tampa neighborhoods.
- Stripe payment-link in the proof page so accepted proofs auto-charge.
- Real-time A/B variant grid (hook A vs hook B in one export).
