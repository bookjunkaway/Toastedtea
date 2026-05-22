"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./id";
import { BrandInputs, DEFAULT_BRAND, DEFAULT_PALETTE, Project } from "./types";

export interface ClientRecord {
  id: string;
  brand: BrandInputs;
  palette: Project["palette"];
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  /** Sales pipeline */
  stage: "lead" | "pitched" | "proof-sent" | "won" | "lost";
  proposedPrice: number;
  createdAt: number;
  updatedAt: number;
}

interface ClientStore {
  clients: ClientRecord[];
  activeClientId: string | null;
  upsertClient: (patch: Partial<ClientRecord> & { id?: string }) => ClientRecord;
  deleteClient: (id: string) => void;
  setActive: (id: string | null) => void;
  pipelineCount: (stage: ClientRecord["stage"]) => number;
}

export function newClient(partial: Partial<ClientRecord> = {}): ClientRecord {
  const now = Date.now();
  return {
    id: uid("c"),
    brand: { ...DEFAULT_BRAND, companyName: "New Client", website: "www.example.com", phone: "(813) 000-0000" },
    palette: DEFAULT_PALETTE,
    industry: "Junk Removal",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
    stage: "lead",
    proposedPrice: 297,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export const useClients = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      activeClientId: null,
      upsertClient: (patch) => {
        const now = Date.now();
        let result: ClientRecord;
        if (patch.id && get().clients.some((c) => c.id === patch.id)) {
          result = { ...get().clients.find((c) => c.id === patch.id)!, ...patch, updatedAt: now } as ClientRecord;
          set((s) => ({
            clients: s.clients.map((c) => (c.id === result.id ? result : c)),
          }));
        } else {
          result = newClient({ ...patch, id: patch.id ?? undefined });
          set((s) => ({ clients: [result, ...s.clients] }));
        }
        return result;
      },
      deleteClient: (id) =>
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          activeClientId: s.activeClientId === id ? null : s.activeClientId,
        })),
      setActive: (id) => set({ activeClientId: id }),
      pipelineCount: (stage) => get().clients.filter((c) => c.stage === stage).length,
    }),
    { name: "bja-studio-clients", version: 1 },
  ),
);

/* ──────────────────────────────────────────────────────────────────────────
 *  Pitch templates — auto-fill from a client + the ad
 *
 *  Keeps tone friendly, concrete, value-leading. Designed so the operator
 *  can copy → paste into Gmail, iMessage, or LinkedIn DMs.
 * ────────────────────────────────────────────────────────────────────────── */

export interface PitchBundle {
  subject: string;
  email: string;
  sms: string;
  linkedin: string;
}

export function buildPitch(
  client: ClientRecord,
  project: Project,
  proofUrl: string,
  yourName: string = "Charles",
  yourPhone: string = "(727) 288-4847",
): PitchBundle {
  const co = client.brand.companyName;
  const aspect = project.aspectRatio;
  const sceneCount = project.scenes.length;
  const totalSec = project.scenes.reduce((a, b) => a + b.duration, 0).toFixed(0);

  const subject = `${totalSec}-second Meta ad I built for ${co}`;
  const email = `Hi ${client.contactName || "there"} —

I built a custom ${totalSec}s Meta video ad for ${co} — ${sceneCount} scenes, ${aspect} for Reels/Feed, ready to drop into Ads Manager today.

Preview it here (no sign-in, plays in your browser):
${proofUrl}

If it lands, the price is $${client.proposedPrice} and you get:
  • The MP4 in every platform spec (Meta Reels, Feed, Stories, TikTok, YouTube Shorts)
  • Two free revisions in the first week
  • A Meta-policy-safe pass so it won't get blocked in review

Reply YES and I'll send the files + invoice within the hour.

— ${yourName}
${yourPhone}`;

  const sms = `Hey ${client.contactName || ""}, I built ${co} a ${totalSec}s Meta ad — preview here: ${proofUrl}. $${client.proposedPrice} flat, all platform sizes. Want it? — ${yourName}`;

  const linkedin = `Hi ${client.contactName || co} — I made you a sample Meta video ad for ${co}: ${proofUrl}

Same-day junk removal niches are running a ton of weak creative right now. This one's built to convert. Happy to license it for $${client.proposedPrice} and ship all platform sizes (Reels, Feed, TikTok, YT Shorts).

Worth a 5-min look?`;

  return { subject, email, sms, linkedin };
}
