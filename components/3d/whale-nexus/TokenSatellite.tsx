import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GraphNode, TokenNode, CRYPTO_COLORS } from '../../../types/three-scene';

// =============================================
// Token Satellite - Glow Sphere with Billboard Logo
// 2D sprite that always faces camera + glow effect
// =============================================

interface TokenSatelliteProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

export const TokenSatellite: React.FC<TokenSatelliteProps> = ({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hoverScale, setHoverScale] = useState(1);

  // Get token data
  const tokenData = node.data as TokenNode;
  const symbol = tokenData.symbol || '?';
  const logoUrl = tokenData.logo;

  // Calculate dimmed values
  const dimOpacity = isDimmed ? 0.15 : 1;
  const dimScale = isDimmed ? 0.7 : 1;

  // Size based on volume - scale radius (TOKENS ARE IMPORTANT!)
  const volumeScale = tokenData.totalVolume
    ? Math.min(Math.max(tokenData.totalVolume / 30000, 1.0), 2.0)
    : 1.2;
  const baseRadius = node.radius * volumeScale * 1.5; // 1.5x bigger overall

  // Animate token
  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating
    const wobble = Math.sin(state.clock.elapsedTime * 0.5 + node.position[0] * 10) * 0.15;
    groupRef.current.position.set(
      node.position[0],
      node.position[1] + Math.sin(state.clock.elapsedTime * 0.8 + node.position[2]) * 0.12,
      node.position[2]
    );

    // Hover/select scale
    const targetScale = isSelected ? 1.3 : isHovered ? 1.15 : 1;
    setHoverScale(prev => THREE.MathUtils.lerp(prev, targetScale * dimScale, 0.08));

    // Glow pulse
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      const baseGlow = isDimmed ? 0.08 : (isSelected ? 0.4 : isHovered ? 0.3 : 0.2);
      glowMat.opacity = baseGlow + Math.sin(state.clock.elapsedTime * 2) * 0.08;
    }
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
    >
      {/* Invisible click target - ensures reliable click detection */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onPointerOver();
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          onPointerOut();
        }}
      >
        <sphereGeometry args={[baseRadius * 2, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Layer 1: Outer glow sphere - soft color halo */}
      <mesh ref={glowRef} scale={hoverScale * 1.6}>
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.2 * dimOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Layer 2: Inner glow - brighter core */}
      <mesh scale={hoverScale * 1.2}>
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.15 * dimOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Layer 3: Selection ring */}
      {(isHovered || isSelected) && !isDimmed && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={hoverScale}>
          <ringGeometry args={[baseRadius * 1.4, baseRadius * 1.55, 32]} />
          <meshBasicMaterial
            color={isSelected ? CRYPTO_COLORS.cryptoCyan : node.color}
            transparent
            opacity={isSelected ? 0.7 : 0.5}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Layer 4: Billboard Logo - Always faces camera */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <group scale={hoverScale}>
          {/* Glow background behind logo */}
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[baseRadius * 0.9, 32]} />
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.25 * dimOpacity}
            />
          </mesh>

          {/* Token logo using HTML img - LARGE and PROMINENT */}
          <Html
            center
            distanceFactor={8}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                width: `${baseRadius * 80}px`,
                height: `${baseRadius * 80}px`,
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(circle, ${node.color}40 0%, ${node.color}15 50%, transparent 70%)`,
                boxShadow: `0 0 30px ${node.color}50, 0 0 60px ${node.color}30`,
                border: `2px solid ${node.color}60`,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={symbol}
                  style={{
                    width: '75%',
                    height: '75%',
                    objectFit: 'contain',
                    opacity: dimOpacity,
                    filter: `drop-shadow(0 0 12px ${node.color}) drop-shadow(0 0 24px ${node.color}80)`,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: `${baseRadius * 28}px`,
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    textShadow: `0 0 15px ${node.color}, 0 0 30px ${node.color}, 0 0 45px ${node.color}80`,
                    opacity: dimOpacity,
                  }}
                >
                  {symbol.slice(0, 4).toUpperCase()}
                </span>
              )}
            </div>
          </Html>
        </group>
      </Billboard>

      {/* Layer 5: Selection particles */}
      {isSelected && !isDimmed && (
        <SelectionParticles radius={baseRadius * 2} color={node.color} />
      )}

      {/* Layer 6: Orbital ring when selected */}
      {isSelected && !isDimmed && (
        <OrbitalRing radius={baseRadius * 2} color={CRYPTO_COLORS.cryptoCyan} />
      )}

      {/* Layer 7: HUD Label - ABOVE the token, not overlapping */}
      {!isDimmed && (
        <Html
          position={[0, baseRadius * hoverScale * 1.8 + 0.8, 0]}
          center
          distanceFactor={12}
          occlude={false}
          style={{
            transition: 'all 0.2s ease',
            opacity: isHovered || isSelected ? 1 : 0.9,
            transform: `scale(${isHovered || isSelected ? 1.1 : 1})`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${isSelected ? CRYPTO_COLORS.cryptoCyan : node.color}80`,
              borderRadius: '6px',
              padding: '6px 14px',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              boxShadow: isSelected
                ? `0 0 20px ${CRYPTO_COLORS.cryptoCyan}60, 0 4px 12px rgba(0,0,0,0.4)`
                : `0 0 12px ${node.color}40, 0 4px 8px rgba(0,0,0,0.3)`,
            }}
          >
            <div
              style={{
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '1px',
              }}
            >
              {(symbol.length > 6 ? symbol.slice(0, 6) : symbol).toUpperCase()}
            </div>
            {(isHovered || isSelected) && (
              <>
                {tokenData.name && (
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      marginTop: '3px',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tokenData.name.toUpperCase()}
                  </div>
                )}
                {tokenData.totalVolume && (
                  <div
                    style={{
                      color: node.color,
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      marginTop: '4px',
                      textShadow: `0 0 8px ${node.color}`,
                    }}
                  >
                    {formatVolume(tokenData.totalVolume)}
                  </div>
                )}
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// =============================================
// Selection Particles Effect
// =============================================

interface SelectionParticlesProps {
  radius: number;
  color: string;
}

const SelectionParticles: React.FC<SelectionParticlesProps> = ({ radius, color }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 20;

  // Create particle positions
  const positions = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const r = radius * (0.9 + Math.random() * 0.3);
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.4;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, [radius]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += 0.012;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

// =============================================
// Orbital Ring Effect
// =============================================

interface OrbitalRingProps {
  radius: number;
  color: string;
}

const OrbitalRing: React.FC<OrbitalRingProps> = ({ radius, color }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime) * 0.15;
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, 0.015, 8, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// =============================================
// Helper Functions
// =============================================

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

export default TokenSatellite;
