"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./id";
import { Project } from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Lead form system
 *
 *  Every generated ad gets a shareable /lead/[id] landing page with a
 *  capture form. The form payload is stored in localStorage and (if
 *  configured) POSTed to NEXT_PUBLIC_LEAD_WEBHOOK so the operator can
 *  pipe leads into their CRM, Google Sheet, or SMS notifier.
 *
 *  The studio also keeps a local CRM-lite view at /leads listing every
 *  submission with timestamp, source ad, and contact info.
 * ────────────────────────────────────────────────────────────────────────── */

export interface LeadSubmission {
  id: string;
  formId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  jobType: string;
  urgency: "asap" | "this-week" | "this-month" | "browsing";
  notes: string;
  submittedAt: number;
  /** Snapshot of the ad's brand at submission time */
  source: {
    companyName: string;
    category: string;
    offer: string;
  };
}

export interface LeadFormSpec {
  id: string;
  /** Snapshot of the ad's brand */
  brand: {
    companyName: string;
    category: string;
    serviceArea: string;
    phone: string;
    website: string;
    offer: string;
    cta: string;
    heroImage?: string;
  };
  palette: Project["palette"];
  createdAt: number;
  /** Email address to forward submissions to. Embedded in the URL so the
   *  lead form works on the customer's device without any account. */
  notifyEmail?: string;
}

interface LeadStore {
  forms: LeadFormSpec[];
  submissions: LeadSubmission[];
  /** Operator's destination email — applied to every generated form */
  notifyEmail: string;
  setNotifyEmail: (email: string) => void;
  createFormFromProject: (p: Project) => LeadFormSpec;
  recordSubmission: (sub: Omit<LeadSubmission, "id" | "submittedAt">) => LeadSubmission;
  deleteSubmission: (id: string) => void;
  markCalled: (id: string) => void;
}

export const useLeads = create<LeadStore>()(
  persist(
    (set, get) => ({
      forms: [],
      submissions: [],
      notifyEmail: "",
      setNotifyEmail: (email) => set({ notifyEmail: email.trim() }),
      createFormFromProject: (p) => {
        // Never embed data-URL images in the form spec — they'd be encoded
        // into the lead-form URL and blow past URL length limits, breaking
        // the page. Only keep small http(s)/relative references (e.g. /logo.svg).
        const safeHero =
          p.brand.heroImage && !p.brand.heroImage.startsWith("data:")
            ? p.brand.heroImage
            : "/logo.svg";
        const f: LeadFormSpec = {
          id: uid("lf"),
          brand: {
            companyName: p.brand.companyName,
            category: p.brand.category,
            serviceArea: p.brand.serviceArea,
            phone: p.brand.phone,
            website: p.brand.website,
            offer: p.brand.offer,
            cta: p.brand.cta,
            heroImage: safeHero,
          },
          palette: p.palette,
          createdAt: Date.now(),
          notifyEmail: get().notifyEmail || undefined,
        };
        set((s) => ({ forms: [f, ...s.forms].slice(0, 40) }));
        return f;
      },
      recordSubmission: (sub) => {
        const full: LeadSubmission = { ...sub, id: uid("ls"), submittedAt: Date.now() };
        set((s) => ({ submissions: [full, ...s.submissions] }));
        return full;
      },
      deleteSubmission: (id) => set((s) => ({ submissions: s.submissions.filter((x) => x.id !== id) })),
      markCalled: (id) =>
        set((s) => ({
          submissions: s.submissions.map((x) =>
            x.id === id ? { ...x, notes: (x.notes ? x.notes + " · " : "") + "CALLED" } : x,
          ),
        })),
    }),
    { name: "bja-leads", version: 1 },
  ),
);

/** Encode the lead form spec into the URL so any device can load the page. */
export function leadFormUrl(spec: LeadFormSpec, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "https://www.bookjunkaway.com");
  const json = JSON.stringify(spec);
  const enc =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
      : Buffer.from(json, "utf8").toString("base64url");
  return `${base}/lead/${spec.id}?f=${enc}`;
}

export function decodeLeadForm(encoded: string): LeadFormSpec | null {
  try {
    const pad = encoded.length % 4 ? 4 - (encoded.length % 4) : 0;
    const s = (encoded + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
    const bin = typeof window !== "undefined" ? atob(s) : Buffer.from(s, "base64").toString("binary");
    const json = decodeURIComponent(escape(bin));
    return JSON.parse(json) as LeadFormSpec;
  } catch {
    return null;
  }
}
