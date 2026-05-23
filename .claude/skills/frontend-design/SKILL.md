---
name: frontend-design
description: >-
  Frontend and UI design guidance tailored to this repo (Next.js 14 App Router,
  Tailwind CSS, Remotion, Three.js / react-three-fiber, Zustand). Use when
  building or restyling pages/components, working on the editor UI, canvas
  rendering, animations, responsive layout, or when the user asks to "make this
  look better", "design a component", "improve the UI", or "match the brand".
---

# Frontend Design (Book Junk Away — Meta Ad Studio)

Guidance for building polished, on-brand UI in this codebase. This is a
high-conversion video-ad studio; the UI should feel fast, confident, and
visually striking.

## Stack facts (don't fight these)

- **Next.js 14 App Router** (`app/`). Server Components by default; add
  `"use client"` only for interactivity (state, effects, event handlers, the
  Zustand store, canvas, Three.js).
- **Tailwind CSS** for all styling — config in `tailwind.config.ts`. Use the
  theme tokens already defined there; add tokens to the config rather than
  hardcoding hex values inline.
- **State**: Zustand store in `lib/store.ts`, persisted to localStorage. Read
  the existing store before adding state; prefer selectors to avoid re-renders.
- **Icons**: `lucide-react`. **Class merging**: `clsx`.
- **Video**: Remotion (`@remotion/player`) + a pure-Canvas renderer in
  `lib/renderer.ts`. 3D via `@react-three/fiber` + `drei`.

## Brand

- Book Junk Away palette: **yellow / black / red**. Keep contrast high and
  legible — these ads must read on mobile feeds.
- Logo: `public/logo.svg` (overridable by `public/logo.png`). Reuse it in brand
  stings; don't reinvent.
- Tone: bold, urgent, trustworthy. Tampa Bay junk-removal market.

## Design principles for this app

1. **Mobile-first, feed-shaped.** Ads target Reels/Stories/TikTok (9:16). Design
   editor previews and proof pages to look right at portrait aspect first.
2. **Speed reads as quality.** Prefer CSS transitions/transforms over JS
   animation for UI chrome; reserve heavy animation for the canvas output.
3. **Reuse existing components.** Check `components/` (TopBar, PromptBar,
   PreviewCanvas, …) before creating new ones. Match their prop and styling
   conventions.
4. **Tailwind discipline.** Compose utilities; extract repeated clusters into a
   component, not a custom CSS file. Use `clsx` for conditional classes.
5. **Accessible by default.** Real button/label elements, focus states, alt
   text, sufficient color contrast (the brand red/yellow on black needs care).
6. **Keep client bundles lean.** Don't pull Three.js or Remotion into routes
   that don't need them. Lazy-load heavy editor pieces.

## Workflow for a UI task

1. Find the page/component in `app/` or `components/` and read it plus any
   Tailwind tokens it uses.
2. Confirm whether it must be a Client Component; minimize the `"use client"`
   boundary.
3. Implement with existing tokens/components; add new theme tokens to
   `tailwind.config.ts` when needed.
4. Run `npm run dev` and check the change at portrait (mobile) and desktop
   widths before reporting done. If you can't view it, say so.
5. Run `npm run type-check` and `npm run lint` for non-trivial changes.
