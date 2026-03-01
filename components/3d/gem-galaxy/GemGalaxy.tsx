import React, { Suspense, useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Html,
  Environment,
  Float,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { Eye, EyeOff, RefreshCw, Sparkles as SparklesIcon, Shield, Flame, Loader2, ExternalLink } from 'lucide-react';
import { useGemHunter } from '../../../hooks/useGemHunter';
import { ProcessedToken } from '../../../types/dexScreener';

// =============================================
// TYPES
// =============================================

interface TokenCrystal {
  id: string;
  address: string;
  symbol: string;
  name: string;
  hype: number;
  isSafe: boolean;
  position: [number, number, number];
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange1h: number;
  trustScore: number;
  dexUrl: string;
  categories: string[];
  redFlags: string[];
  rotation: number;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const calculateHypeScore = (token: ProcessedToken): number => {
  let hype = 0;
  const volumeRatio = token.marketCap > 0 ? (token.volume24h / token.marketCap) * 100 : 0;
  hype += Math.min(30, volumeRatio * 3);
  const priceScore = Math.min(30, Math.max(0, token.priceChange1h + 10) * 1.5);
  hype += priceScore;
  const buyRatio = token.buyRatio || 0.5;
  hype += buyRatio * 20;
  if (token.ageHours < 24) hype += 10;
  else if (token.ageHours < 72) hype += 5;
  if (token.categories.includes('Breakout Hunter')) hype += 5;
  if (token.categories.includes('Whale Magnet')) hype += 5;
  return Math.min(100, Math.max(0, Math.round(hype)));
};

// Random 3D Spherical Cloud Distribution
// Generates all positions at once to ensure proper separation
const generateCloudPositions = (total: number): [number, number, number][] => {
  const positions: [number, number, number][] = [];
  const maxAttempts = 50;
  const minDistance = 2.8; // Minimum distance between nodes

  // Define bounds for the cloud
  const bounds = {
    x: { min: -15, max: 15 },
    y: { min: -8, max: 8 },
    z: { min: -10, max: 8 },
  };

  // Use seeded random for consistency
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < total; i++) {
    let placed = false;

    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      // Generate random position within bounds using seeded random
      const seed = i * 1000 + attempt;
      const x = bounds.x.min + seededRandom(seed) * (bounds.x.max - bounds.x.min);
      const y = bounds.y.min + seededRandom(seed + 1) * (bounds.y.max - bounds.y.min);
      const z = bounds.z.min + seededRandom(seed + 2) * (bounds.z.max - bounds.z.min);

      // Check distance from all existing positions
      let tooClose = false;
      for (const pos of positions) {
        const dist = Math.sqrt(
          Math.pow(x - pos[0], 2) +
          Math.pow(y - pos[1], 2) +
          Math.pow(z - pos[2], 2)
        );
        if (dist < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        positions.push([x, y, z]);
        placed = true;
      }
    }

    // Fallback: place in a sphere pattern
    if (!placed) {
      const phi = Math.acos(-1 + (2 * i) / total);
      const theta = Math.sqrt(total * Math.PI) * phi;
      const radius = 10;
      positions.push([
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi) * 0.6,
        radius * Math.cos(phi),
      ]);
    }
  }

  return positions;
};

const convertTokenToCrystal = (
  token: ProcessedToken,
  position: [number, number, number],
  seedOffset: number
): TokenCrystal => {
  const hype = calculateHypeScore(token);
  const criticalFlags = ['Honeypot Risk', 'Honeypot V2', 'Rug Pull Risk', 'Mintable', 'Freezable'];
  const hasCriticalFlag = token.redFlags.some(flag => criticalFlags.includes(flag));
  const isSafe = token.trustScore >= 5 && !hasCriticalFlag && token.security.loaded;

  // Seeded rotation for consistency
  const seededRotation = Math.sin(seedOffset * 12.9898) * Math.PI * 2;

  return {
    id: token.id,
    address: token.address,
    symbol: `$${token.symbol}`,
    name: token.name,
    hype,
    isSafe,
    position,
    marketCap: token.marketCap || token.fdv || 0,
    volume24h: token.volume24h,
    priceChange24h: token.priceChange24h,
    priceChange1h: token.priceChange1h,
    trustScore: token.trustScore,
    dexUrl: token.dexUrl,
    categories: token.categories,
    redFlags: token.redFlags,
    rotation: seededRotation,
  };
};

