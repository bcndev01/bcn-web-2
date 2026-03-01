// =============================================
// Helius API Service
// Smart Money Transaction Tracking for Solana
// =============================================

import {
  SmartMoneyTransaction,
  SmartWallet,
  SwapType,
  HeliusWebhookPayload,
  CURATED_SMART_WALLETS,
} from '../types/smartMoney';

// =============================================
// Configuration
// =============================================

// Helius API - Free tier: 1M credits/month, 10 RPS
// Get your API key at: https://www.helius.dev
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY || '';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API_URL = `https://api.helius.xyz/v0`;

// Cache and rate limiting
const CACHE_TTL = 300_000; // 5 minutes (aggressive caching)
const REQUEST_DELAY = 150; // 150ms between requests (safe for 10 RPS)

// Demo mode - use mock data when no API key
const DEMO_MODE = !HELIUS_API_KEY;

// Known DEX programs
const DEX_PROGRAMS: Record<string, string> = {
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB': 'Jupiter v4',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca',
  'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY': 'Phoenix',
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX': 'Serum',
};

// Token metadata cache
const tokenMetadataCache = new Map<string, { symbol: string; name: string; logo?: string; timestamp: number }>();

// Transaction cache for rate limit protection
const transactionCache = new Map<string, { transactions: SmartMoneyTransaction[]; timestamp: number }>();

// =============================================
// Demo/Mock Data Generator
// =============================================

