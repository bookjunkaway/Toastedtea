import { Project } from "./types";
import { policyScore, lintProject } from "./policyLint";
import { viralScore } from "./viral";
import { recallScore, wrapWithBrandSting } from "./memorability";

/* ──────────────────────────────────────────────────────────────────────────
 *  Convert-O-Meter
 *
 *  One composite 0–100 score combining the four levers that actually
 *  determine whether a Meta video ad converts:
 *
 *    1. Policy   — will it even ship? (block-level = 0× multiplier)
 *    2. Hook     — does the first 3 seconds stop the scroll?
 *    3. Viral    — is the format share-worthy and save-worthy?
 *    4. Recall   — does the brand actually stick when the video ends?
 *
 *  Plus a `magicFix(project)` that applies every available auto-fix,
 *  wraps with brand sting, and gives the operator a one-click "make this
 *  convert" button.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ConvertScoreBreakdown {
  policy: number;
  hook: number;
  viral: number;
  recall: number;
  overall: number;
  status: "needs-work" | "good" | "excellent" | "blocked";
  topAction: string;
}

function hookScore(project: Project): { score: number; tip: string } {
  const first = project.scenes[0];
  if (!first) return { score: 0, tip: "Add at least one scene with a hook." };
  const text = first.layers.find((l) => l.type === "text") as { text?: string } | undefined;
  const hook = (text?.text ?? "").trim();
  let s = 0;
  let tip = "Tighten the first scene.";

  if (first.duration <= 3) s += 25;
  else tip = "Shorten the first scene to ≤3 seconds — that's the actual decision window.";

  const words = hook.split(/\s+/).filter(Boolean).length;
  if (hook.length > 0) s += 10;
  if (words >= 3 && words <= 10) s += 20;
  else if (words > 10) tip = "Trim your hook to 10 words or fewer.";

  if (/^(POV|Tell me|This is your sign|Rate this|Things|Day in the life|Customer said|What|How|Why|Stop|If you)/i.test(hook))
    s += 20;
  else if (s < 50) tip = 'Open with a proven hook pattern ("POV:", "Tell me you...", "This is your sign").';

  if (/[?!]/.test(hook)) s += 10;
  if (first.layers.some((l) => l.animation && l.animation !== "none")) s += 15;
  return { score: Math.min(100, s), tip };
}

export function convertScore(project: Project): ConvertScoreBreakdown {
  const findings = lintProject(project);
  const pol = policyScore(findings);
  const v = viralScore(project);
  const r = recallScore(project);
  const h = hookScore(project);

  const hasBlock = pol.status === "block";
  // Weighted: hook 35, viral 25, recall 20, policy 20
  const raw =
    (h.score * 35 + v.score * 25 + r.score * 20 + pol.score * 20) / 100;
  const overall = hasBlock ? 0 : Math.round(raw);

  const status: ConvertScoreBreakdown["status"] = hasBlock
    ? "blocked"
    : overall >= 85
    ? "excellent"
    : overall >= 65
    ? "good"
    : "needs-work";

  const topAction = hasBlock
    ? "Fix the policy blocker — Meta will reject this until it's clean."
    : h.score < 60
    ? h.tip
    : v.score < 60
    ? v.checks.find((c) => !c.passed)?.hint ?? "Add motion to every scene."
    : r.score < 60
    ? r.rules.find((c) => !c.passed)?.hint ?? "Wrap with the brand sting."
    : "Solid creative. Ship 5 hook variants to A/B test.";

  return {
    policy: pol.score,
    hook: h.score,
    viral: v.score,
    recall: r.score,
    overall,
    status,
    topAction,
  };
}

export interface MagicFixResult {
  project: Project;
  changes: string[];
}

const VIRAL_HOOK_PATTERN = /^(POV|Tell me you|This is your sign|Rate this|Things|Day in the life|Customer said|What every|Stop|If you)/i;

function hasBrandSting(project: Project): boolean {
  return project.scenes.some((s) => /brand sting/i.test(s.name));
}

export function magicFixWithChanges(project: Project): MagicFixResult {
  const changes: string[] = [];
  let next = project;

  // 1) Apply every available auto-fix from the policy linter
  const findings = lintProject(next);
  const fixable = findings.filter((f) => f.autoFix);
  for (const f of fixable) {
    if (f.autoFix) {
      const before = next;
      next = f.autoFix(next);
      if (next !== before) changes.push(`Fixed: ${f.title}`);
    }
  }

  // 2) Hook upgrade — if the first scene's first text isn't a viral pattern, swap one in
  const first = next.scenes[0];
  if (first) {
    const firstText = first.layers.find((l) => l.type === "text") as { id: string; text: string } | undefined;
    if (firstText && !VIRAL_HOOK_PATTERN.test(firstText.text.trim())) {
      const viralHook = "POV: you finally booked the garage cleanout you've been avoiding for years.";
      next = {
        ...next,
        scenes: next.scenes.map((s) =>
          s.id !== first.id
            ? s
            : {
                ...s,
                layers: s.layers.map((l) => (l.id === firstText.id && l.type === "text" ? { ...l, text: viralHook } : l)),
              },
        ),
        updatedAt: Date.now(),
      };
      changes.push("Upgraded hook to proven POV pattern");
    }
  }

  // 3) Tighten the first scene to ≤2.5s for hook payoff
  if (next.scenes[0] && next.scenes[0].duration > 2.5) {
    const old = next.scenes[0].duration;
    next = {
      ...next,
      scenes: next.scenes.map((s, i) => (i === 0 ? { ...s, duration: 2.5 } : s)),
      updatedAt: Date.now(),
    };
    changes.push(`Shortened hook from ${old.toFixed(1)}s to 2.5s`);
  }

  // 4) Wrap with brand sting if not already wrapped (uses recall score as the gate)
  if (!hasBrandSting(next)) {
    const recall = recallScore(next);
    if (recall.score < 80) {
      next = wrapWithBrandSting(next);
      changes.push("Added brand sting (signature open + close)");
    }
  }

  // 5) Ensure every scene has at least one animated layer (kills static feel)
  let animatedAny = false;
  next = {
    ...next,
    scenes: next.scenes.map((sc) => {
      if (sc.layers.some((l) => l.animation && l.animation !== "none")) return sc;
      animatedAny = true;
      return {
        ...sc,
        layers: sc.layers.map((l, i) => (i === 0 ? { ...l, animation: "slideUp", animationDuration: 0.45 } : l)),
      };
    }),
  };
  if (animatedAny) changes.push("Added entrance motion to flat scenes");

  // 6) Force vertical for max-distribution if not already vertical
  if (next.aspectRatio !== "9:16") {
    next = { ...next, aspectRatio: "9:16", updatedAt: Date.now() };
    changes.push(`Switched aspect to 9:16 for Reels distribution`);
  }

  if (changes.length === 0) {
    changes.push("Already optimized — no changes needed.");
  }

  return { project: next, changes };
}

export function magicFix(project: Project): Project {
  return magicFixWithChanges(project).project;
}
