import { Project } from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Viral hook bank + viral score predictor
 *
 *  These are proven Reels/TikTok-native hook formulas adapted for the
 *  junk-removal niche in Tampa. They're the actual phrasings that score
 *  high three-second-view and save rates in the wild.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ViralHook {
  format:
    | "POV"
    | "Tell me you..."
    | "This is your sign"
    | "Rate this"
    | "Things that…"
    | "Day in the life"
    | "Customer said do it"
    | "Before they call"
    | "Tampa edition";
  hook: string;
  followUp: string;
}

export const VIRAL_HOOKS: ViralHook[] = [
  {
    format: "POV",
    hook: "POV: you finally booked the garage cleanout you've been putting off for 3 years.",
    followUp: "Before-and-after montage + crew arriving in under 2 hours.",
  },
  {
    format: "POV",
    hook: "POV: it's Saturday morning in Tampa and you can finally park in your garage again.",
    followUp: "Reveal swept-clean garage with sunlight cue.",
  },
  {
    format: "Tell me you...",
    hook: "Tell me you live in a Tampa house with a hoarder garage without telling me.",
    followUp: "Quick cuts of overflowing items → smash to empty space + booking screen.",
  },
  {
    format: "This is your sign",
    hook: "This is your sign to finally book that junk haul, Tampa.",
    followUp: "Crew arriving + same-day load-out + $50 off card.",
  },
  {
    format: "Rate this",
    hook: "Rate this Tampa garage cleanout out of 10.",
    followUp: "Time-lapse of a real load with a numeric score animating up at the end.",
  },
  {
    format: "Things that…",
    hook: "Things in your garage that bring you no joy:",
    followUp: "Checklist animation: old treadmill, broken patio set, hot tub, mystery boxes — each ticks off.",
  },
  {
    format: "Day in the life",
    hook: "Day in the life of a Tampa junk-removal crew.",
    followUp: "Coffee → first job (estate cleanout) → lunch on Bayshore → afternoon (hoarder garage) → 'we did 9 jobs today'.",
  },
  {
    format: "Customer said do it",
    hook: "Customer said: take it all. So we did.",
    followUp: "Wide shot of full garage → 8-minute time-lapse → empty garage + customer reaction shot.",
  },
  {
    format: "Before they call",
    hook: "What every Tampa garage looks like 10 minutes before they call us.",
    followUp: "Cinematic establishing shot of mess + caption: 'fixable.'",
  },
  {
    format: "Tampa edition",
    hook: "Things only Tampa homeowners understand: a garage full of hurricane prep + 4 broken pool floats.",
    followUp: "Relatable cuts + 'we haul that' CTA.",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 *  Viral Score predictor
 *  Heuristic 0–100 score plus a list of improvements. This isn't magic —
 *  it scores the things that *actually* correlate with three-second-view
 *  rate, save rate, and share rate on Meta Reels.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ViralImprovement {
  id: string;
  weight: number;
  passed: boolean;
  title: string;
  hint: string;
}

export function viralScore(project: Project): { score: number; checks: ViralImprovement[] } {
  const firstScene = project.scenes[0];
  const firstText =
    firstScene?.layers.find((l) => l.type === "text") as { text?: string } | undefined;
  const firstHook = (firstText?.text ?? "").trim();
  const total = project.scenes.reduce((a, b) => a + b.duration, 0);

  const checks: ViralImprovement[] = [
    {
      id: "vertical",
      weight: 15,
      passed: project.aspectRatio === "9:16",
      title: "Vertical (9:16) format",
      hint: "Reels, TikTok, Shorts, Snap, Pinterest Idea Pins — all 9:16. Square ads scroll past.",
    },
    {
      id: "fast-hook",
      weight: 20,
      passed: firstScene ? firstScene.duration <= 3 : false,
      title: "Hook lands in ≤3 seconds",
      hint: "Three-second-view rate is the lever. Your first scene must pay off before the scroller leaves.",
    },
    {
      id: "hook-pattern",
      weight: 15,
      passed:
        /^(POV|Tell me you|This is your sign|Rate this|Things|Day in the life|Customer said|Tampa)/i.test(firstHook) ||
        /^[A-Z][^.!?]{0,30}[?!]/.test(firstHook),
      title: "Hook uses a proven viral pattern",
      hint: 'Open with "POV:", "Tell me you...", "Things that...", "This is your sign", or a sharp question.',
    },
    {
      id: "duration",
      weight: 10,
      passed: total >= 8 && total <= 30,
      title: "Total length 8–30s",
      hint: "Sweet spot for retention + replay. Sub-8s often kills delivery; >30s tanks completion rate.",
    },
    {
      id: "scenes",
      weight: 10,
      passed: project.scenes.length >= 3,
      title: "3+ scene cuts",
      hint: "Cuts every 1–3 seconds keep the algorithm rewarding watch-time.",
    },
    {
      id: "motion",
      weight: 10,
      passed: project.scenes.some((s) =>
        s.layers.some((l) => l.animation && l.animation !== "none"),
      ),
      title: "Layer motion present",
      hint: "Animated entrances signal native creative, not static ad bait.",
    },
    {
      id: "captions",
      weight: 10,
      passed: project.scenes.every((s) => s.layers.some((l) => l.type === "text")),
      title: "Every scene has text",
      hint: "90%+ of Reels are watched muted. If every scene has on-screen text, you double comprehension.",
    },
    {
      id: "cta-late",
      weight: 10,
      passed:
        project.scenes.length > 1 &&
        (project.scenes[project.scenes.length - 1].layers.some(
          (l) => l.type === "text" && /book|quote|call|order|tap|click|www\./i.test((l as { text?: string }).text ?? ""),
        ) ?? false),
      title: "CTA in the final scene",
      hint: "Lead with payoff, close with the ask. Front-loading CTAs kills completion.",
    },
  ];

  const totalWeight = checks.reduce((a, c) => a + c.weight, 0);
  const earned = checks.reduce((a, c) => a + (c.passed ? c.weight : 0), 0);
  const score = Math.round((earned / totalWeight) * 100);
  return { score, checks };
}
