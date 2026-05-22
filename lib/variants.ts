import { Project, Scene, TextLayer } from "./types";
import { uid } from "./id";
import { VIRAL_HOOKS } from "./viral";

/* ──────────────────────────────────────────────────────────────────────────
 *  Hook Variant Generator
 *
 *  Produces N project clones — each with a different first-scene hook —
 *  so the operator can ship 5 A/B variants in a single export pass.
 *
 *  Strategy:
 *    1. POV pattern
 *    2. "Tell me you..." pattern
 *    3. Direct urgency
 *    4. Curiosity / question
 *    5. Stat / proof
 *
 *  Each variant has a unique project name suffix so the exporter writes
 *  separate files (`name__v1.mp4`, `name__v2.mp4`, …).
 * ────────────────────────────────────────────────────────────────────────── */

export interface HookVariant {
  label: string;
  hook: string;
  rationale: string;
}

export function generateHookVariants(brand: { companyName: string; offer: string; serviceArea: string }): HookVariant[] {
  return [
    {
      label: "POV",
      hook: "POV: you finally booked the garage cleanout you've been avoiding for 3 years.",
      rationale: "Native-feeling Reels opener. Top performer for 3-second view rate.",
    },
    {
      label: "Tell me you...",
      hook: "Tell me you have a Tampa hoarder garage without telling me.",
      rationale: "High save & comment rate. Works as engagement-bait without violating policy.",
    },
    {
      label: "Direct urgency",
      hook: `Book by 2pm in ${brand.serviceArea.split("•")[0].trim() || "Tampa"} — it's gone today.`,
      rationale: "Cuts through cold traffic with a time-bound promise.",
    },
    {
      label: "Curiosity question",
      hook: "What every Tampa garage looks like 10 minutes before they call us.",
      rationale: "Open loop forces a watch-to-find-out. Strong completion rate.",
    },
    {
      label: "Offer stat",
      hook: `${brand.offer} when you book online today.`,
      rationale: "Dollar-amount hook qualifies price-sensitive buyers fast → cheap CPL.",
    },
  ];
}

function replaceFirstHook(project: Project, newHook: string, variantSuffix: string): Project {
  if (!project.scenes.length) return project;
  const firstScene = project.scenes[0];
  const firstText = firstScene.layers.find((l) => l.type === "text") as TextLayer | undefined;
  if (!firstText) return project;
  const newScene: Scene = {
    ...firstScene,
    id: uid("sc"),
    layers: firstScene.layers.map((l) =>
      l.id === firstText.id && l.type === "text" ? { ...l, id: uid("t"), text: newHook } : { ...l, id: uid(l.type[0]) },
    ),
  };
  return {
    ...project,
    id: uid("p"),
    name: `${project.name} · ${variantSuffix}`,
    scenes: [newScene, ...project.scenes.slice(1).map((s) => ({ ...s, id: uid("sc") }))],
    updatedAt: Date.now(),
  };
}

export function buildVariantProjects(base: Project, variants: HookVariant[]): Project[] {
  return variants.map((v, i) => replaceFirstHook(base, v.hook, `v${i + 1} (${v.label})`));
}