// =============================================
// COLOR UTILITIES
// =============================================

// Get color based on hype level and safety
const getNodeColors = (hype: number, isSafe: boolean) => {
  // Safe nodes get distinct green treatment
  if (isSafe && hype < 70) {
    return {
      baseColor: '#10b981',      // Emerald
      emissiveColor: '#34d399',  // Lighter emerald
      emissiveIntensity: 1.2,
      glowColor: '#00ff88',
    };
  }

  // Hot nodes (high hype) - Orange/Red gradient
  if (hype >= 70) {
    const intensity = (hype - 70) / 30; // 0 to 1 for 70-100 range
    return {
      baseColor: intensity > 0.5 ? '#ef4444' : '#f97316',  // Red or Orange
      emissiveColor: intensity > 0.5 ? '#ff4444' : '#ff6600',
      emissiveIntensity: 1.5 + intensity * 1.5,  // 1.5 to 3.0
      glowColor: intensity > 0.5 ? '#ff3333' : '#ff8800',
    };
  }

  // Cold nodes (low hype) - Blue/Cyan gradient
  const coldIntensity = hype / 70; // 0 to 1 for 0-70 range
  return {
    baseColor: coldIntensity > 0.5 ? '#06b6d4' : '#3b82f6',  // Cyan or Blue
    emissiveColor: coldIntensity > 0.5 ? '#22d3ee' : '#60a5fa',
    emissiveIntensity: 0.8 + coldIntensity * 0.7,  // 0.8 to 1.5
    glowColor: coldIntensity > 0.5 ? '#00d4ff' : '#4488ff',
  };
};

// =============================================
// FROSTED GLASS CRYSTAL NODE
// =============================================

interface CrystalNodeProps {
  crystal: TokenCrystal;
  onSelect: (crystal: TokenCrystal) => void;
  isSelected: boolean;
}

