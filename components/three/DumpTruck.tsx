"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  /** Animation progress 0..1 — 0 = at start pose, 1 = at customer pin */
  progress?: number;
  /** Position to drive toward when progress reaches 1 */
  target?: [number, number, number];
}

export function DumpTruck({ progress = 0, target = [0, 0, 0] }: Props) {
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);

  useFrame((_, dt) => {
    if (!root.current) return;
    // Lerp toward target as progress goes up
    const t = Math.min(1, Math.max(0, progress));
    const startX = -6;
    const startZ = 4;
    root.current.position.x = THREE.MathUtils.lerp(startX, target[0], t);
    root.current.position.z = THREE.MathUtils.lerp(startZ, target[2], t);
    // Face the target
    const dx = target[0] - startX;
    const dz = target[2] - startZ;
    root.current.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    // Wheel spin scales with progress velocity (approx)
    const spin = dt * (4 + t * 6);
    for (const w of wheels.current) {
      if (w) w.rotation.x -= spin;
    }
  });

  return (
    <group ref={root} position={[-6, 0, 4]}>
      {/* Cab */}
      <mesh position={[1.4, 0.85, 0]} castShadow>
        <boxGeometry args={[1.2, 1.1, 1.3]} />
        <meshStandardMaterial color="#FBBF24" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Windshield */}
      <mesh position={[1.95, 1.05, 0]} castShadow>
        <boxGeometry args={[0.05, 0.6, 1.1]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {/* Dump bed */}
      <mesh position={[-0.6, 0.95, 0]} castShadow>
        <boxGeometry args={[2.6, 1.3, 1.4]} />
        <meshStandardMaterial color="#FBBF24" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Bed top opening shadow */}
      <mesh position={[-0.6, 1.61, 0]}>
        <boxGeometry args={[2.4, 0.02, 1.2]} />
        <meshStandardMaterial color="#1f1f1f" />
      </mesh>
      {/* Black chassis stripe */}
      <mesh position={[0.3, 0.25, 0]}>
        <boxGeometry args={[3.6, 0.18, 1.45]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {/* Wheels */}
      {[
        [-1.4, 0.32, 0.75],
        [-1.4, 0.32, -0.75],
        [1.5, 0.32, 0.75],
        [1.5, 0.32, -0.75],
      ].map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) wheels.current[i] = el;
          }}
          position={p as [number, number, number]}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.22, 24]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.7} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.24, 16]} />
            <meshStandardMaterial color="#FBBF24" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Tiny red HAULED stamp on the bed */}
      <mesh position={[-0.6, 1.0, 0.72]} rotation={[0, 0, -0.08]}>
        <planeGeometry args={[0.9, 0.25]} />
        <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
