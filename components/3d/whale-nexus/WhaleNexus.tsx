import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { Loader2, RefreshCw, Info, TrendingUp, TrendingDown, X } from 'lucide-react';

import { useWhaleGraph } from '../../../hooks/useWhaleGraph';
import { NexusEffects } from '../shared/PostProcessing';
import { WhaleSphere } from './WhaleSphere';
import { TokenSatellite } from './TokenSatellite';
import { ConnectionsGroup } from './LaserConnection';
import { PRO_COLORS, CRYPTO_COLORS } from '../../../types/three-scene';

// =============================================
// Whale Nexus - Professional Intelligence Dashboard
// Bloomberg/Nansen style visualization
// =============================================

const WhaleNexus: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    hoveredNodeId,
    selectNode,
    hoverNode,
    refresh,
    stats,
    loading,
    error,
    lastUpdated,
  } = useWhaleGraph();

  const [cameraPosition] = useState<[number, number, number]>([28, 20, 28]);
  const [showStats, setShowStats] = useState(true);

  // Determine which node is "focused" for dim effect
  const focusedNodeId = selectedNodeId || hoveredNodeId;

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    console.log('NODE CLICKED:', nodeId);
    if (selectedNodeId === nodeId) {
      selectNode(null);
    } else {
      selectNode(nodeId);
    }
  }, [selectedNodeId, selectNode]);

  // Debug: log selectedNodeId changes
  console.log('CURRENT selectedNodeId:', selectedNodeId, 'nodes count:', nodes.length);

  // Check if a node should be dimmed (not connected to focused node)
  const getConnectedNodeIds = useMemo(() => {
    if (!focusedNodeId) return new Set<string>();

    const connected = new Set<string>();
    connected.add(focusedNodeId);

    edges.forEach(edge => {
      if (edge.source === focusedNodeId) {
        connected.add(edge.target);
      } else if (edge.target === focusedNodeId) {
        connected.add(edge.source);
      }
    });

    return connected;
  }, [focusedNodeId, edges]);

  const isNodeDimmed = useCallback((nodeId: string) => {
    if (!focusedNodeId) return false;
    return !getConnectedNodeIds.has(nodeId);
  }, [focusedNodeId, getConnectedNodeIds]);

  // Format time since update
  const formatTimeSince = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Format volume
  const formatVolume = (amount: number): string => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  // Loading state
  if (loading && nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: PRO_COLORS.bgPrimary }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: PRO_COLORS.accentPrimary }} />
          <p className="text-slate-400 text-sm">Loading Intelligence Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: PRO_COLORS.bgPrimary }}>
        <div className="text-center">
          <p className="text-rose-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
            style={{
              background: `${PRO_COLORS.accentPrimary}20`,
              color: PRO_COLORS.accentPrimary,
              border: `1px solid ${PRO_COLORS.accentPrimary}40`,
            }}
          >
            <RefreshCw size={14} />
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: PRO_COLORS.bgPrimary }}>
      {/* 3D Canvas */}
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: 0,
        }}
        style={{ background: `linear-gradient(180deg, ${PRO_COLORS.bgPrimary} 0%, ${PRO_COLORS.bgSecondary} 100%)` }}
      >
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={cameraPosition} fov={50} near={0.1} far={200} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={70}
            autoRotate={!selectedNodeId}
            autoRotateSpeed={0.15}
            maxPolarAngle={Math.PI * 0.8}
            minPolarAngle={Math.PI * 0.2}
          />

          {/* Fog for depth - slate tones */}
          <fog attach="fog" args={[PRO_COLORS.bgPrimary, 40, 100]} />

          {/* Professional lighting - soft, not dramatic */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[20, 30, 20]}
            intensity={0.8}
            color="#ffffff"
          />
          <pointLight
            position={[-20, 15, -20]}
            intensity={0.3}
            color={PRO_COLORS.accentPrimary}
            distance={60}
          />

          {/* Subtle star field - fewer, more professional */}
          <Stars
            radius={150}
            depth={80}
            count={1500}
            factor={3}
            saturation={0}
            fade
            speed={0.2}
          />

          {/* Minimal dot grid floor */}
          <MinimalDotGrid />

          {/* Laser connections (render first so they're behind nodes) */}
          <ConnectionsGroup
            edges={edges}
            nodes={nodes}
            highlightedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
          />

          {/* Whale nodes - Neon Icosahedron */}
          {nodes
            .filter(node => node.type === 'whale')
            .map(node => (
              <WhaleSphere
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isHovered={hoveredNodeId === node.id}
                isDimmed={isNodeDimmed(node.id)}
                onClick={() => handleNodeClick(node.id)}
                onPointerOver={() => hoverNode(node.id)}
                onPointerOut={() => hoverNode(null)}
              />
            ))}

          {/* Token nodes - Glow sphere with logo */}
          {nodes
            .filter(node => node.type === 'token')
            .map(node => (
              <TokenSatellite
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                isHovered={hoveredNodeId === node.id}
                isDimmed={isNodeDimmed(node.id)}
                onClick={() => handleNodeClick(node.id)}
                onPointerOver={() => hoverNode(node.id)}
                onPointerOut={() => hoverNode(null)}
              />
            ))}

          {/* Post-processing - neon bloom */}
          <NexusEffects />
        </Suspense>
      </Canvas>

      {/* UI Overlay - Professional Stats Panel */}
      {showStats && (
        <div
          className="absolute top-4 left-4 rounded-xl p-4 min-w-[240px]"
          style={{
            background: `linear-gradient(135deg, ${PRO_COLORS.bgPrimary}F5, ${PRO_COLORS.bgSecondary}F0)`,
            border: `1px solid ${PRO_COLORS.neutral700}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: PRO_COLORS.neutral100 }}>
              Whale Intelligence
            </h3>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: PRO_COLORS.buyPrimary }}
              ></div>
              <span className="text-[10px] font-medium" style={{ color: PRO_COLORS.buyPrimary }}>
                LIVE
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span style={{ color: PRO_COLORS.neutral500 }}>Active Wallets</span>
              <span className="font-mono font-semibold" style={{ color: PRO_COLORS.accentPrimary }}>
                {stats.whaleCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: PRO_COLORS.neutral500 }}>Tokens Tracked</span>
              <span className="font-mono font-semibold" style={{ color: PRO_COLORS.neutral100 }}>
                {stats.tokenCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: PRO_COLORS.neutral500 }}>Active Flows</span>
              <span className="font-mono" style={{ color: PRO_COLORS.neutral300 }}>
                {stats.edgeCount}
              </span>
            </div>

            <div className="border-t my-3" style={{ borderColor: PRO_COLORS.neutral700 }}></div>

            {/* Buy/Sell Flow */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} style={{ color: PRO_COLORS.buyPrimary }} />
                <span style={{ color: PRO_COLORS.neutral500 }}>Inflow</span>
              </div>
              <span className="font-mono font-medium" style={{ color: PRO_COLORS.buyPrimary }}>
                {formatVolume(stats.totalBuyVolume)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} style={{ color: PRO_COLORS.sellPrimary }} />
                <span style={{ color: PRO_COLORS.neutral500 }}>Outflow</span>
              </div>
              <span className="font-mono font-medium" style={{ color: PRO_COLORS.sellPrimary }}>
                {formatVolume(stats.totalSellVolume)}
              </span>
            </div>

            {/* Net Flow - Prominent */}
            <div
              className="flex justify-between items-center p-2 rounded-lg mt-2"
              style={{
                background: stats.netFlow >= 0
                  ? `${PRO_COLORS.buyPrimary}15`
                  : `${PRO_COLORS.sellPrimary}15`,
              }}
            >
              <span className="font-medium" style={{ color: PRO_COLORS.neutral300 }}>
                Net Flow
              </span>
              <span
                className="font-mono font-bold text-sm"
                style={{ color: stats.netFlow >= 0 ? PRO_COLORS.buyPrimary : PRO_COLORS.sellPrimary }}
              >
                {stats.netFlow >= 0 ? '+' : ''}{formatVolume(stats.netFlow)}
              </span>
            </div>
          </div>

          <div className="text-[10px] mt-3 flex items-center gap-1" style={{ color: PRO_COLORS.neutral500 }}>
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: PRO_COLORS.neutral500 }}></div>
            Updated {formatTimeSince(lastUpdated)}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => refresh()}
          className="p-2.5 rounded-lg transition-all duration-200"
          style={{
            background: `${PRO_COLORS.bgPrimary}E0`,
            border: `1px solid ${PRO_COLORS.neutral700}`,
          }}
          title="Refresh Data"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
            style={{ color: PRO_COLORS.accentPrimary }}
          />
        </button>
        <button
          onClick={() => setShowStats(!showStats)}
          className="p-2.5 rounded-lg transition-all duration-200"
          style={{
            background: showStats ? `${PRO_COLORS.accentPrimary}20` : `${PRO_COLORS.bgPrimary}E0`,
            border: `1px solid ${showStats ? PRO_COLORS.accentPrimary : PRO_COLORS.neutral700}`,
            color: showStats ? PRO_COLORS.accentPrimary : PRO_COLORS.neutral500,
          }}
          title="Toggle Stats"
        >
          <Info size={16} />
        </button>
      </div>

      {/* Legend - Minimal */}
      <div
        className="absolute bottom-4 left-4 rounded-xl p-3"
        style={{
          background: `${PRO_COLORS.bgPrimary}E0`,
          border: `1px solid ${PRO_COLORS.neutral700}`,
        }}
      >
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded"
              style={{ backgroundColor: PRO_COLORS.neutral500 }}
            ></div>
            <span style={{ color: PRO_COLORS.neutral500 }}>Whale Wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PRO_COLORS.buyPrimary }}
            ></div>
            <span style={{ color: PRO_COLORS.neutral500 }}>Buy Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PRO_COLORS.sellPrimary }}
            ></div>
            <span style={{ color: PRO_COLORS.neutral500 }}>Sell Flow</span>
          </div>
        </div>
      </div>

      {/* Selected node info panel */}
      {selectedNodeId && (() => {
        const node = nodes.find(n => n.id === selectedNodeId);
        if (!node) return null;

        return (
          <div
            className="absolute bottom-4 right-4 rounded-xl p-4 min-w-[280px] max-w-[320px] z-50"
            style={{
              background: `linear-gradient(135deg, ${PRO_COLORS.bgPrimary}F8, ${PRO_COLORS.bgSecondary}F5)`,
              border: `1px solid ${PRO_COLORS.accentPrimary}40`,
              boxShadow: `0 4px 24px ${PRO_COLORS.accentPrimary}15`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: PRO_COLORS.neutral100 }}>
                  {node.type === 'whale'
                    ? (node.data as any).label || 'Unknown Wallet'
                    : (node.data as any).symbol || 'Token'}
                </h3>
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-medium inline-block mt-1"
                  style={{
                    backgroundColor: `${node.color}20`,
                    color: node.color,
                  }}
                >
                  {node.type === 'whale'
                    ? (node.data as any).category || 'Whale'
                    : 'Token'}
                </span>
              </div>
              <button
                onClick={() => selectNode(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200"
                style={{
                  color: PRO_COLORS.neutral500,
                  border: `1px solid ${PRO_COLORS.neutral700}`,
                }}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            {node.type === 'token' && (
              <div className="space-y-2 text-xs">
                <div style={{ color: PRO_COLORS.neutral300 }}>
                  {(node.data as any).name || 'Unknown Token'}
                </div>
                <div className="flex justify-between">
                  <span style={{ color: PRO_COLORS.neutral500 }}>Total Volume</span>
                  <span className="font-mono font-semibold" style={{ color: PRO_COLORS.neutral100 }}>
                    {formatVolume((node.data as any).totalVolume || 0)}
                  </span>
                </div>
              </div>
            )}

            {node.type === 'whale' && (
              <div className="space-y-2 text-xs">
                <div
                  className="font-mono text-[10px] px-2 py-1.5 rounded"
                  style={{
                    color: PRO_COLORS.neutral300,
                    backgroundColor: `${PRO_COLORS.neutral700}50`,
                  }}
                >
                  {(node.data as any).address}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Instructions overlay */}
      {nodes.length > 0 && !selectedNodeId && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <p
            className="text-xs px-4 py-2 rounded-full"
            style={{
              background: `${PRO_COLORS.bgPrimary}90`,
              color: PRO_COLORS.neutral500,
              border: `1px solid ${PRO_COLORS.neutral700}`,
            }}
          >
            Drag to rotate • Scroll to zoom • Click for details
          </p>
        </div>
      )}
    </div>
  );
};

// =============================================
// Minimal Dot Grid - Professional Reference Points
// =============================================

const MinimalDotGrid: React.FC = () => {
  const gridPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    const gridSize = 60;
    const spacing = 6;

    for (let x = -gridSize / 2; x <= gridSize / 2; x += spacing) {
      for (let z = -gridSize / 2; z <= gridSize / 2; z += spacing) {
        // Fade out dots further from center
        const distance = Math.sqrt(x * x + z * z);
        if (distance < gridSize / 2) {
          points.push([x, -5, z]);
        }
      }
    }

    return points;
  }, []);

  return (
    <group>
      {gridPoints.map((pos, i) => {
        const distance = Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]);
        const opacity = Math.max(0.1, 0.4 - distance / 80);

        return (
          <mesh key={i} position={pos}>
            <circleGeometry args={[0.08, 8]} />
            <meshBasicMaterial
              color={PRO_COLORS.neutral700}
              transparent
              opacity={opacity}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default WhaleNexus;
