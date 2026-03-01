// =============================================
// RugCheck API Service
// On-chain security analysis for Solana tokens
// =============================================

export interface RugCheckRisk {
  name: string;
  description: string;
  level: 'warn' | 'danger' | 'good';
  score: number;
}

export interface RugCheckResponse {
  mint: string;
  tokenMeta?: {
    name: string;
    symbol: string;
    uri?: string;
    mutable: boolean;
    updateAuthority?: string;
  };
  token?: {
    mintAuthority: string | null;
    freezeAuthority: string | null;
    supply: number;
    decimals: number;
  };
  markets?: Array<{
    marketType: string;
    pubkey: string;
    lpMint?: string;
    lpCurrentSupply?: number;
    lpTotalSupply?: number;
    lp?: {
      lpLocked: number;
      lpBurned: number;
      lpUnlocked: number;
      lpLockedPct: number;
      lpBurnedPct: number;
    };
  }>;
  topHolders?: Array<{
    address: string;
    pct: number;
    uiAmount: number;
    isInsider: boolean;
  }>;
  risks?: RugCheckRisk[];
  score?: number;
  rugged?: boolean;
}

export interface TokenSecurityInfo {
  // On-chain security flags
  isMintable: boolean;
  isFreezable: boolean;
  isMutable: boolean;

  // LP status
  lpLockedPct: number;
  lpBurnedPct: number;
  isLpSafe: boolean;

  // Holder analysis
  topHolderPct: number;
  top10HolderPct: number;
  hasInsiderRisk: boolean;

  // Overall
  rugCheckScore: number;
  isRugged: boolean;
  risks: RugCheckRisk[];

  // Loading state
  loaded: boolean;
}

// Default security info (before data loads)
export const defaultSecurityInfo: TokenSecurityInfo = {
  isMintable: false,
  isFreezable: false,
  isMutable: false,
  lpLockedPct: 0,
  lpBurnedPct: 0,
  isLpSafe: false,
  topHolderPct: 0,
  top10HolderPct: 0,
  hasInsiderRisk: false,
  rugCheckScore: 0,
  isRugged: false,
  risks: [],
  loaded: false,
};