const CrystalNode: React.FC<CrystalNodeProps> = ({ crystal, onSelect, isSelected }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Size based on market cap
  const size = useMemo(() => {
    const minSize = 0.3;
    const maxSize = 0.75;
    if (crystal.marketCap <= 0) return minSize;
    const logCap = Math.log10(crystal.marketCap);
    const normalized = (logCap - 4) / 8;
    return THREE.MathUtils.clamp(minSize + normalized * (maxSize - minSize), minSize, maxSize);
  }, [crystal.marketCap]);

  // Get colors based on data
  const colors = useMemo(() => getNodeColors(crystal.hype, crystal.isSafe), [crystal.hype, crystal.isSafe]);
  const isHighHype = crystal.hype >= 70;

  // Animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y += delta * (isHighHype ? 0.4 : 0.2);
      // Gentle bobbing
      groupRef.current.position.y = crystal.position[1] + Math.sin(state.clock.elapsedTime * 0.5 + crystal.rotation) * 0.08;
    }
  });

  // Safe nodes use smooth spheres, others use crystals
  const GeometryComponent = crystal.isSafe && crystal.hype < 70 ? (
    <icosahedronGeometry args={[size, 2]} />
  ) : (
    <octahedronGeometry args={[size, 0]} />
  );

  return (
    <group position={crystal.position}>
      {/* Rotating crystal group */}
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(crystal);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        {/* Main Frosted Glass Crystal */}
        <mesh ref={meshRef} castShadow>
          {GeometryComponent}
          <meshPhysicalMaterial
            color={colors.baseColor}
            emissive={colors.emissiveColor}
            emissiveIntensity={colors.emissiveIntensity}
            transmission={0.6}
            thickness={2}
            roughness={0.15}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0}
            transparent
            opacity={0.9}
            envMapIntensity={1}
          />
        </mesh>

        {/* Inner Core Glow - brighter center */}
        <mesh>
          <sphereGeometry args={[size * 0.35, 16, 16]} />
          <meshBasicMaterial
            color={colors.glowColor}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Outer Glow Aura */}
        <mesh>
          <sphereGeometry args={[size * 1.4, 16, 16]} />
          <meshBasicMaterial
            color={colors.glowColor}
            transparent
            opacity={isHighHype ? 0.15 : 0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Selection ring */}
        {isSelected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size * 1.5, size * 1.7, 32]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}

        {/* Safe indicator - smooth ring */}
        {crystal.isSafe && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size * 1.2, size * 1.35, 32]} />
            <meshBasicMaterial
              color="#00ff88"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}

        {/* Hot indicator - particle halo */}
        {isHighHype && (
          <HotParticles size={size} color={colors.glowColor} />
        )}

        {/* Label - positioned at crystal TOP (size = radius for octahedron) */}
        <Html
          position={[0, size + 0.1, 0]}
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* LABEL BADGE */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                padding: '3px 8px',
                borderBottom: `2px solid ${colors.glowColor}`,
                position: 'relative',
              }}
            >
              {/* Status indicators */}
              <div style={{ position: 'absolute', top: '2px', right: '2px', display: 'flex', gap: '2px' }}>
                {crystal.isSafe && (
                  <div
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: '#4ade80',
                      boxShadow: '0 0 3px #4ade80',
                    }}
                  />
                )}
                {isHighHype && (
                  <div
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: '#f97316',
                      boxShadow: '0 0 3px #f97316',
                    }}
                  />
                )}
              </div>

              {/* Symbol */}
              <div
                style={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '10px',
                  letterSpacing: '0.3px',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {crystal.symbol.toUpperCase()}
              </div>

              {/* Price change */}
              <div
                style={{
                  color: crystal.priceChange1h >= 0 ? '#4ade80' : '#f87171',
                  fontSize: '8px',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {crystal.priceChange1h >= 0 ? '+' : ''}{crystal.priceChange1h.toFixed(1)}%
              </div>
            </div>

            {/* TETHER LINE - short connector */}
            <div
              style={{
                width: '1px',
                height: '6px',
                background: colors.glowColor,
              }}
            />
          </div>
        </Html>
      </group>
    </group>
  );
};

// =============================================
// HOT PARTICLES - orbiting particles for high hype
// =============================================

interface HotParticlesProps {
  size: number;
  color: string;
}

const HotParticles: React.FC<HotParticlesProps> = ({ size, color }) => {
  const particlesRef = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const count = 12;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const r = size * 1.6;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * size * 0.5;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      speeds[i] = 0.8 + Math.random() * 0.4;
    }

    return { positions, speeds };
  }, [size]);

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < posArray.length / 3; i++) {
        const angle = time * speeds[i] + (i / (posArray.length / 3)) * Math.PI * 2;
        const r = size * 1.6 + Math.sin(time * 3 + i) * size * 0.2;
        posArray[i * 3] = Math.cos(angle) * r;
        posArray[i * 3 + 1] = Math.sin(time * 2 + i * 0.5) * size * 0.3;
        posArray[i * 3 + 2] = Math.sin(angle) * r;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// =============================================
// AMBIENT DUST FIELD
// =============================================

const DustField: React.FC = () => {
  const dustRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 30;
      const y = (Math.random() - 0.5) * 10;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (dustRef.current) {
      dustRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#6688aa"
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </points>
  );
};

// =============================================
// POST PROCESSING
// =============================================

const PostProcessingEffects: React.FC<{ focusMode: boolean }> = ({ focusMode }) => {
  return (
    <EffectComposer>
      <Bloom
        intensity={focusMode ? 2.5 : 1.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.8}
      />
      <Vignette
        offset={0.3}
        darkness={focusMode ? 0.5 : 0.35}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

// =============================================
// MAIN SCENE
// =============================================

const GalaxyScene: React.FC<{
  crystals: TokenCrystal[];
  focusMode: boolean;
  selectedCrystal: TokenCrystal | null;
  onSelectCrystal: (crystal: TokenCrystal | null) => void;
}> = ({ crystals, focusMode, selectedCrystal, onSelectCrystal }) => {

  return (
    <>
      <PerspectiveCamera makeDefault position={[20, 8, 20]} fov={55} near={0.1} far={200} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={60}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
      />

      {/* Deep space background */}
      <color attach="background" args={['#030308']} />
      <fog attach="fog" args={['#030308', 50, 100]} />

      {/* Environment for glass reflections - CRUCIAL for premium look */}
      <Environment preset="city" background={false} />

      {/* Ambient + Directional lighting */}
      <ambientLight intensity={0.25} color="#334466" />
      <directionalLight position={[15, 25, 10]} intensity={0.4} color="#ffffff" />
      <directionalLight position={[-15, 10, -15]} intensity={0.25} color="#4466aa" />
      <pointLight position={[0, 0, 0]} intensity={0.3} color="#1a1a2e" distance={30} />

      {/* Dense star field - fills the void */}
      <Stars
        radius={120}
        depth={60}
        count={6000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.3}
      />
      {/* Secondary smaller stars for depth */}
      <Stars
        radius={80}
        depth={40}
        count={2000}
        factor={2}
        saturation={0}
        fade
        speed={0.15}
      />

      {/* Dust field */}
      <DustField />

      {/* Crystal Nodes - wrapped in Float for gentle animation */}
      {crystals.map((crystal) => (
        <Float
          key={crystal.id}
          speed={1.5}
          rotationIntensity={0.2}
          floatIntensity={0.5}
        >
          <CrystalNode
            crystal={crystal}
            onSelect={onSelectCrystal}
            isSelected={selectedCrystal?.id === crystal.id}
          />
        </Float>
      ))}

      {/* Post processing */}
      <PostProcessingEffects focusMode={focusMode} />
    </>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

const GemGalaxy: React.FC = () => {
  const { tokens, loading, error, refresh, lastUpdated } = useGemHunter();
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCrystal, setSelectedCrystal] = useState<TokenCrystal | null>(null);

  const crystals = useMemo(() => {
    if (!tokens || tokens.length === 0) return [];
    const limitedTokens = tokens.slice(0, 30);
    // Generate all positions at once for proper separation
    const positions = generateCloudPositions(limitedTokens.length);
    return limitedTokens.map((token, index) =>
      convertTokenToCrystal(token, positions[index], index)
    );
  }, [tokens]);

  const stats = useMemo(() => {
    const highHype = crystals.filter(c => c.hype >= 70);
    const safe = crystals.filter(c => c.isSafe);
    const cold = crystals.filter(c => c.hype < 70 && !c.isSafe);
    return {
      total: crystals.length,
      highHype: highHype.length,
      safe: safe.length,
      cold: cold.length,
    };
  }, [crystals]);

  const handleRefresh = useCallback(() => {
    setSelectedCrystal(null);
    refresh();
  }, [refresh]);

  const formatMarketCap = (cap: number): string => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(0)}K`;
    return `$${cap.toFixed(0)}`;
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatTimeSince = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading && crystals.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#050510' }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400 text-sm font-mono">LOADING GEM GALAXY...</p>
          <p className="text-gray-600 text-xs mt-2 font-mono">Syncing with DexScreener</p>
        </div>
      </div>
    );
  }

  if (error && crystals.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#050510' }}>
        <div className="text-center">
          <p className="text-rose-400 text-sm mb-4 font-mono">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded text-sm font-mono flex items-center gap-2 mx-auto border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            <RefreshCw size={14} />
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#050510' }}>
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Suspense fallback={null}>
          <GalaxyScene
            crystals={crystals}
            focusMode={focusMode}
            selectedCrystal={selectedCrystal}
            onSelectCrystal={setSelectedCrystal}
          />
        </Suspense>
      </Canvas>

      {/* Stats Panel */}
      <div
        className="absolute top-4 left-4 rounded-xl p-4 min-w-[180px]"
        style={{
          background: 'rgba(5,5,16,0.9)',
          border: '1px solid rgba(100,130,180,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold text-white tracking-widest">GEM GALAXY</h3>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: loading ? '#f59e0b' : '#4ade80' }}
            />
            <span className="text-[9px] font-mono" style={{ color: loading ? '#f59e0b' : '#4ade80' }}>
              {loading ? 'SYNC' : 'LIVE'}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-[11px] font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">NODES</span>
            <span className="text-cyan-400">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Flame size={10} className="text-orange-400" />HOT
            </span>
            <span className="text-orange-400">{stats.highHype}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Shield size={10} className="text-green-400" />SAFE
            </span>
            <span className="text-green-400">{stats.safe}</span>
          </div>
        </div>

        <div className="border-t border-white/5 my-3" />

        {/* Legend */}
        <div className="space-y-1.5 text-[9px] font-mono text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f97316', boxShadow: '0 0 8px #f97316' }} />
            <span>HOT (High Hype)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} />
            <span>COLD (Low Hype)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span>AI VERIFIED</span>
          </div>
        </div>

        <div className="border-t border-white/5 my-3" />

        <button
          onClick={() => setFocusMode(!focusMode)}
          className="w-full px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all flex items-center justify-center gap-2"
          style={{
            background: focusMode ? 'rgba(249,115,22,0.15)' : 'rgba(100,130,180,0.1)',
            border: focusMode ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(100,130,180,0.2)',
            color: focusMode ? '#fb923c' : '#94a3b8',
          }}
        >
          {focusMode ? <Eye size={11} /> : <EyeOff size={11} />}
          {focusMode ? 'FOCUS ON' : 'FOCUS OFF'}
        </button>

        <div className="text-[9px] mt-2.5 text-gray-600 font-mono">
          Updated {formatTimeSince(lastUpdated)}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleRefresh}
          className="p-2.5 rounded-lg transition-colors"
          style={{
            background: 'rgba(5,5,16,0.9)',
            border: '1px solid rgba(100,130,180,0.2)',
          }}
          title="Refresh"
        >
          <RefreshCw size={14} className={`text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setFocusMode(!focusMode)}
          className="p-2.5 rounded-lg transition-colors"
          style={{
            background: focusMode ? 'rgba(249,115,22,0.1)' : 'rgba(5,5,16,0.9)',
            border: focusMode ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(100,130,180,0.2)',
          }}
          title="Focus Mode"
        >
          <SparklesIcon size={14} className={focusMode ? 'text-orange-400' : 'text-gray-500'} />
        </button>
      </div>


      {/* Selected Crystal Panel */}
      {selectedCrystal && (
        <div
          className="absolute bottom-4 right-4 rounded-xl p-4 min-w-[280px] max-w-[320px]"
          style={{
            background: 'rgba(5,5,16,0.95)',
            border: `1px solid ${selectedCrystal.hype >= 70 ? 'rgba(249,115,22,0.3)' : 'rgba(6,182,212,0.3)'}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {selectedCrystal.symbol}
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">{selectedCrystal.name}</span>
            </div>
            <div className="flex gap-1.5">
              {selectedCrystal.isSafe && (
                <span className="px-2 py-0.5 text-[9px] font-mono rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  SAFE
                </span>
              )}
              {selectedCrystal.hype >= 70 && (
                <span className="px-2 py-0.5 text-[9px] font-mono rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                  HOT
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">HYPE</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedCrystal.hype}%`,
                      background: selectedCrystal.hype >= 70
                        ? 'linear-gradient(90deg, #f97316, #ef4444)'
                        : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                    }}
                  />
                </div>
                <span className="text-white w-6 text-right">{selectedCrystal.hype}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">TRUST</span>
              <span style={{
                color: selectedCrystal.trustScore >= 5 ? '#4ade80' : selectedCrystal.trustScore >= 3 ? '#fbbf24' : '#f87171'
              }}>
                {selectedCrystal.trustScore}/7
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">MCAP</span>
              <span className="text-white">{formatMarketCap(selectedCrystal.marketCap)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">VOL 24H</span>
              <span className="text-gray-300">{formatVolume(selectedCrystal.volume24h)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">1H</span>
              <span style={{ color: selectedCrystal.priceChange1h >= 0 ? '#4ade80' : '#f87171' }}>
                {selectedCrystal.priceChange1h >= 0 ? '+' : ''}{selectedCrystal.priceChange1h.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">24H</span>
              <span style={{ color: selectedCrystal.priceChange24h >= 0 ? '#4ade80' : '#f87171' }}>
                {selectedCrystal.priceChange24h >= 0 ? '+' : ''}{selectedCrystal.priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>

          {selectedCrystal.redFlags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedCrystal.redFlags.slice(0, 3).map((flag, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[8px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20"
                >
                  {flag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <a
              href={selectedCrystal.dexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1.5 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <ExternalLink size={10} />
              DEXSCREENER
            </a>
            <button
              onClick={() => setSelectedCrystal(null)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono text-gray-400 border border-gray-700 hover:border-gray-500 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedCrystal && crystals.length > 0 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-none">
          <p
            className="text-[9px] px-4 py-1.5 rounded-full font-mono tracking-wider"
            style={{
              background: 'rgba(5,5,16,0.8)',
              color: '#64748b',
              border: '1px solid rgba(100,130,180,0.15)',
            }}
          >
            DRAG TO ROTATE • SCROLL TO ZOOM • CLICK TO SELECT
          </p>
        </div>
      )}
    </div>
  );
};

export default GemGalaxy;
