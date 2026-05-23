import { AspectRatioKey } from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Cross-platform Ad Playbook
 *
 *  Every battle-tested ad pattern across Meta / TikTok / YouTube Shorts /
 *  YouTube Standard / LinkedIn / Pinterest / Snapchat. Each entry includes
 *  the format, why it converts, recent industry benchmarks (directional),
 *  and a tailored prompt brief that the operator can one-tap into /quick.
 *
 *  Benchmarks are blended directional numbers from Meta Ads Reporting,
 *  TikTok Creator Insights, YouTube Studio, LinkedIn Campaign Manager, and
 *  the major performance-marketing public reports (Common Thread Collective,
 *  Motion Insights, Vidico). Treat them as ranges, not guarantees.
 * ────────────────────────────────────────────────────────────────────────── */

export type Platform =
  | "Meta Reels"
  | "Meta Feed"
  | "Meta Stories"
  | "TikTok"
  | "YouTube Shorts"
  | "YouTube Standard"
  | "LinkedIn"
  | "Pinterest"
  | "Snapchat";

export type Funnel = "TOFU" | "MOFU" | "BOFU";

export interface PlaybookPattern {
  id: string;
  name: string;
  platform: Platform;
  funnel: Funnel;
  aspect: AspectRatioKey;
  durationSec: number;
  /** The proven hook formula (operator-facing copy) */
  hook: string;
  /** One-line "why this converts" — psychological lever */
  why: string;
  /** Beat-by-beat storyboard */
  beats: string[];
  /** Directional benchmarks (industry-blended) */
  benchmarks: {
    threeSecViewRate?: string;
    avgWatchTime?: string;
    ctr?: string;
    saveRate?: string;
    shareRate?: string;
    completionRate?: string;
  };
  /** Best-fit business categories (case-insensitive substring matched) */
  goodFor: string[];
  /** Prompt to pre-fill /quick (operator can tweak before generating) */
  promptBrief: string;
  /** Recommended tone for this pattern */
  tone: "punchy" | "funny" | "cinematic" | "chill";
}

