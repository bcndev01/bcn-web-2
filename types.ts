export enum TrustScoreColor {
  GOLD = '#FFD700',
  CYAN = '#00FFFF',
  MAGENTA = '#FF00FF',
  GREEN = '#00FF00',
  YELLOW = '#FFFF00',
  ORANGE = '#FFA500',
  RED = '#FF4444',
  GRAY = '#666666'
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  liquidity: number;
  fdv: number;
  volume24h: number;
  transactions24h: number;
  buyRatio: number;
  trustScore: number;
  trustScoreColor: string; // Hex code
  ageHours: number;
  categories: string[];
  redFlags: string[];
  logoUrl?: string;
  holders: number;
}

export interface WhaleTransaction {
  id: string;
  type: 'BUY' | 'SELL';
  amountUsd: number;
  tokenSymbol: string;
  walletAddress: string;
  timestamp: number;
}

// Whale Alert API Types
export interface WhaleAlertAmount {
  symbol: string;
  amount: number;
  value_usd: number;
}

export interface WhaleAlertTransaction {
  id: number;
  timestamp: number;
  emoticons: string;
  amounts: WhaleAlertAmount[];
  text: string;
  official: boolean;
  link: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  EXTREME = 'Extreme'
}

export interface FearGreedData {
  value: number;
  classification: string;
}
