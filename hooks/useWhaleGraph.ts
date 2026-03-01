// =============================================
// Whale Graph Hook
// Transforms TrendingTokens data into 3D graph nodes/edges
// Uses aggregated token data for visualization
// =============================================

import { useState, useMemo, useCallback } from 'react';
import { useSmartMoney } from './useSmartMoney';
import {
  GraphNode,
  GraphEdge,
  WhaleNexusData,
  TokenNode,
} from '../types/three-scene';

// =============================================
// Configuration
// =============================================

const GRAPH_CONFIG = {
  // Node sizing - tokens are the main focus
  MIN_TOKEN_RADIUS: 0.6,
  MAX_TOKEN_RADIUS: 1.3,

  // Aggregate flow node sizing (buyers/sellers indicators)
  FLOW_NODE_RADIUS: 0.35,

  // Graph layout
  TOKEN_RING_RADIUS: 18,
  FLOW_RING_RADIUS: 8,

  // Limits
  MAX_TOKENS: 25,

  // Colors
  BUY_COLOR: '#10b981',   // Emerald
  SELL_COLOR: '#f43f5e',  // Rose
  NEUTRAL_COLOR: '#4dabf7', // Cyan
  WHALE_COLOR: '#4dabf7', // Whale blue
};

// =============================================
// Hook
// =============================================

