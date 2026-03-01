import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { GraphNode, TokenNode, PRO_COLORS } from '../../../types/three-scene';

// =============================================
// Token Billboard - Real Logo Display
// Professional circular token with actual logo
// =============================================

interface TokenBillboardProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

// Fallback gradient texture for tokens without logo
const createFallbackTexture = (symbol: string, color: string): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, PRO_COLORS.bgSecondary);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Symbol text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol.slice(0, 4).toUpperCase(), 64, 64);

  return new THREE.CanvasTexture(canvas);
};

export const TokenBillboard: React.FC<TokenBillboardProps> = ({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoverScale, setHoverScale] = useState(1);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const tokenData = node.data as TokenNode;
  const symbol = tokenData.symbol || '?';
  const logoUrl = tokenData.logo;

  // Calculate size based on volume (larger volume = larger token)
  const baseSize = node.radius * 2.5;
  const volumeScale = Math.min(Math.max(tokenData.totalVolume / 100000, 0.6), 2);
  const size = baseSize * volumeScale;

  // Determine color based on token state
  const tokenColor = node.color;
  const isPositive = tokenColor === PRO_COLORS.buyPrimary || tokenColor.includes('10B981');

  // Load texture (logo or fallback)
  useEffect(() => {
    if (logoUrl) {
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = 'anonymous';
      loader.load(
        logoUrl,
        (loadedTexture) => {
          loadedTexture.minFilter = THREE.LinearFilter;
          loadedTexture.magFilter = THREE.LinearFilter;
          setTexture(loadedTexture);
        },
        undefined,
        () => {
          // On error, use fallback
          setTexture(createFallbackTexture(symbol, tokenColor));
        }
      );
    } else {
      setTexture(createFallbackTexture(symbol, tokenColor));
    }

    return () => {
      if (texture) texture.dispose();
    };
  }, [logoUrl, symbol, tokenColor]);

  // Animation
  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating
    const floatY = Math.sin(state.clock.elapsedTime * 0.5 + node.position[0]) * 0.1;
    groupRef.current.position.y = node.position[1] + floatY;

    // Scale animation
    const targetScale = isSelected ? 1.25 : isHovered ? 1.12 : 1;
    setHoverScale((prev) => THREE.MathUtils.lerp(prev, targetScale, 0.1));
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
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        {/* Outer glow ring */}
        <mesh scale={hoverScale * 1.15}>
          <ringGeometry args={[size * 0.48, size * 0.52, 64]} />
          <meshBasicMaterial
            color={isSelected ? PRO_COLORS.accentPrimary : tokenColor}
            transparent
            opacity={(isSelected ? 0.8 : isHovered ? 0.5 : 0.3) * dimOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Selection ring */}
        {isSelected && !isDimmed && (
          <mesh scale={hoverScale * 1.25}>
            <ringGeometry args={[size * 0.52, size * 0.56, 64]} />
            <meshBasicMaterial
              color={PRO_COLORS.gold}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Main circular token with logo */}
        <mesh scale={hoverScale}>
          <circleGeometry args={[size * 0.45, 64]} />
          {texture ? (
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={dimOpacity}
              depthWrite={false}
            />
          ) : (
            <meshBasicMaterial
              color={PRO_COLORS.bgSecondary}
              transparent
              opacity={dimOpacity}
            />
          )}
        </mesh>

        {/* Thin border ring */}
        <mesh scale={hoverScale}>
          <ringGeometry args={[size * 0.44, size * 0.46, 64]} />
          <meshBasicMaterial
            color={isSelected ? PRO_COLORS.accentPrimary : PRO_COLORS.neutral500}
            transparent
            opacity={0.8 * dimOpacity}
          />
        </mesh>
      </Billboard>

      {/* Info Label - Professional HUD Style */}
      {!isDimmed && (
        <Html
          position={[0, size * 0.6, 0]}
          center
          distanceFactor={12}
          occlude={false}
          style={{
            transition: 'all 0.15s ease-out',
            opacity: isHovered || isSelected ? 1 : 0.85,
            transform: `scale(${isHovered || isSelected ? 1.05 : 1})`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${PRO_COLORS.bgPrimary}F0, ${PRO_COLORS.bgSecondary}E8)`,
              border: `1px solid ${isSelected ? PRO_COLORS.accentPrimary : PRO_COLORS.neutral700}`,
              borderRadius: '6px',
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              boxShadow: isSelected
                ? `0 4px 20px ${PRO_COLORS.accentPrimary}30`
                : '0 2px 8px rgba(0,0,0,0.4)',
              minWidth: '70px',
            }}
          >
            {/* Symbol */}
            <div
              style={{
                color: PRO_COLORS.neutral100,
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              {symbol.toUpperCase()}
            </div>

            {/* Volume - Only show on hover/select */}
            {(isHovered || isSelected) && tokenData.totalVolume > 0 && (
              <div
                style={{
                  color: isPositive ? PRO_COLORS.buyPrimary : PRO_COLORS.sellPrimary,
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'JetBrains Mono, monospace',
                  marginTop: '2px',
                }}
              >
                {formatVolume(tokenData.totalVolume)}
              </div>
            )}

            {/* Token name on select */}
            {isSelected && tokenData.name && (
              <div
                style={{
                  color: PRO_COLORS.neutral300,
                  fontSize: '9px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  marginTop: '2px',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tokenData.name}
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

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

export default TokenBillboard;
