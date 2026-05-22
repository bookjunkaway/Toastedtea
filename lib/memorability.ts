import { uid } from "./id";
import { Project, Scene } from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Memorability — ad recall + brand sting builder
 *
 *  Distillation of the recall research from System1, Karen Nelson-Field, and
 *  Byron Sharp:
 *    1. Same opening "brand sting" across every spot → distinctive asset
 *    2. Brand name appears ≥3 times (visual + verbal)
 *    3. Signature color is on screen ≥80% of frames
 *    4. Mnemonic phrase ("Book it. Junk it. Away it.") repeated and on closing card
 *    5. Closing card is the same shape every time so the audience learns it
 *
 *  This module ships two things:
 *    - `recallScore(project)` returns a 0–100 score + per-rule explanation
 *    - `prependBrandSting(project)` + `appendBrandSting(project)` insert the
 *       signature scenes so the operator gets a one-click "make this stick"
 * ────────────────────────────────────────────────────────────────────────── */

export interface RecallRule {
  id: string;
  weight: number;
  passed: boolean;
  title: string;
  hint: string;
}

const BRAND_YELLOW = "#FBBF24";
const BRAND_BLACK = "#0a0a0a";

function containsBrand(project: Project, needle: string): number {
  const n = needle.toLowerCase();
  return project.scenes.reduce(
    (acc, s) =>
      acc +
      s.layers.filter((l) => l.type === "text" && (l as { text: string }).text.toLowerCase().includes(n)).length,
    0,
  );
}

function dominantYellow(project: Project): number {
  // % of scenes with any yellow-ish background or yellow text/shape
  const isYellow = (hex: string) => /^#?f[abc]b[fb][12][45f]/i.test(hex) || /^#?fde047|^#?facc15|^#?fbbf24/i.test(hex);
  const hits = project.scenes.filter((s) => {
    const bgYellow =
      (s.background.kind === "solid" && isYellow(s.background.color)) ||
      (s.background.kind === "gradient" && (isYellow(s.background.from) || isYellow(s.background.to)));
    const layerYellow = s.layers.some(
      (l) =>
        (l.type === "text" && isYellow((l as { color: string }).color)) ||
        (l.type === "shape" && isYellow((l as { fill: string }).fill)),
    );
    return bgYellow || layerYellow;
  }).length;
  return project.scenes.length ? hits / project.scenes.length : 0;
}