const DEMO_TOKENS = [
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', logo: 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg' },
  { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', logo: 'https://assets.coingecko.com/coins/images/34188/small/jup.png' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', logo: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
  { address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', name: 'Marinade SOL', logo: 'https://assets.coingecko.com/coins/images/17752/small/mSOL.png' },
  { address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH', name: 'Pyth Network', logo: 'https://assets.coingecko.com/coins/images/31924/small/pyth.png' },
  { address: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk', symbol: 'WEN', name: 'Wen', logo: 'https://assets.coingecko.com/coins/images/34856/small/wen.png' },
  { address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', symbol: 'RENDER', name: 'Render', logo: 'https://assets.coingecko.com/coins/images/11636/small/rndr.png' },
  { address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'JitoSOL', name: 'Jito Staked SOL', logo: 'https://assets.coingecko.com/coins/images/28046/small/jitosol.png' },
  { address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', symbol: 'ORCA', name: 'Orca', logo: 'https://assets.coingecko.com/coins/images/17547/small/orca.png' },
  { address: 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey', symbol: 'MNDE', name: 'Marinade', logo: 'https://assets.coingecko.com/coins/images/18867/small/mnde.png' },
  { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', name: 'Popcat', logo: 'https://assets.coingecko.com/coins/images/35672/small/popcat.jpg' },
  { address: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', symbol: 'BOME', name: 'Book of Meme', logo: 'https://assets.coingecko.com/coins/images/36071/small/bome.jpg' },
];

const DEXES = ['Jupiter', 'Raydium', 'Orca', 'Phoenix'];

function generateMockTransactions(): SmartMoneyTransaction[] {
  const now = Date.now();
  const transactions: SmartMoneyTransaction[] = [];

  // Generate 20-30 mock transactions from the last 24 hours
  const numTransactions = 20 + Math.floor(Math.random() * 10);

  for (let i = 0; i < numTransactions; i++) {
    const wallet = CURATED_SMART_WALLETS[Math.floor(Math.random() * CURATED_SMART_WALLETS.length)];
    const token = DEMO_TOKENS[Math.floor(Math.random() * DEMO_TOKENS.length)];
    const type: SwapType = Math.random() > 0.4 ? 'BUY' : 'SELL';
    const dex = DEXES[Math.floor(Math.random() * DEXES.length)];

    // Random time in last 24 hours, weighted toward recent
    const hoursAgo = Math.pow(Math.random(), 2) * 24; // Quadratic distribution - more recent
    const timestamp = now - hoursAgo * 60 * 60 * 1000;

    // Random USD amount between $500 and $50,000
    const amountUSD = 500 + Math.random() * 49500;

    // Random token amount
    const tokenAmount = amountUSD / (0.001 + Math.random() * 10);

    transactions.push({
      id: `demo-${i}-${Date.now()}`,
      signature: `demo${Math.random().toString(36).substring(2, 15)}`,
      timestamp,
      walletAddress: wallet.address,
      walletLabel: wallet.label,
      walletCategory: wallet.category,
      type,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      tokenLogo: token.logo,
      amountUSD,
      tokenAmount,
      pricePerToken: amountUSD / tokenAmount,
      dex,
    });
  }

  // Sort by timestamp descending
  transactions.sort((a, b) => b.timestamp - a.timestamp);

  return transactions;
}

// Update demo transactions periodically with new activity
function refreshDemoTransactions(existing: SmartMoneyTransaction[]): SmartMoneyTransaction[] {
  const now = Date.now();

  // Add 1-3 new "recent" transactions
  const newCount = 1 + Math.floor(Math.random() * 3);
  const newTransactions: SmartMoneyTransaction[] = [];

  for (let i = 0; i < newCount; i++) {
    const wallet = CURATED_SMART_WALLETS[Math.floor(Math.random() * CURATED_SMART_WALLETS.length)];
    const token = DEMO_TOKENS[Math.floor(Math.random() * DEMO_TOKENS.length)];
    const type: SwapType = Math.random() > 0.4 ? 'BUY' : 'SELL';
    const dex = DEXES[Math.floor(Math.random() * DEXES.length)];

    // Very recent - last 5 minutes
    const minutesAgo = Math.random() * 5;
    const timestamp = now - minutesAgo * 60 * 1000;

    const amountUSD = 500 + Math.random() * 49500;
    const tokenAmount = amountUSD / (0.001 + Math.random() * 10);

    newTransactions.push({
      id: `demo-new-${Date.now()}-${i}`,
      signature: `demonew${Math.random().toString(36).substring(2, 15)}`,
      timestamp,
      walletAddress: wallet.address,
      walletLabel: wallet.label,
      walletCategory: wallet.category,
      type,
      tokenAddress: token.address,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      tokenLogo: token.logo,
      amountUSD,
      tokenAmount,
      pricePerToken: amountUSD / tokenAmount,
      dex,
    });
  }

  // Combine and sort
  const combined = [...newTransactions, ...existing];
  combined.sort((a, b) => b.timestamp - a.timestamp);

  // Keep last 50
  return combined.slice(0, 50);
}

// =============================================
// Helius Service Class
// =============================================

class HeliusService {
  private walletMap: Map<string, SmartWallet>;
  private lastRequestTime: number = 0;
  private demoTransactions: SmartMoneyTransaction[] = [];
  private requestCount: number = 0;
  private requestCountResetTime: number = Date.now();

  constructor() {
    // Initialize wallet map for quick lookups
    this.walletMap = new Map();
    CURATED_SMART_WALLETS.forEach(wallet => {
      this.walletMap.set(wallet.address, wallet);
    });

    // Initialize demo transactions if in demo mode
    if (DEMO_MODE) {
      this.demoTransactions = generateMockTransactions();
    }
  }

  // =============================================
  // Demo Mode Check
  // =============================================

  isDemoMode(): boolean {
    return DEMO_MODE;
  }

  // =============================================
  // Request Tracking (for rate limit display)
  // =============================================

  getRequestStats(): { count: number; limit: number; resetIn: number } {
    const now = Date.now();
    // Reset counter every minute
    if (now - this.requestCountResetTime > 60_000) {
      this.requestCount = 0;
      this.requestCountResetTime = now;
    }

    return {
      count: this.requestCount,
      limit: 600, // 10 RPS * 60 seconds
      resetIn: Math.max(0, 60_000 - (now - this.requestCountResetTime)),
    };
  }

  private incrementRequestCount(): void {
    const now = Date.now();
    if (now - this.requestCountResetTime > 60_000) {
      this.requestCount = 0;
      this.requestCountResetTime = now;
    }
    this.requestCount++;
  }

  // =============================================
  // Rate Limiting Helper
  // =============================================

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  // =============================================
  // Token Metadata
  // =============================================

  async getTokenMetadata(mintAddress: string): Promise<{ symbol: string; name: string; logo?: string }> {
    // Check cache
    const cached = tokenMetadataCache.get(mintAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 10) {
      return { symbol: cached.symbol, name: cached.name, logo: cached.logo };
    }

    await this.rateLimit();

    try {
      // Use DAS API for metadata
      const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'token-metadata',
          method: 'getAsset',
          params: { id: mintAddress },
        }),
      });

      const data = await response.json();

      if (data.result) {
        const metadata = {
          symbol: data.result.content?.metadata?.symbol || mintAddress.slice(0, 6),
          name: data.result.content?.metadata?.name || 'Unknown Token',
          logo: data.result.content?.links?.image,
          timestamp: Date.now(),
        };

        tokenMetadataCache.set(mintAddress, metadata);
        return metadata;
      }
    } catch (error) {
      console.error('Token metadata fetch error:', error);
    }

    // Fallback
    return { symbol: mintAddress.slice(0, 6), name: 'Unknown Token' };
  }

  // =============================================
  // Get Transactions for Wallet
  // =============================================

  async getWalletTransactions(
    walletAddress: string,
    limit: number = 20
  ): Promise<SmartMoneyTransaction[]> {
    if (!HELIUS_API_KEY) {
      console.warn('Helius API key not configured');
      return [];
    }

    await this.rateLimit();

    try {
      // Use Helius enhanced transaction history
      const response = await fetch(
        `${HELIUS_API_URL}/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const transactions = await response.json();

      // Parse and filter for swap transactions
      const parsedTransactions: SmartMoneyTransaction[] = [];

      for (const tx of transactions) {
        const parsed = await this.parseTransaction(tx, walletAddress);
        if (parsed) {
          parsedTransactions.push(parsed);
        }
      }

      return parsedTransactions;
    } catch (error) {
      console.error('Helius transaction fetch error:', error);
      return [];
    }
  }

  // =============================================
  // Parse Transaction
  // =============================================

  private async parseTransaction(
    tx: any,
    walletAddress: string
  ): Promise<SmartMoneyTransaction | null> {
    // Only process swap transactions
    if (tx.type !== 'SWAP' && tx.type !== 'TOKEN_TRANSFER') {
      return null;
    }

    // Get wallet info
    const wallet = this.walletMap.get(walletAddress);

    try {
      // Determine swap type and token
      let type: SwapType = 'SWAP';
      let tokenAddress = '';
      let tokenAmount = 0;
      let amountUSD = 0;

      if (tx.events?.swap) {
        const swap = tx.events.swap;

        // Check if buying (SOL -> Token) or selling (Token -> SOL)
        if (swap.nativeInput && swap.tokenOutputs?.length > 0) {
          type = 'BUY';
          tokenAddress = swap.tokenOutputs[0].mint;
          tokenAmount = parseFloat(swap.tokenOutputs[0].amount);
        } else if (swap.tokenInputs?.length > 0 && swap.nativeOutput) {
          type = 'SELL';
          tokenAddress = swap.tokenInputs[0].mint;
          tokenAmount = parseFloat(swap.tokenInputs[0].amount);
        } else if (swap.tokenInputs?.length > 0 && swap.tokenOutputs?.length > 0) {
          // Token to token swap - consider it based on SOL wrapper
          type = 'SWAP';
          tokenAddress = swap.tokenOutputs[0].mint;
          tokenAmount = parseFloat(swap.tokenOutputs[0].amount);
        }
      }

      if (!tokenAddress) {
        return null;
      }

      // Get token metadata
      const metadata = await this.getTokenMetadata(tokenAddress);

      // Estimate USD value from native transfers or token transfers
      const nativeChange = tx.nativeTransfers?.reduce((sum: number, t: any) => {
        if (t.fromUserAccount === walletAddress) return sum - t.amount;
        if (t.toUserAccount === walletAddress) return sum + t.amount;
        return sum;
      }, 0) || 0;

      // Convert lamports to SOL and estimate USD (rough estimate: 1 SOL = $150)
      const solAmount = Math.abs(nativeChange) / 1e9;
      amountUSD = solAmount * 150; // TODO: Get real SOL price

      // Determine DEX
      const dex = this.detectDex(tx.source);

      return {
        id: tx.signature,
        signature: tx.signature,
        timestamp: tx.timestamp * 1000,
        walletAddress,
        walletLabel: wallet?.label || walletAddress.slice(0, 8),
        walletCategory: wallet?.category || 'Whale',
        type,
        tokenAddress,
        tokenSymbol: metadata.symbol,
        tokenName: metadata.name,
        tokenLogo: metadata.logo,
        amountUSD,
        tokenAmount,
        pricePerToken: tokenAmount > 0 ? amountUSD / tokenAmount : 0,
        dex,
      };
    } catch (error) {
      console.error('Transaction parse error:', error);
      return null;
    }
  }

  // =============================================
  // Detect DEX
  // =============================================

  private detectDex(source: string): string {
    return DEX_PROGRAMS[source] || source || 'Unknown DEX';
  }

  // =============================================
  // Get Recent Smart Money Activity
  // =============================================

  async getRecentSmartMoneyActivity(
    wallets: SmartWallet[] = CURATED_SMART_WALLETS,
    limitPerWallet: number = 10,
    forceRefresh: boolean = false
  ): Promise<SmartMoneyTransaction[]> {
    // Demo mode - return mock transactions
    if (DEMO_MODE) {
      // Refresh demo data with some new transactions
      this.demoTransactions = refreshDemoTransactions(this.demoTransactions);
      return this.demoTransactions;
    }

    // Check cache first (5 minute TTL)
    const cacheKey = 'smart-money-activity';
    const cached = transactionCache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[HeliusService] Returning cached transactions');
      return cached.transactions;
    }

    const allTransactions: SmartMoneyTransaction[] = [];

    // Fetch in parallel with rate limiting
    const batchSize = 3; // Process 3 wallets at a time

    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(wallet => this.getWalletTransactions(wallet.address, limitPerWallet))
      );

      for (const transactions of batchResults) {
        allTransactions.push(...transactions);
      }

      // Small delay between batches
      if (i + batchSize < wallets.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Sort by timestamp descending
    allTransactions.sort((a, b) => b.timestamp - a.timestamp);

    // Update cache
    transactionCache.set(cacheKey, {
      transactions: allTransactions,
      timestamp: Date.now(),
    });

    return allTransactions;
  }

  // =============================================
  // Get Demo Transactions (for UI indicator)
  // =============================================

  getDemoTransactions(): SmartMoneyTransaction[] {
    return this.demoTransactions;
  }

  // =============================================
  // Add Custom Wallet
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
  // Check API Key Status
  // =============================================

  isConfigured(): boolean {
    return !!HELIUS_API_KEY;
  }

  // =============================================
  // Get SOL Price (Simple)
  // =============================================

  async getSolPrice(): Promise<number> {
    try {
      // Use DexScreener for SOL price
      const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
      const data = await response.json();

      if (data.pairs && data.pairs.length > 0) {
        return parseFloat(data.pairs[0].priceUsd) || 150;
      }
    } catch (error) {
      console.error('SOL price fetch error:', error);
    }

    return 150; // Fallback
  }
}

export const heliusService = new HeliusService();
