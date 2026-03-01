// =============================================
// 3D Scene Type Definitions
// =============================================

import { Vector3 } from 'three';
import { SmartWallet, SmartMoneyTransaction, WalletCategory } from './smartMoney';
import { ProcessedToken } from './dexScreener';

// =============================================
// Whale Nexus Types
// =============================================

export interface GraphNode {
  id: string;
  type: 'whale' | 'token';
  position: [number, number, number];
  velocity: [number, number, number];

  // Visual properties
  radius: number;
  color: string;
  emissiveIntensity: number;

  // Data reference
  data: SmartWallet | TokenNode;
}

export interface TokenNode {
  address: string;
  symbol: string;
  name: string;
  logo?: string;
  trustScore?: number;
  trustScoreColor?: string;
  totalVolume: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;

  // Visual properties
  weight: number;      // Line thickness based on volume
  color: string;       // Green for buy, red for sell
  flowSpeed: number;   // Animation speed

  // Transaction data
  type: 'buy' | 'sell';
  amountUSD: number;
  timestamp: number;
}

export interface WhaleNexusData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  lastUpdated: number;
}

// =============================================
// Live Sniper Types
// =============================================

export interface CrystalData {
  id: string;
  type: 'buy' | 'sell';

  // Position in tunnel
  position: [number, number, number];
  rotation: [number, number, number];

  // Visual properties
  scale: number;        // Based on volume
  color: string;
  bloomIntensity: number;

  // Animation
  speed: number;
  active: boolean;

  // Transaction reference
  transaction: SmartMoneyTransaction;
}

export interface TunnelConfig {
  length: number;
  radius: number;
  segments: number;
  wireframeColor: string;
  scrollSpeed: number;
}

// =============================================
// Gem Galaxy Types
// =============================================

export interface PlanetData {
  id: string;
  token: ProcessedToken;

  // Orbital properties
  orbitRadius: number;     // Distance from center
  orbitSpeed: number;      // Angular velocity (momentum)
  orbitAngle: number;      // Current position on orbit

  // Visual properties
  planetRadius: number;    // Size based on marketCap
  color: string;

  // Effects
  hasFireball: boolean;    // High momentum
  hasShield: boolean;      // Safe token
  isFiltered: boolean;     // Blur when filtered out
}

export interface GalaxyConfig {
  coreRadius: number;
  maxOrbitRadius: number;
  minOrbitRadius: number;
  coreColor: string;
}

// =============================================
// Shared Types
// =============================================

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export interface PerformanceSettings {
  quality: 'low' | 'medium' | 'high';
  maxNodes: number;
  maxEdges: number;
  maxCrystals: number;
  maxPlanets: number;
  enableBloom: boolean;
  enableShadows: boolean;
  particleCount: number;
}

// Color palette from existing theme
export const CRYPTO_COLORS = {
  cryptoBlack: '#0A0A0F',
  cryptoDarkGray: '#12121A',
  cryptoLightGray: '#8E8E93',
  cryptoCyan: '#00D4FF',
  cryptoGreen: '#00FF88',
  cryptoRed: '#FF3B5C',
  cryptoAmber: '#FFB800',
  purple: '#A855F7',
  pink: '#EC4899',
  blue: '#3B82F6',
  orange: '#F97316',
} as const;

// Professional Intelligence Dashboard Colors (Bloomberg/Nansen style)
export const PRO_COLORS = {
  // Background - Deep slate, not pure black
  bgPrimary: '#0F172A',      // Slate 900
  bgSecondary: '#1E293B',    // Slate 800
  bgTertiary: '#334155',     // Slate 700

  // Buy/Positive - Emerald/Turquoise (not neon green)
  buyPrimary: '#10B981',     // Emerald 500
  buyLight: '#34D399',       // Emerald 400
  buyDark: '#059669',        // Emerald 600

  // Sell/Negative - Crimson/Rose (not neon red)
  sellPrimary: '#F43F5E',    // Rose 500
  sellLight: '#FB7185',      // Rose 400
  sellDark: '#E11D48',       // Rose 600

  // Accent - Professional cyan/blue
  accentPrimary: '#06B6D4',  // Cyan 500
  accentLight: '#22D3EE',    // Cyan 400
  accentDark: '#0891B2',     // Cyan 600

  // Neutral - For grid, labels, subtle elements
  neutral100: '#F1F5F9',     // Slate 100
  neutral300: '#CBD5E1',     // Slate 300
  neutral500: '#64748B',     // Slate 500
  neutral700: '#334155',     // Slate 700

  // Special - High value indicator
  gold: '#F59E0B',           // Amber 500
  goldLight: '#FBBF24',      // Amber 400
} as const;

// Category colors for wallet types
export const WALLET_CATEGORY_COLORS: Record<WalletCategory, string> = {
  'VC': '#A855F7',           // Purple
  'Whale': '#00D4FF',        // Cyan
  'Early Adopter': '#00FF88', // Green
  'Influencer': '#EC4899',   // Pink
  'DEX Trader': '#3B82F6',   // Blue
  'Sniper Bot': '#F97316',   // Orange
  'Insider': '#FFB800',      // Amber
};
