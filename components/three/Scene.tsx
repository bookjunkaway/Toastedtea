"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Tampa-flavored low-poly environment: ground, palm trees, neighborhood blocks, dropped pin */

function PalmTree({ position }: { position: [number, number, number] }) {
  const fronds = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!fronds.current) return;
    fronds.current.rotation.z = Math.sin(clock.elapsedTime + position[0]) * 0.05;
  });
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.18, 3.2, 12]} />
        <meshStandardMaterial color="#5a4022" roughness={0.9} />
      </mesh>
      {/* Fronds */}
      <group ref={fronds} position={[0, 3.2, 0]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const rotY = angle;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6]}
              rotation={[0.35, rotY, 0]}
              castShadow
            >
              <coneGeometry args={[0.25, 1.6, 6]} />
              <meshStandardMaterial color="#2f7a3e" roughness={0.7} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Block({ position, color, scale }: { position: [number, number, number]; color: string; scale: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Pin({ at, pulse }: { at: [number, number, number]; pulse: boolean }) {
  const pinRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pinRef.current) {
      pinRef.current.position.y = at[1] + 1.6 + Math.sin(clock.elapsedTime * 3) * 0.12;
    }
    if (ringRef.current && pulse) {
      const t = (clock.elapsedTime % 1.5) / 1.5;
      ringRef.current.scale.set(1 + t * 3, 1 + t * 3, 1 + t * 3);
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 1 - t;
    }
  });
  return (
    <group position={at}>
      {/* Pulse ring on ground */}
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.78, 36]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={1} />
      </mesh>
      {/* Pin */}
      <mesh ref={pinRef} position={[0, 1.6, 0]}>
        <coneGeometry args={[0.32, 0.9, 16]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#fef2f2" />
      </mesh>
    </group>
  );
}

interface SceneProps {
  pin?: [number, number, number];
  pinActive?: boolean;
}

export function Scene({ pin = [6, 0, -2], pinActive = false }: SceneProps) {
  // Stable randomized neighborhood
  const houses = useMemo(() => {
    const out: { pos: [number, number, number]; color: string; scale: [number, number, number] }[] = [];
    const palette = ["#e7d7b6", "#cdb98e", "#b9a47a", "#d8c7a3"];
    for (let x = -10; x <= 10; x += 2.5) {
      for (let z = -10; z <= 10; z += 2.5) {
        if (Math.abs(x) < 1.5 || Math.abs(z) < 1.5) continue; // road area
        const h = 0.8 + Math.random() * 1.4;
        out.push({
          pos: [x + (Math.random() - 0.5) * 0.5, h / 2, z + (Math.random() - 0.5) * 0.5],
          color: palette[Math.floor(Math.random() * palette.length)],
          scale: [1.2 + Math.random() * 0.6, h, 1.2 + Math.random() * 0.6],
        });
      }
    }
    return out;
  }, []);

  const palms = useMemo<[number, number, number][]>(() => [
    [-3, 0, 3],
    [3, 0, 3],
    [-5, 0, -1],
    [5, 0, -3.5],
    [-7, 0, -5],
    [7, 0, 5],
  ], []);

  return (
    <>
      {/* Ground (grass) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#3a8443" />
      </mesh>

      {/* Roads (cross pattern through the neighborhood) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[60, 2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Yellow road stripe */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={`s${i}`} position={[-15 + i, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 0.08]} />
          <meshStandardMaterial color="#FBBF24" />
        </mesh>
      ))}

      {/* Houses */}
      {houses.map((h, i) => (
        <Block key={i} position={h.pos} color={h.color} scale={h.scale} />
      ))}

      {/* Palms */}
      {palms.map((p, i) => (
        <PalmTree key={i} position={p} />
      ))}

      {/* Pin */}
      <Pin at={pin} pulse={pinActive} />

      {/* Sky-ish backdrop via fog + colored ambient */}
      <fog attach="fog" args={["#fde8b8", 25, 60]} />
    </>
  );
}
