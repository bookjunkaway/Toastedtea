export type AspectRatioKey = "1:1" | "4:5" | "9:16" | "16:9";

export interface AspectRatio {
  key: AspectRatioKey;
  label: string;
  description: string;
  width: number;
  height: number;
  meta: string;
}

export const ASPECT_RATIOS: Record<AspectRatioKey, AspectRatio> = {
  "9:16": {
    key: "9:16",
    label: "Reels / Stories",
    description: "Best for Instagram Reels, Stories & Facebook Reels",
    width: 1080,
    height: 1920,
    meta: "Reels, Stories",
  },
  "1:1": {
    key: "1:1",
    label: "Feed Square",
    description: "Universal Feed format for FB & IG",
    width: 1080,
    height: 1080,
    meta: "Feed",
  },
  "4:5": {
    key: "4:5",
    label: "Feed Portrait",
    description: "Highest-converting Feed placement",
    width: 1080,
    height: 1350,
    meta: "Feed",
  },
  "16:9": {
    key: "16:9",
    label: "Landscape",
    description: "Right-column, in-stream & link ads",
    width: 1920,
    height: 1080,
    meta: "In-stream",
  },
};

export type LayerAnimation =
  | "none"
  | "fadeIn"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "zoomIn"
  | "zoomOut"
  | "kenBurns"
  | "pulse";

export interface BaseLayer {
  id: string;
  type: "text" | "image" | "shape" | "sticker";
  /** Normalized 0..1 coordinates */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  animation: LayerAnimation;
  /** Seconds after scene start */
  animationDelay: number;
  animationDuration: number;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  text: string;
  fontFamily: string;
  fontWeight: number;
  /** Font size as fraction of canvas height */
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  align: "left" | "center" | "right";
  background?: string;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  uppercase?: boolean;
  italic?: boolean;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string;
  fit: "cover" | "contain";
  borderRadius: number;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
}

export type ShapeKind = "rect" | "ellipse" | "ribbon";

export interface ShapeLayer extends BaseLayer {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius: number;
}

export interface StickerLayer extends BaseLayer {
  type: "sticker";
  emoji: string;
  fontSize: number;
}

export type Layer = TextLayer | ImageLayer | ShapeLayer | StickerLayer;

export type BackgroundFill =
  | { kind: "solid"; color: string }
  | { kind: "gradient"; from: string; to: string; angle: number }
  | { kind: "image"; src: string; fit: "cover" | "contain"; overlay?: string };

export interface Scene {
  id: string;
  name: string;
  duration: number;
  background: BackgroundFill;
  layers: Layer[];
  transitionIn: "none" | "fade" | "slideLeft" | "slideUp" | "zoom";
  transitionInDuration: number;
}

export type AdGoal =
  | "same-day-service"
  | "free-quote"
  | "before-after"
  | "social-proof"
  | "limited-offer"
  | "trust-builder"
  | "service-area";

export interface BrandInputs {
  companyName: string;
  tagline: string;
  serviceArea: string;
  phone: string;
  website: string;
  offer: string;
  reviewQuote: string;
  reviewerName: string;
  rating: number;
  beforeImage?: string;
  afterImage?: string;
  heroImage?: string;
  cta: string;
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatioKey;
  goal: AdGoal;
  brand: BrandInputs;
  scenes: Scene[];
  audio?: {
    src: string;
    name: string;
    volume: number;
  };
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
    onSurface: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface AdTemplate {
  id: string;
  name: string;
  goal: AdGoal;
  description: string;
  recommendedAspect: AspectRatioKey;
  build: (opts: TemplateBuildOpts) => Scene[];
  preview: {
    background: BackgroundFill;
    headline: string;
    sub: string;
    accent: string;
  };
}

export interface TemplateBuildOpts {
  aspect: AspectRatioKey;
  brand: BrandInputs;
  palette: Project["palette"];
}

export const DEFAULT_PALETTE: Project["palette"] = {
  primary: "#FBBF24",
  secondary: "#0a0a0a",
  accent: "#dc2626",
  surface: "#fafafa",
  onSurface: "#0a0a0a",
};

export const DEFAULT_BRAND: BrandInputs = {
  companyName: "Book Junk Away",
  tagline: "Book It • Junk It • Away It",
  serviceArea: "Tampa • St. Pete • Clearwater • Brandon • Wesley Chapel",
  phone: "(727) 288-4847",
  website: "www.bookjunkaway.com",
  offer: "$50 OFF Your First Pickup",
  reviewQuote: "Booked in 60 seconds. Garage cleared in under an hour. These guys own Tampa.",
  reviewerName: "Sarah M. — South Tampa",
  rating: 5,
  heroImage: "/logo.svg",
  cta: "Book Online in 60 Seconds",
};

export const TAMPA_NEIGHBORHOODS = [
  "South Tampa",
  "Hyde Park",
  "Westchase",
  "New Tampa",
  "Carrollwood",
  "Brandon",
  "Riverview",
  "Wesley Chapel",
  "St. Petersburg",
  "Clearwater",
  "Apollo Beach",
  "Lutz",
  "Town 'N Country",
];
