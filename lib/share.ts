"use client";

/* ──────────────────────────────────────────────────────────────────────────
 *  Direct platform share
 *
 *  Uses Web Share API Level 2 (files) to push the rendered MP4 straight
 *  into the iOS / Android share sheet — the user taps the destination app
 *  (Instagram, TikTok, Facebook, YouTube, Snap, etc.) and the file lands
 *  in that app's composer with no manual download / upload.
 *
 *  Falls back to a tap-to-download link on browsers without files share.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ShareOptions {
  blob: Blob;
  filename: string;
  title?: string;
  text?: string;
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("share" in navigator) || !("canShare" in navigator)) return false;
  try {
    const probe = new File([new Blob()], "probe.mp4", { type: "video/mp4" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export async function shareToSheet({ blob, filename, title, text }: ShareOptions): Promise<boolean> {
  if (!canShareFiles()) return false;
  const file = new File([blob], filename, { type: blob.type || "video/mp4" });
  try {
    await navigator.share({ files: [file], title, text });
    return true;
  } catch (e) {
    // User cancelled or share failed — return false so the caller can fall back
    if (e instanceof Error && e.name === "AbortError") return true; // user cancelled, don't fall back
    return false;
  }
}

/** Open a platform's web composer in a new tab as a fallback when direct
 *  share isn't available. The file still has to be uploaded manually but at
 *  least we route the user straight to the upload screen.
 */
export const PLATFORM_UPLOAD_URLS: Record<string, { label: string; url: string }> = {
  "ig-reels": { label: "Instagram Reels", url: "https://www.instagram.com/reels/create/" },
  "fb-reels": { label: "Facebook Reels", url: "https://www.facebook.com/reels/create/" },
  "fb-feed": { label: "Facebook Page", url: "https://www.facebook.com/" },
  "tiktok": { label: "TikTok", url: "https://www.tiktok.com/upload" },
  "yt-shorts": { label: "YouTube Shorts", url: "https://www.youtube.com/upload" },
  "yt-standard": { label: "YouTube", url: "https://studio.youtube.com/" },
  "linkedin": { label: "LinkedIn", url: "https://www.linkedin.com/feed/?shareActive=true" },
  "pinterest": { label: "Pinterest", url: "https://www.pinterest.com/pin-builder/" },
  "snapchat": { label: "Snapchat", url: "https://my.snapchat.com/" },
};
