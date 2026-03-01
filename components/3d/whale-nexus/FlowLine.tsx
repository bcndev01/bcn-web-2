import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GraphEdge, GraphNode, PRO_COLORS } from '../../../types/three-scene';

// =============================================
// Flow Line - Professional Silk Thread Style
// Thin elegant curves with volume-based thickness
// =============================================

interface FlowLineProps {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  isHighlighted: boolean;
  isDimmed: boolean;
}

export const FlowLine: React.FC<FlowLineProps> = ({
  edge,
  sourceNode,
  targetNode,
  isHighlighted,
  isDimmed,
}) => {
  const tubeRef = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const particleProgress = useRef(0);

  // Calculate line thickness based on volume
  // $100 = very thin, $100K+ = thicker
  const volumeNormalized = Math.min(edge.amountUSD / 100000, 1);
  const baseThickness = 0.008 + volumeNormalized * 0.025; // 0.008 to 0.033
  const thickness = isDimmed ? baseThickness * 0.5 : isHighlighted ? baseThickness * 1.5 : baseThickness;

  // Color based on buy/sell
  const lineColor = edge.type === 'buy' ? PRO_COLORS.buyPrimary : PRO_COLORS.sellPrimary;
  const highlightColor = edge.type === 'buy' ? PRO_COLORS.buyLight : PRO_COLORS.sellLight;

  // Create curved path
  const { curve, tubeGeometry } = useMemo(() => {
    const start = new THREE.Vector3(...sourceNode.position);
    const end = new THREE.Vector3(...targetNode.position);

    // Elegant arc - higher arc for longer distances
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.y += distance * 0.12; // Subtle arc

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tubeGeometry = new THREE.TubeGeometry(curve, 32, thickness, 8, false);

    return { curve, tubeGeometry };
  }, [sourceNode.position, targetNode.position, thickness]);

  // Animate the flowing particle
  useFrame((state) => {
    if (!particleRef.current) return;

    // Move particle along curve
    const speed = edge.flowSpeed * 0.2;
    particleProgress.current = (particleProgress.current + speed * 0.01) % 1;

    const point = curve.getPoint(particleProgress.current);
    particleRef.current.position.copy(point);

    // Pulse effect
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
    const particleSize = 0.03 + volumeNormalized * 0.04;
    particleRef.current.scale.setScalar(pulse * particleSize * (isHighlighted ? 1.5 : 1));
  });

  // Opacity based on state
  const lineOpacity = isDimmed ? 0.1 : isHighlighted ? 0.9 : 0.5;
  const particleOpacity = isDimmed ? 0 : isHighlighted ? 1 : 0.7;

  return (
    <group>
      {/* Main flow line */}
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshBasicMaterial
          color={isHighlighted ? highlightColor : lineColor}
          transparent
          opacity={lineOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* Glow effect for highlighted lines */}
      {isHighlighted && !isDimmed && (
        <mesh geometry={new THREE.TubeGeometry(curve, 32, thickness * 2, 8, false)}>
          <meshBasicMaterial
            color={highlightColor}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Flowing particle (data packet) */}
      {!isDimmed && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color={isHighlighted ? '#ffffff' : highlightColor}
            transparent
            opacity={particleOpacity}
          />
        </mesh>
      )}

      {/* Volume indicator on highlight */}
      {isHighlighted && !isDimmed && (
        <FlowLineLabel
          curve={curve}
          amountUSD={edge.amountUSD}
          type={edge.type}
        />
      )}
    </group>
  );
};

// =============================================
// Flow Line Label - Shows transaction amount
// =============================================

interface FlowLineLabelProps {
  curve: THREE.QuadraticBezierCurve3;
  amountUSD: number;
  type: 'buy' | 'sell';
}

const FlowLineLabel: React.FC<FlowLineLabelProps> = ({ curve, amountUSD, type }) => {
  const midPoint = curve.getPoint(0.5);

  return (
    <Html
      position={[midPoint.x, midPoint.y + 0.3, midPoint.z]}
      center
      distanceFactor={15}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: type === 'buy'
            ? `linear-gradient(135deg, ${PRO_COLORS.buyDark}E0, ${PRO_COLORS.buyPrimary}D0)`
            : `linear-gradient(135deg, ${PRO_COLORS.sellDark}E0, ${PRO_COLORS.sellPrimary}D0)`,
          borderRadius: '4px',
          padding: '3px 8px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {type === 'buy' ? '↗' : '↘'} {formatVolume(amountUSD)}
        </span>
      </div>
    </Html>
  );
};

// =============================================
// Connections Group - Renders all flow lines
// =============================================

interface FlowLinesGroupProps {
  edges: GraphEdge[];
  nodes: GraphNode[];
  highlightedNodeId: string | null;
  hoveredNodeId?: string | null;
}

export const FlowLinesGroup: React.FC<FlowLinesGroupProps> = ({
  edges,
  nodes,
  highlightedNodeId,
  hoveredNodeId,
}) => {
  // Create node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Determine if any node is focused
  const hasFocusedNode = highlightedNodeId !== null || hoveredNodeId !== null;

  return (
    <group>
      {edges.map((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);

        if (!sourceNode || !targetNode) return null;

        // Check if this edge is connected to focused node
        const isConnectedToFocused = highlightedNodeId
          ? edge.source === highlightedNodeId || edge.target === highlightedNodeId
          : hoveredNodeId
            ? edge.source === hoveredNodeId || edge.target === hoveredNodeId
            : false;

        // Dim edges not connected to focused node
        const isDimmed = hasFocusedNode && !isConnectedToFocused;

        return (
          <FlowLine
            key={edge.id}
            edge={edge}
            sourceNode={sourceNode}
            targetNode={targetNode}
            isHighlighted={isConnectedToFocused}
            isDimmed={isDimmed}
          />
        );
      })}
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

export default FlowLine;