export const PLAYBOOK: PlaybookPattern[] = [
  /* ─────────────────────── META REELS ─────────────────────────────────── */
  {
    id: "meta-reels-pov-interrupt",
    name: "POV Pattern Interrupt",
    platform: "Meta Reels",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 12,
    hook: "POV: you finally did the thing you've been putting off for years.",
    why: "POV opener mimics organic Reels, kills the ad sniff-test, top 3-second view rate format.",
    beats: [
      "0–1s: POV-tag overlay, single bold word",
      "1–4s: messy 'before' shot, no music",
      "4–8s: bass drop + time-lapse action",
      "8–11s: 'after' reveal + relief moment",
      "11–12s: branded CTA card",
    ],
    benchmarks: { threeSecViewRate: "38–52%", ctr: "1.4–2.8%", saveRate: "1.8–4%" },
    goodFor: ["junk", "cleaning", "lawn", "moving", "pool", "auto", "salon", "med spa"],
    promptBrief: "POV pattern interrupt Reels ad: 'POV: you finally booked the thing you've been avoiding'. Quick before/after with a $50 off offer and same-day promise.",
    tone: "punchy",
  },
  {
    id: "meta-reels-before-after",
    name: "Before/After Time-Lapse",
    platform: "Meta Reels",
    funnel: "MOFU",
    aspect: "9:16",
    durationSec: 15,
    hook: "Watch what happens in 47 minutes.",
    why: "Transformation is the single highest-saving-rate format on Reels. Empty-space reveal is the dopamine hit.",
    beats: [
      "0–2s: 'BEFORE' card on chaos shot",
      "2–10s: speed-ramped action with progress overlay",
      "10–13s: pristine 'AFTER' reveal",
      "13–15s: book-now CTA + URL",
    ],
    benchmarks: { threeSecViewRate: "42–58%", saveRate: "3–6%", completionRate: "28–40%" },
    goodFor: ["junk", "cleaning", "lawn", "landscaping", "pressure washing", "pool", "auto detailing", "painting", "moving"],
    promptBrief: "Before/after transformation Reels ad with a time-lapse and a clear 'AFTER' reveal. Include a $50 off first-service offer.",
    tone: "cinematic",
  },
  {
    id: "meta-reels-static-hook",
    name: "Static Text Hook + B-Roll",
    platform: "Meta Reels",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 14,
    hook: "If you live in [CITY] and have a [PAIN], read this:",
    why: "Big-font hook locks the scroll in 0.8s. Cheapest CPM creative format on Meta.",
    beats: [
      "0–3s: enormous text hook, soft B-roll under",
      "3–9s: 3 quick text beats with rotating B-roll",
      "9–12s: offer + social proof",
      "12–14s: CTA card",
    ],
    benchmarks: { threeSecViewRate: "32–48%", ctr: "1.2–2.5%" },
    goodFor: ["junk", "cleaning", "hvac", "plumbing", "roofing", "real estate", "dentist", "med spa"],
    promptBrief: "Static text hook Reels ad targeting Tampa homeowners. Lead with the pain ('Garage looking like a dumpster?') then promise + offer + CTA.",
    tone: "punchy",
  },
  {
    id: "meta-reels-founder",
    name: "Founder Talks to Camera",
    platform: "Meta Reels",
    funnel: "MOFU",
    aspect: "9:16",
    durationSec: 20,
    hook: "My name's [X] and I own [BUSINESS]. Here's what we do different.",
    why: "Trust + identity short-circuit the 'who am I letting in my house' fear. Best for service businesses.",
    beats: [
      "0–3s: founder direct address, name + business",
      "3–10s: one specific differentiator (uniformed crew, eco disposal, etc.)",
      "10–16s: customer-reaction cut",
      "16–20s: phone + URL CTA",
    ],
    benchmarks: { threeSecViewRate: "35–50%", avgWatchTime: "8–14s", ctr: "1.5–3%" },
    goodFor: ["junk", "cleaning", "lawn", "hvac", "plumbing", "roofing", "auto repair", "moving", "pool", "pest control"],
    promptBrief: "Founder-talks-to-camera Reels ad: 'My name's Charles, I run Book Junk Away'. Lead with one specific differentiator (insured + uniformed + same-day) + a customer reaction.",
    tone: "chill",
  },

  /* ─────────────────────── META FEED ──────────────────────────────────── */
  {
    id: "meta-feed-testimonial",
    name: "Customer Testimonial Reaction",
    platform: "Meta Feed",
    funnel: "BOFU",
    aspect: "4:5",
    durationSec: 18,
    hook: '"I was skeptical until…"',
    why: "Specific objection-killing testimonials convert retargeting audiences 2-3× a generic UGC.",
    beats: [
      "0–3s: customer mid-sentence, raw audio",
      "3–10s: pivot moment ('then they showed up early')",
      "10–14s: outcome ('garage cleared in 40 minutes')",
      "14–18s: 5-stars overlay + CTA",
    ],
    benchmarks: { ctr: "2–4%", completionRate: "35–55%" },
    goodFor: ["junk", "cleaning", "lawn", "moving", "auto repair", "hvac", "plumbing", "pool", "med spa", "dentist", "real estate"],
    promptBrief: "Customer testimonial Feed ad with a specific objection killed in scene 1. Pull a real quote from the brand's review and reveal the outcome.",
    tone: "cinematic",
  },
  {
    id: "meta-feed-stat-reveal",
    name: '"Did You Know" Stat Reveal',
    platform: "Meta Feed",
    funnel: "TOFU",
    aspect: "1:1",
    durationSec: 12,
    hook: "73% of [CITY] garages have $400 of junk just sitting there.",
    why: "Stat-driven hooks bypass ad blindness. Best when paired with a niche-specific number.",
    beats: [
      "0–3s: bold stat reveal",
      "3–7s: 3-icon visual breakdown",
      "7–10s: solution headline",
      "10–12s: CTA",
    ],
    benchmarks: { threeSecViewRate: "28–42%", ctr: "1.1–2.4%" },
    goodFor: ["junk", "cleaning", "lawn", "real estate", "dentist", "med spa", "gym"],
    promptBrief: "Stat-reveal Feed ad opening with a surprising Tampa-specific number, then explain the implication and offer the fix.",
    tone: "punchy",
  },

  /* ─────────────────────── META STORIES ───────────────────────────────── */
  {
    id: "meta-stories-poll",
    name: "Interactive Story Poll",
    platform: "Meta Stories",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 8,
    hook: "Yes / No — does your garage look like this?",
    why: "Poll engagement signals to Meta that the audience cares — drops CPM 20–35%.",
    beats: [
      "0–2s: relatable image + question",
      "2–6s: poll sticker live",
      "6–8s: 'tap up' to book CTA",
    ],
    benchmarks: { ctr: "0.9–2.1%", completionRate: "60–80%" },
    goodFor: ["junk", "cleaning", "lawn", "moving", "salon", "gym"],
    promptBrief: "8-second Stories ad with a yes/no poll question matching the customer's pain. End with a clear 'tap up' CTA.",
    tone: "punchy",
  },

  /* ─────────────────────── TIKTOK ─────────────────────────────────────── */
  {
    id: "tiktok-day-in-life",
    name: "Day in the Life of [X]",
    platform: "TikTok",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 30,
    hook: "Day in the life of a Tampa junk-removal crew.",
    why: "Documentary format is TikTok-native — algorithm rewards long watch time. Builds parasocial trust.",
    beats: [
      "0–3s: coffee + truck cold open",
      "3–12s: first job montage",
      "12–22s: weird-find moment (comic relief)",
      "22–28s: end-of-day relief",
      "28–30s: subtle CTA in caption",
    ],
    benchmarks: { avgWatchTime: "12–22s", shareRate: "0.6–1.4%", saveRate: "2–4%" },
    goodFor: ["junk", "cleaning", "lawn", "hvac", "plumbing", "moving", "pool", "auto detailing", "pest control"],
    promptBrief: "30-second 'day in the life' TikTok of the Book Junk Away crew. Cold open → 3 jobs montage → funny weird-find moment → end-of-day relief.",
    tone: "chill",
  },
  {
    id: "tiktok-tell-me-you",
    name: '"Tell me you… without telling me"',
    platform: "TikTok",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 15,
    hook: "Tell me you have a Tampa hoarder garage without telling me.",
    why: "High comment + duet rate. Algorithmically rewarded engagement-bait that doesn't violate Meta policy.",
    beats: [
      "0–3s: hook on plain text background",
      "3–12s: checklist of relatable items, one per beat",
      "12–14s: 'we haul it all'",
      "14–15s: caption CTA",
    ],
    benchmarks: { saveRate: "3–7%", shareRate: "1–2.5%", completionRate: "45–60%" },
    goodFor: ["junk", "cleaning", "lawn", "moving", "pool", "salon", "restaurant"],
    promptBrief: "TikTok 'Tell me you have a [niche pain] without telling me' format with a 5-item relatable checklist and a punchline.",
    tone: "funny",
  },
  {
    id: "tiktok-trending-sound",
    name: "Trending-Sound Native Ad",
    platform: "TikTok",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 12,
    hook: "[trending audio cue] when the customer says 'just take it all'",
    why: "Riding a current sound 2-3× the impression cap of generic audio. Operate fast — sounds expire weekly.",
    beats: [
      "0–2s: sound cue + reaction face",
      "2–8s: visual punchline matching the sound's beat drop",
      "8–11s: branded reveal",
      "11–12s: caption CTA",
    ],
    benchmarks: { threeSecViewRate: "40–60%", completionRate: "50–70%" },
    goodFor: ["junk", "cleaning", "lawn", "moving", "salon", "restaurant", "fitness", "med spa"],
    promptBrief: "TikTok 12-second native ad that's built around a trending sound's beat-drop moment, with a punchy customer-said-do-it reveal.",
    tone: "funny",
  },
  {
    id: "tiktok-tutorial-15s",
    name: "15-Second Tutorial",
    platform: "TikTok",
    funnel: "MOFU",
    aspect: "9:16",
    durationSec: 15,
    hook: "How to clear your garage in under 60 minutes (without doing it yourself).",
    why: "Tutorials get saved and re-watched. Saves = algorithmic distribution.",
    beats: [
      "0–3s: outcome promise hook",
      "3–13s: 3 numbered steps with on-screen text",
      "13–15s: 'or have us do it' CTA",
    ],
    benchmarks: { saveRate: "4–8%", avgWatchTime: "10–14s" },
    goodFor: ["junk", "cleaning", "lawn", "moving", "auto detailing", "real estate", "salon", "med spa", "gym"],
    promptBrief: "15-second tutorial TikTok: 'How to clear your garage in under 60 minutes (without doing it yourself)'. 3 steps with the last step being 'book us'.",
    tone: "punchy",
  },

  /* ─────────────────────── YOUTUBE SHORTS ─────────────────────────────── */
  {
    id: "yts-curiosity-gap",
    name: "Curiosity Gap Cold Open",
    platform: "YouTube Shorts",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 22,
    hook: "I knocked on this door and what I saw inside…",
    why: "Open loops drive 60s+ watch time on Shorts. YouTube boosts videos with high retention curves.",
    beats: [
      "0–3s: tension cold open",
      "3–10s: gradual reveal with intercut B-roll",
      "10–18s: payoff + how we solved it",
      "18–22s: subscribe + book CTA",
    ],
    benchmarks: { avgWatchTime: "14–20s", completionRate: "55–72%" },
    goodFor: ["junk", "cleaning", "lawn", "pool", "moving", "hvac", "roofing", "real estate"],
    promptBrief: "YouTube Shorts curiosity-gap ad with a 3-second tension open ('What I saw inside this garage…'), gradual reveal, then the BJA fix.",
    tone: "cinematic",
  },
  {
    id: "yts-one-tip",
    name: "Educational One-Tip",
    platform: "YouTube Shorts",
    funnel: "MOFU",
    aspect: "9:16",
    durationSec: 28,
    hook: "The one thing every Tampa homeowner gets wrong about junk removal.",
    why: "Educational shorts attract subscribers and earn cheap retargeting impressions.",
    beats: [
      "0–4s: bold tip headline",
      "4–18s: explanation with on-screen visuals",
      "18–24s: real customer example",
      "24–28s: 'we do this for you' CTA",
    ],
    benchmarks: { saveRate: "5–10%", avgWatchTime: "18–24s" },
    goodFor: ["junk", "cleaning", "hvac", "plumbing", "roofing", "auto repair", "moving", "real estate", "med spa", "dentist", "salon"],
    promptBrief: "28-second educational YouTube Short: 'The one thing every [audience] gets wrong about [service]'. One tip, then 'or we do it for you'.",
    tone: "chill",
  },

  /* ─────────────────────── YOUTUBE STANDARD ───────────────────────────── */
  {
    id: "yt-watch-before-buy",
    name: '"Watch This Before You Buy"',
    platform: "YouTube Standard",
    funnel: "MOFU",
    aspect: "16:9",
    durationSec: 90,
    hook: "Watch this before you hire any junk-removal company in Tampa.",
    why: "Buyer-intent search format. Captures the high-LTV bottom-of-funnel viewer.",
    beats: [
      "0–6s: stop-and-warn hook",
      "6–25s: 3 things to look for",
      "25–60s: how we score on each",
      "60–80s: side-by-side vs the bad option",
      "80–90s: free quote CTA",
    ],
    benchmarks: { avgWatchTime: "55–75s", ctr: "3–5%" },
    goodFor: ["junk", "cleaning", "hvac", "plumbing", "roofing", "moving", "real estate", "med spa", "dentist", "auto repair"],
    promptBrief: "90-second YouTube TrueView: 'Watch this before you hire any [category] company in Tampa.' Three buyer red flags, then how we score, then free-quote CTA.",
    tone: "cinematic",
  },

  /* ─────────────────────── LINKEDIN ───────────────────────────────────── */
  {
    id: "linkedin-b2b-case-study",
    name: "B2B Case Study",
    platform: "LinkedIn",
    funnel: "MOFU",
    aspect: "1:1",
    durationSec: 45,
    hook: "How a Tampa property manager cleared 40 estate units in one week.",
    why: "LinkedIn rewards specific, professional outcomes. Best B2B referral channel for service businesses.",
    beats: [
      "0–5s: outcome stat headline",
      "5–20s: setup ('the problem')",
      "20–35s: solution + numbers",
      "35–45s: who to call CTA",
    ],
    benchmarks: { ctr: "0.6–1.4%", avgWatchTime: "22–35s" },
    goodFor: ["junk", "cleaning", "lawn", "hvac", "plumbing", "roofing", "moving", "real estate", "pest control"],
    promptBrief: "LinkedIn case-study ad for B2B/realtor audience: 'How a Tampa property manager cleared 40 estate units in one week with Book Junk Away.' Numbers + outcome + CTA.",
    tone: "chill",
  },
  {
    id: "linkedin-founder-pov",
    name: "Founder POV / Thought Leadership",
    platform: "LinkedIn",
    funnel: "TOFU",
    aspect: "1:1",
    durationSec: 60,
    hook: "I started Book Junk Away because every other Tampa hauler was charging by the minute.",
    why: "LinkedIn's algorithm boosts founder-voice content. Builds authority + inbound leads.",
    beats: [
      "0–6s: 'I started [business] because' opener",
      "6–35s: industry insight + your contrarian take",
      "35–55s: customer story proof point",
      "55–60s: subtle 'reach out' CTA",
    ],
    benchmarks: { ctr: "0.5–1.2%", saveRate: "1–2.5%" },
    goodFor: ["junk", "cleaning", "lawn", "hvac", "plumbing", "roofing", "moving", "real estate", "med spa", "dentist", "salon"],
    promptBrief: "LinkedIn founder POV ad: 'I started [business] because [contrarian industry take]'. End with a customer story and a soft CTA.",
    tone: "chill",
  },

  /* ─────────────────────── PINTEREST ──────────────────────────────────── */
  {
    id: "pinterest-before-after-pin",
    name: "Before/After Idea Pin",
    platform: "Pinterest",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 12,
    hook: "From dumpster to driveway in 47 minutes.",
    why: "Home-organization searches are massive on Pinterest. Before/after content gets saved indefinitely.",
    beats: [
      "0–3s: 'before' shot with bold caption",
      "3–9s: transformation sequence",
      "9–12s: 'after' reveal + URL",
    ],
    benchmarks: { saveRate: "8–14%", ctr: "0.8–1.8%" },
    goodFor: ["junk", "cleaning", "lawn", "landscaping", "pressure washing", "pool", "painting", "auto detailing", "moving", "salon"],
    promptBrief: "Pinterest Idea Pin: before/after transformation with a bold 'from X to Y' caption. Designed to be saved and re-watched.",
    tone: "cinematic",
  },
  {
    id: "pinterest-tutorial-pin",
    name: "Step-by-Step Tutorial Pin",
    platform: "Pinterest",
    funnel: "MOFU",
    aspect: "9:16",
    durationSec: 15,
    hook: "5 things to declutter before listing your Tampa home.",
    why: "Tutorial pins have multi-month evergreen lifespan. Best for real-estate-adjacent niches.",
    beats: [
      "0–3s: list headline overlay",
      "3–13s: 5 numbered items with quick visuals",
      "13–15s: 'or we do it' CTA",
    ],
    benchmarks: { saveRate: "10–16%", ctr: "0.9–2%" },
    goodFor: ["junk", "cleaning", "lawn", "moving", "real estate", "salon", "med spa", "gym"],
    promptBrief: "Pinterest tutorial pin: '5 things to declutter before listing your home'. Numbered list, fast visuals, gentle 'or we do it' CTA.",
    tone: "chill",
  },

  /* ─────────────────────── SNAPCHAT ───────────────────────────────────── */
  {
    id: "snapchat-spotlight-quickfire",
    name: "Spotlight Quick-Fire",
    platform: "Snapchat",
    funnel: "TOFU",
    aspect: "9:16",
    durationSec: 10,
    hook: "What we hauled in 24 hours, Tampa edition.",
    why: "Snap Spotlight rewards 5-15s payoff videos. Younger Tampa demo for cleanouts post-move.",
    beats: [
      "0–2s: bold city callout",
      "2–8s: rapid-fire item reveals",
      "8–10s: book CTA + URL",
    ],
    benchmarks: { completionRate: "55–75%" },
    goodFor: ["junk", "cleaning", "moving", "salon", "restaurant", "med spa", "fitness", "auto detailing"],
    promptBrief: "10-second Snapchat Spotlight ad: 'What we hauled in 24 hours, Tampa edition'. Rapid-fire item reveals + URL.",
    tone: "punchy",
  },
];

export function patternsFor(category: string, platform?: Platform): PlaybookPattern[] {
  const cat = category.toLowerCase();
  return PLAYBOOK.filter((p) => {
    if (platform && p.platform !== platform) return false;
    return p.goodFor.some((g) => cat.includes(g) || g.includes(cat));
  });
}

export function platformsInPlaybook(): Platform[] {
  const set = new Set<Platform>();
  for (const p of PLAYBOOK) set.add(p.platform);
  return Array.from(set);
}
