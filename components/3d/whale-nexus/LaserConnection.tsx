import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphEdge, GraphNode, CRYPTO_COLORS } from '../../../types/three-scene';

// =============================================
// Laser Connection Component - Neon Energy Beam
// Animated particles flowing along curved path
// =============================================

interface LaserConnectionProps {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  isHighlighted: boolean;
  isDimmed: boolean;
}

export const LaserConnection: React.FC<LaserConnectionProps> = ({
  edge,
  sourceNode,
  targetNode,
  isHighlighted,
  isDimmed,
}) => {
  const flowRef = useRef<THREE.Points>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const dataPacketRef = useRef<THREE.Group>(null);
  const dashOffset = useRef(0);

  // Number of flowing particles - more for better visibility
  const flowCount = isHighlighted ? 20 : 12;

  // Data packet count - fewer but larger, more visible
  const dataPacketCount = isHighlighted ? 3 : 2;

  // Calculate curved path
  const { curve, flowPositions } = useMemo(() => {
    const start = new THREE.Vector3(...sourceNode.position);
    const end = new THREE.Vector3(...targetNode.position);

    // Create curved path (quadratic bezier) - arc upward
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.y += distance * 0.15; // Arc height proportional to distance

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

    // Flow particle positions (will be updated in animation)
    const flowPositions = new Float32Array(flowCount * 3);

    return { curve, flowPositions };
  }, [sourceNode.position, targetNode.position, flowCount]);

  // Animate the flow particles
  useFrame((state) => {
    if (!flowRef.current) return;

    // Update dash offset for flowing animation
    dashOffset.current += edge.flowSpeed * 0.015;
    if (dashOffset.current > 1) dashOffset.current = 0;

    // Update flow particle positions along curve
    const posArray = flowRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < flowCount; i++) {
      // Stagger particles along the path
      const t = (dashOffset.current + i / flowCount) % 1;
      const point = curve.getPoint(t);

      // Add slight wobble for energy effect
      const wobble = Math.sin(state.clock.elapsedTime * 4 + i) * 0.05;

      posArray[i * 3] = point.x + wobble;
      posArray[i * 3 + 1] = point.y + wobble;
      posArray[i * 3 + 2] = point.z + wobble;
    }
    flowRef.current.geometry.attributes.position.needsUpdate = true;

    // Pulse the beam emissive intensity - artırılmış değerler
    if (beamRef.current && beamRef.current.material) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      const baseIntensity = isDimmed ? 1 : (isHighlighted ? 3.5 : 2);
      mat.emissiveIntensity = baseIntensity + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    }

    // Pulse the glow - artırılmış değerler
    if (glowRef.current && glowRef.current.material) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      const baseGlow = isDimmed ? 0.5 : (isHighlighted ? 2 : 1);
      mat.emissiveIntensity = baseGlow + Math.sin(state.clock.elapsedTime * 3) * 0.4;
    }

    // Animate data packets - large bright spheres traveling along beam
    if (dataPacketRef.current) {
      const children = dataPacketRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const packet = children[i];
        // Stagger packets with different speeds
        const speed = edge.flowSpeed * (0.8 + i * 0.15);
        const t = ((state.clock.elapsedTime * speed * 0.3) + (i / dataPacketCount)) % 1;
        const point = curve.getPoint(t);
        packet.position.set(point.x, point.y, point.z);

        // Pulse scale for "breathing" effect
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5 + i * 2) * 0.2;
        packet.scale.setScalar(scale);
      }
    }
  });

  // Base opacity and size based on state - enhanced for visibility
  const beamOpacity = isDimmed ? 0.15 : (isHighlighted ? 0.95 : 0.6);
  const glowOpacity = isDimmed ? 0.08 : (isHighlighted ? 0.6 : 0.25);
  const particleSize = isDimmed ? 0.12 : (isHighlighted ? 0.35 : 0.2);
  const particleOpacity = isDimmed ? 0.4 : (isHighlighted ? 1 : 0.85);

  // Tube radius - KALIN neon lazer efekti için 2x artırıldı
  const tubeRadius = isDimmed ? 0.03 : (isHighlighted ? 0.08 : 0.05);
  const glowTubeRadius = tubeRadius * 2;

  return (
    <group>
      {/* Main beam - tube geometry for consistent width */}
      <mesh ref={beamRef}>
        <tubeGeometry args={[curve, 32, tubeRadius, 8, false]} />
        <meshStandardMaterial
          color="#000000"
          emissive={edge.color}
          emissiveIntensity={isHighlighted ? 3.5 : 2}
          toneMapped={false}
          transparent
          opacity={beamOpacity}
        />
      </mesh>

      {/* Outer glow tube */}
      <mesh ref={glowRef}>
        <tubeGeometry args={[curve, 32, glowTubeRadius, 8, false]} />
        <meshStandardMaterial
          color="#000000"
          emissive={edge.color}
          emissiveIntensity={isHighlighted ? 2 : 1}
          toneMapped={false}
          transparent
          opacity={glowOpacity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Flow particles - energy orbs traveling along the beam */}
      <points ref={flowRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={flowCount}
            array={flowPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={edge.color}
          size={particleSize}
          transparent
          opacity={particleOpacity}
          depthWrite={false}
          sizeAttenuation
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* DATA PACKETS - Large bright spheres traveling along beam */}
      {!isDimmed && (
        <group ref={dataPacketRef}>
          {Array.from({ length: dataPacketCount }).map((_, i) => (
            <group key={i}>
              {/* Core - bright white center */}
              <mesh>
                <sphereGeometry args={[isHighlighted ? 0.12 : 0.08, 12, 12]} />
                <meshBasicMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.95}
                />
              </mesh>
              {/* Glow shell - colored */}
              <mesh>
                <sphereGeometry args={[isHighlighted ? 0.2 : 0.14, 12, 12]} />
                <meshStandardMaterial
                  color="#000000"
                  emissive={edge.color}
                  emissiveIntensity={isHighlighted ? 4 : 3}
                  toneMapped={false}
                  transparent
                  opacity={0.6}
                />
              </mesh>
              {/* Outer glow - additive */}
              <mesh>
                <sphereGeometry args={[isHighlighted ? 0.35 : 0.25, 8, 8]} />
                <meshBasicMaterial
                  color={edge.color}
                  transparent
                  opacity={0.25}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
};

// =============================================
// Multiple Connections Group
// =============================================

interface ConnectionsGroupProps {
  edges: GraphEdge[];
  nodes: GraphNode[];
  highlightedNodeId: string | null;
  hoveredNodeId?: string | null;
}

export const ConnectionsGroup: React.FC<ConnectionsGroupProps> = ({
  edges,
  nodes,
  highlightedNodeId,
  hoveredNodeId,
}) => {
  // Create node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Determine if any node is focused (selected or hovered)
  const hasFocusedNode = highlightedNodeId !== null || hoveredNodeId !== null;

  return (
    <group>
      {edges.map(edge => {
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
          <LaserConnection
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

export default LaserConnection;
