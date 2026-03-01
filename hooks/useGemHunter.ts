import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { dexScreenerService } from '../services/dexScreenerService';
import { processTokens, detectOnChainRedFlags, mergeRedFlags, calculateTrustScore, getTrustScoreColor } from '../utils/gemAlgorithm';
import { ProcessedToken, GemFilterType, GemHunterState } from '../types/dexScreener';
import { rugCheckService, TokenSecurityInfo } from '../services/rugCheckService';

const POLL_INTERVAL = 90_000; // 90 seconds
const NEW_TOKEN_THRESHOLD = 5 * 60 * 1000; // 5 minutes
// Disabled initial batch fetch due to RugCheck rate limits
// Security data is now fetched on-demand when user selects a token

export function useGemHunter() {
  const [state, setState] = useState<GemHunterState>({
    tokens: [],
    loading: true,
    error: null,
    lastUpdated: null,
    activeFilter: 'ALL',
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Enrich tokens with RugCheck security data
  const enrichWithSecurityData = useCallback(async (tokens: ProcessedToken[]) => {
    try {
      const addresses = tokens.map(t => t.address);
      const securityMap = await rugCheckService.getBatchTokenSecurity(addresses);

      if (!isMountedRef.current) return;

      setState((prev) => {
        const updatedTokens = prev.tokens.map((token) => {
          const security = securityMap.get(token.address);
          if (!security || !security.loaded) return token;

          // Update security info
          const updatedToken = {
            ...token,
            security: {
              isMintable: security.isMintable,
              isFreezable: security.isFreezable,
              isMutable: security.isMutable,
              lpLockedPct: security.lpLockedPct,
              lpBurnedPct: security.lpBurnedPct,
              isLpSafe: security.isLpSafe,
              topHolderPct: security.topHolderPct,
              top10HolderPct: security.top10HolderPct,
              hasInsiderRisk: security.hasInsiderRisk,
              rugCheckScore: security.rugCheckScore,
              loaded: true,
            },
          };

          // Detect on-chain red flags
          const onChainFlags = detectOnChainRedFlags(updatedToken);

          // Merge red flags
          updatedToken.redFlags = mergeRedFlags(token.redFlags, onChainFlags);

          // Recalculate trust score with security data
          updatedToken.trustScore = calculateTrustScore(updatedToken);
          updatedToken.trustScoreColor = getTrustScoreColor(updatedToken.trustScore);

          return updatedToken;
        });

        return { ...prev, tokens: updatedTokens };
      });
    } catch (error) {
      console.error('Security enrichment error:', error);
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    try {
      // Only show loading on initial fetch
      setState((prev) => ({
        ...prev,
        loading: prev.tokens.length === 0,
        error: null,
      }));

      // Fetch from all sources in parallel
      const [latestTokens, boostedTokens, topTokens] = await Promise.all([
        dexScreenerService.getLatestTokens(),
        dexScreenerService.getBoostedTokens(),
        dexScreenerService.getTopBoostedTokens(),
      ]);

      // Deduplicate by address
      const addressSet = new Set<string>();
      const uniqueAddresses: string[] = [];

      for (const token of [...latestTokens, ...boostedTokens, ...topTokens]) {
        if (!addressSet.has(token.tokenAddress)) {
          addressSet.add(token.tokenAddress);
          uniqueAddresses.push(token.tokenAddress);
        }
      }

      if (uniqueAddresses.length === 0) {
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'No tokens found',
          }));
        }
        return;
      }

      // Enrich with pair data
      const enrichedPairs = await dexScreenerService.enrichTokens(uniqueAddresses);

      // Process through gem detection algorithm
      const processedTokens = processTokens(enrichedPairs);

      // Mark new tokens
      const now = Date.now();
      const tokensWithNewFlag = processedTokens.map((token) => ({
        ...token,
        isNew: now - token.fetchedAt < NEW_TOKEN_THRESHOLD,
      }));

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          tokens: tokensWithNewFlag,
          loading: false,
          error: null,
          lastUpdated: now,
        }));

        // NOTE: Initial batch security fetch disabled due to RugCheck rate limits
        // Security data is fetched on-demand when user selects a token
        // This prevents 429 errors from overwhelming the API
      }
    } catch (error) {
      console.error('GemHunter fetch error:', error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch tokens',
        }));
      }
    }
  }, []);

  // Filter tokens by category
  const filteredTokens = useMemo(() => {
    // Base quality filter for ALL gems - exclude obvious dumps/rugs
    const baseFilter = (t: ProcessedToken) => {
      // Exclude tokens with extreme price drops (likely rugs or dead projects)
      if (t.priceChange24h < -70) return false;
      if (t.priceChange1h < -50) return false;

      // Exclude tokens with critical red flags
      if (t.redFlags.includes('Honeypot V2')) return false;
      if (t.redFlags.includes('Honeypot Risk')) return false;

      // Exclude tokens with very low liquidity (< $5K)
      if (t.liquidity < 5000) return false;

      // Exclude tokens with 0 volume (dead)
      if (t.volume24h <= 0) return false;

      return true;
    };

    switch (state.activeFilter) {
      case 'BREAKOUT':
        return state.tokens.filter((t) => baseFilter(t) && t.categories.includes('Breakout Hunter'));
      case 'STRONG_TREND':
        return state.tokens.filter((t) => baseFilter(t) && t.categories.includes('Strong Trend'));
      case 'WHALE_MAGNET':
        return state.tokens.filter((t) => baseFilter(t) && t.categories.includes('Whale Magnet'));
      case 'HIGH_TRUST':
        // Stricter filter: minimum 6/7 score AND no severe price crash
        return state.tokens.filter((t) =>
          baseFilter(t) &&
          t.trustScore >= 6 &&
          t.priceChange1h > -20 &&
          t.priceChange24h > -30
        );
      default:
        // "All Gems" - apply base quality filter
        return state.tokens.filter(baseFilter);
    }
  }, [state.tokens, state.activeFilter]);

  // Set filter
  const setFilter = useCallback((filter: GemFilterType) => {
    setState((prev) => ({ ...prev, activeFilter: filter }));
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Fetch security data for a specific token (called when token is selected)
  const fetchTokenSecurity = useCallback(async (address: string) => {
    console.log('fetchTokenSecurity called for:', address);

    // Check if already loaded
    const existingToken = state.tokens.find(t => t.address === address);
    if (existingToken?.security.loaded) {
      console.log('Security already loaded, skipping');
      return;
    }

    try {
      console.log('Calling rugCheckService.getTokenSecurity...');
      const security = await rugCheckService.getTokenSecurity(address);
      console.log('Got security response:', security);

      if (!security.loaded || !isMountedRef.current) {
        console.log('Security not loaded or unmounted, returning');
        return;
      }

      setState((prev) => {
        const updatedTokens = prev.tokens.map((token) => {
          if (token.address !== address) return token;

          const updatedToken = {
            ...token,
            security: {
              isMintable: security.isMintable,
              isFreezable: security.isFreezable,
              isMutable: security.isMutable,
              lpLockedPct: security.lpLockedPct,
              lpBurnedPct: security.lpBurnedPct,
              isLpSafe: security.isLpSafe,
              topHolderPct: security.topHolderPct,
              top10HolderPct: security.top10HolderPct,
              hasInsiderRisk: security.hasInsiderRisk,
              rugCheckScore: security.rugCheckScore,
              loaded: true,
            },
          };

          // Detect on-chain red flags
          const onChainFlags = detectOnChainRedFlags(updatedToken);
          updatedToken.redFlags = mergeRedFlags(token.redFlags, onChainFlags);

          // Recalculate trust score
          updatedToken.trustScore = calculateTrustScore(updatedToken);
          updatedToken.trustScoreColor = getTrustScoreColor(updatedToken.trustScore);

          return updatedToken;
        });

        return { ...prev, tokens: updatedTokens };
      });
    } catch (error) {
      console.error('Token security fetch error:', error);
    }
  }, [state.tokens]);

  // Setup polling
  useEffect(() => {
    isMountedRef.current = true;
    fetchTokens();

    pollIntervalRef.current = setInterval(fetchTokens, POLL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchTokens]);

  return {
    tokens: filteredTokens,
    allTokens: state.tokens,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    activeFilter: state.activeFilter,
    setFilter,
    refresh,
    fetchTokenSecurity,
  };
}

// Helper hook for time since last update
export function useTimeSinceUpdate(lastUpdated: number | null): string {
  const [timeSince, setTimeSince] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) {
      setTimeSince('');
      return;
    }

    const updateTimeSince = () => {
      const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
      if (seconds < 60) {
        setTimeSince(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeSince(`${minutes}m ago`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return timeSince;
}
