// =============================================
// AI Token Analyzer Service
// Uses Supabase Edge Function for secure AI analysis
// =============================================

import { AITokenAnalysis, AIVerdict, SmartMoneyTransaction } from '../types/smartMoney';
import { ProcessedToken } from '../types/dexScreener';

// =============================================
// Configuration
// =============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-analyze`;

// Cache for AI analysis (15 minute TTL)
const analysisCache = new Map<string, { data: AITokenAnalysis; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

// =============================================
// AI Analyzer Service
// =============================================

class AIAnalyzerService {
  // =============================================
  // Analyze Token
  // =============================================

  async analyzeToken(
    tokenAddress: string,
    tokenData?: ProcessedToken,
    smartMoneyContext?: SmartMoneyTransaction[]
  ): Promise<AITokenAnalysis | null> {
    // Check cache
    const cached = analysisCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Check if Supabase is configured
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.log('[AIAnalyzer] Supabase not configured - using algorithmic analysis');
      return this.createFallbackAnalysis(tokenAddress, tokenData, smartMoneyContext);
    }

    try {
      console.log('[AIAnalyzer] Calling edge function for AI analysis...');

      // Call Supabase Edge Function
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          tokenAddress,
          tokenData: tokenData ? {
            symbol: tokenData.symbol,
            name: tokenData.name,
            price: tokenData.price,
            marketCap: tokenData.marketCap,
            fdv: tokenData.fdv,
            liquidity: tokenData.liquidity,
            volume24h: tokenData.volume24h,
            priceChange1h: tokenData.priceChange1h,
            priceChange24h: tokenData.priceChange24h,
            ageHours: tokenData.ageHours,
            buyRatio: tokenData.buyRatio,
            txnsH1: tokenData.txnsH1,
            hasWebsite: tokenData.hasWebsite,
            hasSocials: tokenData.hasSocials,
            trustScore: tokenData.trustScore,
            redFlags: tokenData.redFlags,
            security: tokenData.security,
          } : undefined,
          smartMoneyContext: smartMoneyContext?.map(tx => ({
            type: tx.type,
            amountUSD: tx.amountUSD,
            walletAddress: tx.walletAddress,
            walletLabel: tx.walletLabel,
            timestamp: tx.timestamp,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[AIAnalyzer] Edge function error:', errorData.error || response.status);
        return this.createFallbackAnalysis(tokenAddress, tokenData, smartMoneyContext);
      }

      const analysis = await response.json();

      // Cache result
      analysisCache.set(tokenAddress, { data: analysis, timestamp: Date.now() });

      console.log('[AIAnalyzer] AI analysis complete');
      return analysis;
    } catch (error) {
      console.error('[AIAnalyzer] Error:', error);
      return this.createFallbackAnalysis(tokenAddress, tokenData, smartMoneyContext);
    }
  }

  // =============================================
  // Fallback Analysis (No AI)
  // =============================================

  private createFallbackAnalysis(
    tokenAddress: string,
    tokenData?: ProcessedToken,
    smartMoneyContext?: SmartMoneyTransaction[]
  ): AITokenAnalysis {
    // Create analysis based on available data without AI
    let verdict: AIVerdict = 'HOLD';
    let confidence = 30;
    const bullishFactors: string[] = [];
    const bearishFactors: string[] = [];
    const riskFactors: string[] = [];
    let riskScore = 5;
    let smartMoneySignal: 'accumulating' | 'distributing' | 'neutral' = 'neutral';

    // Analyze smart money activity
    if (smartMoneyContext && smartMoneyContext.length > 0) {
      const buys = smartMoneyContext.filter(tx => tx.type === 'BUY');
      const sells = smartMoneyContext.filter(tx => tx.type === 'SELL');
      const totalBuyVolume = buys.reduce((sum, tx) => sum + tx.amountUSD, 0);
      const totalSellVolume = sells.reduce((sum, tx) => sum + tx.amountUSD, 0);
      const netFlow = totalBuyVolume - totalSellVolume;

      if (netFlow > 5000) {
        smartMoneySignal = 'accumulating';
        bullishFactors.push(`Smart money accumulating ($${this.formatNumber(netFlow)} net inflow)`);
        confidence += 10;
      } else if (netFlow < -5000) {
        smartMoneySignal = 'distributing';
        bearishFactors.push(`Smart money distributing ($${this.formatNumber(Math.abs(netFlow))} net outflow)`);
        riskScore += 1;
      }

      if (buys.length >= 3) {
        bullishFactors.push(`${buys.length} whale buys detected`);
      }
      if (sells.length >= 3) {
        bearishFactors.push(`${sells.length} whale sells detected`);
      }
    }

    if (tokenData) {
      // Analyze based on metrics
      if (tokenData.trustScore >= 6) {
        bullishFactors.push('High trust score');
        confidence += 15;
      }
      if (tokenData.trustScore <= 3) {
        bearishFactors.push('Low trust score');
        riskScore += 2;
      }

      if (tokenData.priceChange1h > 10) {
        bullishFactors.push('Strong price momentum');
      }
      if (tokenData.priceChange1h < -15) {
        bearishFactors.push('Price is crashing');
        riskScore += 2;
      }

      if (tokenData.buyRatio > 0.6) {
        bullishFactors.push('Strong buying pressure');
      }
      if (tokenData.buyRatio < 0.4) {
        bearishFactors.push('Weak buying pressure');
      }

      if (tokenData.liquidity > 50000) {
        bullishFactors.push('Good liquidity depth');
      }
      if (tokenData.liquidity < 10000) {
        bearishFactors.push('Low liquidity');
        riskScore += 2;
      }

      if (tokenData.hasWebsite && tokenData.hasSocials) {
        bullishFactors.push('Verified presence (website + socials)');
      }

      // Security factors
      if (tokenData.security.loaded) {
        if (tokenData.security.isMintable) {
          riskFactors.push('Token is mintable - supply can be inflated');
          riskScore += 2;
        }
        if (tokenData.security.isFreezable) {
          riskFactors.push('Token is freezable - accounts can be frozen');
          riskScore += 2;
        }
        if (tokenData.security.isLpSafe) {
          bullishFactors.push('LP is locked/burned');
        } else {
          riskFactors.push('LP not locked - rug pull risk');
          riskScore += 1;
        }
      }

      // Red flags
      tokenData.redFlags.forEach(flag => {
        riskFactors.push(flag);
        riskScore += 1;
      });

      // Determine verdict
      if (bullishFactors.length >= 4 && riskScore <= 4) {
        verdict = 'BUY';
        confidence = 60;
      } else if (bullishFactors.length >= 5 && riskScore <= 3) {
        verdict = 'STRONG_BUY';
        confidence = 75;
      } else if (riskScore >= 7 || bearishFactors.length >= 3) {
        verdict = 'AVOID';
        confidence = 55;
      } else if (riskScore >= 9) {
        verdict = 'STRONG_AVOID';
        confidence = 70;
      }
    }

    return {
      tokenAddress,
      tokenSymbol: tokenData?.symbol || tokenAddress.slice(0, 6),
      verdict,
      confidence: Math.min(100, confidence),
      summary: this.generateSummary(verdict, bullishFactors, bearishFactors),
      bullishFactors,
      bearishFactors,
      riskScore: Math.min(10, riskScore),
      riskFactors,
      technicalOutlook: tokenData && tokenData.priceChange1h > 5 ? 'bullish' : tokenData && tokenData.priceChange1h < -5 ? 'bearish' : 'neutral',
      smartMoneySignal,
      analyzedAt: Date.now(),
      dataSourcesUsed: ['DexScreener', 'Algorithmic Analysis'],
    };
  }

  // =============================================
  // Generate Summary
  // =============================================

  private generateSummary(
    verdict: AIVerdict,
    bullish: string[],
    bearish: string[]
  ): string {
    switch (verdict) {
      case 'STRONG_BUY':
        return `Strong bullish signals with ${bullish.length} positive factors. Consider entry with proper risk management.`;
      case 'BUY':
        return `Moderate bullish outlook with some positive indicators. Monitor for confirmation.`;
      case 'HOLD':
        return `Mixed signals - wait for clearer direction before taking position.`;
      case 'AVOID':
        return `Multiple risk factors detected (${bearish.length}). Consider avoiding or reducing exposure.`;
      case 'STRONG_AVOID':
        return `High risk token with significant red flags. Strongly recommend avoiding.`;
      default:
        return 'Unable to determine clear direction. Exercise caution.';
    }
  }

  // =============================================
  // Utility
  // =============================================

  private formatNumber(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
  }

  // =============================================
  // Clear Cache
  // =============================================

  clearCache(tokenAddress?: string): void {
    if (tokenAddress) {
      analysisCache.delete(tokenAddress);
    } else {
      analysisCache.clear();
    }
  }

  // =============================================
  // Check Configuration
  // =============================================

  isConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }
}

export const aiAnalyzerService = new AIAnalyzerService();
