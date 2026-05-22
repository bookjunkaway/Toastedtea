"use client";

import { AspectRatioKey } from "./types";

export interface BananaPreset {
  id: string;
  label: string;
  hint: string;
  prompt: string;
  bestFor: "background" | "before" | "after" | "hero";
}

export const BANANA_PRESETS: BananaPreset[] = [
  {
    id: "before-garage",
    label: "Before — Cluttered Garage",
    hint: "Cluttered Tampa garage with old furniture, boxes, dusty light",
    bestFor: "before",
    prompt:
      "Tampa suburban garage stuffed with old furniture, broken appliances, cardboard boxes and yard tools. Mid-afternoon Florida sunlight, slightly dusty, photorealistic, wide angle.",
  },
  {
    id: "after-garage",
    label: "After — Spotless Garage",
    hint: "Empty clean garage, swept floor, bright daylight",
    bestFor: "after",
    prompt:
      "Same Tampa suburban garage now completely empty, freshly swept concrete floor, single ladder hung neatly on the wall, golden hour light spilling in, photorealistic.",
  },
  {
    id: "crew-loading",
    label: "Crew Loading Truck",
    hint: "Friendly uniformed crew loading junk into a yellow truck",
    bestFor: "hero",
    prompt:
      "Two uniformed junk-removal workers smiling as they load a battered couch into the back of a bright yellow dump truck on a Tampa driveway, palm trees, sunny, photorealistic.",
  },
  {
    id: "happy-customer",
    label: "Happy Customer Handshake",
    hint: "Smiling Tampa homeowner shaking hands with crew",
    bestFor: "hero",
    prompt:
      "A smiling Tampa homeowner in casual clothes shaking hands with a friendly junk-removal worker in front of a freshly cleared garage, palm trees, golden hour, photorealistic.",
  },
  {
    id: "estate-cleanout",
    label: "Estate / Hoarder Cleanout",
    hint: "Large-volume cleanout, crew carrying boxes",
    bestFor: "before",
    prompt:
      "A Tampa Florida single-family home overflowing with belongings from an estate cleanout. Crew in matching uniforms carrying out boxes and old electronics to a dump truck on the driveway, photorealistic.",
  },
  {
    id: "hot-tub-pickup",
    label: "Hot Tub / Heavy Item Haul",
    hint: "Crew lifting an old hot tub onto a truck",
    bestFor: "hero",
    prompt:
      "Three uniformed junk-removal workers using straps to lift an old beat-up hot tub onto a bright yellow flatbed dump truck on a Tampa pool deck, photorealistic.",
  },
  {
    id: "tampa-skyline-truck",
    label: "Tampa Skyline + Branded Truck",
    hint: "Yellow dump truck with Tampa skyline backdrop",
    bestFor: "background",
    prompt:
      "Bright yellow dump truck parked in foreground with the Tampa Florida downtown skyline blurred in the background, golden hour, cinematic depth of field, photorealistic.",
  },
  {
    id: "before-yard",
    label: "Before — Overgrown Yard",
    hint: "Yard piled with debris and old patio furniture",
    bestFor: "before",
    prompt:
      "Tampa backyard with broken patio furniture, fallen palm fronds, and stacked yard debris under bright Florida sun, photorealistic.",
  },
  {
    id: "after-yard",
    label: "After — Pristine Yard",
    hint: "Clean, debris-free Tampa backyard",
    bestFor: "after",
    prompt:
      "Same Tampa backyard now completely cleared, freshly raked, palm trees swaying, blue sky, photorealistic.",
  },
];

export interface BananaResult {
  dataUrl: string;
}

export async function generateBananaImage(
  prompt: string,
  aspectRatio: AspectRatioKey,
): Promise<BananaResult> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Generation failed" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as BananaResult;
}
