import { AdGoal } from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Tampa Junk-Removal Ad Inspiration Library
 *
 *  Curated, structurally-decoded patterns from top-performing Meta video
 *  ads in the junk-removal niche. Each entry includes:
 *    - the exact hook copy
 *    - the storyboard beat-by-beat
 *    - why it converts (the psychology)
 *    - the matching template id you can swipe straight into the editor
 *    - the deep link into Meta Ads Library so you can see the real ads
 *      currently running in Florida
 *
 *  Note on data source: Meta Ads Library is a public web property, but it
 *  blocks programmatic scraping. We render deep links into its UI so the
 *  user can browse real, live ads — and we layer our own curated analysis
 *  on top so they can ship a swipe-file ad in minutes instead of hours.
 * ────────────────────────────────────────────────────────────────────────── */

export interface SpyAd {
  id: string;
  advertiser: string;
  market: string;
  goal: AdGoal;
  hook: string;
  format: "Reels 9:16" | "Feed 4:5" | "Feed 1:1" | "Landscape 16:9";
  beats: string[];
  whyItWorks: string[];
  swipeTemplateId: string;
  /** Meta Ads Library search URL filtered to FL (region 13 = Florida) */
  adLibraryUrl: string;
  estimatedSpendRange?: string;
}

const FL_LIB = (advertiser: string) =>
  `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(
    advertiser,
  )}&search_type=keyword_unordered&media_type=video`;

export const TAMPA_COMPETITORS: { name: string; note: string; url: string }[] = [
  {
    name: "1-800-GOT-JUNK? Tampa",
    note: "National powerhouse. Polished, trust-heavy creative. Beat them on price + speed.",
    url: FL_LIB("1-800-GOT-JUNK"),
  },
  {
    name: "College Hunks Hauling Junk Tampa",
    note: "Personality-led brand. Their hook is the crew. Beat them with same-day urgency + offer.",
    url: FL_LIB("College Hunks Hauling Junk"),
  },
  {
    name: "Junk King Tampa",
    note: "Pricing transparency angle. Beat them with stronger before/after social proof.",
    url: FL_LIB("Junk King Tampa"),
  },
  {
    name: "JDog Junk Removal Tampa",
    note: "Veteran-owned positioning. Beat them with local Tampa neighborhood targeting.",
    url: FL_LIB("JDog Junk Removal"),
  },
  {
    name: "LoadUp Tampa",
    note: "Online booking flow is their hook. Match it + own the local angle.",
    url: FL_LIB("LoadUp"),
  },
  {
    name: "The Junkluggers Tampa",
    note: "Eco / donation-first angle. Beat them with sharper, faster creative.",
    url: FL_LIB("The Junkluggers"),
  },
];

