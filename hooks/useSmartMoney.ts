// =============================================
// Smart Money Tracker Hook
// Real-time tracking of whale/smart money activity
// =============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { whaleTrackingService } from '../services/whaleTrackingService';
import { aiAnalyzerService } from '../services/aiAnalyzerService';
import {
  SmartMoneyTransaction,
  SmartWallet,
  SmartMoneyState,
  SmartMoneyTokenActivity,
  WalletCategory,
  SwapType,
  AITokenAnalysis,
  TrendingTokenData,
  TrendDirection,
  CURATED_SMART_WALLETS,
} from '../types/smartMoney';

// =============================================
// Configuration
// =============================================

const POLL_INTERVAL = 60_000; // 1 minute polling
const MAX_TRANSACTIONS = 100; // Keep last 100 transactions

// =============================================
// Hook
// =============================================

// Trend filter type
export type TrendFilter = 'ALL' | 'accumulating' | 'distributing' | 'neutral';

export function useSmartMoney() {
  const [state, setState] = useState<SmartMoneyState>({
    wallets: CURATED_SMART_WALLETS,
    transactions: [],
    tokenActivity: new Map(),
    loading: true,
    error: null,
    activeCategory: 'ALL',
    activeSwapType: 'ALL',
    minAmountUSD: 1000, // Default to $1000+ trades (whale activity)
    isConnected: true, // Always connected - no API key needed
    lastUpdated: null,
  });

  // Trending tokens state (NEW)
  const [trendingTokens, setTrendingTokens] = useState<TrendingTokenData[]>([]);
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('ALL');

  // No demo mode - always real data
  const isDemoMode = false;

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // =============================================
  // Fetch Trending Tokens (NEW - Single Entry Per Token)
  // =============================================

  const fetchTrendingTokens = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setState(prev => ({
        ...prev,
        loading: trendingTokens.length === 0,
        error: null,
      }));

      const tokens = await whaleTrackingService.getTrendingTokens(forceRefresh);

      if (!isMountedRef.current) return;

      setTrendingTokens(tokens);
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.error('Trending tokens fetch error:', error);
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch trending tokens',
        }));
      }
    }
  }, [trendingTokens.length]);

  // =============================================
  // Fetch Transactions (Legacy - kept for compatibility)
  // =============================================

  const fetchTransactions = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setState(prev => ({
        ...prev,
        loading: prev.transactions.length === 0,
        error: null,
      }));

      // Fetch real whale activity from blockchain
      const transactions = await whaleTrackingService.getRecentWhaleActivity(forceRefresh);

      if (!isMountedRef.current) return;

      // Update state with new transactions
      setState(prev => {
        // Merge new transactions, avoiding duplicates
        const existingIds = new Set(prev.transactions.map(tx => tx.id));
        const newTxs = transactions.filter(tx => !existingIds.has(tx.id));

        const allTransactions = [...newTxs, ...prev.transactions]
          .sort((a, b) => b.amountUSD - a.amountUSD) // Sort by volume, not timestamp (aggregated data)
          .slice(0, MAX_TRANSACTIONS);

        // Update token activity aggregation
        const tokenActivity = new Map<string, SmartMoneyTokenActivity>(prev.tokenActivity);

        for (const tx of newTxs) {
          const existing = tokenActivity.get(tx.tokenAddress);

          if (existing) {
            // Update existing
            if (tx.type === 'BUY') {
              existing.totalBuyVolume += tx.amountUSD;
              existing.buyerCount++;
            } else if (tx.type === 'SELL') {
              existing.totalSellVolume += tx.amountUSD;
              existing.sellerCount++;
            }
            existing.netFlow = existing.totalBuyVolume - existing.totalSellVolume;
            existing.recentTransactions = [tx, ...existing.recentTransactions].slice(0, 10);
            existing.lastActivity = Math.max(existing.lastActivity, tx.timestamp);

            // Update signal strength
            existing.signalStrength = calculateSignalStrength(existing);
          } else {
            // Create new entry
            tokenActivity.set(tx.tokenAddress, {
              tokenAddress: tx.tokenAddress,
              tokenSymbol: tx.tokenSymbol,
              tokenName: tx.tokenName,
              tokenLogo: tx.tokenLogo,
              totalBuyVolume: tx.type === 'BUY' ? tx.amountUSD : 0,
              totalSellVolume: tx.type === 'SELL' ? tx.amountUSD : 0,
              netFlow: tx.type === 'BUY' ? tx.amountUSD : -tx.amountUSD,
              buyerCount: tx.type === 'BUY' ? 1 : 0,
              sellerCount: tx.type === 'SELL' ? 1 : 0,
              recentTransactions: [tx],
              topWallets: [{
                address: tx.walletAddress,
                label: tx.walletLabel,
                amount: tx.amountUSD,
                type: tx.type,
              }],
              firstSeen: tx.timestamp,
              lastActivity: tx.timestamp,
              signalStrength: 'weak',
            });
          }
        }

        return {
          ...prev,
          transactions: allTransactions,
          tokenActivity,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        };
      });
    } catch (error) {
      console.error('Smart Money fetch error:', error);
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        }));
      }
    }
  }, [state.wallets]);

  // =============================================
  // Filter Transactions
  // =============================================

  const filteredTransactions = state.transactions.filter(tx => {
    if (state.activeCategory !== 'ALL' && tx.walletCategory !== state.activeCategory) {
      return false;
    }
    if (state.activeSwapType !== 'ALL' && tx.type !== state.activeSwapType) {
      return false;
    }
    if (tx.amountUSD < state.minAmountUSD) {
      return false;
    }
    return true;
  });

  // =============================================
  // Filter Trending Tokens
  // =============================================

  const filteredTrendingTokens = trendingTokens.filter(token => {
    if (trendFilter !== 'ALL' && token.trend !== trendFilter) {
      return false;
    }
    if (token.totalVolume < state.minAmountUSD) {
      return false;
    }
    return true;
  });

  // =============================================
  // Filter Setters
  // =============================================

  const setCategory = useCallback((category: WalletCategory | 'ALL') => {
    setState(prev => ({ ...prev, activeCategory: category }));
  }, []);

  const setSwapType = useCallback((type: SwapType | 'ALL') => {
    setState(prev => ({ ...prev, activeSwapType: type }));
  }, []);

  const setMinAmount = useCallback((amount: number) => {
    setState(prev => ({ ...prev, minAmountUSD: amount }));
  }, []);

  // =============================================
  // Wallet Management
  // =============================================

  const addWallet = useCallback((wallet: SmartWallet) => {
    whaleTrackingService.addWallet(wallet);
    setState(prev => ({
      ...prev,
      wallets: [...prev.wallets, wallet],
    }));
  }, []);

  const removeWallet = useCallback((address: string) => {
    whaleTrackingService.removeWallet(address);
    setState(prev => ({
      ...prev,
      wallets: prev.wallets.filter(w => w.address !== address),
    }));
  }, []);

  const toggleWallet = useCallback((address: string) => {
    setState(prev => ({
      ...prev,
      wallets: prev.wallets.map(w =>
        w.address === address ? { ...w, isActive: !w.isActive } : w
      ),
    }));
  }, []);

  // =============================================
  // AI Analysis
  // =============================================

  const analyzeToken = useCallback(async (
    tokenAddress: string,
    tokenData?: any
  ): Promise<AITokenAnalysis | null> => {
    // Get smart money context for this token
    const tokenTxs = state.transactions.filter(tx => tx.tokenAddress === tokenAddress);

    // If no token data provided, fetch from DexScreener
    let enrichedTokenData = tokenData;
    if (!enrichedTokenData) {
      try {
        const response = await fetch(`/api/dexscreener/tokens/v1/solana/${tokenAddress}`);
        if (response.ok) {
          const pairs = await response.json();
          if (Array.isArray(pairs) && pairs.length > 0) {
            const pair = pairs[0];
            enrichedTokenData = {
              symbol: pair.baseToken?.symbol || 'UNKNOWN',
              name: pair.baseToken?.name || 'Unknown Token',
              price: parseFloat(pair.priceUsd || '0'),
              marketCap: pair.marketCap || 0,
              fdv: pair.fdv || 0,
              liquidity: pair.liquidity?.usd || 0,
              volume24h: pair.volume?.h24 || 0,
              priceChange1h: pair.priceChange?.h1 || 0,
              priceChange24h: pair.priceChange?.h24 || 0,
              ageHours: pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3600000 : 0,
              buyRatio: pair.txns?.h1 ? pair.txns.h1.buys / (pair.txns.h1.buys + pair.txns.h1.sells || 1) : 0.5,
              txnsH1: pair.txns?.h1 || { buys: 0, sells: 0 },
              hasWebsite: !!(pair.info?.websites?.length),
              hasSocials: !!(pair.info?.socials?.length),
              trustScore: 4,
              redFlags: [],
              security: { loaded: false },
            };
          }
        }
      } catch (error) {
        console.error('Failed to fetch token data for analysis:', error);
      }
    }

    return aiAnalyzerService.analyzeToken(tokenAddress, enrichedTokenData, tokenTxs);
  }, [state.transactions]);

  // =============================================
  // Manual Refresh
  // =============================================

  const refresh = useCallback((forceRefresh: boolean = true) => {
    fetchTrendingTokens(forceRefresh);
  }, [fetchTrendingTokens]);

  // =============================================
  // Get Demo/Rate Limit Status
  // =============================================

  const getStatus = useCallback(() => {
    return {
      isDemoMode: false,
      requestStats: { count: 0, limit: 1000, resetIn: 60000 },
    };
  }, []);

  // =============================================
  // Setup Polling
  // =============================================

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch - use new trending tokens
    fetchTrendingTokens();

    // Setup polling
    pollIntervalRef.current = setInterval(fetchTrendingTokens, POLL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchTrendingTokens]);

  // =============================================
  // Return
  // =============================================

  return {
    // Data - NEW: Trending tokens as primary data
    trendingTokens: filteredTrendingTokens,
    allTrendingTokens: trendingTokens,

    // Legacy data (for backward compatibility)
    transactions: filteredTransactions,
    allTransactions: state.transactions,
    wallets: state.wallets,
    tokenActivity: state.tokenActivity,

    // State
    loading: state.loading,
    error: state.error,
    isConnected: state.isConnected,
    lastUpdated: state.lastUpdated,
    isDemoMode,

    // Filters
    activeCategory: state.activeCategory,
    activeSwapType: state.activeSwapType,
    minAmountUSD: state.minAmountUSD,
    trendFilter,

    // Actions
    setCategory,
    setSwapType,
    setMinAmount,
    setTrendFilter,
    addWallet,
    removeWallet,
    toggleWallet,
    analyzeToken,
    refresh,
    getStatus,
  };
}

