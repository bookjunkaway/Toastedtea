import { Project } from "./types";
import { renderScene, preloadScenes } from "./renderer";
import { sceneAtTime, totalDuration } from "./store";
import { ASPECT_RATIOS } from "./types";
import { PlatformSpec } from "./platforms";

export interface ExportOptions {
  fps?: number;
  bitsPerSecond?: number;
  /** Optional progress callback 0..1 */
  onProgress?: (p: number) => void;
  /** Render scale 0.5..2 (relative to native aspect ratio dimensions) */
  scale?: number;
}

export interface ExportResult {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  width: number;
  height: number;
}

function pickMimeType(): string {
  const candidates = [
    // iOS Safari produces MP4 natively — try plain mp4 first
    "video/mp4",
    "video/mp4;codecs=h264",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1.4D0028",
    // Other browsers fall through to WebM
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

export function isMp4(mime: string): boolean {
  return mime.startsWith("video/mp4");
}

/** Attach project audio to the capture stream — resilient and non-blocking.
 *  iOS keeps an AudioContext suspended until a user gesture; if it can't be
 *  resumed (or decode is slow / fails), we skip audio rather than let the
 *  MediaRecorder hang waiting for samples that never arrive. */
async function attachAudio(
  stream: MediaStream,
  project: Project,
): Promise<() => void> {
  if (!project.audio?.src) return () => {};
  let audioCtx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  try {
    audioCtx = new AudioContext();
    // Try to resume; if it stays suspended we bail (no hang)
    if (audioCtx.state === "suspended") {
      await Promise.race([
        audioCtx.resume(),
        new Promise((r) => setTimeout(r, 600)),
      ]);
    }
    const decoded = await Promise.race([
      (async () => {
        const resp = await fetch(project.audio!.src);
        const buf = await resp.arrayBuffer();
        return audioCtx!.decodeAudioData(buf);
      })(),
      new Promise<null>((r) => setTimeout(() => r(null), 3000)),
    ]);
    if (!decoded) {
      await audioCtx.close().catch(() => {});
      return () => {};
    }
    const dest = audioCtx.createMediaStreamDestination();
    const gain = audioCtx.createGain();
    gain.gain.value = project.audio.volume ?? 0.7;
    source = audioCtx.createBufferSource();
    source.buffer = decoded;
    source.loop = true;
    source.connect(gain).connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    source.start();
    return () => {
      try {
        source?.stop();
      } catch {}
      audioCtx?.close().catch(() => {});
    };
  } catch {
    try {
      audioCtx?.close().catch(() => {});
    } catch {}
    return () => {};
  }
}

/** Drive the canvas render for `duration` seconds with a hard watchdog so it
 *  always resolves even if requestAnimationFrame is throttled (backgrounded
 *  tab, iOS share sheet, etc.). */
async function driveRender(
  duration: number,
  onFrame: (t: number) => void,
): Promise<void> {
  await new Promise<void>((resolve) => {
    const startedAt = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    // Hard watchdog: never run longer than duration + 3s of wall clock
    const watchdog = setTimeout(finish, (duration + 3) * 1000);
    // Backup interval in case rAF is paused
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      onFrame(Math.min(elapsed, duration));
      if (elapsed >= duration) {
        clearInterval(interval);
        clearTimeout(watchdog);
        finish();
      }
    }, 1000 / 30);
    function frame() {
      if (done) return;
      const elapsed = (performance.now() - startedAt) / 1000;
      onFrame(Math.min(elapsed, duration));
      if (elapsed >= duration) {
        clearInterval(interval);
        clearTimeout(watchdog);
        finish();
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

/** Stop the recorder and wait for the final dataavailable/stop, with a
 *  timeout so a stalled recorder can never hang the export forever. */
async function stopRecorder(recorder: MediaRecorder): Promise<void> {
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  try {
    recorder.requestData?.();
  } catch {}
  try {
    recorder.stop();
  } catch {}
  await Promise.race([stopped, new Promise((r) => setTimeout(r, 2500))]);
}

export function canPlayInline(mime: string): boolean {
  // iOS Safari can't play WebM. Detect Apple browsers via UA.
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent;
  const isAppleMobile = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  if ((isAppleMobile || isSafari) && !isMp4(mime)) return false;
  return true;
}

export async function exportProjectVideo(
  project: Project,
  opts: ExportOptions = {},
): Promise<ExportResult> {
  const fps = opts.fps ?? 30;
  const scale = opts.scale ?? 1;
  const ar = ASPECT_RATIOS[project.aspectRatio];
  const W = Math.round(ar.width * scale);
  const H = Math.round(ar.height * scale);

  // Offscreen canvas drives the encoder
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("2D context unavailable");

  await preloadScenes(project.scenes);

  const stream = canvas.captureStream(fps);

  const duration = totalDuration(project);
  if (duration <= 0) throw new Error("Project has no scenes to export");

  // Resilient audio — never hangs the render
  const detachAudio = await attachAudio(stream, project);

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: opts.bitsPerSecond ?? 6_000_000,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(200);

  await driveRender(duration, (t) => {
    const slot = sceneAtTime(project, t);
    if (slot && ctx) renderScene(ctx, slot.scene, slot.localTime, W, H);
    opts.onProgress?.(Math.min(1, t / duration));
  });

  await stopRecorder(recorder);
  detachAudio();
  stream.getTracks().forEach((t) => t.stop());

  const blob = new Blob(chunks, { type: mimeType });
  return { blob, mimeType, durationSeconds: duration, width: W, height: H };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function extensionFor(mime: string): string {
  if (mime.startsWith("video/mp4")) return "mp4";
  if (mime.startsWith("video/webm")) return "webm";
  return "mp4";
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Multi-platform export
 *
 *  Renders the project into a *target* canvas sized to the platform's
 *  spec. The project's native scenes are first rendered into an offscreen
 *  canvas at the project's authoring aspect, then drawn into the target
 *  with `contain` letterboxing so composition is preserved across every
 *  spec — no cropping, no copy clipped out.
 * ────────────────────────────────────────────────────────────────────────── */

export interface PlatformExportResult extends ExportResult {
  platform: PlatformSpec;
  trimmed: boolean;
}

export async function exportProjectForPlatform(
  project: Project,
  platform: PlatformSpec,
  opts: { onProgress?: (p: number) => void } = {},
): Promise<PlatformExportResult> {
  const native = ASPECT_RATIOS[project.aspectRatio];
  const target = { width: platform.width, height: platform.height };

  // Authoring canvas at the project's native ratio
  const author = document.createElement("canvas");
  author.width = native.width;
  author.height = native.height;
  const aCtx = author.getContext("2d", { alpha: false });
  if (!aCtx) throw new Error("2D context unavailable");

  // Target canvas at the platform's spec
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Target 2D context unavailable");

  await preloadScenes(project.scenes);

  const total = totalDuration(project);
  const duration = Math.min(total, platform.maxDurationSec);
  const trimmed = total > platform.maxDurationSec;
  if (duration <= 0) throw new Error("Project has no scenes to export");

  const stream = canvas.captureStream(platform.fps);

  // Resilient audio — never hangs the render
  const detachAudio = await attachAudio(stream, project);

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: platform.bitsPerSecond,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(200);

  // Pre-compute contain placement so we don't recompute every frame
  const scale = Math.min(target.width / native.width, target.height / native.height);
  const drawW = native.width * scale;
  const drawH = native.height * scale;
  const drawX = (target.width - drawW) / 2;
  const drawY = (target.height - drawH) / 2;

  await driveRender(duration, (t) => {
    const slot = sceneAtTime(project, t);
    if (slot) {
      renderScene(aCtx!, slot.scene, slot.localTime, native.width, native.height);
      const fill =
        slot.scene.background.kind === "solid"
          ? slot.scene.background.color
          : slot.scene.background.kind === "gradient"
          ? slot.scene.background.from
          : "#0a0a0a";
      ctx!.fillStyle = fill;
      ctx!.fillRect(0, 0, target.width, target.height);
      ctx!.drawImage(author, drawX, drawY, drawW, drawH);
    }
    opts.onProgress?.(Math.min(1, t / duration));
  });

  await stopRecorder(recorder);
  detachAudio();
  stream.getTracks().forEach((t) => t.stop());

  const blob = new Blob(chunks, { type: mimeType });
  return {
    blob,
    mimeType,
    durationSeconds: duration,
    width: target.width,
    height: target.height,
    platform,
    trimmed,
  };
}

export interface BulkExportProgress {
  platformId: string;
  status: "pending" | "exporting" | "done" | "error";
  progress: number;
  error?: string;
}

export async function exportProjectForPlatforms(
  project: Project,
  platforms: PlatformSpec[],
  onProgress?: (state: BulkExportProgress[]) => void,
): Promise<PlatformExportResult[]> {
  const state: BulkExportProgress[] = platforms.map((p) => ({
    platformId: p.id,
    status: "pending",
    progress: 0,
  }));
  const results: PlatformExportResult[] = [];

  for (let i = 0; i < platforms.length; i++) {
    state[i].status = "exporting";
    onProgress?.([...state]);
    try {
      const out = await exportProjectForPlatform(project, platforms[i], {
        onProgress: (p) => {
          state[i].progress = p;
          onProgress?.([...state]);
        },
      });
      results.push(out);
      state[i].status = "done";
      state[i].progress = 1;
    } catch (e) {
      state[i].status = "error";
      state[i].error = e instanceof Error ? e.message : String(e);
    }
    onProgress?.([...state]);
  }
  return results;
}
