import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { CRYPTO_COLORS } from '../../../types/three-scene';

// =============================================
// Fresnel Shader Material - Iron Man HUD Style
// =============================================

const FresnelShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#00D4FF'),
    uFresnelPower: 2.5,
    uGlowIntensity: 1.0,
    uInnerGlow: 0.3,
    uRimColor: new THREE.Color('#ffffff'),
    uPulseSpeed: 1.0,
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vUv = uv;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uFresnelPower;
    uniform float uGlowIntensity;
    uniform float uInnerGlow;
    uniform vec3 uRimColor;
    uniform float uPulseSpeed;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      // Fresnel calculation
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), uFresnelPower);

      // Pulsing effect
      float pulse = 0.5 + 0.5 * sin(uTime * uPulseSpeed);

      // Inner glow gradient (center is darker, edges glow)
      float innerGlow = uInnerGlow + fresnel * uGlowIntensity;

      // Combine colors
      vec3 rimGlow = uRimColor * fresnel * (0.8 + 0.2 * pulse);
      vec3 coreColor = uColor * innerGlow;
      vec3 finalColor = coreColor + rimGlow;

      // Alpha based on fresnel (edges more visible)
      float alpha = 0.4 + fresnel * 0.6;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ FresnelShaderMaterial });

// TypeScript declaration
declare global {
  namespace JSX {
    interface IntrinsicElements {
      fresnelShaderMaterial: any;
    }
  }
}

// =============================================
// Fresnel Sphere Component - Glassmorphism Effect
// =============================================

interface FresnelSphereProps {
  radius: number;
  color: string;
  rimColor?: string;
  fresnelPower?: number;
  glowIntensity?: number;
  innerGlow?: number;
  pulseSpeed?: number;
  isHighlighted?: boolean;
}

export const FresnelSphere: React.FC<FresnelSphereProps> = ({
  radius,
  color,
  rimColor = '#ffffff',
  fresnelPower = 2.5,
  glowIntensity = 1.0,
  innerGlow = 0.3,
  pulseSpeed = 1.0,
  isHighlighted = false,
}) => {
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      // Boost glow when highlighted
      materialRef.current.uGlowIntensity = isHighlighted ? glowIntensity * 1.5 : glowIntensity;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <fresnelShaderMaterial
        ref={materialRef}
        uColor={new THREE.Color(color)}
        uRimColor={new THREE.Color(rimColor)}
        uFresnelPower={fresnelPower}
        uGlowIntensity={glowIntensity}
        uInnerGlow={innerGlow}
        uPulseSpeed={pulseSpeed}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// =============================================
// Holographic Ring - Sci-Fi Selection Effect
// =============================================

interface HoloRingProps {
  radius: number;
  color: string;
  rotationSpeed?: number;
}

export const HoloRing: React.FC<HoloRingProps> = ({
  radius,
  color,
  rotationSpeed = 1,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * rotationSpeed;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.9, radius, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// =============================================
// Neon Glow Materials for Crypto Theme
// =============================================

interface NeonMaterialProps {
  color: string;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
}

export const useNeonMaterial = ({
  color,
  emissiveIntensity = 0.8,
  opacity = 1,
  transparent = false,
}: NeonMaterialProps) => {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: emissiveIntensity,
        transparent: transparent,
        opacity: opacity,
        roughness: 0.2,
        metalness: 0.8,
      }),
    [color, emissiveIntensity, opacity, transparent]
  );
};

// Glass material for HUD panels
export const useGlassMaterial = (tint?: string) => {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: tint || CRYPTO_COLORS.cryptoDarkGray,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
      }),
    [tint]
  );
};

// Wireframe material for tunnel/grid effects
export const useWireframeMaterial = (color: string, opacity = 0.5) => {
  return useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: opacity,
      }),
    [color, opacity]
  );
};

// Particle/point material for stars and effects
export const usePointsMaterial = (color: string, size = 0.1) => {
  return useMemo(
    () =>
      new THREE.PointsMaterial({
        color: color,
        size: size,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color, size]
  );
};

// Line material for laser connections
export const useLineMaterial = (color: string, linewidth = 2) => {
  return useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        linewidth: linewidth,
      }),
    [color, linewidth]
  );
};

// =============================================
// Reusable Neon Sphere Component
// =============================================

interface NeonSphereProps {
  position: [number, number, number];
  radius: number;
  color: string;
  emissiveIntensity?: number;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export const NeonSphere: React.FC<NeonSphereProps> = ({
  position,
  radius,
  color,
  emissiveIntensity = 0.8,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const material = useNeonMaterial({ color, emissiveIntensity });

  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

// =============================================
// Pulsing Glow Effect Component
// =============================================

interface PulsingGlowProps {
  position: [number, number, number];
  radius: number;
  color: string;
  pulseSpeed?: number;
}

export const PulsingGlow: React.FC<PulsingGlowProps> = ({
  position,
  radius,
  color,
  pulseSpeed = 1,
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);

  React.useEffect(() => {
    if (!meshRef.current) return;

    let animationId: number;
    const animate = () => {
      if (meshRef.current) {
        const scale = 1 + Math.sin(Date.now() * 0.002 * pulseSpeed) * 0.1;
        meshRef.current.scale.setScalar(scale);
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        if (material && 'opacity' in material) {
          material.opacity = 0.3 + Math.sin(Date.now() * 0.002 * pulseSpeed) * 0.2;
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [pulseSpeed]);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius * 1.3, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </mesh>
  );
};

export default {
  useNeonMaterial,
  useGlassMaterial,
  useWireframeMaterial,
  usePointsMaterial,
  useLineMaterial,
  NeonSphere,
  PulsingGlow,
  FresnelSphere,
  HoloRing,
};
