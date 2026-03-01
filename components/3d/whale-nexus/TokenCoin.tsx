import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { GraphNode, TokenNode, PRO_COLORS } from '../../../types/three-scene';

// =============================================
// Token Coin - Solid Cylinder Like Real Coin
// NOT wireframe, NOT hollow rings
// =============================================

interface TokenCoinProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

// Create texture with logo or symbol
const createCoinTexture = (
  symbol: string,
  color: string,
  logoUrl?: string
): Promise<THREE.CanvasTexture> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Background - solid color with gradient
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, shadeColor(color, -30));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2);
    ctx.stroke();

    if (logoUrl) {
      // Try to load logo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw logo in center
        const logoSize = 100;
        ctx.save();
        ctx.beginPath();
        ctx.arc(128, 128, 50, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 128 - logoSize / 2, 128 - logoSize / 2, logoSize, logoSize);
        ctx.restore();
        resolve(new THREE.CanvasTexture(canvas));
      };
      img.onerror = () => {
        // Fallback to symbol
        drawSymbol(ctx, symbol);
        resolve(new THREE.CanvasTexture(canvas));
      };
      img.src = logoUrl;
    } else {
      // Draw symbol text
      drawSymbol(ctx, symbol);
      resolve(new THREE.CanvasTexture(canvas));
    }
  });
};

const drawSymbol = (ctx: CanvasRenderingContext2D, symbol: string) => {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol.slice(0, 4).toUpperCase(), 128, 128);
};

const shadeColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
};

export const TokenCoin: React.FC<TokenCoinProps> = ({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coinRef = useRef<THREE.Mesh>(null);
  const [hoverScale, setHoverScale] = useState(1);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const tokenData = node.data as TokenNode;
  const symbol = tokenData.symbol || '?';
  const logoUrl = tokenData.logo;

  // Determine color - green for buy signal, red for sell
  const coinColor = node.color;
  const isPositive = coinColor === PRO_COLORS.buyPrimary;

  // Size based on volume
  const volumeScale = Math.min(Math.max(tokenData.totalVolume / 80000, 0.7), 1.8);
  const coinRadius = node.radius * 1.8 * volumeScale;
  const coinThickness = coinRadius * 0.15; // Thin like real coin

  // Load texture
  useEffect(() => {
    createCoinTexture(symbol, coinColor, logoUrl).then(setTexture);
    return () => {
      if (texture) texture.dispose();
    };
  }, [symbol, coinColor, logoUrl]);

  // Animation - coins spin on their axis, stay upright
  useFrame((state) => {
    if (!groupRef.current || !coinRef.current) return;

    // Gentle floating
    const floatY = Math.sin(state.clock.elapsedTime * 0.5 + node.position[0] * 2) * 0.1;
    groupRef.current.position.y = node.position[1] + floatY;

    // Coin spin - rotate around Y axis (like spinning coin on table)
    coinRef.current.rotation.y += 0.008;

    // Scale animation
    const targetScale = isSelected ? 1.2 : isHovered ? 1.1 : 1;
    setHoverScale((prev) => THREE.MathUtils.lerp(prev, targetScale, 0.12));
    groupRef.current.scale.setScalar(hoverScale);
  });

  const dimOpacity = isDimmed ? 0.2 : 1;

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
      {/* Main coin - solid cylinder */}
      <mesh ref={coinRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[coinRadius, coinRadius, coinThickness, 32]} />
        <meshPhysicalMaterial
          color={coinColor}
          metalness={0.6}
          roughness={0.25}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          transparent
          opacity={dimOpacity}
        />
        {/* Edge highlight */}
        <Edges
          threshold={15}
          color={isSelected ? PRO_COLORS.gold : PRO_COLORS.neutral300}
          scale={1.001}
          lineWidth={isSelected ? 1.5 : 1}
        />
      </mesh>

      {/* Top face with texture/logo */}
      {texture && (
        <mesh
          position={[0, 0, coinThickness / 2 + 0.001]}
          rotation={[0, coinRef.current?.rotation.y || 0, 0]}
        >
          <circleGeometry args={[coinRadius * 0.95, 32]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={dimOpacity}
          />
        </mesh>
      )}

      {/* Glow ring when selected */}
      {isSelected && !isDimmed && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[coinRadius * 1.1, coinRadius * 1.2, 32]} />
          <meshBasicMaterial
            color={PRO_COLORS.gold}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Hover glow */}
      {isHovered && !isSelected && !isDimmed && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[coinRadius * 1.05, coinRadius * 1.12, 32]} />
          <meshBasicMaterial
            color={coinColor}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Info Label */}
      {!isDimmed && (
        <Html
          position={[0, coinRadius + 0.4, 0]}
          center
          distanceFactor={12}
          occlude={false}
          style={{
            transition: 'all 0.15s ease-out',
            opacity: isHovered || isSelected ? 1 : 0.85,
            transform: `scale(${isHovered || isSelected ? 1.08 : 1})`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${PRO_COLORS.bgPrimary}F5, ${PRO_COLORS.bgSecondary}F0)`,
              border: `1px solid ${isSelected ? PRO_COLORS.gold : coinColor}50`,
              borderRadius: '6px',
              padding: '6px 12px',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              boxShadow: isSelected
                ? `0 4px 16px ${PRO_COLORS.gold}25`
                : '0 2px 8px rgba(0,0,0,0.35)',
              minWidth: '60px',
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

            {/* Volume */}
            {(isHovered || isSelected) && tokenData.totalVolume > 0 && (
              <div
                style={{
                  color: isPositive ? PRO_COLORS.buyPrimary : PRO_COLORS.sellPrimary,
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'JetBrains Mono, monospace',
                  marginTop: '3px',
                }}
              >
                {formatVolume(tokenData.totalVolume)}
              </div>
            )}

            {/* Token name on select */}
            {isSelected && tokenData.name && (
              <div
                style={{
                  color: PRO_COLORS.neutral500,
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

export default TokenCoin;
