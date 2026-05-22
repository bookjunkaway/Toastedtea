import {
  BackgroundFill,
  ImageLayer,
  Layer,
  Scene,
  ShapeLayer,
  StickerLayer,
  TextLayer,
} from "./types";

/* ──────────────────────────────────────────────────────────────────────────
 *  Canvas renderer
 *
 *  - Pure 2D Canvas API (works in browser + offscreen for export)
 *  - All layer positions are normalized 0..1 against canvas dimensions
 *  - Scene-local time `t` drives per-layer entrance animations
 *  - Transition-in driven by `sceneProgress` 0..1 (1 = fully entered)
 * ────────────────────────────────────────────────────────────────────────── */

const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/** Pre-warm image cache so the first paint isn't a flicker. */
export async function preloadScenes(scenes: Scene[]): Promise<void> {
  const srcs = new Set<string>();
  for (const sc of scenes) {
    if (sc.background.kind === "image") srcs.add(sc.background.src);
    for (const l of sc.layers) {
      if (l.type === "image") srcs.add(l.src);
    }
  }
  await Promise.allSettled([...srcs].map(loadImage));
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function applyTransitionIn(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  progress: number,
  W: number,
  H: number,
): void {
  if (scene.transitionIn === "none" || progress >= 1) return;
  const p = easeOut(progress);
  ctx.globalAlpha *= scene.transitionIn === "fade" ? p : 1;
  if (scene.transitionIn === "slideLeft") {
    ctx.translate((1 - p) * W, 0);
  } else if (scene.transitionIn === "slideUp") {
    ctx.translate(0, (1 - p) * H);
  } else if (scene.transitionIn === "zoom") {
    const s = 0.85 + 0.15 * p;
    ctx.translate(W / 2, H / 2);
    ctx.scale(s, s);
    ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha *= p;
  }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: BackgroundFill,
  W: number,
  H: number,
  sceneTime: number,
): void {
  if (bg.kind === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  if (bg.kind === "gradient") {
    const rad = ((bg.angle ?? 180) * Math.PI) / 180;
    const x0 = W / 2 - (Math.cos(rad) * W) / 2;
    const y0 = H / 2 - (Math.sin(rad) * H) / 2;
    const x1 = W / 2 + (Math.cos(rad) * W) / 2;
    const y1 = H / 2 + (Math.sin(rad) * H) / 2;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, bg.from);
    g.addColorStop(1, bg.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  if (bg.kind === "image") {
    const img = imageCache.get(bg.src);
    if (img && img.complete && img.naturalWidth > 0) {
      // Subtle Ken Burns on image backgrounds for life
      const zoom = 1.05 + Math.min(0.05, sceneTime * 0.01);
      const tw = W * zoom;
      const th = H * zoom;
      const offX = (W - tw) / 2;
      const offY = (H - th) / 2;
      if (bg.fit === "cover") {
        const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, offX + (tw - dw) / 2, offY + (th - dh) / 2, dw, dh);
      } else {
        const scale = Math.min(tw / img.naturalWidth, th / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, offX + (tw - dw) / 2, offY + (th - dh) / 2, dw, dh);
      }
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);
    }
    if (bg.overlay) {
      ctx.fillStyle = bg.overlay;
      ctx.fillRect(0, 0, W, H);
    }
    return;
  }
}

interface LayerAnimState {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
}

function layerAnimState(layer: Layer, sceneTime: number, W: number, H: number): LayerAnimState {
  const t0 = layer.animationDelay;
  const dur = Math.max(0.001, layer.animationDuration);
  const local = sceneTime - t0;
  if (layer.animation === "none" || local <= 0) {
    const visible = layer.animation === "none" || sceneTime >= t0;
    return {
      opacity: visible ? 1 : 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
    };
  }
  const p = Math.min(1, local / dur);
  const e = easeOut(p);
  switch (layer.animation) {
    case "fadeIn":
      return { opacity: e, translateX: 0, translateY: 0, scale: 1 };
    case "slideUp":
      return { opacity: e, translateX: 0, translateY: (1 - e) * H * 0.05, scale: 1 };
    case "slideDown":
      return { opacity: e, translateX: 0, translateY: -(1 - e) * H * 0.05, scale: 1 };
    case "slideLeft":
      return { opacity: e, translateX: (1 - e) * W * 0.05, translateY: 0, scale: 1 };
    case "slideRight":
      return { opacity: e, translateX: -(1 - e) * W * 0.05, translateY: 0, scale: 1 };
    case "zoomIn":
      return { opacity: e, translateX: 0, translateY: 0, scale: 0.7 + 0.3 * e };
    case "zoomOut":
      return { opacity: e, translateX: 0, translateY: 0, scale: 1.3 - 0.3 * e };
    case "kenBurns": {
      // Gentle continuous zoom over the whole life of the layer
      const k = Math.min(1, sceneTime / 5);
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1 + 0.08 * easeInOut(k) };
    }
    case "pulse": {
      const k = Math.sin((sceneTime - t0) * 4) * 0.04;
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1 + k };
    }
    default:
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1 };
  }
}

