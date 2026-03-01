// =============================================
// DexScreener API Response Types
// =============================================

export interface DexScreenerLink {
  type?: string;
  label?: string;
  url: string;
}

export interface DexScreenerTokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: DexScreenerLink[];
}

export interface DexScreenerBoostedToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  amount?: number;
  totalAmount?: number;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap?: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: { label: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
  labels?: string[];
  boosts?: {
    active: number;
  };
}

export interface DexScreenerTokenResponse {
  schemaVersion?: string;
  pairs: DexScreenerPair[] | null;
}

// =============================================
// Internal Processing Types
// =============================================

export type GemCategory = 'Breakout Hunter' | 'Strong Trend' | 'Whale Magnet';

export type RedFlagType =
  | 'Falling Knife'
  | 'Dead Volume'
  | 'Honeypot V2'
  | 'Wash Trading'
  | 'Honeypot Risk'
  | 'Impersonator'
  | 'Rug Pull Risk'
  | 'Pump & Dump'
  | 'Mintable'
  | 'Freezable'
  | 'Mutable Metadata'
  | 'LP Unlocked'
  | 'Insider Risk'
  | 'Whale Dominated';

export interface ProcessedToken {
  // Core identifiers
  id: string;
  address: string;
  symbol: string;
  name: string;
  chainId: string;
  dexUrl: string;
  pairAddress: string;

  // Price data
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChangeM5: number;
  priceChangeH6: number;

  // Volume & Liquidity
  liquidity: number;
  fdv: number;
  marketCap: number;
  volume24h: number;
  volumeH1: number;
  volumeH6: number;
  volumeM5: number;

  // Transaction data
  transactions24h: number;
  txnsH1: { buys: number; sells: number; total: number };
  txnsH24: { buys: number; sells: number; total: number };
  buyRatio: number;
  avgTxSize: number;

  // Token metadata
  ageHours: number;
  logoUrl?: string;
  hasWebsite: boolean;
  hasSocials: boolean;
  holders: number;

  // Computed scores
  trustScore: number;
  trustScoreColor: string;
  categories: GemCategory[];
  redFlags: RedFlagType[];

  // On-chain security (from RugCheck)
  security: {
    isMintable: boolean;
    isFreezable: boolean;
    isMutable: boolean;
    lpLockedPct: number;
    lpBurnedPct: number;
    isLpSafe: boolean;
    topHolderPct: number;
    top10HolderPct: number;
    hasInsiderRisk: boolean;
    rugCheckScore: number;
    loaded: boolean;
  };

  // Display
  bubbleRadius: number;
  isNew: boolean;

  // Timestamps
  fetchedAt: number;
  pairCreatedAt: number;
}

// =============================================
// State Types
// =============================================

export type GemFilterType = 'ALL' | 'BREAKOUT' | 'STRONG_TREND' | 'WHALE_MAGNET' | 'HIGH_TRUST';

export interface GemHunterState {
  tokens: ProcessedToken[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  activeFilter: GemFilterType;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
