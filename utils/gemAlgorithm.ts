import { ProcessedToken, GemCategory, RedFlagType, DexScreenerPair } from '../types/dexScreener';
import { TrustScoreColor } from '../types';

// =============================================
// CONSTANTS
// =============================================

const RESERVED_SYMBOLS = ['SOL', 'ETH', 'BTC', 'USDC', 'USDT', 'BONK', 'WIF', 'PEPE', 'DOGE', 'SHIB', 'XRP', 'BNB'];

const MIN_BUBBLE_RADIUS = 35;
const MAX_BUBBLE_RADIUS = 80;

// =============================================
// CATEGORY DETECTION ALGORITHMS
// =============================================

export function isBreakoutHunter(token: ProcessedToken): boolean {
  const { priceChange1h, priceChangeM5, volumeH1, liquidity, fdv, txnsH1, buyRatio } = token;

  return (
    priceChange1h >= 10 &&
    priceChange1h <= 100 &&
    priceChangeM5 > -2 &&
    volumeH1 > liquidity * 0.2 &&
    fdv >= 50_000 &&
    fdv <= 10_000_000 &&
    txnsH1.total > 300 &&
    buyRatio > 0.52
  );
}

export function isStrongTrend(token: ProcessedToken): boolean {
  const { priceChange24h, priceChange1h, liquidity, fdv, volume24h } = token;
  const volLiqRatio = liquidity > 0 ? volume24h / liquidity : 0;

  return (
    priceChange24h > 30 &&
    priceChange1h > 0 &&
    liquidity > 25_000 &&
    fdv >= 500_000 &&
    fdv <= 10_000_000 &&
    volLiqRatio > 0.5
  );
}

export function isWhaleMagnet(token: ProcessedToken): boolean {
  const { fdv, liquidity, ageHours, txnsH24, volumeH1, priceChange1h } = token;
  const fdvLiqRatio = liquidity > 0 ? fdv / liquidity : Infinity;

  return (
    fdvLiqRatio <= 5 &&
    ageHours > 24 &&
    txnsH24.total > 300 &&
    volumeH1 > 500 &&
    priceChange1h > -5
  );
}

export function detectCategories(token: ProcessedToken): GemCategory[] {
  const categories: GemCategory[] = [];

  if (isBreakoutHunter(token)) {
    categories.push('Breakout Hunter');
  }
  if (isStrongTrend(token)) {
    categories.push('Strong Trend');
  }
  if (isWhaleMagnet(token)) {
    categories.push('Whale Magnet');
  }

  return categories;
}

// =============================================
// RED FLAG DETECTION ALGORITHMS (Enhanced v2)
// =============================================

export function detectRedFlags(token: ProcessedToken): RedFlagType[] {
  const flags: RedFlagType[] = [];

  // Falling Knife: Price crashing > 15% in 1h (more lenient threshold)
  if (token.priceChange1h < -15) {
    flags.push('Falling Knife');
  }

  // Dead Volume: Very low activity (< $500 in 1h)
  if (token.volumeH1 < 500) {
    flags.push('Dead Volume');
  }

  // Honeypot V2: Can buy but can't sell (> 20 buys, < 2 sells in 1h)
  if (token.txnsH1.buys > 20 && token.txnsH1.sells < 2) {
    flags.push('Honeypot V2');
  }

  // Wash Trading: Suspiciously large average transaction size
  const isLowCap = token.fdv < 100_000;
  const washThreshold = isLowCap ? 500 : 1500;
  if (token.avgTxSize > washThreshold && token.txnsH1.total > 0) {
    flags.push('Wash Trading');
  }

  // Honeypot Risk: Very few sells relative to buys
  if (token.txnsH1.sells < 5 && token.txnsH1.buys > 10) {
    flags.push('Honeypot Risk');
  }

  // Impersonator: Reserved symbols with low cap
  if (RESERVED_SYMBOLS.includes(token.symbol.toUpperCase()) && token.fdv < 10_000_000) {
    flags.push('Impersonator');
  }

  // NEW: Rug Pull Risk - Very low liquidity compared to FDV
  if (token.fdv > 0 && token.liquidity / token.fdv < 0.03) {
    flags.push('Rug Pull Risk');
  }

  // NEW: Pump & Dump - Extreme price spike with low liquidity
  if (token.priceChange1h > 200 && token.liquidity < 10_000) {
    flags.push('Pump & Dump');
  }

  return flags;
}

