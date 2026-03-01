import React, { Suspense, useState, useCallback, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  Line,
  Billboard,
  Text,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { Loader2, RefreshCw, Info, TrendingUp, TrendingDown, X } from 'lucide-react';
import * as THREE from 'three';

import { useWhaleGraph } from '../../../hooks/useWhaleGraph';
import { GraphNode, GraphEdge, TokenNode as TokenNodeType, PRO_COLORS } from '../../../types/three-scene';

// =============================================
// DESIGN SYSTEM - Bloomberg Terminal x Sci-Fi
// =============================================

const PREMIUM_COLORS = {
  // Background - Deep slate, not pure black
  bgDark: '#0b1016',
  bgMid: '#111827',

  // Whale nodes - Institutional blue
  whaleCore: '#4dabf7',
  whaleGlow: '#74c0fc',

  // Token rings
  tokenBuy: '#10b981',   // Emerald
  tokenSell: '#f43f5e',  // Rose

  // Connections
  lineBase: '#1e3a5f',
  lineBuy: '#10b981',
  lineSell: '#f43f5e',

  // UI
  labelBg: 'rgba(15, 23, 42, 0.75)',
  labelBorder: 'rgba(100, 116, 139, 0.3)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
};

// =============================================
// MAIN COMPONENT
// =============================================

const WhaleNexusPremium: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedNodeEdges,
    hoveredNodeId,
    selectNode,
    hoverNode,
    refresh,
    stats,
    loading,
    lastUpdated,
  } = useWhaleGraph();

  const [cameraPosition] = useState<[number, number, number]>([0, 15, 35]);

  const focusedNodeId = selectedNodeId || hoveredNodeId;

  const handleNodeClick = useCallback((nodeId: string) => {
    selectNode(selectedNodeId === nodeId ? null : nodeId);
  }, [selectedNodeId, selectNode]);

  const connectedNodeIds = useMemo(() => {
    if (!focusedNodeId) return new Set<string>();
    const connected = new Set<string>([focusedNodeId]);
    edges.forEach(edge => {
      if (edge.source === focusedNodeId) connected.add(edge.target);
      else if (edge.target === focusedNodeId) connected.add(edge.source);
    });
    return connected;
  }, [focusedNodeId, edges]);

  const isNodeDimmed = useCallback((nodeId: string) => {
    if (!focusedNodeId) return false;
    return !connectedNodeIds.has(nodeId);
  }, [focusedNodeId, connectedNodeIds]);

  const isEdgeDimmed = useCallback((edge: GraphEdge) => {
    if (!focusedNodeId) return false;
    return edge.source !== focusedNodeId && edge.target !== focusedNodeId;
  }, [focusedNodeId]);

  const formatVolume = (amount: number): string => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatTimeSince = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: PREMIUM_COLORS.bgDark }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: PREMIUM_COLORS.whaleCore }} />
          <p className="text-slate-500 text-xs font-mono">INITIALIZING NEXUS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <Suspense fallback={null}>
          {/* Background gradient via fog */}
          <color attach="background" args={[PREMIUM_COLORS.bgDark]} />
          <fog attach="fog" args={[PREMIUM_COLORS.bgDark, 50, 120]} />

          {/* Camera */}
          <PerspectiveCamera makeDefault position={cameraPosition} fov={45} near={0.1} far={200} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={15}
            maxDistance={80}
            autoRotate={!selectedNodeId}
            autoRotateSpeed={0.08}
            maxPolarAngle={Math.PI * 0.75}
            minPolarAngle={Math.PI * 0.25}
          />

          {/* Subtle ambient lighting */}
          <ambientLight intensity={0.15} />
          <directionalLight position={[10, 20, 10]} intensity={0.4} color="#ffffff" />
          <pointLight position={[-15, 10, -15]} intensity={0.2} color={PREMIUM_COLORS.whaleCore} distance={50} />

          {/* Subtle grid floor */}
          <SubtleGrid />

          {/* Sparse dust particles */}
          <DustParticles />

          {/* Connections - hairline bezier curves */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <DataConnection
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isDimmed={isEdgeDimmed(edge)}
                isHighlighted={focusedNodeId ? !isEdgeDimmed(edge) : false}
              />
            );
          })}

          {/* Whale nodes - glass icosahedrons */}
          {nodes.filter(n => n.type === 'whale').map(node => (
            <WhaleNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isHovered={hoveredNodeId === node.id}
              isDimmed={isNodeDimmed(node.id)}
              onClick={() => handleNodeClick(node.id)}
              onHover={(hover) => hoverNode(hover ? node.id : null)}
            />
          ))}

          {/* Token nodes - floating coins */}
          {nodes.filter(n => n.type === 'token').map(node => (
            <TokenCoin
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isHovered={hoveredNodeId === node.id}
              isDimmed={isNodeDimmed(node.id)}
              onClick={() => handleNodeClick(node.id)}
              onHover={(hover) => hoverNode(hover ? node.id : null)}
            />
          ))}

          {/* Selective bloom post-processing */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={1.2}
              luminanceSmoothing={0.9}
              intensity={0.6}
              mipmapBlur
            />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Stats Panel - Glassmorphism */}
      <div
        className="absolute top-4 left-4 rounded-lg p-4 min-w-[200px]"
        style={{
          background: PREMIUM_COLORS.labelBg,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${PREMIUM_COLORS.labelBorder}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold tracking-wider flex items-center gap-2" style={{ color: PREMIUM_COLORS.textPrimary }}>
            WHALE NEXUS
            <span
              className="text-[8px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                color: '#fbbf24',
              }}
            >
              BETA
            </span>
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PREMIUM_COLORS.tokenBuy }} />
            <span className="text-[9px] font-mono" style={{ color: PREMIUM_COLORS.tokenBuy }}>LIVE</span>
          </div>
        </div>

        <div className="space-y-2 text-[10px] font-mono">
          <div className="flex justify-between">
            <span style={{ color: PREMIUM_COLORS.textSecondary }}>WALLETS</span>
            <span style={{ color: PREMIUM_COLORS.whaleCore }}>{stats.whaleCount}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: PREMIUM_COLORS.textSecondary }}>TOKENS</span>
            <span style={{ color: PREMIUM_COLORS.textPrimary }}>{stats.tokenCount}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: PREMIUM_COLORS.textSecondary }}>FLOWS</span>
            <span style={{ color: PREMIUM_COLORS.textSecondary }}>{stats.edgeCount}</span>
          </div>

          <div className="border-t my-2" style={{ borderColor: PREMIUM_COLORS.labelBorder }} />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <TrendingUp size={10} style={{ color: PREMIUM_COLORS.tokenBuy }} />
              <span style={{ color: PREMIUM_COLORS.textSecondary }}>IN</span>
            </div>
            <span style={{ color: PREMIUM_COLORS.tokenBuy }}>{formatVolume(stats.totalBuyVolume)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <TrendingDown size={10} style={{ color: PREMIUM_COLORS.tokenSell }} />
              <span style={{ color: PREMIUM_COLORS.textSecondary }}>OUT</span>
            </div>
            <span style={{ color: PREMIUM_COLORS.tokenSell }}>{formatVolume(stats.totalSellVolume)}</span>
          </div>

          <div
            className="flex justify-between items-center p-1.5 rounded mt-1"
            style={{ background: stats.netFlow >= 0 ? `${PREMIUM_COLORS.tokenBuy}15` : `${PREMIUM_COLORS.tokenSell}15` }}
          >
            <span style={{ color: PREMIUM_COLORS.textSecondary }}>NET</span>
            <span style={{ color: stats.netFlow >= 0 ? PREMIUM_COLORS.tokenBuy : PREMIUM_COLORS.tokenSell }}>
              {stats.netFlow >= 0 ? '+' : ''}{formatVolume(stats.netFlow)}
            </span>
          </div>
        </div>

        <div className="text-[8px] mt-2 font-mono" style={{ color: PREMIUM_COLORS.textSecondary }}>
          {formatTimeSince(lastUpdated)}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={() => refresh()}
        className="absolute top-4 right-4 p-2 rounded-lg transition-all"
        style={{
          background: PREMIUM_COLORS.labelBg,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${PREMIUM_COLORS.labelBorder}`,
        }}
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: PREMIUM_COLORS.textSecondary }} />
      </button>

      {/* Selected Node Info Panel */}
      {selectedNodeId && (() => {
        const node = nodes.find(n => n.id === selectedNodeId);
        if (!node) return null;

        const isWhale = node.type === 'whale';
        const data = node.data as any;

        // Calculate connected stats
        const connectedEdges = selectedNodeEdges || [];
        const buyEdges = connectedEdges.filter(e => e.type === 'buy');
        const sellEdges = connectedEdges.filter(e => e.type === 'sell');
        const totalBuyVol = buyEdges.reduce((sum, e) => sum + e.amountUSD, 0);
        const totalSellVol = sellEdges.reduce((sum, e) => sum + e.amountUSD, 0);
        const netFlow = totalBuyVol - totalSellVol;

        // Get connected nodes
        const connectedNodeIds = new Set<string>();
        connectedEdges.forEach(e => {
          if (e.source !== selectedNodeId) connectedNodeIds.add(e.source);
          if (e.target !== selectedNodeId) connectedNodeIds.add(e.target);
        });

        return (
          <div
            className="absolute bottom-4 right-4 rounded-lg p-4 min-w-[280px] max-w-[320px] z-50"
            style={{
              background: PREMIUM_COLORS.labelBg,
              backdropFilter: 'blur(16px)',
              border: `1px solid ${PREMIUM_COLORS.labelBorder}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Icon/Logo */}
                {!isWhale && data.logo ? (
                  <img
                    src={data.logo}
                    alt={data.symbol}
                    className="w-10 h-10 rounded-full"
                    style={{ border: `2px solid ${node.color}` }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `${node.color}20`,
                      border: `2px solid ${node.color}`,
                      color: node.color,
                    }}
                  >
                    {isWhale ? '🐋' : data.symbol?.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-mono font-semibold" style={{ color: PREMIUM_COLORS.textPrimary }}>
                    {isWhale ? (data.label || 'Unknown Wallet') : (data.symbol || 'Token')}
                  </h3>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded inline-block mt-1"
                    style={{
                      backgroundColor: `${node.color}20`,
                      color: node.color,
                    }}
                  >
                    {isWhale ? (data.category || 'Whale') : 'TOKEN'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => selectNode(null)}
                className="p-1.5 rounded hover:bg-white/10 transition-all"
                style={{
                  color: PREMIUM_COLORS.textSecondary,
                  border: `1px solid ${PREMIUM_COLORS.labelBorder}`,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Token Details */}
            {!isWhale && (
              <div className="space-y-3">
                {data.name && (
                  <div className="text-[11px] font-mono" style={{ color: PREMIUM_COLORS.textSecondary }}>
                    {data.name}
                  </div>
                )}

                {/* Volume Stats */}
                <div
                  className="p-3 rounded-lg space-y-2"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  <div className="flex justify-between text-[10px] font-mono">
                    <span style={{ color: PREMIUM_COLORS.textSecondary }}>TOTAL VOLUME</span>
                    <span className="font-semibold" style={{ color: PREMIUM_COLORS.textPrimary }}>
                      {formatVolume(data.totalVolume || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={10} style={{ color: PREMIUM_COLORS.tokenBuy }} />
                      <span style={{ color: PREMIUM_COLORS.textSecondary }}>BUY VOL</span>
                    </span>
                    <span style={{ color: PREMIUM_COLORS.tokenBuy }}>{formatVolume(totalBuyVol)}</span>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-1">
                      <TrendingDown size={10} style={{ color: PREMIUM_COLORS.tokenSell }} />
                      <span style={{ color: PREMIUM_COLORS.textSecondary }}>SELL VOL</span>
                    </span>
                    <span style={{ color: PREMIUM_COLORS.tokenSell }}>{formatVolume(totalSellVol)}</span>
                  </div>

                  <div className="border-t pt-2 mt-2" style={{ borderColor: PREMIUM_COLORS.labelBorder }}>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span style={{ color: PREMIUM_COLORS.textSecondary }}>NET FLOW</span>
                      <span
                        className="font-bold"
                        style={{ color: netFlow >= 0 ? PREMIUM_COLORS.tokenBuy : PREMIUM_COLORS.tokenSell }}
                      >
                        {netFlow >= 0 ? '+' : ''}{formatVolume(netFlow)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connected Whales */}
                <div className="flex justify-between text-[10px] font-mono">
                  <span style={{ color: PREMIUM_COLORS.textSecondary }}>WHALE TRADERS</span>
                  <span style={{ color: PREMIUM_COLORS.whaleCore }}>{connectedNodeIds.size}</span>
                </div>

                {/* Activity Indicator */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: netFlow >= 0 ? PREMIUM_COLORS.tokenBuy : PREMIUM_COLORS.tokenSell }}
                  />
                  <span style={{ color: PREMIUM_COLORS.textSecondary }}>
                    {netFlow >= 0 ? 'Accumulation detected' : 'Distribution detected'}
                  </span>
                </div>
              </div>
            )}

            {/* Whale Details */}
            {isWhale && (
              <div className="space-y-3">
                {/* Address */}
                <div
                  className="px-2 py-2 rounded text-[9px] font-mono"
                  style={{
                    color: PREMIUM_COLORS.textSecondary,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    wordBreak: 'break-all',
                  }}
                >
                  {data.address}
                </div>

                {/* Performance Metrics */}
                <div
                  className="p-3 rounded-lg space-y-2"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  {data.winRate !== undefined && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span style={{ color: PREMIUM_COLORS.textSecondary }}>WIN RATE</span>
                      <span
                        style={{
                          color: data.winRate >= 60 ? PREMIUM_COLORS.tokenBuy : data.winRate >= 40 ? PREMIUM_COLORS.textPrimary : PREMIUM_COLORS.tokenSell
                        }}
                      >
                        {data.winRate.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {data.avgROI !== undefined && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span style={{ color: PREMIUM_COLORS.textSecondary }}>AVG ROI</span>
                      <span
                        style={{ color: data.avgROI >= 0 ? PREMIUM_COLORS.tokenBuy : PREMIUM_COLORS.tokenSell }}
                      >
                        {data.avgROI >= 0 ? '+' : ''}{data.avgROI.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {data.totalTrades !== undefined && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span style={{ color: PREMIUM_COLORS.textSecondary }}>TOTAL TRADES</span>
                      <span style={{ color: PREMIUM_COLORS.textPrimary }}>{data.totalTrades}</span>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2" style={{ borderColor: PREMIUM_COLORS.labelBorder }}>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span style={{ color: PREMIUM_COLORS.textSecondary }}>NET FLOW</span>
                      <span
                        className="font-bold"
                        style={{ color: netFlow >= 0 ? PREMIUM_COLORS.tokenBuy : PREMIUM_COLORS.tokenSell }}
                      >
                        {netFlow >= 0 ? '+' : ''}{formatVolume(netFlow)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connected Tokens */}
                <div className="flex justify-between text-[10px] font-mono">
                  <span style={{ color: PREMIUM_COLORS.textSecondary }}>TOKENS TRADED</span>
                  <span style={{ color: PREMIUM_COLORS.whaleCore }}>{connectedNodeIds.size}</span>
                </div>

                {/* Risk Level */}
                {data.riskLevel && (
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span style={{ color: PREMIUM_COLORS.textSecondary }}>RISK LEVEL</span>
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: data.riskLevel === 'low' ? `${PREMIUM_COLORS.tokenBuy}20` :
                                        data.riskLevel === 'medium' ? 'rgba(251, 191, 36, 0.2)' :
                                        `${PREMIUM_COLORS.tokenSell}20`,
                        color: data.riskLevel === 'low' ? PREMIUM_COLORS.tokenBuy :
                               data.riskLevel === 'medium' ? '#fbbf24' :
                               PREMIUM_COLORS.tokenSell,
                      }}
                    >
                      {data.riskLevel.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Activity Status */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: data.isActive ? PREMIUM_COLORS.tokenBuy : PREMIUM_COLORS.textSecondary,
                      animation: data.isActive ? 'pulse 2s infinite' : 'none',
                    }}
                  />
                  <span style={{ color: PREMIUM_COLORS.textSecondary }}>
                    {data.isActive ? 'Active trader' : 'Inactive'}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Instructions */}
      {nodes.length > 0 && !selectedNodeId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p
            className="text-[10px] font-mono px-3 py-1.5 rounded"
            style={{
              background: PREMIUM_COLORS.labelBg,
              color: PREMIUM_COLORS.textSecondary,
              border: `1px solid ${PREMIUM_COLORS.labelBorder}`,
            }}
          >
            HOVER TO FOCUS • CLICK TO SELECT • SCROLL TO ZOOM
          </p>
        </div>
      )}
    </div>
  );
};

// =============================================
// SUBTLE GRID FLOOR
// =============================================

const SubtleGrid: React.FC = () => {
  const gridRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const result: [number, number, number][][] = [];
    const size = 80;
    const divisions = 40;
    const step = size / divisions;

    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const pos = i * step;
      // X lines
      result.push([[-size / 2, 0, pos], [size / 2, 0, pos]]);
      // Z lines
      result.push([[pos, 0, -size / 2], [pos, 0, size / 2]]);
    }
    return result;
  }, []);

  return (
    <group ref={gridRef} position={[0, -8, 0]}>
      {lines.map((line, i) => {
        const distance = Math.abs(line[0][0]) || Math.abs(line[0][2]);
        const opacity = Math.max(0.02, 0.08 - distance / 500);

        return (
          <Line
            key={i}
            points={line}
            color="#1e3a5f"
            lineWidth={0.5}
            transparent
            opacity={opacity}
          />
        );
      })}
    </group>
  );
};

// =============================================
// DUST PARTICLES
// =============================================

const DustParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#4dabf7" size={0.08} transparent opacity={0.3} sizeAttenuation depthWrite={false} />
    </points>
  );
};

// =============================================
// WHALE NODE - Glass Icosahedron
// =============================================

interface WhaleNodeProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onHover: (hover: boolean) => void;
}

const WhaleNode: React.FC<WhaleNodeProps> = ({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onHover,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const walletData = node.data as any;
  const label = walletData.label || 'Unknown';
  const category = walletData.category || 'Whale';

  const opacity = isDimmed ? 0.1 : 1;
  const scale = isSelected ? 1.15 : isHovered ? 1.08 : 1;

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.003;
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.008;
    }
    if (groupRef.current) {
      groupRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * 0.4 + node.position[0]) * 0.08;
    }
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      scale={scale}
    >
      {/* Invisible click target for reliable detection */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHover(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; onHover(false); }}
      >
        <sphereGeometry args={[node.radius * 1.8, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Glass core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[node.radius * 0.9, 0]} />
        <meshPhysicalMaterial
          color={PREMIUM_COLORS.whaleCore}
          transmission={0.6}
          roughness={0.2}
          metalness={0.8}
          thickness={0.5}
          transparent
          opacity={opacity * 0.9}
          envMapIntensity={1}
        />
      </mesh>

      {/* Inner glow core - for bloom */}
      <mesh>
        <sphereGeometry args={[node.radius * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={PREMIUM_COLORS.whaleGlow}
          transparent
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* Protective ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[node.radius * 1.3, 0.015, 8, 64]} />
        <meshBasicMaterial
          color={PREMIUM_COLORS.whaleCore}
          transparent
          opacity={opacity * 0.5}
        />
      </mesh>

      {/* Second ring - offset */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[node.radius * 1.2, 0.01, 8, 64]} />
        <meshBasicMaterial
          color={PREMIUM_COLORS.whaleGlow}
          transparent
          opacity={opacity * 0.3}
        />
      </mesh>

      {/* Label */}
      {!isDimmed && (
        <Html
          position={[0, node.radius + 0.6, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: PREMIUM_COLORS.labelBg,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${PREMIUM_COLORS.labelBorder}`,
              borderRadius: '4px',
              padding: '4px 8px',
              whiteSpace: 'nowrap',
              opacity: isHovered || isSelected ? 1 : 0.8,
            }}
          >
            <div
              style={{
                color: PREMIUM_COLORS.textPrimary,
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600,
              }}
            >
              {getCategoryCode(category)}
            </div>
            {(isHovered || isSelected) && (
              <div
                style={{
                  color: PREMIUM_COLORS.textSecondary,
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginTop: '2px',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {label.toUpperCase()}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// =============================================
// TOKEN NODE - Floating Coin with Ring
// =============================================

interface TokenCoinProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onHover: (hover: boolean) => void;
}

const TokenCoin: React.FC<TokenCoinProps> = ({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onClick,
  onHover,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const tokenData = node.data as TokenNodeType;
  const symbol = tokenData.symbol || '?';
  const logoUrl = tokenData.logo;
  const isBuy = node.color === PRO_COLORS.buyPrimary;
  const ringColor = isBuy ? PREMIUM_COLORS.tokenBuy : PREMIUM_COLORS.tokenSell;

  const opacity = isDimmed ? 0.1 : 1;
  const scale = isSelected ? 1.2 : isHovered ? 1.1 : 1;
  const coinSize = node.radius * 1.2;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * 0.6 + node.position[0] * 2) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group
      ref={groupRef}
      position={node.position}
      scale={scale}
    >
      {/* Invisible click target for reliable detection */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHover(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; onHover(false); }}
      >
        <sphereGeometry args={[coinSize * 1.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Glowing ring around token */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[coinSize * 0.9, 0.02, 8, 48]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={opacity * 0.9}
        />
      </mesh>

      {/* Outer glow ring - for bloom */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[coinSize * 0.9, 0.05, 8, 48]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={opacity * 0.3}
        />
      </mesh>

      {/* Center coin with logo */}
      <Billboard follow={true}>
        {/* Dark backing */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[coinSize * 0.7, 32]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={opacity * 0.95} />
        </mesh>

        {/* Logo or symbol via HTML */}
        <Html
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              width: `${coinSize * 40}px`,
              height: `${coinSize * 40}px`,
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0f172a',
              border: `1px solid ${ringColor}50`,
              opacity: opacity,
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={symbol}
                style={{
                  width: '70%',
                  height: '70%',
                  objectFit: 'contain',
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span
                style={{
                  color: ringColor,
                  fontSize: `${coinSize * 12}px`,
                  fontWeight: 'bold',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {symbol.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>
        </Html>
      </Billboard>

      {/* Center glow point - for selective bloom */}
      <mesh>
        <sphereGeometry args={[coinSize * 0.15, 8, 8]} />
        <meshBasicMaterial color={ringColor} transparent opacity={opacity * 0.9} />
      </mesh>

      {/* Label above */}
      {!isDimmed && (
        <Html
          position={[0, coinSize + 0.4, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: PREMIUM_COLORS.labelBg,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${PREMIUM_COLORS.labelBorder}`,
              borderRadius: '4px',
              padding: '3px 8px',
              whiteSpace: 'nowrap',
              opacity: isHovered || isSelected ? 1 : 0.85,
            }}
          >
            <div
              style={{
                color: PREMIUM_COLORS.textPrimary,
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600,
              }}
            >
              {symbol.toUpperCase()}
            </div>
            {(isHovered || isSelected) && tokenData.totalVolume && (
              <div
                style={{
                  color: ringColor,
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  marginTop: '2px',
                }}
              >
                {formatVol(tokenData.totalVolume)}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// =============================================
// DATA CONNECTION - Hairline Bezier with Packets
// =============================================

interface DataConnectionProps {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  isDimmed: boolean;
  isHighlighted: boolean;
}

const DataConnection: React.FC<DataConnectionProps> = ({
  edge,
  sourceNode,
  targetNode,
  isDimmed,
  isHighlighted,
}) => {
  const packetRef = useRef<THREE.Mesh>(null);
  const packetProgress = useRef(Math.random());

  const isBuy = edge.type === 'buy';
  const lineColor = isBuy ? PREMIUM_COLORS.lineBuy : PREMIUM_COLORS.lineSell;
  const opacity = isDimmed ? 0.05 : isHighlighted ? 0.6 : 0.25;

  // Create bezier curve
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...sourceNode.position);
    const end = new THREE.Vector3(...targetNode.position);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.y += start.distanceTo(end) * 0.15;

    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [sourceNode.position, targetNode.position]);

  const curvePoints = useMemo(() => curve.getPoints(50), [curve]);

  // Animate data packet
  useFrame(() => {
    if (!packetRef.current || isDimmed) return;

    packetProgress.current = (packetProgress.current + edge.flowSpeed * 0.003) % 1;
    const point = curve.getPoint(packetProgress.current);
    packetRef.current.position.copy(point);
  });

  return (
    <group>
      {/* Hairline connection */}
      <Line
        points={curvePoints}
        color={lineColor}
        lineWidth={isDimmed ? 0.5 : isHighlighted ? 1.5 : 1}
        transparent
        opacity={opacity}
      />

      {/* Data packet - small bright sphere */}
      {!isDimmed && (
        <mesh ref={packetRef}>
          <sphereGeometry args={[isHighlighted ? 0.08 : 0.05, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={isHighlighted ? 1 : 0.8} />
        </mesh>
      )}
    </group>
  );
};

// =============================================
// HELPERS
// =============================================

function getCategoryCode(category: string): string {
  const codes: Record<string, string> = {
    'VC': 'VC',
    'Whale': 'WHL',
    'Early Adopter': 'EA',
    'Influencer': 'INF',
    'DEX Trader': 'DEX',
    'Sniper Bot': 'BOT',
    'Insider': 'INS',
  };
  return codes[category] || 'WHL';
}

function formatVol(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

export default WhaleNexusPremium;
