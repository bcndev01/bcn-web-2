// =============================================
// Token Insight Card - "Wow" Feature
// Speech bubble that appears on token click
// Shows quick AI insights + opens full chat
// =============================================

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Shield, Loader2, ChevronRight, Zap } from 'lucide-react';
import { ProcessedToken } from '../types/dexScreener';

interface TokenInsightCardProps {
  token: ProcessedToken;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenChat: () => void;
}

// Quick insight generator based on token data
const generateQuickInsights = (token: ProcessedToken): { text: string; type: 'bullish' | 'bearish' | 'neutral' | 'warning' }[] => {
  const insights: { text: string; type: 'bullish' | 'bearish' | 'neutral' | 'warning' }[] = [];

  // Price momentum
  if (token.priceChange1h > 10) {
    insights.push({ text: `Strong momentum: +${token.priceChange1h.toFixed(1)}% in 1h`, type: 'bullish' });
  } else if (token.priceChange1h < -10) {
    insights.push({ text: `Sharp decline: ${token.priceChange1h.toFixed(1)}% in 1h`, type: 'bearish' });
  }

  // Volume analysis
  const volToLiq = token.volume24h / token.liquidity;
  if (volToLiq > 2) {
    insights.push({ text: `High activity: ${volToLiq.toFixed(1)}x volume/liquidity`, type: 'bullish' });
  }

  // Buy pressure
  if (token.buyRatio > 0.65) {
    insights.push({ text: `Strong buy pressure: ${(token.buyRatio * 100).toFixed(0)}% buys`, type: 'bullish' });
  } else if (token.buyRatio < 0.35) {
    insights.push({ text: `Heavy selling: ${((1 - token.buyRatio) * 100).toFixed(0)}% sells`, type: 'bearish' });
  }

  // Trust score
  if (token.trustScore >= 5) {
    insights.push({ text: `High trust score: ${token.trustScore}/7`, type: 'bullish' });
  } else if (token.trustScore <= 2) {
    insights.push({ text: `Low trust score: ${token.trustScore}/7`, type: 'warning' });
  }

  // Red flags
  if (token.redFlags.length > 0) {
    insights.push({ text: `${token.redFlags.length} red flag${token.redFlags.length > 1 ? 's' : ''} detected`, type: 'warning' });
  }

  // Liquidity health
  if (token.liquidity < 10000) {
    insights.push({ text: 'Low liquidity - high slippage risk', type: 'warning' });
  } else if (token.liquidity > 100000) {
    insights.push({ text: `Solid liquidity: $${(token.liquidity / 1000).toFixed(0)}K`, type: 'neutral' });
  }

  // Category badge
  if (token.categories.includes('BREAKOUT')) {
    insights.push({ text: 'Breakout pattern detected', type: 'bullish' });
  }
  if (token.categories.includes('WHALE_MAGNET')) {
    insights.push({ text: 'Whale accumulation zone', type: 'bullish' });
  }

  // Return top 3 insights
  return insights.slice(0, 3);
};