// =============================================
// ON-CHAIN SECURITY RED FLAGS (RugCheck Data)
// =============================================

export function detectOnChainRedFlags(token: ProcessedToken): RedFlagType[] {
  const flags: RedFlagType[] = [];
  const { security } = token;

  // Skip if security data not loaded
  if (!security.loaded) {
    return flags;
  }

  // Mintable: Token owner can mint new tokens (dilution risk)
  if (security.isMintable) {
    flags.push('Mintable');
  }

  // Freezable: Token owner can freeze accounts (funds at risk)
  if (security.isFreezable) {
    flags.push('Freezable');
  }

  // Mutable Metadata: Token info can be changed
  if (security.isMutable) {
    flags.push('Mutable Metadata');
  }

  // LP Unlocked: Liquidity not locked or burned (rug risk)
  if (!security.isLpSafe && security.lpLockedPct < 50 && security.lpBurnedPct < 50) {
    flags.push('LP Unlocked');
  }

  // Insider Risk: Insiders hold significant portion
  if (security.hasInsiderRisk) {
    flags.push('Insider Risk');
  }

  // Whale Dominated: Top holder owns > 20%
  if (security.topHolderPct > 20) {
    flags.push('Whale Dominated');
  }

  return flags;
}

// =============================================
// MERGE RED FLAGS (Off-chain + On-chain)
// =============================================

export function mergeRedFlags(offChainFlags: RedFlagType[], onChainFlags: RedFlagType[]): RedFlagType[] {
  // Combine and deduplicate
  const allFlags = new Set([...offChainFlags, ...onChainFlags]);
  return Array.from(allFlags);
}

// =============================================
// TRUST SCORE CALCULATION (Enhanced v2)
// =============================================

export function calculateTrustScore(token: ProcessedToken): number {
  let score = 0;

  // ========== POSITIVE FACTORS (Max +9) ==========

  // +1: Liquidity > $25k (increased threshold)
  if (token.liquidity > 25_000) {
    score += 1;
  }

  // +1: Has BOTH website AND socials (stricter)
  if (token.hasWebsite && token.hasSocials) {
    score += 1;
  }

  // +1: Buy ratio > 55% (healthy buying pressure)
  if (token.buyRatio > 0.55) {
    score += 1;
  }

  // +1: Liquidity/FDV > 10% (good liquidity depth)
  if (token.fdv > 0 && token.liquidity / token.fdv > 0.1) {
    score += 1;
  }

  // +1: Token age > 24 hours (survived initial volatility)
  if (token.ageHours > 24) {
    score += 1;
  }

  // +1: High transaction count (genuine activity)
  if (token.transactions24h > 500) {
    score += 1;
  }

  // +1: No red flags
  if (token.redFlags.length === 0) {
    score += 1;
  }

  // +1: Price stability - not crashing (h1 > -15%)
  if (token.priceChange1h > -15) {
    score += 1;
  }

  // +1: Consistent volume (h1 volume > $1k)
  if (token.volumeH1 > 1_000) {
    score += 1;
  }

  // ========== NEGATIVE FACTORS (Penalties) ==========

  // -2: Severe price crash (h1 < -30%)
  if (token.priceChange1h < -30) {
    score -= 2;
  }
  // -1: Moderate price crash (h1 < -20%)
  else if (token.priceChange1h < -20) {
    score -= 1;
  }

  // -2: Multiple red flags (high risk)
  if (token.redFlags.length >= 2) {
    score -= 2;
  }
  // -1: Single red flag
  else if (token.redFlags.length === 1) {
    score -= 1;
  }

  // -1: Very low liquidity ratio (potential rug)
  if (token.fdv > 0 && token.liquidity / token.fdv < 0.05) {
    score -= 1;
  }

  // -1: Extremely new token (< 1 hour) - high risk period
  if (token.ageHours < 1) {
    score -= 1;
  }

  // -1: Low sell activity (potential honeypot indicator)
  if (token.txnsH1.buys > 15 && token.txnsH1.sells < 3) {
    score -= 1;
  }

  // -1: Suspicious buy/sell imbalance in 24h
  const sellRatio24h = token.txnsH24.total > 0 ? token.txnsH24.sells / token.txnsH24.total : 0;
  if (sellRatio24h < 0.2 && token.txnsH24.total > 100) {
    score -= 1;
  }

  // ========== ON-CHAIN SECURITY FACTORS ==========
  // (Only apply if security data is loaded)

  if (token.security.loaded) {
    // +2: LP is locked or burned (major trust indicator)
    if (token.security.isLpSafe) {
      score += 2;
    }

    // +1: Not mintable (supply is fixed)
    if (!token.security.isMintable) {
      score += 1;
    }

    // +1: Not freezable (accounts can't be frozen)
    if (!token.security.isFreezable) {
      score += 1;
    }

    // -2: Mintable AND Freezable (very dangerous)
    if (token.security.isMintable && token.security.isFreezable) {
      score -= 2;
    }

    // -1: LP unlocked and not burned
    if (!token.security.isLpSafe && token.security.lpLockedPct < 50) {
      score -= 1;
    }

    // -1: Whale dominated (top holder > 20%)
    if (token.security.topHolderPct > 20) {
      score -= 1;
    }

    // -1: Insider risk detected
    if (token.security.hasInsiderRisk) {
      score -= 1;
    }
  }

  // Clamp score between 0 and 7
  return Math.max(0, Math.min(score, 7));
}

