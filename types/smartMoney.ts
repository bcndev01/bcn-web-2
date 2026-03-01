// =============================================
// Smart Money Tracker Type Definitions
// =============================================

// Known profitable wallet categories
export type WalletCategory =
  | 'VC'
  | 'Whale'
  | 'Early Adopter'
  | 'Influencer'
  | 'DEX Trader'
  | 'Sniper Bot'
  | 'Insider';

// Wallet profile for tracking
export interface SmartWallet {
  address: string;
  label: string;
  category: WalletCategory;
  description?: string;

  // Performance metrics
  winRate: number;        // % of profitable trades
  avgROI: number;         // Average return per trade
  totalTrades: number;    // Total tracked trades
  profitableTrades: number;

  // Tracking metadata
  isActive: boolean;
  lastActivity?: number;
  addedAt: number;

  // Social links (if known)
  twitter?: string;

  // Risk indicator
  riskLevel: 'low' | 'medium' | 'high';
}

// Transaction types we care about
export type SwapType = 'BUY' | 'SELL' | 'SWAP';

// Smart money transaction (parsed from Helius)
export interface SmartMoneyTransaction {
  id: string;
  signature: string;
  timestamp: number;

  // Wallet info
  walletAddress: string;
  walletLabel: string;
  walletCategory: WalletCategory;

  // Transaction details
  type: SwapType;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;

  // Amounts
  amountUSD: number;
  tokenAmount: number;
  pricePerToken: number;

  // Context
  dex: string;           // Jupiter, Raydium, etc.
  slippage?: number;

  // For tracking performance
  currentPrice?: number;
  unrealizedPnL?: number;

  // AI analysis (lazy loaded)
  aiAnalysis?: AITokenAnalysis;
}

// Trend direction for tokens
export type TrendDirection = 'accumulating' | 'distributing' | 'neutral';

// Trending token data (single entry per token, BUY+SELL merged)
export interface TrendingTokenData {
  // Identity
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  pairAddress: string;
  dex: string;

  // Volume metrics (1h aggregated)
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  netFlow: number;           // buy - sell (positive = accumulating)

  // Transaction counts
  buyCount: number;
  sellCount: number;
  buyRatio: number;          // 0-1 (buys / total)

  // Market data
  price: number;
  marketCap: number;
  liquidity: number;
  priceChangeH1: number;
  priceChangeH24: number;
  volumeToMcapRatio: number; // % of MC traded in 1h

  // Engagement scoring
  activityScore: number;     // 0-100 composite score
  trend: TrendDirection;

  // Timestamps
  fetchedAt: number;
}

// Aggregated smart money activity for a token
export interface SmartMoneyTokenActivity {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;

  // Aggregated metrics
  totalBuyVolume: number;
  totalSellVolume: number;
  netFlow: number;        // Buy - Sell

  buyerCount: number;
  sellerCount: number;

  // Recent transactions
  recentTransactions: SmartMoneyTransaction[];

  // Notable wallets involved
  topWallets: {
    address: string;
    label: string;
    amount: number;
    type: SwapType;
  }[];

  // Timing
  firstSeen: number;
  lastActivity: number;

  // Signal strength
  signalStrength: 'weak' | 'moderate' | 'strong' | 'very_strong';
}

// =============================================
// AI Token Analyzer Types
// =============================================

export type AIVerdict = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID';

export interface AITokenAnalysis {
  tokenAddress: string;
  tokenSymbol: string;

  // Main verdict
  verdict: AIVerdict;
  confidence: number;     // 0-100

  // Reasoning breakdown
  summary: string;        // 1-2 sentence summary

  bullishFactors: string[];
  bearishFactors: string[];

  // Risk assessment
  riskScore: number;      // 0-10 (10 = very risky)
  riskFactors: string[];

  // Technical analysis
  technicalOutlook: 'bullish' | 'neutral' | 'bearish';

  // Social sentiment
  socialSentiment?: {
    score: number;        // -100 to 100
    trending: boolean;
    mentions24h: number;
  };

  // Smart money context
  smartMoneySignal: 'accumulating' | 'distributing' | 'neutral';

  // Metadata
  analyzedAt: number;
  dataSourcesUsed: string[];
}

// =============================================
// Smart Money Feed State
// =============================================

export interface SmartMoneyState {
  // All tracked wallets
  wallets: SmartWallet[];

  // Recent transactions feed
  transactions: SmartMoneyTransaction[];

  // Token activity aggregation
  tokenActivity: Map<string, SmartMoneyTokenActivity>;

  // Loading states
  loading: boolean;
  error: string | null;

  // Filters
  activeCategory: WalletCategory | 'ALL';
  activeSwapType: SwapType | 'ALL';
  minAmountUSD: number;

  // Connection status
  isConnected: boolean;
  lastUpdated: number | null;
}

// =============================================
// Helius Webhook Types (Simplified)
// =============================================

export interface HeliusWebhookPayload {
  accountData: {
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: {
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
      tokenAccount: string;
      userAccount: string;
    }[];
  }[];
  description: string;
  events: {
    swap?: {
      nativeInput?: { account: string; amount: string };
      nativeOutput?: { account: string; amount: string };
      tokenInputs: { mint: string; amount: string; userAccount: string }[];
      tokenOutputs: { mint: string; amount: string; userAccount: string }[];
      tokenFees: any[];
      nativeFees: any[];
      innerSwaps: any[];
    };
  };
  fee: number;
  feePayer: string;
  nativeTransfers: any[];
  signature: string;
  slot: number;
  source: string;
  timestamp: number;
  tokenTransfers: {
    fromTokenAccount: string;
    fromUserAccount: string;
    mint: string;
    toTokenAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    tokenStandard: string;
  }[];
  type: string;
}

// =============================================
// Curated Smart Wallet List (Initial)
// =============================================

export const CURATED_SMART_WALLETS: SmartWallet[] = [
  {
    address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    label: 'Raydium Authority',
    category: 'DEX Trader',
    description: 'Raydium protocol authority wallet',
    winRate: 0,
    avgROI: 0,
    totalTrades: 0,
    profitableTrades: 0,
    isActive: true,
    addedAt: Date.now(),
    riskLevel: 'low',
  },
  {
    address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    label: 'Jupiter Aggregator',
    category: 'DEX Trader',
    description: 'Jupiter main aggregator wallet',
    winRate: 0,
    avgROI: 0,
    totalTrades: 0,
    profitableTrades: 0,
    isActive: true,
    addedAt: Date.now(),
    riskLevel: 'low',
  },
  // Add more curated wallets here
  // These would be researched wallets with proven track records
];
