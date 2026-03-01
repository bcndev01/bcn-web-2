// =============================================
// Token-Specific AI Chat Component
// Chat about a specific token with context
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, Sparkles } from 'lucide-react';
import { ProcessedToken } from '../types/dexScreener';

// =============================================
// Supabase Config
// =============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const CHAT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;

// =============================================
// Types
// =============================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface TokenChatProps {
  token: ProcessedToken;
  onClose: () => void;
}

// =============================================
// Quick Questions
// =============================================

const getQuickQuestions = (token: ProcessedToken) => [
  `Should I buy ${token.symbol}?`,
  `What are the risks of ${token.symbol}?`,
  `Is ${token.symbol} a good entry right now?`,
  `Analyze ${token.symbol} technicals`,
];

// =============================================
// Component
// =============================================

const TokenChat: React.FC<TokenChatProps> = ({ token, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate initial context message
  useEffect(() => {
    const contextMessage: ChatMessage = {
      id: 'context',
      role: 'assistant',
      text: generateContextIntro(token),
      timestamp: new Date()
    };
    setMessages([contextMessage]);
  }, [token.address]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build token context for AI
  const getTokenContext = () => {
    return `
Current token being discussed: ${token.symbol} (${token.name})
Address: ${token.address}
Price: $${token.price.toFixed(8)}
Market Cap: $${formatNumber(token.marketCap)}
FDV: $${formatNumber(token.fdv)}
Liquidity: $${formatNumber(token.liquidity)}
24h Volume: $${formatNumber(token.volume24h)}
Price Changes: 5m: ${token.priceChangeM5.toFixed(2)}%, 1h: ${token.priceChange1h.toFixed(2)}%, 6h: ${token.priceChangeH6.toFixed(2)}%, 24h: ${token.priceChange24h.toFixed(2)}%
Age: ${token.ageHours.toFixed(1)} hours
Buy Ratio (1h): ${(token.buyRatio * 100).toFixed(1)}%
1h Transactions: ${token.txnsH1.buys} buys, ${token.txnsH1.sells} sells
Trust Score: ${token.trustScore}/7
Categories: ${token.categories.join(', ') || 'None'}
Red Flags: ${token.redFlags.join(', ') || 'None'}
Security: Mintable: ${token.security.isMintable ? 'Yes' : 'No'}, Freezable: ${token.security.isFreezable ? 'Yes' : 'No'}, LP Locked: ${token.security.lpLockedPct.toFixed(1)}%, LP Burned: ${token.security.lpBurnedPct.toFixed(1)}%
Has Website: ${token.hasWebsite ? 'Yes' : 'No'}
Has Socials: ${token.hasSocials ? 'Yes' : 'No'}

Answer questions about this specific token using the data above. Be concise and analytical.`;
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Chat not configured');
      }

      // Include token context in message
      const contextualMessage = `[TOKEN CONTEXT]\n${getTokenContext()}\n\n[USER QUESTION]\n${text.trim()}`;

      const response = await fetch(CHAT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: contextualMessage,
          history: messages.filter(m => m.id !== 'context').map(m => ({
            role: m.role,
            content: m.text
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response || 'No response received',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I'm having trouble connecting. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg h-[600px] max-h-[80vh] bg-[#0D0D12] rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0A0A0F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center overflow-hidden">
              {token.logoUrl ? (
                <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
              ) : (
                <Bot size={20} className="text-purple-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-sm">{token.symbol} AI Chat</h2>
                <Sparkles size={12} className="text-purple-400" />
              </div>
              <p className="text-[10px] text-gray-500">Ask anything about this token</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-purple-500/20 text-purple-100 border border-purple-500/30 rounded-tr-none'
                    : 'bg-white/[0.04] text-gray-200 border border-white/[0.06] rounded-tl-none'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/[0.06]">
                <Loader2 size={14} className="animate-spin text-purple-400" />
                <span className="text-xs text-gray-400">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-gray-500 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {getQuickQuestions(token).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06] bg-[#0A0A0F]">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder={`Ask about ${token.symbol}...`}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder-gray-600"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[9px] text-gray-600 mt-2 text-center">
            Not financial advice • Always DYOR
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================
// Helper Functions
// =============================================

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function generateContextIntro(token: ProcessedToken): string {
  const priceDirection = token.priceChange1h >= 0 ? 'up' : 'down';
  const riskLevel = token.redFlags.length > 2 ? 'high' : token.redFlags.length > 0 ? 'moderate' : 'low';

  return `I'm analyzing **${token.symbol}** for you.

**Quick Stats:**
• Price: $${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(4)} (${priceDirection} ${Math.abs(token.priceChange1h).toFixed(1)}% in 1h)
• Market Cap: $${formatNumber(token.marketCap)}
• Liquidity: $${formatNumber(token.liquidity)}
• Trust Score: ${token.trustScore}/7
• Risk Level: ${riskLevel}

What would you like to know about this token?`;
}

export default TokenChat;