export function recallScore(project: Project): { score: number; rules: RecallRule[] } {
  const brandMentions =
    containsBrand(project, project.brand.companyName) +
    containsBrand(project, project.brand.companyName.replace(/\s+/g, ""));
  const mnemonicHits = containsBrand(project, "book it") + containsBrand(project, "junk it") + containsBrand(project, "away it");
  const yellowShare = dominantYellow(project);
  const lastScene = project.scenes[project.scenes.length - 1];
  const closingHasBrand =
    !!lastScene &&
    lastScene.layers.some(
      (l) =>
        l.type === "text" &&
        new RegExp(project.brand.website.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(
          (l as { text: string }).text,
        ),
    );
  const openingHasBrand =
    !!project.scenes[0] &&
    project.scenes[0].layers.some(
      (l) =>
        (l.type === "text" && /book\s*junk|bookjunk|booking|book.*junk/i.test((l as { text: string }).text)) ||
        (l.type === "image" && /logo/.test((l as { src: string }).src)),
    );

  const rules: RecallRule[] = [
    {
      id: "brand-name-3x",
      weight: 18,
      passed: brandMentions >= 3,
      title: "Brand name appears 3+ times",
      hint: "Repeat the brand name visually across hook, middle, and CTA — Sharp's research is unambiguous.",
    },
    {
      id: "mnemonic",
      weight: 16,
      passed: mnemonicHits >= 1,
      title: 'Mnemonic phrase used ("Book it. Junk it. Away it.")',
      hint: "Your tagline is a perfect ear-worm. Use it in at least one scene — it triples unaided recall in tests.",
    },
    {
      id: "yellow-dominant",
      weight: 15,
      passed: yellowShare >= 0.6,
      title: "Brand yellow dominates ≥60% of scenes",
      hint: "Color is your fastest mental shortcut. Lock the BJA yellow into every scene background or accent.",
    },
    {
      id: "open-brand",
      weight: 15,
      passed: openingHasBrand,
      title: "Opening scene establishes the brand",
      hint: "Add a 0.5–1s logo / brand-card flash at the very start so the brand registers before the hook.",
    },
    {
      id: "close-brand",
      weight: 15,
      passed: closingHasBrand,
      title: "Closing scene shows the URL/brand",
      hint: 'End on a stable "brand card" — same composition every time — to build the distinctive asset.',
    },
    {
      id: "consistent-cta",
      weight: 11,
      passed:
        !!lastScene &&
        lastScene.layers.some(
          (l) => l.type === "text" && /book|quote|tap|call/i.test((l as { text: string }).text),
        ),
      title: "Clear closing CTA verb",
      hint: 'A single, repeated CTA verb ("Book", "Tap", "Quote") trains the audience to take action by reflex.',
    },
    {
      id: "scene-count",
      weight: 10,
      passed: project.scenes.length >= 3 && project.scenes.length <= 6,
      title: "3–6 scenes (memorable cadence)",
      hint: "Too few scenes = forgettable. Too many = blur. The sweet spot for recall is 3–6 distinct beats.",
    },
  ];

  const total = rules.reduce((a, r) => a + r.weight, 0);
  const earned = rules.reduce((a, r) => a + (r.passed ? r.weight : 0), 0);
  return { score: Math.round((earned / total) * 100), rules };
}

/* ─── Brand sting builders ──────────────────────────────────────────────── */

function logoStingScene(project: Project, kind: "open" | "close"): Scene {
  const isOpen = kind === "open";
  return {
    id: uid("sc"),
    name: isOpen ? "Brand sting (open)" : "Brand sting (close)",
    duration: isOpen ? 1.0 : 1.8,
    background: { kind: "solid", color: BRAND_BLACK },
    transitionIn: isOpen ? "none" : "zoom",
    transitionInDuration: isOpen ? 0 : 0.2,
    layers: [
      // Yellow flash bar
      {
        id: uid("s"),
        type: "shape",
        shape: "rect",
        fill: BRAND_YELLOW,
        x: 0,
        y: 0.45,
        width: 1,
        height: 0.1,
        rotation: 0,
        opacity: 1,
        borderRadius: 0,
        animation: isOpen ? "zoomIn" : "fadeIn",
        animationDelay: 0,
        animationDuration: 0.3,
      },
      // Brand logo image
      {
        id: uid("i"),
        type: "image",
        src: project.brand.heroImage ?? "/logo.svg",
        fit: "contain",
        x: 0.25,
        y: 0.15,
        width: 0.5,
        height: 0.5,
        rotation: 0,
        opacity: 1,
        borderRadius: 0,
        animation: "zoomIn",
        animationDelay: 0.05,
        animationDuration: 0.4,
      },
      // Tagline mnemonic
      {
        id: uid("t"),
        type: "text",
        text: isOpen ? "Book Junk Away" : project.brand.tagline,
        x: 0.05,
        y: 0.7,
        width: 0.9,
        height: 0.1,
        rotation: 0,
        opacity: 1,
        animation: "slideUp",
        animationDelay: 0.3,
        animationDuration: 0.4,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontWeight: 900,
        fontSize: 0.06,
        lineHeight: 1.1,
        letterSpacing: 0,
        color: BRAND_YELLOW,
        align: "center",
        paddingX: 0,
        paddingY: 0,
        borderRadius: 0,
      },
      // URL on closing card only
      ...(isOpen
        ? []
        : [
            {
              id: uid("t"),
              type: "text" as const,
              text: project.brand.website,
              x: 0.05,
              y: 0.82,
              width: 0.9,
              height: 0.06,
              rotation: 0,
              opacity: 1,
              animation: "fadeIn" as const,
              animationDelay: 0.6,
              animationDuration: 0.3,
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 0.04,
              lineHeight: 1.1,
              letterSpacing: 0.02,
              color: "#ffffff",
              align: "center" as const,
              paddingX: 0,
              paddingY: 0,
              borderRadius: 0,
            },
          ]),
    ],
  };
}

export function prependBrandSting(project: Project): Project {
  return {
    ...project,
    updatedAt: Date.now(),
    scenes: [logoStingScene(project, "open"), ...project.scenes],
  };
}

export function appendBrandSting(project: Project): Project {
  return {
    ...project,
    updatedAt: Date.now(),
    scenes: [...project.scenes, logoStingScene(project, "close")],
  };
}

export function wrapWithBrandSting(project: Project): Project {
  return appendBrandSting(prependBrandSting(project));
}
