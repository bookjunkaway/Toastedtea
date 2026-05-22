import { Layer, Project, Scene, TextLayer } from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Meta Ad Policy Linter
 *
 *  Scans a Project for the most common reasons junk-removal video ads get
 *  rejected by Meta's automated and human review:
 *
 *    - Sensational / shock language ("SHOCKING", "URGENT", excessive !!! or
 *      $$$, ALL-CAPS sentences)
 *    - Negative self-image phrasing ("STOP being a hoarder", "tired of being
 *      messy") that triggers Personal Attributes policy
 *    - Unsubstantiated superlatives ("#1", "best", "guaranteed") without
 *      a third-party citation
 *    - Profanity, ALL-CAPS abuse, excessive emoji density
 *    - Direct platform mentions ("Facebook", "Instagram" trademarks) in copy
 *    - Aspect ratio mismatched to declared placement
 *    - Insufficient duration for Reels (<6s) or excessive for Stories (>60s)
 *    - Misleading "free" claims without disclosure
 *    - Phone-number-only CTAs without a destination URL
 *
 *  Each finding has a severity:
 *    - "block"  = will almost certainly get the ad rejected
 *    - "warn"   = sometimes triggers review delays
 *    - "tip"    = best-practice nudge (won't block, but hurts CTR)
 *
 *  Many findings come with an `autoFix(project)` that returns a patched
 *  Project so the editor can apply one-click fixes.
 * ────────────────────────────────────────────────────────────────────────── */

export type Severity = "block" | "warn" | "tip";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  sceneId?: string;
  layerId?: string;
  autoFix?: (p: Project) => Project;
}

const BANNED_WORDS = [
  // Sensational
  "shocking",
  "outrageous",
  "unbelievable",
  "insane deal",
  "you won't believe",
  // Hard scams
  "miracle",
  "secret trick",
  "doctors hate",
  // Discrimination triggers (junk-removal is rarely culprit, but safety)
  "ghetto",
  "trashy people",
];

const PERSONAL_ATTRIBUTE_PHRASES = [
  // "You" + negative self-image (Meta Personal Attributes policy)
  /\byou'?re\s+(?:a\s+)?(?:hoarder|messy|lazy|gross|disgusting|nasty)\b/i,
  /\b(?:tired|sick)\s+of\s+being\s+(?:a\s+hoarder|messy|fat|broke|overwhelmed)\b/i,
  /\bstop\s+being\s+(?:a\s+hoarder|messy|lazy|gross)\b/i,
  /\byou\s+have\s+(?:a\s+)?(?:hoarding|mental|anxiety|depression)\b/i,
];

const SUPERLATIVES = [
  /\b#?\s*1\b\s*(?:rated|in|junk|service)?/i,
  /\bbest\b/i,
  /\btop[- ]?rated\b/i,
  /\bguaranteed?\b/i,
  /\bcheapest\b/i,
  /\bfastest\b/i,
];

const META_TRADEMARKS = [/facebook/i, /instagram/i, /\bmeta\b(?!\s*ad)/i, /whatsapp/i];

const PROFANITY = [/\bf+u+c+k+/i, /\bsh+i+t+/i, /\bb+i+t+c+h+/i, /\ba+s+s+h+o+l+e+/i, /\bdamn\b/i];

function texts(scene: Scene): TextLayer[] {
  return scene.layers.filter((l): l is TextLayer => l.type === "text");
}

function allText(p: Project): { scene: Scene; layer: TextLayer }[] {
  return p.scenes.flatMap((scene) => texts(scene).map((layer) => ({ scene, layer })));
}

function countEmoji(p: Project): number {
  return p.scenes.reduce(
    (n, s) => n + s.layers.filter((l): l is Layer => l.type === "sticker").length,
    0,
  );
}

function patchLayerText(p: Project, sceneId: string, layerId: string, newText: string): Project {
  return {
    ...p,
    updatedAt: Date.now(),
    scenes: p.scenes.map((s) =>
      s.id !== sceneId
        ? s
        : {
            ...s,
            layers: s.layers.map((l) =>
              l.id === layerId && l.type === "text" ? ({ ...l, text: newText } as Layer) : l,
            ),
          },
    ),
  };
}

function softenPunctuation(text: string): string {
  return text
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    .replace(/\${3,}/g, "$$")
    .replace(/\.{4,}/g, "…");
}

function deShoutSentence(text: string): string {
  // If the whole text is ALL CAPS and longer than 3 words, convert to Title Case
  const words = text.trim().split(/\s+/);
  const isShouting = words.length > 3 && text.replace(/[^A-Za-z]/g, "").length > 0 && text === text.toUpperCase();
  if (!isShouting) return text;
  return words
    .map((w) => (w.length <= 3 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

export function lintProject(p: Project): Finding[] {
  const findings: Finding[] = [];

  // 1. Aspect-ratio sanity
  if (p.aspectRatio === "16:9") {
    findings.push({
      id: "ar-16-9",
      severity: "tip",
      title: "Landscape rarely wins on mobile",
      description:
        "Meta delivers 80%+ of impressions on mobile. 9:16 Reels and 4:5 Feed convert ~2× landscape on average. Consider switching unless you're buying in-stream/right-column only.",
    });
  }

  // 2. Duration sanity
  const total = p.scenes.reduce((a, b) => a + b.duration, 0);
  if (total < 6) {
    findings.push({
      id: "dur-short",
      severity: "warn",
      title: "Video is under 6 seconds",
      description:
        "Reels and Feed favor 10–20s creative. Sub-6-second videos can be down-ranked and may not deliver in Reels placements at all.",
    });
  }
  if (total > 60 && p.aspectRatio === "9:16") {
    findings.push({
      id: "dur-long-reel",
      severity: "warn",
      title: "Stories cap at 60 seconds",
      description:
        "If you target Stories, anything over 60s gets sliced into 15s cards or rejected. Either shorten or restrict the ad set to Reels & Feed only.",
    });
  }

  // 3. Per-layer text checks
  for (const { scene, layer } of allText(p)) {
    const text = layer.text;
    const lower = text.toLowerCase();

    // Banned words
    for (const w of BANNED_WORDS) {
      if (lower.includes(w)) {
        findings.push({
          id: `banned-${w}-${layer.id}`,
          severity: "block",
          title: `Sensational language: "${w}"`,
          description:
            'Meta\'s Sensational Content policy rejects shock-bait copy. Replace with a concrete benefit ("Same-day pickup", "$50 off your first load", etc.).',
          sceneId: scene.id,
          layerId: layer.id,
        });
      }
    }

    // Personal attributes
    for (const re of PERSONAL_ATTRIBUTE_PHRASES) {
      if (re.test(text)) {
        findings.push({
          id: `pers-${layer.id}-${re.source.slice(0, 10)}`,
          severity: "block",
          title: "Personal-attributes wording",
          description:
            'Phrasing that calls out a viewer\'s personal characteristic ("you\'re messy", "stop being a hoarder") will be auto-rejected. Reframe the problem on the *space*, not the person ("Garage looking like a dumpster?").',
          sceneId: scene.id,
          layerId: layer.id,
        });
      }
    }

    // Superlatives
    for (const re of SUPERLATIVES) {
      if (re.test(text)) {
        findings.push({
          id: `super-${layer.id}-${re.source.slice(0, 8)}`,
          severity: "warn",
          title: 'Unsubstantiated superlative ("#1", "best", "guaranteed")',
          description:
            'Meta asks for proof when you claim "#1", "best", or "guaranteed". Either cite the source ("BBB A+ rated"), reword to "highly rated", or remove the claim.',
          sceneId: scene.id,
          layerId: layer.id,
        });
      }
    }

    // Meta trademarks
    for (const re of META_TRADEMARKS) {
      if (re.test(text)) {
        findings.push({
          id: `meta-tm-${layer.id}`,
          severity: "warn",
          title: "Don't mention Meta brands in the creative",
          description:
            'Using "Facebook", "Instagram", or "Meta" in the ad copy violates the Brand Asset Use guidelines and is a common rejection cause.',
          sceneId: scene.id,
          layerId: layer.id,
        });
      }
    }

    // Profanity
    for (const re of PROFANITY) {
      if (re.test(text)) {
        findings.push({
          id: `prof-${layer.id}`,
          severity: "block",
          title: "Profanity detected",
          description: "Profanity violates Community Standards and will block the ad.",
          sceneId: scene.id,
          layerId: layer.id,
        });
      }
    }

    // Excessive punctuation
    if (/!{2,}|\?{2,}|\${3,}/.test(text)) {
      findings.push({
        id: `punct-${layer.id}`,
        severity: "warn",
        title: "Excessive punctuation",
        description: 'Multiple "!" or "$$$" reads as spammy to Meta\'s review model.',
        sceneId: scene.id,
        layerId: layer.id,
        autoFix: (proj) => patchLayerText(proj, scene.id, layer.id, softenPunctuation(text)),
      });
    }

    // Whole-sentence ALL CAPS
    const words = text.trim().split(/\s+/);
    if (
      words.length >= 4 &&
      text === text.toUpperCase() &&
      text.replace(/[^A-Za-z]/g, "").length > 6
    ) {
      findings.push({
        id: `caps-${layer.id}`,
        severity: "warn",
        title: "Whole sentence in ALL CAPS",
        description:
          "Short shouts like \"STOP\" are fine. Full sentences in caps are flagged as low-quality and lose distribution.",
        sceneId: scene.id,
        layerId: layer.id,
        autoFix: (proj) => patchLayerText(proj, scene.id, layer.id, deShoutSentence(text)),
      });
    }

    // Misleading "FREE"
    if (/\bfree\b/i.test(text) && !/\b(quote|estimate|consult|trial)\b/i.test(text)) {
      findings.push({
        id: `free-${layer.id}`,
        severity: "tip",
        title: 'Clarify what is "free"',
        description:
          'Bare "FREE" is sometimes flagged as misleading. Pair it with the noun ("free quote", "free estimate") to stay safe.',
        sceneId: scene.id,
        layerId: layer.id,
      });
    }
  }

  // 4. Excessive emoji density
  const emojiCount = countEmoji(p);
  if (emojiCount > 6) {
    findings.push({
      id: "emoji-density",
      severity: "tip",
      title: `${emojiCount} emoji stickers — consider trimming`,
      description:
        "More than ~5 emoji across an ad trips Meta's low-quality engagement-bait classifier on roughly 1 in 10 reviews.",
    });
  }

  // 5. Contact info: must have a destination
  const hasUrl = allText(p).some(({ layer }) => /\.(com|co|net|org|us)\b/i.test(layer.text));
  const hasPhone = allText(p).some(({ layer }) => /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(layer.text));
  if (hasPhone && !hasUrl) {
    findings.push({
      id: "phone-no-url",
      severity: "warn",
      title: "Phone shown but no destination URL",
      description:
        "Meta requires a tappable destination URL for video ads. Add www.bookjunkaway.com as a visible CTA so reviewers see parity with your landing page.",
    });
  }

  return findings;
}

export function policyScore(findings: Finding[]): { score: number; status: "safe" | "review" | "block" } {
  const blocks = findings.filter((f) => f.severity === "block").length;
  const warns = findings.filter((f) => f.severity === "warn").length;
  if (blocks > 0) return { score: Math.max(0, 60 - blocks * 15 - warns * 5), status: "block" };
  if (warns > 0) return { score: Math.max(60, 95 - warns * 8), status: "review" };
  return { score: 100, status: "safe" };
}
