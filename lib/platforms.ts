import { AspectRatioKey } from "./types";

export interface PlatformSpec {
  id: string;
  name: string;
  platform: "Meta" | "TikTok" | "YouTube" | "LinkedIn" | "Pinterest" | "Snapchat" | "Google";
  aspect: AspectRatioKey;
  width: number;
  height: number;
  maxDurationSec: number;
  bitsPerSecond: number;
  fps: number;
  /** Container preference — we'll fall back to whatever MediaRecorder supports */
  container: "mp4" | "webm";
  notes: string;
}

export const PLATFORMS: PlatformSpec[] = [
  // ─── Meta ────────────────────────────────────────────────────────────
  {
    id: "meta-reels",
    name: "Meta Reels (FB + IG)",
    platform: "Meta",
    aspect: "9:16",
    width: 1080,
    height: 1920,
    maxDurationSec: 90,
    bitsPerSecond: 8_000_000,
    fps: 30,
    container: "mp4",
    notes: "Reels render in feed too. 9:16, max 90s, safe zone keeps copy 14% from top/bottom.",
  },
  {
    id: "meta-stories",
    name: "Meta Stories (FB + IG)",
    platform: "Meta",
    aspect: "9:16",
    width: 1080,
    height: 1920,
    maxDurationSec: 60,
    bitsPerSecond: 8_000_000,
    fps: 30,
    container: "mp4",
    notes: "Stories cap at 60s (sliced into 15s cards if longer). Keep CTA in middle 60%.",
  },
  {
    id: "meta-feed-portrait",
    name: "Meta Feed Portrait",
    platform: "Meta",
    aspect: "4:5",
    width: 1080,
    height: 1350,
    maxDurationSec: 240,
    bitsPerSecond: 8_000_000,
    fps: 30,
    container: "mp4",
    notes: "Highest-converting Feed placement. 4:5 max footprint on mobile.",
  },
  {
    id: "meta-feed-square",
    name: "Meta Feed Square",
    platform: "Meta",
    aspect: "1:1",
    width: 1080,
    height: 1080,
    maxDurationSec: 240,
    bitsPerSecond: 8_000_000,
    fps: 30,
    container: "mp4",
    notes: "Universal Feed format. Great for right-column and desktop too.",
  },
  // ─── TikTok ──────────────────────────────────────────────────────────
  {
    id: "tiktok",
    name: "TikTok In-Feed",
    platform: "TikTok",
    aspect: "9:16",
    width: 1080,
    height: 1920,
    maxDurationSec: 60,
    bitsPerSecond: 6_000_000,
    fps: 30,
    container: "mp4",
    notes: "9:16 only. Hook in first 1s. Native audio strongly preferred.",
  },
  // ─── YouTube ─────────────────────────────────────────────────────────
  {
    id: "yt-shorts",
    name: "YouTube Shorts",
    platform: "YouTube",
    aspect: "9:16",
    width: 1080,
    height: 1920,
    maxDurationSec: 60,
    bitsPerSecond: 8_000_000,
    fps: 30,
    container: "mp4",
    notes: "9:16 vertical, max 60s. Captions strongly recommended.",
  },
  {
    id: "yt-standard",
    name: "YouTube Standard (TrueView)",
    platform: "YouTube",
    aspect: "16:9",
    width: 1920,
    height: 1080,
    maxDurationSec: 600,
    bitsPerSecond: 10_000_000,
    fps: 30,
    container: "mp4",
    notes: "16:9 landscape. Use for skippable in-stream Tampa-targeted ads.",
  },
  // ─── LinkedIn ────────────────────────────────────────────────────────
  {
    id: "linkedin-square",
    name: "LinkedIn Feed Square",
    platform: "LinkedIn",
    aspect: "1:1",
    width: 1080,
    height: 1080,
    maxDurationSec: 600,
    bitsPerSecond: 6_000_000,
    fps: 30,
    container: "mp4",
    notes: "Great for commercial B2B referrals (realtors, property managers).",
  },
  {
    id: "linkedin-landscape",
    name: "LinkedIn Feed Landscape",
    platform: "LinkedIn",
    aspect: "16:9",
    width: 1920,
    height: 1080,
    maxDurationSec: 600,
    bitsPerSecond: 8_000_000,
    fps: 30,
    container: "mp4",
    notes: "Desktop-leaning placement. Pair with B2B partnership pitch.",
  },
  // ─── Pinterest ───────────────────────────────────────────────────────
  {
    id: "pinterest-pin",
    name: "Pinterest Idea Pin",
    platform: "Pinterest",
    aspect: "9:16",
    width: 1080,
    height: 1920,
    maxDurationSec: 60,
    bitsPerSecond: 6_000_000,
    fps: 30,
    container: "mp4",
    notes: "Big in home-organization searches — perfect for before/after Tampa cleanouts.",
  },
  {
    id: "pinterest-square",
    name: "Pinterest Standard",
    platform: "Pinterest",
    aspect: "1:1",
    width: 1080,
    height: 1080,
    maxDurationSec: 60,
    bitsPerSecond: 6_000_000,
    fps: 30,
    container: "mp4",
    notes: "Use for evergreen Tampa cleanout creative.",
  },
  // ─── Snapchat ────────────────────────────────────────────────────────
  {
    id: "snapchat",
    name: "Snapchat Spotlight",
    platform: "Snapchat",
    aspect: "9:16",
    width: 1080,
    height: 1920,
    maxDurationSec: 60,
    bitsPerSecond: 6_000_000,
    fps: 30,
    container: "mp4",
    notes: "Younger Tampa demo. Snappy, native-feel works best.",
  },
  // ─── Google Display ──────────────────────────────────────────────────
  {
    id: "google-display",
    name: "Google Display 16:9",
    platform: "Google",
    aspect: "16:9",
    width: 1920,
    height: 1080,
    maxDurationSec: 30,
    bitsPerSecond: 8_000_000,
    fps: 30,
    container: "mp4",
    notes: "Use for retargeting via Google Ads display network.",
  },
];

export function getPlatform(id: string): PlatformSpec | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

export const DEFAULT_PLATFORM_BUNDLE = [
  "meta-reels",
  "meta-feed-portrait",
  "meta-feed-square",
  "tiktok",
  "yt-shorts",
];
