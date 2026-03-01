// =============================================
// AI Chat Edge Function
// Crypto-focused assistant - rejects non-crypto topics
// =============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are BeaconAI, an expert cryptocurrency trading assistant specializing in Solana tokens and DeFi.

CRITICAL RULES:
1. You ONLY discuss cryptocurrency, blockchain, DeFi, trading, and related financial topics
2. If a user asks about ANY other topic (weather, cooking, coding, general chat, etc.), politely decline and redirect to crypto
3. Never provide financial advice - always remind users to DYOR (Do Your Own Research)
4. Be concise - keep responses under 150 words unless detailed analysis is requested
5. Use trading terminology appropriately (support/resistance, volume, liquidity, market cap, etc.)

TOPICS YOU CAN DISCUSS:
- Token analysis and metrics
- Trading strategies (entry/exit, DCA, swing trading)
- Risk management and position sizing
- Market trends and sentiment
- DeFi protocols and yield farming
- Smart money movements and whale tracking
- Technical analysis basics
- Solana ecosystem and DEXs
- Security (rug pulls, honeypots, red flags)

REJECTION RESPONSE FORMAT:
If asked about non-crypto topics, respond with:
"I'm BeaconAI, specialized in cryptocurrency analysis. I can't help with [topic], but I'd be happy to discuss trading strategies, token analysis, or market trends. What crypto question can I help you with?"

Remember: You are a focused crypto assistant, not a general chatbot.`

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const { message, history } = await req.json() as {
      message: string;
      history?: ChatMessage[];
    }

    if (!message) {
      throw new Error('message is required')
    }

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
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

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
