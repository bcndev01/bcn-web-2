// =============================================
// Whale Tracking Service
// Real-time tracking using DexScreener API
// NO MOCK DATA - Real blockchain data
// =============================================

import {
  SmartMoneyTransaction,
  SmartWallet,
  WalletCategory,
  TrendingTokenData,
  TrendDirection,
  CURATED_SMART_WALLETS,
} from '../types/smartMoney';

// =============================================
// Configuration
// =============================================

const DEXSCREENER_API = '/api/dexscreener';
const CACHE_TTL = 30_000; // 30 seconds cache for real-time feel
const MIN_VOLUME_USD = 1000; // Minimum volume to show

// =============================================
// Types
// =============================================

interface DexScreenerPair {
  chainId: string;
  dexId: string;
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
  priceUsd: string;
  priceNative: string;
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
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
  };
}

interface BoostedToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  description?: string;
  icon?: string;
  links?: Array<{ url?: string; type?: string }>;
  totalAmount: number;
}

// =============================================
// Cache
// =============================================

const tradesCache = new Map<string, { data: SmartMoneyTransaction[]; timestamp: number }>();
const trendingCache = new Map<string, { data: TrendingTokenData[]; timestamp: number }>();

// =============================================
// Whale Tracking Service Class
// =============================================

class WhaleTrackingService {
  private walletMap: Map<string, SmartWallet>;
  private isLoading: boolean = false;

  constructor() {
    this.walletMap = new Map();
    CURATED_SMART_WALLETS.forEach(wallet => {
      this.walletMap.set(wallet.address, wallet);
    });
  }

  // =============================================
  // Get Boosted/Trending Tokens (Real Activity)
  // =============================================

  async getBoostedTokens(): Promise<BoostedToken[]> {
    try {
      const response = await fetch(`${DEXSCREENER_API}/token-boosts/latest/v1`);
      if (!response.ok) return [];

      const data = await response.json();
      // Filter for Solana tokens only
      return Array.isArray(data) ? data.filter((t: BoostedToken) => t.chainId === 'solana') : [];
    } catch (error) {
      console.error('[WhaleTracking] Error fetching boosted tokens:', error);
      return [];
    }
  }

  // =============================================
  // Get Token Pair Data (Volume, Txns, Price)
  // =============================================

