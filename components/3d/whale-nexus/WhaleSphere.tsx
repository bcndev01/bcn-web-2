import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GraphNode, CRYPTO_COLORS } from '../../../types/three-scene';
import { HoloRing } from '../shared/CryptoMaterials';

// =============================================
// Whale Sphere Component - Iron Man HUD Style
// Glassmorphism with Fresnel rim lighting
// =============================================

interface WhaleSphereProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

export const WhaleSphere: React.FC<WhaleSphereProps> = ({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hoverScale, setHoverScale] = useState(1);

  // Get wallet data
  const walletData = node.data as any;
  const label = walletData.label || 'Unknown Whale';
  const category = walletData.category || 'Whale';

  // Calculate dimmed opacity
  const dimOpacity = isDimmed ? 0.2 : 1;

  // Animate sphere
  useFrame((state) => {
    if (!groupRef.current) return;

    // Subtle floating animation
    groupRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * 0.5 + node.position[0]) * 0.15;

    // Hover/select scale animation
    const targetScale = isSelected ? 1.25 : isHovered ? 1.12 : 1;
    setHoverScale(prev => THREE.MathUtils.lerp(prev, targetScale, 0.08));
    groupRef.current.scale.setScalar(hoverScale);

    // Rotating core
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.005;
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
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
        <sphereGeometry args={[node.radius * 1.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Layer 0: BLACK OCCLUSION MASK - arkadaki objeleri gizler */}
      <mesh>
        <icosahedronGeometry args={[node.radius * 0.95, 1]} />
        <meshBasicMaterial
          color="#000000"
          depthWrite={true}
          transparent={isDimmed}
          opacity={isDimmed ? 0.8 : 1}
        />
      </mesh>

      {/* Layer 1: Dark solid icosahedron core - slightly smaller */}
      <mesh>
        <icosahedronGeometry args={[node.radius * 0.75, 1]} />
        <meshStandardMaterial
          color="#050510"
          roughness={0.8}
          metalness={0.2}
          transparent
          opacity={dimOpacity}
        />
      </mesh>

      {/* Layer 2: Rotating wireframe icosahedron - NEON GLOW */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[node.radius, 1]} />
        <meshStandardMaterial
          wireframe
          color="#000000"
          emissive={node.color}
          emissiveIntensity={isSelected ? 3 : isHovered ? 2.2 : 1.5}
          toneMapped={false}
          transparent
          opacity={(isSelected ? 0.9 : isHovered ? 0.8 : 0.7) * dimOpacity}
        />
      </mesh>

      {/* Layer 3: Secondary wireframe - different rotation for depth */}
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <icosahedronGeometry args={[node.radius * 1.1, 1]} />
        <meshStandardMaterial
          wireframe
          color="#000000"
          emissive={node.color}
          emissiveIntensity={isSelected ? 1.5 : isHovered ? 1 : 0.6}
          toneMapped={false}
          transparent
          opacity={(isSelected ? 0.5 : isHovered ? 0.4 : 0.3) * dimOpacity}
        />
      </mesh>

      {/* Layer 4: Outer glow shell */}
      <mesh>
        <icosahedronGeometry args={[node.radius * 1.2, 2]} />
        <meshStandardMaterial
          color="#000000"
          emissive={node.color}
          emissiveIntensity={isSelected ? 2 : isHovered ? 1.4 : 0.8}
          toneMapped={false}
          transparent
          opacity={0.12 * dimOpacity}
        />
      </mesh>

      {/* Inner energy core - bright center for bloom */}
      <mesh>
        <icosahedronGeometry args={[node.radius * 0.3, 0]} />
        <meshStandardMaterial
          color="#000000"
          emissive={node.color}
          emissiveIntensity={isSelected ? 5 : isHovered ? 4 : 3}
          toneMapped={false}
          transparent
          opacity={0.95 * dimOpacity}
        />
      </mesh>

      {/* Bright white center point */}
      <mesh>
        <sphereGeometry args={[node.radius * 0.1, 12, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.98 * dimOpacity}
        />
      </mesh>

      {/* Holographic rings on selection */}
      {isSelected && (
        <>
          <HoloRing radius={node.radius * 1.6} color={CRYPTO_COLORS.cryptoCyan} rotationSpeed={0.5} />
          <group rotation={[0, 0, Math.PI / 4]}>
            <HoloRing radius={node.radius * 1.8} color={node.color} rotationSpeed={-0.3} />
          </group>
        </>
      )}

      {/* Hover ring */}
      {isHovered && !isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[node.radius * 1.3, node.radius * 1.4, 32]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* HUD Label - Always visible, crisp DOM element */}
      {!isDimmed && (
        <Html
          position={[0, node.radius + 0.3, 0]}
          center
          distanceFactor={12}
          occlude={false}
          style={{
            transition: 'all 0.2s ease',
            opacity: isHovered || isSelected ? 1 : 0.85,
            transform: `scale(${isHovered || isSelected ? 1.1 : 1})`,
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${isSelected ? CRYPTO_COLORS.cryptoCyan : node.color}`,
              borderRadius: '4px',
              padding: '4px 10px',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              boxShadow: isSelected
                ? `0 0 15px ${CRYPTO_COLORS.cryptoCyan}40`
                : `0 0 10px ${node.color}30`,
            }}
          >
            <div
              style={{
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'monospace',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {getCategoryCode(category)}
            </div>
            {(isHovered || isSelected) && (
              <>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    marginTop: '2px',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {label.toUpperCase()}
                </div>
                <div
                  style={{
                    color: node.color,
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    opacity: 0.8,
                  }}
                >
                  // {category.toUpperCase()}
                </div>
              </>
            )}
          </div>
        </Html>
      )}

      {/* Scanning lines effect on selection */}
      {isSelected && <ScanningLines radius={node.radius * 1.5} color={CRYPTO_COLORS.cryptoCyan} />}
    </group>
  );
};

// =============================================
// Scanning Lines Effect - Sci-Fi HUD
// =============================================

interface ScanningLinesProps {
  radius: number;
  color: string;
}

const ScanningLines: React.FC<ScanningLinesProps> = ({ radius, color }) => {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={linesRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, Math.PI / 2]}>
          <ringGeometry args={[radius * 0.95, radius, 4, 1, 0, Math.PI / 6]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Helper function to get category code - tech style
function getCategoryCode(category: string): string {
  switch (category) {
    case 'VC': return 'VC';
    case 'Whale': return 'WHL';
    case 'Early Adopter': return 'EA';
    case 'Influencer': return 'INF';
    case 'DEX Trader': return 'DEX';
    case 'Sniper Bot': return 'BOT';
    case 'Insider': return 'INS';
    default: return 'WHL';
  }
}

export default WhaleSphere;
