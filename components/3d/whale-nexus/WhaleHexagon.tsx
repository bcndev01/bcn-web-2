import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { GraphNode, PRO_COLORS, WALLET_CATEGORY_COLORS } from '../../../types/three-scene';
import { WalletCategory } from '../../../types/smartMoney';

// =============================================
// Whale Hexagon - Premium Vault Style
// Solid metallic/glass material - NOT wireframe
// =============================================

interface WhaleHexagonProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

export const WhaleHexagon: React.FC<WhaleHexagonProps> = ({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hoverScale, setHoverScale] = useState(1);

  // Get wallet data
  const walletData = node.data as any;
  const label = walletData.label || 'Unknown Whale';
  const category: WalletCategory = walletData.category || 'Whale';

  // Professional category colors
  const categoryColor = WALLET_CATEGORY_COLORS[category] || PRO_COLORS.accentPrimary;

  // Size based on volume/importance
  const baseRadius = node.radius * 1.0;
  const height = baseRadius * 0.5;

  // Animation - SMOOTH, ALIGNED rotation (not random tumbling)
  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;

    // Subtle floating - vertical only
    const floatY = Math.sin(state.clock.elapsedTime * 0.3 + node.position[0]) * 0.08;
    groupRef.current.position.y = node.position[1] + floatY;

    // ALIGNED rotation - all hexagons rotate on Y axis only, staying upright
    meshRef.current.rotation.y += 0.002;
    // Keep X and Z rotation at 0 for alignment
    meshRef.current.rotation.x = 0;
    meshRef.current.rotation.z = 0;

    // Scale animation
    const targetScale = isSelected ? 1.15 : isHovered ? 1.08 : 1;
    setHoverScale((prev) => THREE.MathUtils.lerp(prev, targetScale, 0.1));
    groupRef.current.scale.setScalar(hoverScale);
  });

  const dimOpacity = isDimmed ? 0.25 : 1;

  return (
    <group
      ref={groupRef}
      position={node.position}
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
      {/* Main solid hexagonal prism - PREMIUM DARK GLASS */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[baseRadius, baseRadius, height, 6]} />
        <meshPhysicalMaterial
          color={PRO_COLORS.bgSecondary}
          metalness={0.85}
          roughness={0.15}
          transmission={0.15}
          thickness={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1}
          transparent
          opacity={0.92 * dimOpacity}
        />
        {/* Glowing edges - category color */}
        <Edges
          threshold={15}
          color={isSelected ? PRO_COLORS.gold : categoryColor}
          scale={1.001}
          lineWidth={isSelected ? 2 : isHovered ? 1.5 : 1}
        />
      </mesh>

      {/* Inner glow core - gives depth */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[baseRadius * 0.7, baseRadius * 0.7, height * 0.8, 6]} />
        <meshStandardMaterial
          color="#000000"
          emissive={categoryColor}
          emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : 0.3}
          toneMapped={false}
          transparent
          opacity={0.5 * dimOpacity}
        />
      </mesh>

      {/* Top surface accent - subtle glow */}
      <mesh position={[0, height / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[baseRadius * 0.9, 6]} />
        <meshStandardMaterial
          color="#000000"
          emissive={categoryColor}
          emissiveIntensity={isSelected ? 1.2 : isHovered ? 0.8 : 0.4}
          toneMapped={false}
          transparent
          opacity={0.6 * dimOpacity}
        />
      </mesh>

      {/* Selection ring - gold highlight */}
      {isSelected && !isDimmed && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseRadius * 1.2, baseRadius * 1.3, 6]} />
          <meshBasicMaterial
            color={PRO_COLORS.gold}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Hover ring */}
      {isHovered && !isSelected && !isDimmed && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseRadius * 1.15, baseRadius * 1.2, 6]} />
          <meshBasicMaterial
            color={categoryColor}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Professional Info Label */}
      {!isDimmed && (
        <Html
          position={[0, height / 2 + 0.6, 0]}
          center
          distanceFactor={10}
          occlude={false}
          style={{
            transition: 'all 0.15s ease-out',
            opacity: isHovered || isSelected ? 1 : 0.9,
            transform: `scale(${isHovered || isSelected ? 1.05 : 1})`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${PRO_COLORS.bgPrimary}F8, ${PRO_COLORS.bgSecondary}F5)`,
              border: `1px solid ${isSelected ? PRO_COLORS.gold : categoryColor}60`,
              borderRadius: '8px',
              padding: '8px 14px',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              boxShadow: isSelected
                ? `0 4px 20px ${PRO_COLORS.gold}30`
                : `0 2px 12px rgba(0,0,0,0.4)`,
              minWidth: '90px',
            }}
          >
            {/* Category Badge */}
            <div
              style={{
                display: 'inline-block',
                background: `${categoryColor}25`,
                border: `1px solid ${categoryColor}50`,
                borderRadius: '4px',
                padding: '2px 10px',
                marginBottom: '5px',
              }}
            >
              <span
                style={{
                  color: categoryColor,
                  fontSize: '9px',
                  fontWeight: 700,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {getCategoryLabel(category)}
              </span>
            </div>

            {/* Label */}
            <div
              style={{
                color: PRO_COLORS.neutral100,
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'Inter, system-ui, sans-serif',
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {label}
            </div>

            {/* Wallet address preview on hover */}
            {(isHovered || isSelected) && walletData.address && (
              <div
                style={{
                  color: PRO_COLORS.neutral500,
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginTop: '4px',
                }}
              >
                {walletData.address.slice(0, 4)}...{walletData.address.slice(-4)}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// =============================================
// Helper Functions
// =============================================

function getCategoryLabel(category: WalletCategory): string {
  const labels: Record<WalletCategory, string> = {
    'VC': 'Venture Capital',
    'Whale': 'Whale',
    'Early Adopter': 'Early Adopter',
    'Influencer': 'Influencer',
    'DEX Trader': 'DEX Trader',
    'Sniper Bot': 'Bot',
    'Insider': 'Insider',
  };
  return labels[category] || 'Whale';
}

export default WhaleHexagon;