// =============================================
// TRUST SCORE COLOR MAPPING
// =============================================

export function getTrustScoreColor(score: number): string {
  if (score >= 7) return TrustScoreColor.GOLD;
  if (score >= 6) return TrustScoreColor.CYAN;
  if (score >= 5) return TrustScoreColor.MAGENTA;
  if (score >= 4) return TrustScoreColor.GREEN;
  if (score >= 3) return TrustScoreColor.YELLOW;
  if (score >= 2) return TrustScoreColor.ORANGE;
  if (score >= 1) return TrustScoreColor.RED;
  return TrustScoreColor.GRAY;
}

// =============================================
// BUBBLE SIZING ALGORITHM
// =============================================

export function calculateBubbleRadius(token: ProcessedToken): number {
  const radiusRange = MAX_BUBBLE_RADIUS - MIN_BUBBLE_RADIUS;

  // Trust factor: 30% weight
  const trustFactor = (token.trustScore / 7) * 0.3;

  // Change factor: 70% weight (capped at 100% change)
  const changeAbs = Math.abs(token.priceChange1h);
  const changeFactor = Math.min(changeAbs / 100, 1.0) * 0.7;

  // Combined factor
  const combinedFactor = trustFactor + changeFactor;

  return MIN_BUBBLE_RADIUS + combinedFactor * radiusRange;
}

// =============================================
// CATEGORY COLOR MAPPING
// =============================================

export function getCategoryColor(category: GemCategory): string {
  switch (category) {
    case 'Breakout Hunter':
      return '#FFA500'; // Orange
    case 'Strong Trend':
      return '#3B82F6'; // Blue
    case 'Whale Magnet':
      return '#A855F7'; // Purple
    default:
      return '#6B7280'; // Gray
  }
}

export function getCategoryIcon(category: GemCategory): string {
  switch (category) {
    case 'Breakout Hunter':
      return '🔥';
    case 'Strong Trend':
      return '🚀';
    case 'Whale Magnet':
      return '💎';
    default:
      return '●';
  }
}

// =============================================
// PAIR TRANSFORMATION
// =============================================