// =============================================
// Helper Functions
// =============================================

function calculateSignalStrength(
  activity: { buyerCount: number; sellerCount: number; netFlow: number }
): 'weak' | 'moderate' | 'strong' | 'very_strong' {
  const totalParticipants = activity.buyerCount + activity.sellerCount;
  const netFlowAbs = Math.abs(activity.netFlow);

  if (totalParticipants >= 5 && netFlowAbs > 10000) {
    return 'very_strong';
  }
  if (totalParticipants >= 3 && netFlowAbs > 5000) {
    return 'strong';
  }
  if (totalParticipants >= 2 && netFlowAbs > 1000) {
    return 'moderate';
  }
  return 'weak';
}

// =============================================
// Time Since Helper
// =============================================

export function useTimeSince(timestamp: number | null): string {
  const [timeSince, setTimeSince] = useState('');

  useEffect(() => {
    // timestamp 0 = aggregated 1h data, not a single transaction
    if (timestamp === 0) {
      setTimeSince('1h vol');
      return;
    }

    if (!timestamp) {
      setTimeSince('');
      return;
    }

    const update = () => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);

      if (seconds < 60) {
        setTimeSince(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeSince(`${Math.floor(seconds / 60)}m ago`);
      } else if (seconds < 86400) {
        setTimeSince(`${Math.floor(seconds / 3600)}h ago`);
      } else {
        setTimeSince(`${Math.floor(seconds / 86400)}d ago`);
      }
    };

    update();
    const interval = setInterval(update, 10000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeSince;
}