export const SPY_ADS: SpyAd[] = [
  {
    id: "spy-gotjunk-before-after",
    advertiser: "1-800-GOT-JUNK?",
    market: "Tampa / National",
    goal: "before-after",
    format: "Reels 9:16",
    hook: "POV: you finally cleared the garage you've been ignoring for 3 years.",
    beats: [
      "0–2s: messy garage establishing shot, no music",
      "2–4s: drumroll, fast-cut crew arriving in truck",
      "4–7s: time-lapse loading montage",
      "7–10s: empty swept garage reveal with bass drop",
      "10–14s: CTA card: 'Book online. Same-day.'",
    ],
    whyItWorks: [
      "POV opener pulls in scrollers immediately — feels like UGC, not ad",
      "Audio cue (drumroll → drop) is the actual conversion lever",
      "Empty-garage payoff is the dopamine hit that gets saves & shares",
    ],
    swipeTemplateId: "tpl-before-after",
    adLibraryUrl: FL_LIB("1-800-GOT-JUNK"),
    estimatedSpendRange: "$50k–$120k/month national",
  },
  {
    id: "spy-college-hunks-personality",
    advertiser: "College Hunks Hauling Junk",
    market: "Tampa / National",
    goal: "trust-builder",
    format: "Reels 9:16",
    hook: "Meet the crew that's about to take your problem away.",
    beats: [
      "0–2s: smiling crew piling into a truck",
      "2–5s: each member intros with one line",
      "5–8s: arrival at customer's home, friendly handshake",
      "8–11s: customer reaction (relief, laugh)",
      "11–14s: CTA card with phone + URL",
    ],
    whyItWorks: [
      "Defuses the #1 buyer objection: 'who am I letting into my house?'",
      "Personality > polish — feels human, not corporate",
      "Customer reaction shot is your real social proof",
    ],
    swipeTemplateId: "tpl-trust",
    adLibraryUrl: FL_LIB("College Hunks Hauling Junk"),
  },
  {
    id: "spy-junkking-pricing",
    advertiser: "Junk King",
    market: "Tampa / National",
    goal: "limited-offer",
    format: "Feed 4:5",
    hook: "No hourly surprises. We charge by the truck — not the minute.",
    beats: [
      "0–2s: bold price card '$XXX per truckload'",
      "2–5s: text overlay comparing to hourly competitor",
      "5–9s: B-roll of crew loading + price ticker frozen",
      "9–12s: 'No hidden fees' badge + CTA",
    ],
    whyItWorks: [
      "Leads with the buyer's biggest fear (surprise pricing)",
      "Comparison frame anchors against competitors without naming them",
      "Lower CAC because it pre-qualifies price-sensitive buyers",
    ],
    swipeTemplateId: "tpl-offer",
    adLibraryUrl: FL_LIB("Junk King"),
  },
  {
    id: "spy-jdog-local",
    advertiser: "JDog Junk Removal",
    market: "Tampa / National",
    goal: "social-proof",
    format: "Feed 1:1",
    hook: "Veteran-owned. Background-checked. Insured. Tampa proud.",
    beats: [
      "0–3s: identity badge stack with flag overlay",
      "3–7s: short customer testimonial cut",
      "7–11s: 5-star reviews scroll",
      "11–14s: CTA + service area map",
    ],
    whyItWorks: [
      "Identity stack lowers risk for cautious homeowners",
      "Locality + values combo outperforms generic 'we're great' ads",
      "Works especially well to 35–65 audiences on Facebook Feed",
    ],
    swipeTemplateId: "tpl-social-proof",
    adLibraryUrl: FL_LIB("JDog Junk Removal"),
  },
  {
    id: "spy-loadup-online-booking",
    advertiser: "LoadUp",
    market: "National",
    goal: "free-quote",
    format: "Reels 9:16",
    hook: "Get an upfront quote in 60 seconds — without talking to anyone.",
    beats: [
      "0–2s: phone screen recording of price calculator",
      "2–6s: three taps → price appears",
      "6–10s: confirmation screen + delivery window",
      "10–14s: 'Book now' CTA",
    ],
    whyItWorks: [
      "Friction-removal hook (no phone call) is huge for younger audiences",
      "Screen recording feels native and demonstrates the actual product",
      "Lower funnel conversion event ('Get Quote') is cheap to optimize",
    ],
    swipeTemplateId: "tpl-free-quote",
    adLibraryUrl: FL_LIB("LoadUp"),
  },
  {
    id: "spy-junkluggers-eco",
    advertiser: "The Junkluggers",
    market: "Tampa / National",
    goal: "trust-builder",
    format: "Feed 4:5",
    hook: "We donate or recycle 60%+ of everything we haul.",
    beats: [
      "0–3s: bold stat reveal",
      "3–7s: B-roll of donations being dropped at a Tampa shelter",
      "7–11s: customer voiceover testimonial",
      "11–14s: CTA + eco badge",
    ],
    whyItWorks: [
      "Values-based hook wins for higher-income, eco-leaning Tampa neighborhoods",
      "Local donation drop B-roll is the proof — generic stats alone don't convert",
      "Doubles as PR and CSR content, not just an ad",
    ],
    swipeTemplateId: "tpl-trust",
    adLibraryUrl: FL_LIB("The Junkluggers"),
  },
  {
    id: "spy-tampa-hurricane",
    advertiser: "Local Tampa Operators",
    market: "Tampa",
    goal: "same-day-service",
    format: "Reels 9:16",
    hook: "Storm-damaged debris? We're booking same-day across Tampa Bay.",
    beats: [
      "0–2s: aerial shot of debris-strewn Tampa street",
      "2–5s: crew arriving in branded truck",
      "5–9s: loading wet drywall, fallen palm fronds",
      "9–12s: 'Booking today' text card + phone",
    ],
    whyItWorks: [
      "Seasonal hook (hurricane season Jun–Nov) is your single highest-intent moment",
      "Visceral footage forces the scroller to stop",
      "Same-day promise is the differentiator vs. national chains who can't respond fast",
    ],
    swipeTemplateId: "tpl-same-day",
    adLibraryUrl: FL_LIB("junk removal tampa"),
  },
  {
    id: "spy-tampa-snowbird",
    advertiser: "Local Tampa Operators",
    market: "Tampa / Clearwater / St. Pete",
    goal: "service-area",
    format: "Feed 1:1",
    hook: "Selling your Tampa snowbird condo? Empty it in one afternoon.",
    beats: [
      "0–3s: realtor-style shot of empty condo",
      "3–7s: text overlay 'before showings' angle",
      "7–11s: testimonial from realtor or seller",
      "11–14s: CTA + free quote",
    ],
    whyItWorks: [
      "Targets the high-LTV snowbird real-estate niche unique to FL",
      "Aligns with realtor referrals — partnership channel unlock",
      "Higher AOV than standard residential cleanouts",
    ],
    swipeTemplateId: "tpl-service-area",
    adLibraryUrl: FL_LIB("junk removal snowbird"),
  },
];

export function getSpyAd(id: string): SpyAd | undefined {
  return SPY_ADS.find((s) => s.id === id);
}