export function transformPairToToken(pair: DexScreenerPair, fetchedAt: number): ProcessedToken {
  const now = Date.now();
  const ageMs = now - pair.pairCreatedAt;
  const ageHours = ageMs / (1000 * 60 * 60);

  const txnsH1Total = pair.txns.h1.buys + pair.txns.h1.sells;
  const txnsH24Total = pair.txns.h24.buys + pair.txns.h24.sells;
  const buyRatio = txnsH1Total > 0 ? pair.txns.h1.buys / txnsH1Total : 0;
  const avgTxSize = txnsH1Total > 0 ? pair.volume.h1 / txnsH1Total : 0;

  const hasWebsite = (pair.info?.websites?.length || 0) > 0;
  const hasSocials = (pair.info?.socials?.length || 0) > 0;

  // Create base token
  const baseToken: ProcessedToken = {
    id: pair.baseToken.address,
    address: pair.baseToken.address,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    chainId: pair.chainId,
    dexUrl: pair.url,
    pairAddress: pair.pairAddress,

    price: parseFloat(pair.priceUsd) || 0,
    priceChange1h: pair.priceChange.h1 || 0,
    priceChange24h: pair.priceChange.h24 || 0,
    priceChangeM5: pair.priceChange.m5 || 0,
    priceChangeH6: pair.priceChange.h6 || 0,

    liquidity: pair.liquidity.usd || 0,
    fdv: pair.fdv || 0,
    marketCap: pair.marketCap || pair.fdv || 0,
    volume24h: pair.volume.h24 || 0,
    volumeH1: pair.volume.h1 || 0,
    volumeH6: pair.volume.h6 || 0,
    volumeM5: pair.volume.m5 || 0,

    transactions24h: txnsH24Total,
    txnsH1: { buys: pair.txns.h1.buys, sells: pair.txns.h1.sells, total: txnsH1Total },
    txnsH24: { buys: pair.txns.h24.buys, sells: pair.txns.h24.sells, total: txnsH24Total },
    buyRatio,
    avgTxSize,

    ageHours,
    logoUrl: pair.info?.imageUrl,
    hasWebsite,
    hasSocials,
    holders: 0, // Not available from this API

    // Will be calculated
    trustScore: 0,
    trustScoreColor: TrustScoreColor.GRAY,
    categories: [],
    redFlags: [],

    // Default security info (will be enriched by RugCheck)
    security: {
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
      loaded: false,
    },

    bubbleRadius: MIN_BUBBLE_RADIUS,
    isNew: false,

    fetchedAt,
    pairCreatedAt: pair.pairCreatedAt,
  };

  // Detect red flags first
  baseToken.redFlags = detectRedFlags(baseToken);

  // Calculate trust score
  baseToken.trustScore = calculateTrustScore(baseToken);
  baseToken.trustScoreColor = getTrustScoreColor(baseToken.trustScore);

  // Detect categories
  baseToken.categories = detectCategories(baseToken);

  // Calculate bubble radius
  baseToken.bubbleRadius = calculateBubbleRadius(baseToken);

  return baseToken;
}

// =============================================
// PAIR FILTERING & SELECTION
// =============================================

export function filterSolanaPairs(pairs: DexScreenerPair[]): DexScreenerPair[] {
  return pairs.filter((pair) => {
    // Must be Solana
    if (pair.chainId !== 'solana') return false;

    // Quote token must be SOL or USDC
    const quoteSymbol = pair.quoteToken.symbol.toUpperCase();
    if (!['SOL', 'USDC'].includes(quoteSymbol)) return false;

    // Must have liquidity
    if (!pair.liquidity?.usd || pair.liquidity.usd < 1000) return false;

    return true;
  });
}

export function selectBestPairPerToken(pairs: DexScreenerPair[]): Map<string, DexScreenerPair> {
  const bestPairs = new Map<string, DexScreenerPair>();

  for (const pair of pairs) {
    const address = pair.baseToken.address;
    const existing = bestPairs.get(address);

    if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
      bestPairs.set(address, pair);
    }
  }

  return bestPairs;
}

// =============================================
// MAIN PROCESSING PIPELINE
// =============================================

export function processTokens(pairs: DexScreenerPair[]): ProcessedToken[] {
  const fetchedAt = Date.now();

  // Filter Solana pairs with SOL/USDC quote
  const filteredPairs = filterSolanaPairs(pairs);

  // Select best pair per token (highest liquidity)
  const bestPairs = selectBestPairPerToken(filteredPairs);

  // Transform to ProcessedToken
  const tokens: ProcessedToken[] = [];

  for (const pair of bestPairs.values()) {
    const token = transformPairToToken(pair, fetchedAt);

    // Skip tokens with critical red flags (auto-reject)
    const criticalFlags: RedFlagType[] = ['Honeypot V2', 'Impersonator', 'Rug Pull Risk'];
    const hasCriticalFlag = token.redFlags.some((flag) => criticalFlags.includes(flag));

    if (!hasCriticalFlag) {
      tokens.push(token);
    }
  }

  // Sort by trust score, then by volume
  tokens.sort((a, b) => {
    if (b.trustScore !== a.trustScore) {
      return b.trustScore - a.trustScore;
    }
    return b.volume24h - a.volume24h;
  });

  // Limit to top 75 tokens
  return tokens.slice(0, 75);
}
