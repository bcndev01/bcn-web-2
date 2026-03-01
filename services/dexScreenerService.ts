import {
  DexScreenerTokenProfile,
  DexScreenerBoostedToken,
  DexScreenerPair,
  DexScreenerTokenResponse,
  CacheEntry,
} from '../types/dexScreener';

const BASE_URL = '/api/dexscreener';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const BATCH_SIZE = 30; // Max addresses per enrichment request

class DexScreenerService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    throw lastError;
  }

  async getLatestTokens(): Promise<DexScreenerTokenProfile[]> {
    const cacheKey = 'latest-tokens';
    const cached = this.getCached<DexScreenerTokenProfile[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.fetchWithRetry<DexScreenerTokenProfile[]>(
        `${BASE_URL}/token-profiles/latest/v1`
      );

      // Filter for Solana only
      const solanaTokens = (data || []).filter((t) => t.chainId === 'solana');
      this.setCache(cacheKey, solanaTokens);
      return solanaTokens;
    } catch (error) {
      console.error('Failed to fetch latest tokens:', error);
      return [];
    }
  }

  async getBoostedTokens(): Promise<DexScreenerBoostedToken[]> {
    const cacheKey = 'boosted-tokens';
    const cached = this.getCached<DexScreenerBoostedToken[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.fetchWithRetry<DexScreenerBoostedToken[]>(
        `${BASE_URL}/token-boosts/latest/v1`
      );

      const solanaTokens = (data || []).filter((t) => t.chainId === 'solana');
      this.setCache(cacheKey, solanaTokens);
      return solanaTokens;
    } catch (error) {
      console.error('Failed to fetch boosted tokens:', error);
      return [];
    }
  }

  async getTopBoostedTokens(): Promise<DexScreenerBoostedToken[]> {
    const cacheKey = 'top-boosted-tokens';
    const cached = this.getCached<DexScreenerBoostedToken[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.fetchWithRetry<DexScreenerBoostedToken[]>(
        `${BASE_URL}/token-boosts/top/v1`
      );

      const solanaTokens = (data || []).filter((t) => t.chainId === 'solana');
      this.setCache(cacheKey, solanaTokens);
      return solanaTokens;
    } catch (error) {
      console.error('Failed to fetch top boosted tokens:', error);
      return [];
    }
  }

  async enrichTokens(addresses: string[]): Promise<DexScreenerPair[]> {
    if (addresses.length === 0) return [];

    // Batch addresses into groups of BATCH_SIZE
    const batches: string[][] = [];
    for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
      batches.push(addresses.slice(i, i + BATCH_SIZE));
    }

    const allPairs: DexScreenerPair[] = [];

    for (const batch of batches) {
      const addressString = batch.join(',');
      const cacheKey = `pairs-${addressString}`;
      const cached = this.getCached<DexScreenerPair[]>(cacheKey);

      if (cached) {
        allPairs.push(...cached);
        continue;
      }

      try {
        const data = await this.fetchWithRetry<DexScreenerTokenResponse>(
          `${BASE_URL}/latest/dex/tokens/${addressString}`
        );

        const pairs = data?.pairs || [];
        this.setCache(cacheKey, pairs);
        allPairs.push(...pairs);
      } catch (error) {
        console.error('Failed to enrich tokens batch:', error);
      }
    }

    return allPairs;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const dexScreenerService = new DexScreenerService();
