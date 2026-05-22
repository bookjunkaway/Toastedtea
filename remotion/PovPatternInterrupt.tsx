"use client";

import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { CSSProperties } from "react";

/* ──────────────────────────────────────────────────────────────────────────
 *  Remotion composition — "POV Pattern Interrupt"
 *
 *  Mirrors the studio's tpl-viral-pov template but rendered through
 *  Remotion so we get frame-perfect timing, true MP4 output (via the
 *  Lambda/CLI render path), and richer easing curves.
 *
 *  Compatible with @remotion/player so the same composition can be
 *  previewed in-browser without any server setup.
 * ────────────────────────────────────────────────────────────────────────── */

export interface BrandProps {
  companyName: string;
  tagline: string;
  offer: string;
  cta: string;
  website: string;
  phone: string;
  beforeImage?: string;
  afterImage?: string;
}

const COLORS = {
  bg: "#0a0a0a",
  yellow: "#FBBF24",
  red: "#dc2626",
  white: "#ffffff",
  textMuted: "#94a3b8",
};

function Headline({ text, delay = 0, color = COLORS.white, big = false }: { text: string; delay?: number; color?: string; big?: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.6 } });
  const style: CSSProperties = {
    transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
    opacity: enter,
    color,
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 900,
    fontSize: big ? 160 : 80,
    lineHeight: 1.05,
    letterSpacing: -2,
    padding: "0 60px",
    textAlign: "center",
    textShadow: "0 4px 30px rgba(0,0,0,0.6)",
  };
  return <div style={style}>{text}</div>;
}

function YellowBar({ delay = 0 }: { delay?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        position: "absolute",
        top: "45%",
        left: "50%",
        transform: `translateX(-50%) scaleX(${w})`,
        transformOrigin: "center",
        width: "100%",
        height: 16,
        background: COLORS.yellow,
        boxShadow: "0 0 60px rgba(251,191,36,0.6)",
      }}
    />
  );
}

const SceneShell: React.FC<{ children: React.ReactNode; bg?: string; bgImage?: string }> = ({ children, bg = COLORS.bg, bgImage }) => (
  <AbsoluteFill style={{ background: bg, overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
    {bgImage && (
      <Img
        src={bgImage}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.55)",
        }}
      />
    )}
    {children}
  </AbsoluteFill>
);

function PovHookScene() {
  return (
    <SceneShell bg="linear-gradient(180deg, #1f2937, #0a0a0a)">
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 60,
          background: COLORS.yellow,
          color: COLORS.bg,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 44,
          padding: "8px 20px",
          borderRadius: 8,
          letterSpacing: 2,
        }}
      >
        POV
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 80 }}>
        <Headline text="you finally booked" delay={6} />
        <Headline text="the garage cleanout." delay={14} />
      </div>
      <div style={{ marginTop: 40 }}>
        <Headline text="(3 years overdue)" delay={30} color={COLORS.yellow} />
      </div>
    </SceneShell>
  );
}

function BeforeScene({ image }: { image?: string }) {
  return (
    <SceneShell bg="#7f1d1d" bgImage={image}>
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 60,
          background: COLORS.red,
          color: COLORS.white,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 40,
          padding: "8px 18px",
          borderRadius: 6,
          letterSpacing: 5,
        }}
      >
        BEFORE
      </div>
      <div style={{ position: "absolute", bottom: 200 }}>
        <Headline text="Today." delay={6} />
      </div>
    </SceneShell>
  );
}

function AfterScene({ image }: { image?: string }) {
  return (
    <SceneShell bg="linear-gradient(180deg, #16a34a, #052e16)" bgImage={image}>
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 60,
          background: "#16a34a",
          color: COLORS.white,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 40,
          padding: "8px 18px",
          borderRadius: 6,
          letterSpacing: 5,
        }}
      >
        AFTER
      </div>
      <div style={{ position: "absolute", bottom: 200 }}>
        <Headline text="Under an hour later." delay={6} color={COLORS.yellow} />
      </div>
    </SceneShell>
  );
}

function CtaScene({ brand }: { brand: BrandProps }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: frame - 20, fps, config: { damping: 16 } });
  return (
    <SceneShell bg="linear-gradient(160deg, #0a0a0a, #1f2937)">
      <YellowBar delay={4} />
      <div style={{ position: "absolute", top: 360, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: COLORS.textMuted, fontSize: 38, fontWeight: 600 }}>
          Booked online · Same-day
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: "Inter, system-ui, sans-serif",
            color: COLORS.yellow,
            fontSize: 90,
            fontWeight: 900,
            letterSpacing: -1,
          }}
        >
          {brand.offer}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 280,
          width: "70%",
          height: 110,
          background: COLORS.yellow,
          borderRadius: 24,
          transform: `scale(${card})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 20px 60px rgba(251,191,36,0.4)",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            color: COLORS.bg,
            fontWeight: 900,
            fontSize: 60,
            letterSpacing: -0.5,
          }}
        >
          {brand.website}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 180,
          width: "100%",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          color: COLORS.white,
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        {brand.cta}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 100,
          width: "100%",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          color: COLORS.textMuted,
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        {brand.phone}
      </div>
    </SceneShell>
  );
}

export const PovPatternInterrupt: React.FC<BrandProps> = (brand) => {
  const { fps } = useVideoConfig();
  const s = (sec: number) => Math.round(sec * fps);

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={0} durationInFrames={s(1.6)}>
        <PovHookScene />
      </Sequence>
      <Sequence from={s(1.6)} durationInFrames={s(1.4)}>
        <BeforeScene image={brand.beforeImage} />
      </Sequence>
      <Sequence from={s(3.0)} durationInFrames={s(1.8)}>
        <AfterScene image={brand.afterImage} />
      </Sequence>
      <Sequence from={s(4.8)} durationInFrames={s(2.4)}>
        <CtaScene brand={brand} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const POV_DURATION_FRAMES = (fps: number) => Math.round(7.2 * fps);
