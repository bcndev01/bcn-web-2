import React, { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { CRYPTO_COLORS } from '../../../types/three-scene';

// =============================================
// Cyberpunk Grid Floor - Tron-style with fog
// =============================================

const GridShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color(CRYPTO_COLORS.cryptoCyan),
    uColor2: new THREE.Color(CRYPTO_COLORS.purple),
    uFogColor: new THREE.Color('#0A0A0F'),
    uFogNear: 10,
    uFogFar: 60,
    uGridSize: 2.0,
    uLineWidth: 0.03,
    uGlowIntensity: 0.8,
    uPulseSpeed: 0.5,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vFogDepth;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vFogDepth = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform float uGridSize;
    uniform float uLineWidth;
    uniform float uGlowIntensity;
    uniform float uPulseSpeed;

    varying vec2 vUv;
    varying float vFogDepth;

    void main() {
      // Grid calculation
      vec2 gridPos = vUv * 50.0 / uGridSize;
      vec2 grid = abs(fract(gridPos - 0.5) - 0.5);
      float line = min(grid.x, grid.y);

      // Sharp grid lines with glow falloff
      float gridLine = 1.0 - smoothstep(0.0, uLineWidth, line);
      float gridGlow = 1.0 - smoothstep(0.0, uLineWidth * 4.0, line);

      // Pulsing effect radiating from center
      float dist = length(vUv - 0.5) * 2.0;
      float pulse = sin(dist * 10.0 - uTime * uPulseSpeed) * 0.5 + 0.5;

      // Color gradient based on distance from center
      vec3 gridColor = mix(uColor1, uColor2, dist);

      // Combine line and glow
      vec3 finalColor = gridColor * (gridLine * uGlowIntensity + gridGlow * 0.3 * pulse);

      // Apply fog
      float fogFactor = smoothstep(uFogNear, uFogFar, vFogDepth);
      finalColor = mix(finalColor, uFogColor, fogFactor);

      // Alpha based on line visibility
      float alpha = gridLine * 0.9 + gridGlow * 0.2;
      alpha *= (1.0 - fogFactor * 0.8);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ GridShaderMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      gridShaderMaterial: any;
    }
  }
}

interface CyberpunkGridProps {
  size?: number;
  position?: [number, number, number];
  color1?: string;
  color2?: string;
}

export const CyberpunkGrid: React.FC<CyberpunkGridProps> = ({
  size = 100,
  position = [0, -5, 0],
  color1 = CRYPTO_COLORS.cryptoCyan,
  color2 = CRYPTO_COLORS.purple,
}) => {
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[size, size, 1, 1]} />
      <gridShaderMaterial
        ref={materialRef}
        uColor1={new THREE.Color(color1)}
        uColor2={new THREE.Color(color2)}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// =============================================
// Fog Volume - Atmospheric depth effect
// =============================================

export const FogVolume: React.FC<{ color?: string; density?: number }> = ({
  color = '#0A0A0F',
  density = 0.015,
}) => {
  return (
    <fog attach="fog" args={[color, 10, 80]} />
  );
};

// =============================================
// Ambient Particles - Floating dust/energy
// =============================================

interface AmbientParticlesProps {
  count?: number;
  size?: number;
  color?: string;
  spread?: number;
}

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({
  count = 200,
  size = 0.05,
  color = CRYPTO_COLORS.cryptoCyan,
  spread = 40,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = Math.random() * spread * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.02 + 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    return { positions, velocities };
  }, [count, spread]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Reset particle when it goes too high
      if (posArray[i * 3 + 1] > spread * 0.5) {
        posArray[i * 3 + 1] = -spread * 0.1;
        posArray[i * 3] = (Math.random() - 0.5) * spread;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

// =============================================
// Hex Grid Background - Alternative style
// =============================================

interface HexGridProps {
  radius?: number;
  position?: [number, number, number];
  color?: string;
}

export const HexGridBackground: React.FC<HexGridProps> = ({
  radius = 50,
  position = [0, 0, -30],
  color = CRYPTO_COLORS.cryptoCyan,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });

  // Generate hexagon points
  const hexPoints = useMemo(() => {
    const points: number[] = [];
    const hexRadius = 3;
    const rows = Math.ceil(radius / hexRadius);

    for (let row = -rows; row <= rows; row++) {
      for (let col = -rows; col <= rows; col++) {
        const xOffset = col * hexRadius * 1.5;
        const yOffset = row * hexRadius * Math.sqrt(3) + (col % 2 === 0 ? 0 : hexRadius * Math.sqrt(3) / 2);

        if (Math.sqrt(xOffset * xOffset + yOffset * yOffset) < radius) {
          // Draw hexagon
          for (let i = 0; i < 6; i++) {
            const angle1 = (Math.PI / 3) * i;
            const angle2 = (Math.PI / 3) * (i + 1);
            points.push(
              xOffset + Math.cos(angle1) * hexRadius * 0.9,
              yOffset + Math.sin(angle1) * hexRadius * 0.9,
              0
            );
            points.push(
              xOffset + Math.cos(angle2) * hexRadius * 0.9,
              yOffset + Math.sin(angle2) * hexRadius * 0.9,
              0
            );
          }
        }
      }
    }

    return new Float32Array(points);
  }, [radius]);

  return (
    <group position={position}>
      <lineSegments ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={hexPoints.length / 3}
            array={hexPoints}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

export default CyberpunkGrid;
