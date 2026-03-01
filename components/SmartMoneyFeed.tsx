// =============================================
// Smart Money Feed Component
// Real-time feed of trending token activity
// NEW: Single entry per token with merged BUY/SELL
// =============================================

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  Loader2,
  ExternalLink,
  Filter,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Activity,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useSmartMoney, useTimeSince, TrendFilter } from '../hooks/useSmartMoney';
import { TrendingTokenData, TrendDirection } from '../types/smartMoney';
import AIAnalysisPanel from './AIAnalysisPanel';

// =============================================
// Smart Money Feed Component
// =============================================

const SmartMoneyFeed: React.FC = () => {
  const {
    trendingTokens,
    loading,
    error,
    lastUpdated,
    trendFilter,
    setTrendFilter,
    refresh,
    analyzeToken,
  } = useSmartMoney();

  const [selectedToken, setSelectedToken] = useState<TrendingTokenData | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const analysisPanelRef = React.useRef<HTMLDivElement>(null);

  const timeSince = useTimeSince(lastUpdated);

  // =============================================
  // Trend Filter Options
  // =============================================

  const trendOptions: { key: TrendFilter; label: string; color: string }[] = [
    { key: 'ALL', label: 'All', color: 'gray' },
    { key: 'accumulating', label: 'Accumulating', color: 'emerald' },
    { key: 'distributing', label: 'Distributing', color: 'red' },
    { key: 'neutral', label: 'Neutral', color: 'gray' },
  ];

  // =============================================
  // Render
  // =============================================

  return (
    <div className="h-full bg-[#0D0D12] rounded-2xl border border-white/[0.06] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Activity size={16} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Trending Activity</h2>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[9px] text-emerald-400 font-bold">LIVE</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500">
                {trendingTokens.length} tokens with smart money flow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {timeSince && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock size={10} /> {timeSince}
              </span>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors ${
                showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <Filter size={14} />
            </button>
            <button
              onClick={() => refresh(true)}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="pt-2 border-t border-white/[0.04]">
            <div className="flex flex-wrap gap-1">
              {trendOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTrendFilter(opt.key)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    trendFilter === opt.key
                      ? opt.key === 'accumulating'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : opt.key === 'distributing'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Token Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && trendingTokens.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 size={24} className="animate-spin text-cyan-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading trending tokens...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          </div>
        ) : trendingTokens.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <Activity size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No trending tokens found</p>
              <p className="text-[10px] text-gray-600">Try adjusting filters or refresh</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {trendingTokens.map(token => (
              <TrendingTokenCard
                key={token.tokenAddress}
                token={token}
                isSelected={selectedToken?.tokenAddress === token.tokenAddress}
                onClick={() => {
                  if (selectedToken?.tokenAddress === token.tokenAddress) {
                    setSelectedToken(null);
                    setShowAIAnalysis(false);
                  } else {
                    setSelectedToken(token);
                    setShowAIAnalysis(false);
                  }
                }}
                onAnalyze={() => {
                  setShowAIAnalysis(true);
                  setTimeout(() => {
                    analysisPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }, 100);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Analysis Panel */}
      {selectedToken && showAIAnalysis && (
        <div ref={analysisPanelRef}>
          <AIAnalysisPanelWrapper
            token={selectedToken}
            onClose={() => setShowAIAnalysis(false)}
            analyzeToken={analyzeToken}
          />
        </div>
      )}
    </div>
  );
};

// =============================================
// Trending Token Card Component (NEW)
// =============================================

interface TrendingTokenCardProps {
  token: TrendingTokenData;
  isSelected: boolean;
  onClick: () => void;
  onAnalyze: () => void;
}

const TrendingTokenCard: React.FC<TrendingTokenCardProps> = ({
  token,
  isSelected,
  onClick,
  onAnalyze,
}) => {
  const isAccumulating = token.netFlow > 0;
  const buyRatioPercent = Math.round(token.buyRatio * 100);

  return (
    <div
      onClick={onClick}
      className={`p-3 hover:bg-white/[0.02] cursor-pointer transition-all ${
        isSelected ? 'bg-white/[0.03] border-l-2 border-cyan-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: Token Info */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Token Logo */}
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center overflow-hidden flex-shrink-0">
              {token.tokenLogo ? (
                <img src={token.tokenLogo} alt={token.tokenSymbol} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gray-400">{token.tokenSymbol[0]}</span>
              )}
            </div>
            {/* Activity Score Badge */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
              token.activityScore >= 70
                ? 'bg-emerald-500 text-white'
                : token.activityScore >= 40
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-600 text-gray-200'
            }`}>
              {token.activityScore}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {/* Token Symbol + Trend Badge */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white text-sm truncate">{token.tokenSymbol}</span>
              <TrendBadge trend={token.trend} />
            </div>

            {/* Price + MC */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>${formatPrice(token.price)}</span>
              <span className="text-gray-600">|</span>
              <span>MC: ${formatAmount(token.marketCap)}</span>
            </div>
          </div>
        </div>

        {/* Right: Net Flow */}
        <div className="text-right flex-shrink-0">
          <div className={`font-mono text-sm font-semibold flex items-center gap-1 justify-end ${
            isAccumulating ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isAccumulating ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {isAccumulating ? '+' : ''}{formatAmount(token.netFlow)}
          </div>
          <div className="text-[10px] text-gray-500">
            net flow
          </div>
        </div>
      </div>

      {/* Buy/Sell Bar */}
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] text-emerald-400">{buyRatioPercent}% buy</span>
          <div className="flex-1 h-1.5 bg-red-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${buyRatioPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-red-400">{100 - buyRatioPercent}% sell</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <MetricBox label="Buy Vol" value={`$${formatAmount(token.buyVolume)}`} color="emerald" />
            <MetricBox label="Sell Vol" value={`$${formatAmount(token.sellVolume)}`} color="red" />
            <MetricBox label="Txns" value={`${token.buyCount + token.sellCount}`} />
            <MetricBox label="Vol/MC" value={`${token.volumeToMcapRatio.toFixed(1)}%`} />
          </div>

          {/* Price Changes */}
          <div className="flex items-center gap-3 mb-3 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">1h:</span>
              <span className={token.priceChangeH1 >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {token.priceChangeH1 >= 0 ? '+' : ''}{token.priceChangeH1.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">24h:</span>
              <span className={token.priceChangeH24 >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {token.priceChangeH24 >= 0 ? '+' : ''}{token.priceChangeH24.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Liq:</span>
              <span className="text-white">${formatAmount(token.liquidity)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 text-xs font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-colors"
            >
              <Brain size={12} />
              AI Analysis
            </button>
            <a
              href={`https://dexscreener.com/solana/${token.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="px-3 py-2 rounded-lg bg-white/[0.03] text-gray-400 text-xs hover:bg-white/[0.06] hover:text-white transition-colors flex items-center gap-1"
            >
              <TrendingUp size={12} />
              Chart
            </a>
            <a
              href={`https://solscan.io/token/${token.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="px-3 py-2 rounded-lg bg-white/[0.03] text-gray-400 text-xs hover:bg-white/[0.06] hover:text-white transition-colors flex items-center gap-1"
            >
              <ExternalLink size={12} />
              Token
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================
// Trend Badge Component
// =============================================

const TrendBadge: React.FC<{ trend: TrendDirection }> = ({ trend }) => {
  const config = {
    accumulating: {
      icon: <ArrowUpRight size={10} />,
      label: 'ACC',
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    distributing: {
      icon: <ArrowDownRight size={10} />,
      label: 'DIST',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    neutral: {
      icon: <BarChart3 size={10} />,
      label: 'NEU',
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    },
  };

  const { icon, label, className } = config[trend];

  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${className}`}>
      {icon}
      {label}
    </span>
  );
};

// =============================================
// Metric Box Component
// =============================================

const MetricBox: React.FC<{ label: string; value: string; color?: 'emerald' | 'red' }> = ({
  label,
  value,
  color,
}) => (
  <div className="p-2 rounded-lg bg-white/[0.02]">
    <div className="text-[9px] text-gray-500 uppercase">{label}</div>
    <div className={`text-xs font-mono ${
      color === 'emerald' ? 'text-emerald-400' :
      color === 'red' ? 'text-red-400' : 'text-white'
    }`}>
      {value}
    </div>
  </div>
);

// =============================================
// AI Analysis Panel Wrapper (for TrendingTokenData)
// =============================================

interface AIAnalysisPanelWrapperProps {
  token: TrendingTokenData;
  onClose: () => void;
  analyzeToken: (tokenAddress: string, tokenData?: any) => Promise<any>;
}

const AIAnalysisPanelWrapper: React.FC<AIAnalysisPanelWrapperProps> = ({
  token,
  onClose,
  analyzeToken,
}) => {
  // Convert TrendingTokenData to SmartMoneyTransaction format for AIAnalysisPanel
  const mockTransaction = {
    id: token.tokenAddress,
    signature: token.pairAddress,
    timestamp: token.fetchedAt,
    walletAddress: '',
    walletLabel: '',
    walletCategory: 'Whale' as const,
    type: token.netFlow > 0 ? 'BUY' as const : 'SELL' as const,
    tokenAddress: token.tokenAddress,
    tokenSymbol: token.tokenSymbol,
    tokenName: token.tokenName,
    tokenLogo: token.tokenLogo,
    amountUSD: token.totalVolume,
    tokenAmount: 0,
    pricePerToken: token.price,
    dex: token.dex,
  };

  return (
    <AIAnalysisPanel
      transaction={mockTransaction}
      onClose={onClose}
      analyzeToken={analyzeToken}
    />
  );
};

// =============================================
// Helper Functions
// =============================================

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toFixed(2);
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toExponential(2);
}

export default SmartMoneyFeed;
