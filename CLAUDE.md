# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # next lint (eslint-config-next)
npm run type-check   # tsc --noEmit — strict mode is on
```

There is no test runner configured. Validate changes with `type-check` + `lint` and by exercising the feature in the browser.

## Big picture

This is a **client-side Meta video-ad studio** (Next.js 14 App Router, TypeScript strict, Tailwind). Almost all real work happens in the browser; the `app/api/*` routes are thin, optional proxies. The product builds short video ads (default brand: Book Junk Away, a Tampa junk-removal company) and ships them to multiple social platforms.

### The single source of truth: `lib/store.ts`
A Zustand store (`useEditor`) holds one `Project` and is **persisted to localStorage** (key `bookjunkaway-meta-ad-studio`, only the `project` slice via `partialize`). The whole app reads/writes this one store. Every mutation goes through `touch()` to bump `updatedAt`. Helpers `totalDuration()` and `sceneAtTime()` map a global timeline position to a specific scene + scene-local time — this mapping is central to both preview and export.

### The data model: `lib/types.ts`
`Project → Scene[] → Layer[]`. A `Layer` is a discriminated union (`text | image | shape | sticker`) on the `type` field. **All layer geometry is normalized 0..1** against canvas dimensions, and font sizes are fractions of canvas height — so layouts are aspect-ratio independent. Aspect ratios, default brand/palette, and Tampa-specific constants all live here.

### The render pipeline (the architectural core)
`lib/renderer.ts` is a **pure 2D Canvas renderer** with no React/DOM dependency beyond `Image`. `renderScene(ctx, scene, localTime, sceneProgress, ...)` draws one frame; per-layer entrance animations are driven by scene-local time, and scene transition-in by `sceneProgress` (0..1). This same renderer powers:
- **`components/PreviewCanvas.tsx`** — live in-editor preview (RAF loop reading `previewTime`/`isPlaying` from the store).
- **`lib/exporter.ts`** — offscreen render to a `MediaStream` captured by `MediaRecorder`. Note the deliberate resilience: it probes for `video/mp4` then falls back to WebM (`pickMimeType`), and `attachAudio` is non-blocking so a suspended/failed AudioContext (common on iOS) never hangs the export.

When changing visuals, edit the renderer once — both preview and export inherit it. Don't fork rendering logic into a component.

### Templates: `lib/templates.ts`
Each `AdTemplate.build(opts)` returns a fresh `Scene[]` from brand + palette + aspect. `loadTemplate` in the store rebuilds scenes from the current brand. This is how "pick a template" and natural-language ad generation produce editable projects.

### Graceful degradation is a hard requirement
Every external integration must work (in a degraded way) when its env var is absent — see `.env.example` for the full contract:
- `GEMINI_API_KEY` → `app/api/generate-ad` (NL→ad spec) and `app/api/generate-image` (Nano Banana imagery). Without it: heuristic template selection + free Pollinations imagery.
- `RESEND_API_KEY` / `RESEND_FROM` → lead emails (`app/api/notify-lead`). Without it: leads still persist locally.
- `UPSTASH_REDIS_REST_URL` / `_TOKEN` → cross-device per-ad analytics (`app/api/track`, `app/api/analytics`). Without it: in-memory counters only.
- `NEXT_PUBLIC_*_WEBHOOK` → optional Zapier/Make JSON forwarding.

Preserve this pattern when touching any API route or its client wrapper.

### Sharing without a backend DB
Proof/lead pages are shareable by **encoding state into the URL** (`lib/proof.ts`, `lib/share.ts`), e.g. `/proof/[id]?p=...`. There is no central database for projects — persistence is localStorage + URL encoding + optional Redis counters.

### Domain logic libraries (`lib/`)
Independent, mostly-pure modules layered on the model: `policyLint.ts` (Meta ad-policy linter + auto-fixes), `viral.ts` (hook bank + 3-second-view score), `memorability.ts` (recall score + brand sting), `platforms.ts` (per-platform export specs), `clients.ts`/`leads.ts` (pipeline, localStorage-persisted), `spyLibrary.ts` (competitor swipe file), `voiceover.ts`/`voices.ts`/`music.ts` (TTS via `app/api/tts` + audio mixing).

### Pages (`app/`, App Router)
`editor` is the studio; `quick` is the simplified flow; `proof/[id]` and `lead/[id]` are shareable public viewers; `clients`/`leads`/`analytics`/`playbook`/`settings` are operator tools; `live` + `components/three/*` is a Three.js (`@react-three/fiber`) experience. `remotion/PovPatternInterrupt.tsx` is a Remotion composition used for one template.

## Conventions

- Import alias `@/*` maps to repo root (see `tsconfig.json`).
- Browser-only modules (anything touching the store, canvas, or `window`) must start with `"use client"`.
- IDs come from `uid(prefix)` in `lib/id.ts`; never hand-roll IDs.
- Keep new layer/scene mutations inside the store's reducer-style setters rather than mutating `project` elsewhere.
