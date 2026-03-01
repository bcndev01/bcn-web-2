import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';

// =============================================
// Supabase Config
// =============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const CHAT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;

// =============================================
// Assistant Component
// =============================================

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm BeaconAI, your crypto trading assistant. Ask me about token analysis, trading strategies, market trends, or risk management. Note: I only discuss cryptocurrency topics.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Convert messages to API format
  const getHistory = () => {
    return messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Check if Supabase is configured
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Chat not configured');
      }

      // Call Edge Function
      const response = await fetch(CHAT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: input,
          history: getHistory(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.response || 'No response received',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');

      // Add error message to chat
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12121A] rounded-xl border border-white/5 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-[#0A0A0F]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cryptoCyan to-blue-600 flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white text-sm">BeaconAI Assistant</h2>
          <div className="flex items-center gap-1">
             <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-cryptoGreen'}`}></div>
             <span className="text-xs text-gray-400">{isLoading ? 'Thinking...' : 'Online'}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 ${
              msg.role === 'user'
                ? 'bg-cryptoCyan/10 text-cryptoCyan border border-cryptoCyan/20 rounded-tr-none'
                : 'bg-[#1E1E28] text-gray-200 border border-white/5 rounded-tl-none'
            }`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
              <div className="text-[10px] opacity-50 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-[#1E1E28] p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[#0A0A0F] border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask about tokens, trading, or market trends..."
            className="w-full bg-[#12121A] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-cryptoCyan/50 transition-colors placeholder-gray-600"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cryptoCyan text-black rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          Powered by BeaconAI • Crypto topics only • Not financial advice
        </p>
      </div>
    </div>
  );
};

export default Assistant;