export function useWhaleGraph() {
  const {
    allTrendingTokens,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useSmartMoney();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // =============================================
  // Transform TrendingTokens to Graph
  // =============================================

  const graphData = useMemo((): WhaleNexusData => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Sort tokens by activity score and limit
    const sortedTokens = [...allTrendingTokens]
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, GRAPH_CONFIG.MAX_TOKENS);

    if (sortedTokens.length === 0) {
      return { nodes, edges, lastUpdated: lastUpdated || Date.now() };
    }

    // Group tokens by trend
    const accumulatingTokens = sortedTokens.filter(t => t.trend === 'accumulating');
    const distributingTokens = sortedTokens.filter(t => t.trend === 'distributing');
    const neutralTokens = sortedTokens.filter(t => t.trend === 'neutral');

    // Calculate max values for normalization
    const maxVolume = Math.max(...sortedTokens.map(t => t.totalVolume), 1);
    const maxActivityScore = Math.max(...sortedTokens.map(t => t.activityScore), 1);

    // Create flow hub nodes for each trend category
    const flowHubs: Array<{
      id: string;
      label: string;
      color: string;
      tokens: typeof sortedTokens;
      angle: number;
      type: 'buy' | 'sell';
    }> = [];

    if (accumulatingTokens.length > 0) {
      flowHubs.push({
        id: 'hub-accumulating',
        label: 'Accumulation',
        color: GRAPH_CONFIG.BUY_COLOR,
        tokens: accumulatingTokens,
        angle: -Math.PI / 2, // Top
        type: 'buy',
      });
    }

    if (distributingTokens.length > 0) {
      flowHubs.push({
        id: 'hub-distributing',
        label: 'Distribution',
        color: GRAPH_CONFIG.SELL_COLOR,
        tokens: distributingTokens,
        angle: Math.PI / 2, // Bottom
        type: 'sell',
      });
    }

    if (neutralTokens.length > 0) {
      flowHubs.push({
        id: 'hub-neutral',
        label: 'Neutral Flow',
        color: GRAPH_CONFIG.NEUTRAL_COLOR,
        tokens: neutralTokens,
        angle: Math.PI, // Left
        type: 'buy',
      });
    }

    // Create hub nodes
    const HUB_DISTANCE = 8;
    flowHubs.forEach((hub) => {
      const hubVolume = hub.tokens.reduce((sum, t) => sum + t.totalVolume, 0);
      const normalizedHubVolume = hubVolume / (maxVolume * hub.tokens.length || 1);

      nodes.push({
        id: hub.id,
        type: 'whale',
        position: [
          Math.cos(hub.angle) * HUB_DISTANCE,
          0,
          Math.sin(hub.angle) * HUB_DISTANCE,
        ],
        velocity: [0, 0, 0],
        radius: 0.6 + normalizedHubVolume * 0.4,
        color: hub.color,
        emissiveIntensity: 0.8,
        data: {
          address: hub.id,
          symbol: hub.label.slice(0, 4).toUpperCase(),
          name: hub.label,
          totalVolume: hubVolume,
        } as TokenNode,
      });
    });

    // Create token nodes arranged around their respective hubs
    flowHubs.forEach((hub) => {
      const tokenCount = hub.tokens.length;
      const baseAngle = hub.angle;
      const spreadAngle = Math.PI * 0.8; // Spread tokens in an arc

      hub.tokens.forEach((token, index) => {
        const normalizedVolume = token.totalVolume / maxVolume;
        const normalizedActivity = token.activityScore / maxActivityScore;

        // Calculate radius based on activity score
        const radius = GRAPH_CONFIG.MIN_TOKEN_RADIUS +
          normalizedActivity * (GRAPH_CONFIG.MAX_TOKEN_RADIUS - GRAPH_CONFIG.MIN_TOKEN_RADIUS);

        // Position tokens in an arc around their hub
        const tokenAngle = baseAngle + (index / Math.max(tokenCount - 1, 1) - 0.5) * spreadAngle;
        const distance = GRAPH_CONFIG.TOKEN_RING_RADIUS;
        const heightVariation = (index % 3 - 1) * 2;

        const tokenNodeId = `token-${token.tokenAddress}`;

        nodes.push({
          id: tokenNodeId,
          type: 'token',
          position: [
            Math.cos(tokenAngle) * distance,
            heightVariation,
            Math.sin(tokenAngle) * distance,
          ],
          velocity: [0, 0, 0],
          radius,
          color: hub.color,
          emissiveIntensity: 0.5 + normalizedActivity * 0.5,
          data: {
            address: token.tokenAddress,
            symbol: token.tokenSymbol,
            name: token.tokenName,
            logo: token.tokenLogo,
            totalVolume: token.totalVolume,
            buyVolume: token.buyVolume,
            sellVolume: token.sellVolume,
            netFlow: token.netFlow,
            price: token.price,
            marketCap: token.marketCap,
            liquidity: token.liquidity,
            priceChangeH1: token.priceChangeH1,
            priceChangeH24: token.priceChangeH24,
            activityScore: token.activityScore,
            trend: token.trend,
            buyCount: token.buyCount,
            sellCount: token.sellCount,
            buyRatio: token.buyRatio,
          } as TokenNode,
        });

        // Create edge from hub to token
        edges.push({
          id: `edge-${hub.id}-${token.tokenAddress}`,
          source: hub.id,
          target: tokenNodeId,
          weight: 0.3 + normalizedVolume * 0.7,
          color: hub.color,
          flowSpeed: 0.3 + normalizedActivity * 0.5,
          type: hub.type,
          amountUSD: token.totalVolume,
          timestamp: token.fetchedAt,
        });
      });
    });

    // Create connections between hubs to show flow relationships
    if (flowHubs.length > 1) {
      for (let i = 0; i < flowHubs.length; i++) {
        for (let j = i + 1; j < flowHubs.length; j++) {
          const hubA = flowHubs[i];
          const hubB = flowHubs[j];

          // Calculate flow between groups
          const flowAtoB = hubA.tokens.reduce((sum, t) => sum + t.sellVolume, 0);
          const flowBtoA = hubB.tokens.reduce((sum, t) => sum + t.sellVolume, 0);
          const totalFlow = flowAtoB + flowBtoA;

          if (totalFlow > 0) {
            edges.push({
              id: `edge-${hubA.id}-${hubB.id}`,
              source: hubA.id,
              target: hubB.id,
              weight: 0.2 + (totalFlow / maxVolume) * 0.3,
              color: GRAPH_CONFIG.WHALE_COLOR,
              flowSpeed: 0.2,
              type: flowAtoB > flowBtoA ? 'sell' : 'buy',
              amountUSD: totalFlow,
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    return {
      nodes,
      edges,
      lastUpdated: lastUpdated || Date.now(),
    };
  }, [allTrendingTokens, lastUpdated]);

  // =============================================
  // Node Selection
  // =============================================

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const hoverNode = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  // =============================================
  // Get Selected Node Data
  // =============================================

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData.nodes]);

  const selectedNodeEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return graphData.edges.filter(
      e => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [selectedNodeId, graphData.edges]);

  // =============================================
  // Statistics (calculated from trending tokens)
  // =============================================

  const stats = useMemo(() => {
    const whaleNodes = graphData.nodes.filter(n => n.type === 'whale');
    const tokenNodes = graphData.nodes.filter(n => n.type === 'token');

    // Calculate totals from trending tokens data
    let totalBuyVolume = 0;
    let totalSellVolume = 0;

    for (const token of allTrendingTokens) {
      totalBuyVolume += token.buyVolume;
      totalSellVolume += token.sellVolume;
    }

    return {
      whaleCount: whaleNodes.length, // Number of flow hubs
      tokenCount: tokenNodes.length,
      edgeCount: graphData.edges.length,
      totalBuyVolume,
      totalSellVolume,
      netFlow: totalBuyVolume - totalSellVolume,
    };
  }, [graphData, allTrendingTokens]);

  // =============================================
  // Return
  // =============================================

  return {
    // Graph data
    nodes: graphData.nodes,
    edges: graphData.edges,

    // Selection state
    selectedNodeId,
    selectedNode,
    selectedNodeEdges,
    hoveredNodeId,

    // Actions
    selectNode,
    hoverNode,
    refresh,

    // Stats
    stats,

    // Loading state
    loading,
    error,
    lastUpdated: graphData.lastUpdated,
  };
}

export default useWhaleGraph;