function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer, W: number, H: number): void {
  const x = layer.x * W;
  const y = layer.y * H;
  const w = layer.width * W;
  const h = layer.height * H;
  let fontPx = layer.fontSize * H;
  const display = layer.uppercase ? layer.text.toUpperCase() : layer.text;
  const fontStyle = layer.italic ? "italic " : "";
  const setFont = (px: number) => {
    ctx.font = `${fontStyle}${layer.fontWeight} ${px}px ${layer.fontFamily}`;
  };
  setFont(fontPx);
  ctx.textBaseline = "top";
  ctx.textAlign = layer.align;

  if (layer.background) {
    roundRect(ctx, x, y, w, h, layer.borderRadius * Math.min(W, H));
    ctx.fillStyle = layer.background;
    ctx.fill();
  }

  if (layer.shadow) {
    ctx.shadowColor = layer.shadow.color;
    ctx.shadowBlur = layer.shadow.blur * H;
    ctx.shadowOffsetX = layer.shadow.offsetX * W;
    ctx.shadowOffsetY = layer.shadow.offsetY * H;
  }
  ctx.fillStyle = layer.color;

  const padX = layer.paddingX * W;
  const padY = layer.paddingY * H;
  const maxWidthInner = Math.max(20, w - padX * 2);
  const maxHeightInner = Math.max(20, h - padY * 2);
  const letterSpacingPx = (lp: number) => (layer.letterSpacing || 0) * lp;

  // Effective width of one rendered line including letter spacing.
  const lineRenderedWidth = (line: string, px: number): number => {
    const base = ctx.measureText(line).width;
    const ls = letterSpacingPx(px);
    return base + Math.max(0, line.length - 1) * ls;
  };

  // Wrap, accounting for letter spacing at current font size.
  const wrapWithSpacing = (px: number): string[] => {
    const paragraphs = display.split("\n");
    const out: string[] = [];
    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        out.push("");
        continue;
      }
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (lineRenderedWidth(candidate, px) > maxWidthInner && line) {
          out.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) out.push(line);
    }
    return out;
  };

  // Auto-shrink: pick a font size that fits the box both horizontally
  // (no single word overflows) and vertically (lines stack inside height).
  let lines = wrapWithSpacing(fontPx);
  const fits = (px: number, ls: string[]): boolean => {
    const lh = px * layer.lineHeight;
    const total = ls.length * lh;
    if (total > maxHeightInner) return false;
    for (const line of ls) {
      if (lineRenderedWidth(line, px) > maxWidthInner + 0.5) return false;
    }
    return true;
  };
  let safety = 0;
  while (!fits(fontPx, lines) && fontPx > 8 && safety < 40) {
    fontPx *= 0.92;
    setFont(fontPx);
    lines = wrapWithSpacing(fontPx);
    safety++;
  }

  const anchorX =
    layer.align === "left"
      ? x + padX
      : layer.align === "right"
      ? x + w - padX
      : x + w / 2;

  const lineHeight = fontPx * layer.lineHeight;
  const totalHeight = lines.length * lineHeight;
  const startY = y + Math.max(padY, (h - totalHeight) / 2);

  for (let i = 0; i < lines.length; i++) {
    const ly = startY + i * lineHeight;
    if (layer.letterSpacing && layer.letterSpacing !== 0) {
      drawTextWithSpacing(ctx, lines[i], anchorX, ly, letterSpacingPx(fontPx), layer.align);
    } else {
      ctx.fillText(lines[i], anchorX, ly);
    }
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "center" | "right",
): void {
  // We position each glyph manually, so textAlign must be "left" or the
  // built-in centering offsets each character and produces jumbled text.
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  // Don't apply negative letter spacing to space chars or punctuation
  // separators — that's what was making "Clear Your" render as "ClearYour"
  // and "Tampa • St. Pete" collapse to "Tampa•St.Pete".
  const isSpaceLike = (c: string) => c === " " || c === " " || c === " " || c === " ";
  const effSpacing = (i: number) => {
    if (i >= chars.length - 1) return 0;
    if (spacing >= 0) return spacing;
    // Negative kerning: skip on spaces and around bullets/separators
    if (isSpaceLike(chars[i]) || isSpaceLike(chars[i + 1])) return 0;
    return spacing;
  };
  let total = 0;
  for (let i = 0; i < chars.length; i++) {
    total += widths[i] + effSpacing(i);
  }
  let cursor = align === "left" ? x : align === "right" ? x - total : x - total / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursor, y);
    cursor += widths[i] + effSpacing(i);
  }
  ctx.textAlign = prevAlign;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const out: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function drawImageLayer(ctx: CanvasRenderingContext2D, layer: ImageLayer, W: number, H: number): void {
  const x = layer.x * W;
  const y = layer.y * H;
  const w = layer.width * W;
  const h = layer.height * H;
  ctx.save();
  if (layer.borderRadius > 0) {
    roundRect(ctx, x, y, w, h, layer.borderRadius * Math.min(W, H));
    ctx.clip();
  }
  if (layer.shadow) {
    ctx.shadowColor = layer.shadow.color;
    ctx.shadowBlur = layer.shadow.blur * H;
    ctx.shadowOffsetX = layer.shadow.offsetX * W;
    ctx.shadowOffsetY = layer.shadow.offsetY * H;
  }
  const img = imageCache.get(layer.src);
  if (img && img.complete && img.naturalWidth > 0) {
    if (layer.fit === "cover") {
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else {
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = `${0.025 * H}px ui-sans-serif, system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("loading…", x + w / 2, y + h / 2);
  }
  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, layer: ShapeLayer, W: number, H: number): void {
  const x = layer.x * W;
  const y = layer.y * H;
  const w = layer.width * W;
  const h = layer.height * H;
  ctx.fillStyle = layer.fill;
  if (layer.stroke) {
    ctx.strokeStyle = layer.stroke;
    ctx.lineWidth = (layer.strokeWidth ?? 0.005) * Math.min(W, H);
  }
  if (layer.shape === "rect") {
    roundRect(ctx, x, y, w, h, layer.borderRadius * Math.min(W, H));
    ctx.fill();
    if (layer.stroke) ctx.stroke();
  } else if (layer.shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (layer.stroke) ctx.stroke();
  } else if (layer.shape === "ribbon") {
    // Trapezoid-like ribbon
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - h * 0.4, y + h);
    ctx.lineTo(x + h * 0.4, y + h);
    ctx.closePath();
    ctx.fill();
    if (layer.stroke) ctx.stroke();
  }
}

function drawSticker(ctx: CanvasRenderingContext2D, layer: StickerLayer, W: number, H: number): void {
  const x = layer.x * W;
  const y = layer.y * H;
  const w = layer.width * W;
  const h = layer.height * H;
  const fontPx = layer.fontSize * H;
  ctx.font = `${fontPx}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(layer.emoji, x + w / 2, y + h / 2);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  sceneTime: number,
  W: number,
  H: number,
): void {
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // Transition-in wraps the whole scene
  const tProg = scene.transitionInDuration > 0
    ? Math.min(1, sceneTime / scene.transitionInDuration)
    : 1;
  applyTransitionIn(ctx, scene, tProg, W, H);

  drawBackground(ctx, scene.background, W, H, sceneTime);

  for (const layer of scene.layers) {
    const anim = layerAnimState(layer, sceneTime, W, H);
    if (anim.opacity <= 0) continue;
    ctx.save();
    ctx.globalAlpha = anim.opacity * layer.opacity;
    if (layer.rotation || anim.scale !== 1 || anim.translateX || anim.translateY) {
      const cx = (layer.x + layer.width / 2) * W;
      const cy = (layer.y + layer.height / 2) * H;
      ctx.translate(cx + anim.translateX, cy + anim.translateY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(anim.scale, anim.scale);
      ctx.translate(-cx, -cy);
    }
    switch (layer.type) {
      case "text":
        drawText(ctx, layer, W, H);
        break;
      case "image":
        drawImageLayer(ctx, layer, W, H);
        break;
      case "shape":
        drawShape(ctx, layer, W, H);
        break;
      case "sticker":
        drawSticker(ctx, layer, W, H);
        break;
    }
    ctx.restore();
  }

  ctx.restore();
}