const TokenInsightCard: React.FC<TokenInsightCardProps> = ({ token, position, onClose, onOpenChat }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [insights, setInsights] = useState<{ text: string; type: 'bullish' | 'bearish' | 'neutral' | 'warning' }[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  // Calculate card position (speech bubble pointing to token)
  const cardWidth = 320;
  const cardHeight = 280;
  const padding = 20;

  // Determine if card should appear on left or right of bubble
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const showOnLeft = position.x > screenWidth / 2;
  const showAbove = position.y > screenHeight / 2;

  const cardX = showOnLeft
    ? Math.max(padding, position.x - cardWidth - 30)
    : Math.min(screenWidth - cardWidth - padding, position.x + 30);

  const cardY = showAbove
    ? Math.max(padding, position.y - cardHeight + 50)
    : Math.min(screenHeight - cardHeight - padding, position.y - 50);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Generate insights with slight delay for effect
  useEffect(() => {
    setLoadingInsights(true);
    const timer = setTimeout(() => {
      setInsights(generateQuickInsights(token));
      setLoadingInsights(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [token]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bullish': return <TrendingUp size={12} className="text-green-400" />;
      case 'bearish': return <TrendingDown size={12} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={12} className="text-amber-400" />;
      default: return <Shield size={12} className="text-gray-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'bullish': return 'border-green-500/30 bg-green-500/10 text-green-300';
      case 'bearish': return 'border-red-500/30 bg-red-500/10 text-red-300';
      case 'warning': return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
      default: return 'border-white/10 bg-white/5 text-gray-300';
    }
  };

  // Sentiment calculation - based on actual token metrics, not just insight counts
  // Priority: Price action > Red flags > Trust score > Buy ratio
  const calculateSentiment = (): 'Bullish' | 'Bearish' | 'Caution' | 'Neutral' => {
    // CRITICAL: Sharp price decline = Bearish, no exceptions
    if (token.priceChange1h < -20) return 'Bearish';
    if (token.priceChange1h < -10) return 'Caution';

    // Red flags are serious warnings
    if (token.redFlags.length >= 2) return 'Caution';

    // Strong negative 24h trend
    if (token.priceChange24h < -30) return 'Bearish';

    // Now check for positive signals
    const hasStrongMomentum = token.priceChange1h > 15;
    const hasGoodBuyPressure = token.buyRatio > 0.6;
    const hasHighTrust = token.trustScore >= 5;
    const hasGoodLiquidity = token.liquidity > 25000;

    const positiveSignals = [hasStrongMomentum, hasGoodBuyPressure, hasHighTrust, hasGoodLiquidity].filter(Boolean).length;

    if (positiveSignals >= 3 && token.priceChange1h > 5) return 'Bullish';
    if (positiveSignals >= 2 && token.redFlags.length === 0) return 'Bullish';

    // Mixed signals
    if (token.redFlags.length > 0 || token.trustScore < 3) return 'Caution';

    return 'Neutral';
  };

  const sentiment = calculateSentiment();

  const sentimentColor = {
    'Bullish': 'text-green-400',
    'Bearish': 'text-red-400',
    'Caution': 'text-amber-400',
    'Neutral': 'text-gray-400'
  }[sentiment];

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Speech bubble card */}
      <div
        style={{
          position: 'fixed',
          left: cardX,
          top: cardY,
          width: cardWidth,
        }}
        className={`z-50 transition-all duration-300 ease-out ${
          isVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        {/* Main card */}
        <div className="bg-[#0D0D12]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Token logo/icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden border border-white/10">
                {token.logoUrl ? (
                  <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">{token.symbol[0]}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{token.symbol}</h3>
                  <Sparkles size={12} className="text-cyan-400" />
                </div>
                <p className="text-[10px] text-gray-500">AI Quick Analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sentiment badge */}
          <div className="px-4 py-2 bg-black/30 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">AI Sentiment</span>
            <div className="flex items-center gap-2">
              <Zap size={12} className={sentimentColor} />
              <span className={`text-xs font-bold ${sentimentColor}`}>{sentiment}</span>
            </div>
          </div>

          {/* Insights */}
          <div className="p-4 space-y-2">
            {loadingInsights ? (
              <div className="py-6 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-cyan-400" />
                <span className="text-[10px] text-gray-500">Analyzing {token.symbol}...</span>
              </div>
            ) : insights.length > 0 ? (
              insights.map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getInsightColor(insight.type)} transition-all duration-300`}
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animation: 'fadeInUp 0.3s ease-out forwards'
                  }}
                >
                  {getInsightIcon(insight.type)}
                  <span className="text-xs">{insight.text}</span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-gray-500 text-xs">
                No significant patterns detected
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="p-4 pt-0">
            <button
              onClick={onOpenChat}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-cyan-500/25 group"
            >
              <MessageSquare size={16} />
              <span>Deep Dive with AI</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Speech bubble pointer */}
        <div
          className={`absolute w-4 h-4 bg-[#0D0D12]/95 border-white/10 transform rotate-45 ${
            showOnLeft
              ? 'right-[-8px] border-r border-t'
              : 'left-[-8px] border-l border-b'
          }`}
          style={{
            top: showAbove ? cardHeight - 60 : 60,
          }}
        />
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default TokenInsightCard;