  async getTokenPairs(tokenAddress: string): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(`${DEXSCREENER_API}/tokens/v1/solana/${tokenAddress}`);
      if (!response.ok) return [];

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`[WhaleTracking] Error fetching pairs for ${tokenAddress}:`, error);
      return [];
    }
  }

  // =============================================
  // Convert Pair Activity to Transactions
  // Shows aggregated volume data with better filtering
  // =============================================

  private pairToTransactions(pair: DexScreenerPair, tokenIcon?: string): SmartMoneyTransaction[] {
    const transactions: SmartMoneyTransaction[] = [];
    const now = Date.now();

    // Skip if no meaningful volume
    if (!pair.volume?.h1 || pair.volume.h1 < 100) return [];

    // Get market cap and liquidity
    const marketCap = pair.marketCap || pair.fdv || 0;
    const liquidity = pair.liquidity?.usd || 0;
    const volumeH1 = pair.volume?.h1 || 0;

    // FILTER 1: Skip micro-cap coins (MC < $50K) - too easy to manipulate
    if (marketCap > 0 && marketCap < 50000) return [];

    // FILTER 2: Skip if volume > 100% of market cap (wash trading signal)
    if (marketCap > 0 && volumeH1 > marketCap) return [];

    // FILTER 3: Skip if liquidity is too low (< $10K)
    if (liquidity > 0 && liquidity < 10000) return [];

    // Get transaction counts
    const { buys: buysH1, sells: sellsH1 } = pair.txns?.h1 || { buys: 0, sells: 0 };

    // Only include if there's real activity
    if (buysH1 + sellsH1 < 5) return [];

    // Calculate total transactions and average trade size
    const totalTxns = buysH1 + sellsH1;
    const avgTradeSize = volumeH1 / totalTxns;

    // Determine category based on avg trade size and market cap
    let category: WalletCategory;
    if (avgTradeSize > 1000 && marketCap > 500000) {
      category = 'Whale';
    } else if (avgTradeSize > 500) {
      category = 'DEX Trader';
    } else {
      category = 'Early Adopter';
    }

    // Calculate volume/mcap ratio for context
    const volMcapRatio = marketCap > 0 ? (volumeH1 / marketCap * 100).toFixed(1) : '?';

    // Recent BUY activity (if any)
    if (buysH1 > 0 && volumeH1 > MIN_VOLUME_USD) {
      const buyVolume = (volumeH1 * buysH1) / totalTxns;
      const avgBuySize = buyVolume / buysH1;

      // Better label: show volume context
      const label = marketCap > 0
        ? `${volMcapRatio}% of MC (${buysH1} txns)`
        : `${buysH1} buys (avg $${this.formatCompact(avgBuySize)})`;

      transactions.push({
        id: `${pair.pairAddress}-buy-${now}`,
        signature: pair.pairAddress,
        timestamp: 0, // Aggregated 1h data - not a single transaction
        walletAddress: `aggregated_${buysH1}_buyers`,
        walletLabel: label,
        walletCategory: category,
        type: 'BUY',
        tokenAddress: pair.baseToken.address,
        tokenSymbol: pair.baseToken.symbol,
        tokenName: pair.baseToken.name,
        tokenLogo: tokenIcon || pair.info?.imageUrl,
        amountUSD: buyVolume,
        tokenAmount: buyVolume / Math.max(parseFloat(pair.priceUsd || '0.0001'), 0.0000001),
        pricePerToken: parseFloat(pair.priceUsd || '0'),
        dex: this.formatDexName(pair.dexId),
      });
    }

    // Recent SELL activity (if any)
    if (sellsH1 > 0 && volumeH1 > MIN_VOLUME_USD) {
      const sellVolume = (volumeH1 * sellsH1) / totalTxns;
      const avgSellSize = sellVolume / sellsH1;

      const label = marketCap > 0
        ? `${volMcapRatio}% of MC (${sellsH1} txns)`
        : `${sellsH1} sells (avg $${this.formatCompact(avgSellSize)})`;

      transactions.push({
        id: `${pair.pairAddress}-sell-${now}`,
        signature: pair.pairAddress,
        timestamp: 0, // Aggregated 1h data - not a single transaction
        walletAddress: `aggregated_${sellsH1}_sellers`,
        walletLabel: label,
        walletCategory: category,
        type: 'SELL',
        tokenAddress: pair.baseToken.address,
        tokenSymbol: pair.baseToken.symbol,
        tokenName: pair.baseToken.name,
        tokenLogo: tokenIcon || pair.info?.imageUrl,
        amountUSD: sellVolume,
        tokenAmount: sellVolume / Math.max(parseFloat(pair.priceUsd || '0.0001'), 0.0000001),
        pricePerToken: parseFloat(pair.priceUsd || '0'),
        dex: this.formatDexName(pair.dexId),
      });
    }

    return transactions;
  }

  // =============================================
  // Helper: Format Compact Number
  // =============================================

  private formatCompact(num: number): string {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  }

  // =============================================
  // Get All Recent Whale Activity (REAL DATA)
  // =============================================

  async getRecentWhaleActivity(forceRefresh: boolean = false): Promise<SmartMoneyTransaction[]> {
    const cacheKey = 'whale-activity';
    const cached = tradesCache.get(cacheKey);

    // Return cache if valid
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    if (this.isLoading) {
      return cached?.data || [];
    }

    this.isLoading = true;
    console.log('[WhaleTracking] Fetching REAL whale activity from DexScreener...');

    try {
      const allTransactions: SmartMoneyTransaction[] = [];

      // 1. Get boosted/trending tokens (most active on DexScreener)
      const boostedTokens = await this.getBoostedTokens();
      console.log(`[WhaleTracking] Found ${boostedTokens.length} boosted Solana tokens`);

      // 2. Get pair data for each boosted token (parallel, batched)
      const batchSize = 5;
      const processedAddresses = new Set<string>();

      for (let i = 0; i < Math.min(boostedTokens.length, 30); i += batchSize) {
        const batch = boostedTokens.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (token) => {
            // Skip duplicates
            if (processedAddresses.has(token.tokenAddress)) return [];
            processedAddresses.add(token.tokenAddress);

            const pairs = await this.getTokenPairs(token.tokenAddress);
            if (pairs.length === 0) return [];

            // Get the most liquid pair
            const bestPair = pairs.sort((a, b) =>
              (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];

            // Convert icon hash to URL
            const iconUrl = token.icon
              ? `https://cdn.dexscreener.com/cms/images/${token.icon}?width=64&height=64&quality=90`
              : undefined;

            return this.pairToTransactions(bestPair, iconUrl);
          })
        );

        for (const transactions of batchResults) {
          allTransactions.push(...transactions);
        }

        // Small delay between batches
        if (i + batchSize < boostedTokens.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Sort by volume (amountUSD) descending
      allTransactions.sort((a, b) => b.amountUSD - a.amountUSD);

      // Take top 50
      const result = allTransactions.slice(0, 50);

      // Update cache
      tradesCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log(`[WhaleTracking] Returned ${result.length} real whale activity entries`);
      return result;
    } catch (error) {
      console.error('[WhaleTracking] Error:', error);
      return cached?.data || [];
    } finally {
      this.isLoading = false;
    }
  }

  // =============================================
  // Convert Pair to Trending Token (Single Entry)
  // =============================================

  private pairToTrendingToken(pair: DexScreenerPair, tokenIcon?: string): TrendingTokenData | null {
    const now = Date.now();

    // Skip if no meaningful volume
    if (!pair.volume?.h1 || pair.volume.h1 < 100) return null;

    // Get market data
    const marketCap = pair.marketCap || pair.fdv || 0;
    const liquidity = pair.liquidity?.usd || 0;
    const volumeH1 = pair.volume?.h1 || 0;
    const price = parseFloat(pair.priceUsd || '0');

    // FILTER 1: Skip micro-cap coins (MC < $50K)
    if (marketCap > 0 && marketCap < 50000) return null;

    // FILTER 2: Skip wash trading (volume > 100% of MC)
    if (marketCap > 0 && volumeH1 > marketCap) return null;

    // FILTER 3: Skip low liquidity (< $10K)
    if (liquidity > 0 && liquidity < 10000) return null;

    // Get transaction counts
    const { buys: buyCount, sells: sellCount } = pair.txns?.h1 || { buys: 0, sells: 0 };
    const totalTxns = buyCount + sellCount;

    // Skip if no real activity
    if (totalTxns < 5) return null;

    // Calculate volumes
    const buyVolume = totalTxns > 0 ? (volumeH1 * buyCount) / totalTxns : 0;
    const sellVolume = totalTxns > 0 ? (volumeH1 * sellCount) / totalTxns : 0;
    const netFlow = buyVolume - sellVolume;
    const buyRatio = totalTxns > 0 ? buyCount / totalTxns : 0.5;

    // Calculate volume to market cap ratio
    const volumeToMcapRatio = marketCap > 0 ? (volumeH1 / marketCap) * 100 : 0;

    // Determine trend direction
    let trend: TrendDirection;
    if (buyRatio > 0.6) {
      trend = 'accumulating';
    } else if (buyRatio < 0.4) {
      trend = 'distributing';
    } else {
      trend = 'neutral';
    }

    // Calculate activity score (0-100)
    const activityScore = this.calculateActivityScore({
      netFlow,
      totalVolume: volumeH1,
      buyRatio,
      volumeToMcapRatio,
      totalTxns,
    });

    return {
      tokenAddress: pair.baseToken.address,
      tokenSymbol: pair.baseToken.symbol,
      tokenName: pair.baseToken.name,
      tokenLogo: tokenIcon || pair.info?.imageUrl,
      pairAddress: pair.pairAddress,
      dex: this.formatDexName(pair.dexId),

      totalVolume: volumeH1,
      buyVolume,
      sellVolume,
      netFlow,

      buyCount,
      sellCount,
      buyRatio,

      price,
      marketCap,
      liquidity,
      priceChangeH1: pair.priceChange?.h1 || 0,
      priceChangeH24: pair.priceChange?.h24 || 0,
      volumeToMcapRatio,

      activityScore,
      trend,

      fetchedAt: now,
    };
  }

  // =============================================
  // Calculate Activity Score (0-100)
  // =============================================

  private calculateActivityScore(data: {
    netFlow: number;
    totalVolume: number;
    buyRatio: number;
    volumeToMcapRatio: number;
    totalTxns: number;
  }): number {
    let score = 0;

    // Factor 1: Net flow strength (30 points max)
    // Strong directional flow is more interesting
    const netFlowRatio = data.totalVolume > 0 ? Math.abs(data.netFlow) / data.totalVolume : 0;
    score += netFlowRatio * 30;

    // Factor 2: Volume magnitude (25 points max)
    // $5K = 5pts, $25K = 15pts, $100K+ = 25pts
    const volumeScore = Math.min(25, Math.log10(data.totalVolume + 1) * 6);
    score += volumeScore;

    // Factor 3: Buy ratio extremity (25 points max)
    // More extreme ratios (>70% or <30%) are more interesting
    const ratioExtremity = Math.abs(data.buyRatio - 0.5) * 2; // 0-1 scale
    score += ratioExtremity * 25;

    // Factor 4: Transaction count (10 points max)
    // More participants = more confidence in the signal
    const txnScore = Math.min(10, data.totalTxns / 10);
    score += txnScore;

    // Factor 5: Volume/MC ratio bonus (10 points max)
    // High volume relative to MC is notable
    const vmcScore = Math.min(10, data.volumeToMcapRatio * 2);
    score += vmcScore;

    return Math.min(100, Math.round(score));
  }

  // =============================================
  // Get Trending Tokens (NEW - Single Entry Per Token)
  // =============================================

  async getTrendingTokens(forceRefresh: boolean = false): Promise<TrendingTokenData[]> {
    const cacheKey = 'trending-tokens';
    const cached = trendingCache.get(cacheKey);

    // Return cache if valid
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    if (this.isLoading) {
      return cached?.data || [];
    }

    this.isLoading = true;
    console.log('[WhaleTracking] Fetching trending tokens...');

    try {
      const tokenMap = new Map<string, TrendingTokenData>();

      // 1. Get boosted/trending tokens
      const boostedTokens = await this.getBoostedTokens();
      console.log(`[WhaleTracking] Found ${boostedTokens.length} boosted Solana tokens`);

      // 2. Process tokens in batches
      const batchSize = 5;
      const processedAddresses = new Set<string>();

      for (let i = 0; i < Math.min(boostedTokens.length, 30); i += batchSize) {
        const batch = boostedTokens.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (token) => {
            // Skip duplicates
            if (processedAddresses.has(token.tokenAddress)) return null;
            processedAddresses.add(token.tokenAddress);

            const pairs = await this.getTokenPairs(token.tokenAddress);
            if (pairs.length === 0) return null;

            // Get the most liquid pair
            const bestPair = pairs.sort((a, b) =>
              (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
            )[0];

            // Convert icon hash to URL
            const iconUrl = token.icon
              ? `https://cdn.dexscreener.com/cms/images/${token.icon}?width=64&height=64&quality=90`
              : undefined;

            return this.pairToTrendingToken(bestPair, iconUrl);
          })
        );

        // Add to map (ensures uniqueness by tokenAddress)
        for (const tokenData of batchResults) {
          if (tokenData && !tokenMap.has(tokenData.tokenAddress)) {
            tokenMap.set(tokenData.tokenAddress, tokenData);
          }
        }

        // Small delay between batches
        if (i + batchSize < boostedTokens.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Convert to array and sort by activity score
      const result = Array.from(tokenMap.values())
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 30); // Top 30 trending tokens

      // Update cache
      trendingCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log(`[WhaleTracking] Returned ${result.length} unique trending tokens`);
      return result;
    } catch (error) {
      console.error('[WhaleTracking] Error:', error);
      return cached?.data || [];
    } finally {
      this.isLoading = false;
    }
  }

  // =============================================
  // Helper: Format DEX Name
  // =============================================

  private formatDexName(dexId: string): string {
    const dexNames: Record<string, string> = {
      raydium: 'Raydium',
      orca: 'Orca',
      jupiter: 'Jupiter',
      meteora: 'Meteora',
      phoenix: 'Phoenix',
    };
    return dexNames[dexId?.toLowerCase()] || dexId || 'DEX';
  }

  // =============================================
  // Wallet Management
  // =============================================

  addWallet(wallet: SmartWallet): void {
    this.walletMap.set(wallet.address, wallet);
  }

  removeWallet(address: string): void {
    this.walletMap.delete(address);
  }

  getWallets(): SmartWallet[] {
    return Array.from(this.walletMap.values());
  }

  // =============================================
  // Status
  // =============================================

  isConfigured(): boolean {
    return true; // Always configured - DexScreener is free
  }

  isDemoMode(): boolean {
    return false; // NEVER demo mode - always real data
  }
}

export const whaleTrackingService = new WhaleTrackingService();