// Cache for security data (10 minute TTL - longer to reduce API calls)
const securityCache = new Map<string, { data: TokenSecurityInfo; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Rate limiting queue
const requestQueue: Array<{ address: string; resolve: (data: TokenSecurityInfo) => void }> = [];
let isProcessingQueue = false;
const REQUEST_DELAY = 2000; // 2 seconds between requests

// Track 429 errors for exponential backoff
let consecutiveErrors = 0;
let lastErrorTime = 0;
const BACKOFF_BASE = 5000; // 5 second base backoff
const MAX_BACKOFF = 60000; // Max 60 seconds

class RugCheckService {
  private baseUrl = '/api/rugcheck';

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (isProcessingQueue || requestQueue.length === 0) return;

    isProcessingQueue = true;
    let isFirstRequest = true;

    while (requestQueue.length > 0) {
      const request = requestQueue.shift();
      if (!request) break;

      // Skip delay for first request, apply delay for subsequent requests
      if (!isFirstRequest) {
        // Calculate backoff delay if we've had recent errors
        let delay = REQUEST_DELAY;
        if (consecutiveErrors > 0 && Date.now() - lastErrorTime < 60000) {
          delay = Math.min(BACKOFF_BASE * Math.pow(2, consecutiveErrors - 1), MAX_BACKOFF);
          console.log(`RugCheck: Using backoff delay of ${delay}ms after ${consecutiveErrors} errors`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      isFirstRequest = false;

      const security = await this.fetchSingleToken(request.address);
      request.resolve(security);
    }

    isProcessingQueue = false;
  }

  /**
   * Internal fetch for a single token (no queue)
   */
  private async fetchSingleToken(mintAddress: string): Promise<TokenSecurityInfo> {
    // Check cache first
    const cached = securityCache.get(mintAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`RugCheck: Cache hit for ${mintAddress.slice(0, 8)}...`);
      return cached.data;
    }

    try {
      console.log(`RugCheck: Fetching security for ${mintAddress.slice(0, 8)}...`);
      const response = await fetch(`${this.baseUrl}/v1/tokens/${mintAddress}/report`);

      if (response.status === 429) {
        // Rate limited - increase backoff
        consecutiveErrors++;
        lastErrorTime = Date.now();
        console.warn(`RugCheck rate limited (429) for ${mintAddress}. Errors: ${consecutiveErrors}`);
        return { ...defaultSecurityInfo, loaded: false }; // Return not loaded so it can retry later
      }

      if (!response.ok) {
        console.warn(`RugCheck API error for ${mintAddress}: ${response.status}`);
        return { ...defaultSecurityInfo, loaded: true };
      }

      // Reset error count on success
      consecutiveErrors = 0;

      const data: RugCheckResponse = await response.json();
      console.log(`RugCheck: Got response for ${mintAddress.slice(0, 8)}...`, data);
      const securityInfo = this.parseSecurityData(data);
      console.log(`RugCheck: Parsed security for ${mintAddress.slice(0, 8)}...`, securityInfo);

      // Cache the result
      securityCache.set(mintAddress, { data: securityInfo, timestamp: Date.now() });

      return securityInfo;
    } catch (error) {
      console.error(`RugCheck fetch error for ${mintAddress}:`, error);
      return { ...defaultSecurityInfo, loaded: true };
    }
  }

  /**
   * Fetch security info for a single token (with queue)
   */
  async getTokenSecurity(mintAddress: string): Promise<TokenSecurityInfo> {
    // Check cache first - if cached, return immediately
    const cached = securityCache.get(mintAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Add to queue and wait for result
    return new Promise((resolve) => {
      requestQueue.push({ address: mintAddress, resolve });
      this.processQueue();
    });
  }

  /**
   * Batch fetch security info for multiple tokens
   * Now uses queue-based rate limiting
   */
  async getBatchTokenSecurity(mintAddresses: string[]): Promise<Map<string, TokenSecurityInfo>> {
    const results = new Map<string, TokenSecurityInfo>();

    // Filter out already cached addresses
    const uncachedAddresses = mintAddresses.filter(addr => {
      const cached = securityCache.get(addr);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        results.set(addr, cached.data);
        return false;
      }
      return true;
    });

    // Queue remaining addresses (they'll be processed sequentially with rate limiting)
    const promises = uncachedAddresses.map(address =>
      this.getTokenSecurity(address).then(security => ({ address, security }))
    );

    const batchResults = await Promise.all(promises);

    for (const { address, security } of batchResults) {
      results.set(address, security);
    }

    return results;
  }

  /**
   * Parse RugCheck API response into our security info format
   */
  private parseSecurityData(data: RugCheckResponse): TokenSecurityInfo {
    // Check mint authority (mintable)
    const isMintable = data.token?.mintAuthority !== null && data.token?.mintAuthority !== undefined;

    // Check freeze authority (freezable)
    const isFreezable = data.token?.freezeAuthority !== null && data.token?.freezeAuthority !== undefined;

    // Check if metadata is mutable
    const isMutable = data.tokenMeta?.mutable ?? false;

    // LP analysis
    let lpLockedPct = 0;
    let lpBurnedPct = 0;

    if (data.markets && data.markets.length > 0) {
      // Find the main market (usually Raydium)
      const mainMarket = data.markets.find(m => m.lp) || data.markets[0];
      if (mainMarket?.lp) {
        lpLockedPct = mainMarket.lp.lpLockedPct || 0;
        lpBurnedPct = mainMarket.lp.lpBurnedPct || 0;
      }
    }

    const isLpSafe = lpLockedPct >= 80 || lpBurnedPct >= 80;

    // Holder analysis
    let topHolderPct = 0;
    let top10HolderPct = 0;
    let hasInsiderRisk = false;

    if (data.topHolders && data.topHolders.length > 0) {
      topHolderPct = data.topHolders[0]?.pct || 0;
      top10HolderPct = data.topHolders.slice(0, 10).reduce((sum, h) => sum + h.pct, 0);
      hasInsiderRisk = data.topHolders.some(h => h.isInsider && h.pct > 5);
    }

    return {
      isMintable,
      isFreezable,
      isMutable,
      lpLockedPct,
      lpBurnedPct,
      isLpSafe,
      topHolderPct,
      top10HolderPct,
      hasInsiderRisk,
      rugCheckScore: data.score || 0,
      isRugged: data.rugged || false,
      risks: data.risks || [],
      loaded: true,
    };
  }

  /**
   * Clear cache for a specific token or all tokens
   */
  clearCache(mintAddress?: string): void {
    if (mintAddress) {
      securityCache.delete(mintAddress);
    } else {
      securityCache.clear();
    }
  }
}

export const rugCheckService = new RugCheckService();
