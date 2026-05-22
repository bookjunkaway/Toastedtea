"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Sky } from "@react-three/drei";
import { MapPin, Phone, Sparkles, Truck, Loader2 } from "lucide-react";
import { Scene } from "./Scene";
import { DumpTruck } from "./DumpTruck";

/* ──────────────────────────────────────────────────────────────────────────
 *  Live 3D booking experience for Book Junk Away
 *
 *  Phase 1 (this is what's shipped):
 *    - Stylized Tampa neighborhood in 3D (R3F)
 *    - Customer types their address → camera flies to a pin → BJA dump
 *      truck drives from the depot to the pin
 *    - Booking overlay on top with phone, $50 off offer, "Book now"
 *
 *  Phase 2 (later): swap the scripted truck for real GPS via WebSocket
 *    (driver app broadcasts location → all watchers see truck move live)
 * ────────────────────────────────────────────────────────────────────────── */

function CameraRig({ progress, pin }: { progress: number; pin: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    // The OrbitControls/PerspectiveCamera below sets initial pose;
    // here we drift toward the pin as progress increases.
  }, []);
  useEffect(() => {
    const startX = 0;
    const startY = 14;
    const startZ = 14;
    const targetX = pin[0] * 0.6;
    const targetY = 6;
    const targetZ = pin[2] * 0.6 + 6;
    const t = Math.min(1, Math.max(0, progress));
    camera.position.x = startX + (targetX - startX) * t;
    camera.position.y = startY + (targetY - startY) * t;
    camera.position.z = startZ + (targetZ - startZ) * t;
    camera.lookAt(pin[0] * 0.5, 0, pin[2] * 0.5);
  }, [progress, pin, camera]);
  return null;
}

type Stage = "idle" | "dispatching" | "enroute" | "arrived";

export function LiveExperience() {
  const [address, setAddress] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [pin, setPin] = useState<[number, number, number]>([6, 0, -2]);
  const rafRef = useRef<number | null>(null);

  // Hash address into a deterministic neighborhood location so different
  // addresses produce different pins on the map
  const hashedPin = useMemo<[number, number, number]>(() => {
    if (!address.trim()) return [6, 0, -2];
    let h = 0;
    for (let i = 0; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) | 0;
    const x = ((h & 0xff) / 255) * 16 - 8;
    const z = (((h >> 8) & 0xff) / 255) * 16 - 8;
    return [x, 0, z];
  }, [address]);

  const dispatch = () => {
    if (!address.trim() || stage !== "idle") return;
    setPin(hashedPin);
    setStage("dispatching");
    setProgress(0);

    // Tiny "looking up address" beat, then start the drive
    const startedAt = performance.now();
    const dispatchDelay = 800;
    const driveDuration = 4200;
    let switchedToEnroute = false;
    const animate = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed < dispatchDelay) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      if (!switchedToEnroute) {
        switchedToEnroute = true;
        setStage("enroute");
      }
      const t = Math.min(1, (elapsed - dispatchDelay) / driveDuration);
      setProgress(t);
      if (t >= 1) {
        setStage("arrived");
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStage("idle");
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-gradient-to-b from-sky-300 via-amber-100 to-emerald-100">
      <Canvas shadows dpr={[1, 2]} className="absolute inset-0">
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 14, 14]} fov={45} />
          <CameraRig progress={progress} pin={pin} />
          <Sky sunPosition={[40, 18, 20]} turbidity={4} rayleigh={1.2} />
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[20, 25, 15]}
            intensity={1.4}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={25}
            shadow-camera-bottom={-25}
          />
          <Scene pin={pin} pinActive={stage !== "idle"} />
          <DumpTruck progress={progress} target={[pin[0], 0, pin[2]]} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2.3}
            minPolarAngle={Math.PI / 6}
            autoRotate={stage === "idle"}
            autoRotateSpeed={0.45}
          />
        </Suspense>
      </Canvas>

      {/* HUD — top brand bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur rounded-full pl-2 pr-4 py-1 pointer-events-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="size-8" />
          <div className="leading-tight">
            <div className="text-sm font-black text-white">Book Junk Away</div>
            <div className="text-[10px] text-brand">Tampa • Live Dispatch</div>
          </div>
        </div>
        <a
          href="tel:7272884847"
          className="bg-black/70 backdrop-blur rounded-full px-3 py-1.5 text-xs font-bold text-white pointer-events-auto flex items-center gap-1"
        >
          <Phone className="size-3.5 text-brand" /> (727) 288-4847
        </a>
      </div>

      {/* Booking card */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[min(94vw,520px)] pointer-events-auto">
        <div className="rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 shadow-2xl p-4">
          {stage === "idle" && (
            <>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand" />
                <div className="text-xs font-bold tracking-wider uppercase text-brand">Live booking · Tampa Bay</div>
              </div>
              <h2 className="mt-1 text-2xl font-black leading-tight text-white">
                Watch a truck drive to your door — for real.
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Drop your address. We&apos;ll dispatch a yellow dump truck on the map. <span className="text-brand font-bold">$50 OFF</span> your first pickup.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch();
                }}
                className="mt-3 flex gap-2"
              >
                <div className="relative flex-1">
                  <MapPin className="size-4 text-brand absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    className="w-full pl-9 pr-3 h-11 rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/60"
                    placeholder="Street address, neighborhood, or ZIP"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!address.trim()}
                  className="h-11 px-4 rounded-lg bg-brand text-ink-950 font-black hover:bg-brand-400 disabled:opacity-50 flex items-center gap-1"
                >
                  <Truck className="size-4" /> Dispatch
                </button>
              </form>
              <div className="mt-2 text-[11px] text-white/40">
                Demo mode — no real truck is dispatched yet. Real GPS is being wired up next.
              </div>
            </>
          )}

          {stage === "dispatching" && (
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-brand" />
              <div>
                <div className="font-bold text-white">Finding the closest crew to {address}…</div>
                <div className="text-xs text-white/60">Routing through Tampa Bay.</div>
              </div>
            </div>
          )}

          {stage === "enroute" && (
            <div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold tracking-wider uppercase text-brand">En route</div>
                <div className="text-xs text-white/60">{Math.round(progress * 100)}%</div>
              </div>
              <div className="mt-1 font-black text-white text-lg leading-tight">
                Truck heading to {address}.
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/60">
                Live ETA is approximate. Tap the truck on the map to see the crew.
              </p>
            </div>
          )}

          {stage === "arrived" && (
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-emerald-400">Arrived</div>
              <div className="mt-1 font-black text-white text-lg leading-tight">
                Your crew is at the pin. Lock the booking?
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href="tel:7272884847"
                  className="h-11 rounded-lg bg-brand text-ink-950 font-black flex items-center justify-center gap-2"
                >
                  <Phone className="size-4" /> Call to confirm
                </a>
                <button
                  onClick={reset}
                  className="h-11 rounded-lg bg-white/10 text-white font-bold hover:bg-white/15"
                >
                  Try another address
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
