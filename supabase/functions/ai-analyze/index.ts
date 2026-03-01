// =============================================
// AI Analyze Edge Function
// Securely calls OpenAI API with server-side key
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenData {
  symbol?: string;
  name?: string;
  price?: number;
  marketCap?: number;
  fdv?: number;
  liquidity?: number;
  volume24h?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  ageHours?: number;
  buyRatio?: number;
  txnsH1?: { buys: number; sells: number };
  hasWebsite?: boolean;
  hasSocials?: boolean;
  trustScore?: number;
  redFlags?: string[];
  security?: {
    loaded: boolean;
    isMintable?: boolean;
    isFreezable?: boolean;
    lpLockedPct?: number;
    lpBurnedPct?: number;
    topHolderPct?: number;
  };
}

interface SmartMoneyTx {
  type: 'BUY' | 'SELL';
  amountUSD: number;
  walletAddress: string;
  walletLabel: string;
  timestamp: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get OpenAI API key from Edge Function Secrets
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured in Edge Function Secrets')
    }

    // Parse request body
    const { tokenAddress, tokenData, smartMoneyContext } = await req.json() as {
      tokenAddress: string;
      tokenData?: TokenData;
      smartMoneyContext?: SmartMoneyTx[];
    }

    if (!tokenAddress) {
      throw new Error('tokenAddress is required')
    }

    // Build prompt
    const prompt = buildAnalysisPrompt(tokenAddress, tokenData, smartMoneyContext)

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert crypto analyst specializing in Solana tokens. Analyze tokens and provide trading recommendations in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await openaiResponse.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('Empty AI response')
    }

    // Parse and validate response
    const analysis = parseAIResponse(aiResponse, tokenAddress, tokenData)

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('AI Analysis Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// =============================================
// Helper Functions
// =============================================

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

function buildAnalysisPrompt(
  tokenAddress: string,
  tokenData?: TokenData,
  smartMoneyContext?: SmartMoneyTx[]
): string {
  let prompt = `Analyze this Solana token and provide a trading recommendation.

TOKEN ADDRESS: ${tokenAddress}
`

  if (tokenData) {
    prompt += `
TOKEN DATA:
- Symbol: ${tokenData.symbol || 'Unknown'}
- Name: ${tokenData.name || 'Unknown'}
- Price: $${tokenData.price?.toFixed(8) || '0'}
- Market Cap: $${formatNumber(tokenData.marketCap || 0)}
- FDV: $${formatNumber(tokenData.fdv || 0)}
- Liquidity: $${formatNumber(tokenData.liquidity || 0)}
- 24h Volume: $${formatNumber(tokenData.volume24h || 0)}
- 1h Price Change: ${tokenData.priceChange1h?.toFixed(2) || '0'}%
- 24h Price Change: ${tokenData.priceChange24h?.toFixed(2) || '0'}%
- Age: ${tokenData.ageHours?.toFixed(1) || '0'} hours
- Buy Ratio (1h): ${((tokenData.buyRatio || 0) * 100).toFixed(1)}%
- 1h Transactions: ${tokenData.txnsH1?.buys || 0} buys, ${tokenData.txnsH1?.sells || 0} sells
- Has Website: ${tokenData.hasWebsite ? 'Yes' : 'No'}
- Has Socials: ${tokenData.hasSocials ? 'Yes' : 'No'}
- Trust Score: ${tokenData.trustScore || 0}/7
- Red Flags: ${tokenData.redFlags?.length ? tokenData.redFlags.join(', ') : 'None'}
`

    if (tokenData.security?.loaded) {
      prompt += `
SECURITY DATA:
- Mintable: ${tokenData.security.isMintable ? 'YES (RISKY)' : 'No'}
- Freezable: ${tokenData.security.isFreezable ? 'YES (RISKY)' : 'No'}
- LP Locked: ${tokenData.security.lpLockedPct?.toFixed(1) || '0'}%
- LP Burned: ${tokenData.security.lpBurnedPct?.toFixed(1) || '0'}%
- Top Holder: ${tokenData.security.topHolderPct?.toFixed(1) || '0'}%
`
    }
  }

  if (smartMoneyContext && smartMoneyContext.length > 0) {
    const buys = smartMoneyContext.filter(tx => tx.type === 'BUY')
    const sells = smartMoneyContext.filter(tx => tx.type === 'SELL')
    const totalBuyVolume = buys.reduce((sum, tx) => sum + tx.amountUSD, 0)
    const totalSellVolume = sells.reduce((sum, tx) => sum + tx.amountUSD, 0)

    prompt += `
SMART MONEY ACTIVITY:
- Total Buy Volume: $${formatNumber(totalBuyVolume)}
- Total Sell Volume: $${formatNumber(totalSellVolume)}
- Net Flow: $${formatNumber(totalBuyVolume - totalSellVolume)}
- Unique Buyers: ${new Set(buys.map(tx => tx.walletAddress)).size}
- Unique Sellers: ${new Set(sells.map(tx => tx.walletAddress)).size}
`
  }

  prompt += `
Respond with a JSON object containing:
{
  "verdict": "STRONG_BUY" | "BUY" | "HOLD" | "AVOID" | "STRONG_AVOID",
  "confidence": <number 0-100>,
  "summary": "<1-2 sentence summary>",
  "bullishFactors": ["<factor1>", "<factor2>", ...],
  "bearishFactors": ["<factor1>", "<factor2>", ...],
  "riskScore": <number 0-10>,
  "riskFactors": ["<risk1>", "<risk2>", ...],
  "technicalOutlook": "bullish" | "neutral" | "bearish",
  "smartMoneySignal": "accumulating" | "distributing" | "neutral"
}

Be objective and consider both opportunities and risks.`

  return prompt
}

function parseAIResponse(
  aiResponse: string,
  tokenAddress: string,
  tokenData?: TokenData
) {
  try {
    const parsed = JSON.parse(aiResponse)

    const validVerdicts = ['STRONG_BUY', 'BUY', 'HOLD', 'AVOID', 'STRONG_AVOID']
    const validOutlooks = ['bullish', 'neutral', 'bearish']
    const validSignals = ['accumulating', 'distributing', 'neutral']

    return {
      tokenAddress,
      tokenSymbol: tokenData?.symbol || tokenAddress.slice(0, 6),
      verdict: validVerdicts.includes(parsed.verdict) ? parsed.verdict : 'HOLD',
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      summary: parsed.summary || 'Analysis unavailable',
      bullishFactors: Array.isArray(parsed.bullishFactors) ? parsed.bullishFactors : [],
      bearishFactors: Array.isArray(parsed.bearishFactors) ? parsed.bearishFactors : [],
      riskScore: Math.min(10, Math.max(0, parsed.riskScore || 5)),
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      technicalOutlook: validOutlooks.includes(parsed.technicalOutlook) ? parsed.technicalOutlook : 'neutral',
      smartMoneySignal: validSignals.includes(parsed.smartMoneySignal) ? parsed.smartMoneySignal : 'neutral',
      analyzedAt: Date.now(),
      dataSourcesUsed: ['DexScreener', 'RugCheck', 'Smart Money Tracker', 'OpenAI GPT'],
    }
  } catch (error) {
    throw new Error('Failed to parse AI response')
  }
}
