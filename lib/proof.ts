"use client";

import { Project } from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Shareable proof links
 *
 *  Encodes the project as a URL-safe base64 string and embeds it in
 *  /proof/[id]?p=... — recipients see a clean preview page that plays the
 *  ad live in their browser. No server storage required, no auth, just a
 *  link you can paste into an email or text.
 * ────────────────────────────────────────────────────────────────────────── */

function b64UrlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64UrlDecode(str: string): Uint8Array {
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  const s = (str + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeProjectToUrl(project: Project): string {
  // Strip transient/audio if it's a giant data URL — keep URL short
  const slim: Project = {
    ...project,
    audio: project.audio?.src?.startsWith("data:") ? undefined : project.audio,
  };
  const json = JSON.stringify(slim);
  const bytes = new TextEncoder().encode(json);
  return b64UrlEncode(bytes);
}

export function decodeProjectFromUrl(encoded: string): Project | null {
  try {
    const bytes = b64UrlDecode(encoded);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Project;
  } catch {
    return null;
  }
}

export function proofUrl(project: Project, clientId?: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://www.bookjunkaway.com");
  const id = clientId ?? project.id;
  return `${base}/proof/${id}?p=${encodeProjectToUrl(project)}`;
}
