import React, { useState, useEffect, useCallback } from 'react';
import { WhaleAlertTransaction } from '../types';

interface RadarBlip extends WhaleAlertTransaction {
  x: number;
  y: number;
}

const WHALE_ALERT_API = '/api/whale-alerts?range=today';

// Token icon mapping
const TOKEN_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  USDT: '₮',
  USDC: '$',
  XRP: '✕',
  LTC: 'Ł',
  SOL: '◎',
};

const WhaleRadarView: React.FC = () => {
  const [transactions, setTransactions] = useState<WhaleAlertTransaction[]>([]);
  const [blips, setBlips] = useState<RadarBlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchWhaleAlerts = useCallback(async () => {
    try {
      const response = await fetch(WHALE_ALERT_API);
      if (!response.ok) {
        throw new Error('Failed to fetch whale alerts');
      }
      const data: WhaleAlertTransaction[] = await response.json();
      setTransactions(data);
      setError(null);
      setLastFetch(new Date());

      const newBlips: RadarBlip[] = data.slice(0, 15).map((tx) => {
        const angle = Math.random() * 360;
        const distance = 50 + Math.random() * 180;
        return {
          ...tx,
          x: Math.cos(angle * Math.PI / 180) * distance,
          y: Math.sin(angle * Math.PI / 180) * distance,
        };
      });
      setBlips(newBlips);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWhaleAlerts();
    const interval = setInterval(fetchWhaleAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchWhaleAlerts]);

  const formatAmount = (amount: number): string => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatTokenAmount = (amount: number, symbol: string): string => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ${symbol}`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K ${symbol}`;
    return `${amount.toLocaleString()} ${symbol}`;
  };

  const getTransactionType = (text: string): 'EXCHANGE_IN' | 'EXCHANGE_OUT' | 'TRANSFER' | 'FROZEN' | 'MINT' | 'BURN' => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('frozen')) return 'FROZEN';
    if (lowerText.includes('minted')) return 'MINT';
    if (lowerText.includes('burned')) return 'BURN';
    if (lowerText.includes('to #') || lowerText.includes('to binance') || lowerText.includes('to coinbase') || lowerText.includes('to kraken') || lowerText.includes('to bitstamp') || lowerText.includes('to okex') || lowerText.includes('to bitfinex')) return 'EXCHANGE_IN';
    if (lowerText.includes('from #') || lowerText.includes('from binance') || lowerText.includes('from coinbase') || lowerText.includes('from kraken') || lowerText.includes('from bitstamp') || lowerText.includes('from okex') || lowerText.includes('from bitfinex')) return 'EXCHANGE_OUT';
    return 'TRANSFER';
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'EXCHANGE_IN':
        return { label: 'Exchange In', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' };
      case 'EXCHANGE_OUT':
        return { label: 'Exchange Out', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' };
      case 'FROZEN':
        return { label: 'Frozen', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]' };
      case 'MINT':
        return { label: 'Minted', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.3)]' };
      case 'BURN':
        return { label: 'Burned', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]' };
      default:
        return { label: 'Transfer', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', glow: 'shadow-[0_0_10px_rgba(107,114,128,0.3)]' };
    }
  };

  const getBlipColor = (type: string): string => {
    switch (type) {
      case 'EXCHANGE_IN': return 'bg-red-500 shadow-[0_0_12px_#ef4444]';
      case 'EXCHANGE_OUT': return 'bg-emerald-500 shadow-[0_0_12px_#10b981]';
      case 'FROZEN': return 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]';
      case 'MINT': return 'bg-purple-500 shadow-[0_0_12px_#a855f7]';
      case 'BURN': return 'bg-orange-500 shadow-[0_0_12px_#f97316]';
      default: return 'bg-gray-400 shadow-[0_0_12px_#9ca3af]';
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getTokenIcon = (symbol: string) => {
    return TOKEN_ICONS[symbol] || symbol.charAt(0);
  };

  const getTokenBgColor = (symbol: string) => {
    switch (symbol) {
      case 'BTC': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ETH': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'USDT': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'USDC': return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'XRP': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'LTC': return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 'SOL': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F]">
      {/* Radar Section */}
      <div className="flex-1 relative flex items-center justify-center min-h-[300px] overflow-hidden">
        <div className="absolute w-[200px] h-[200px] border border-white/5 rounded-full"></div>
        <div className="absolute w-[350px] h-[350px] border border-white/5 rounded-full"></div>
        <div className="absolute w-[500px] h-[500px] border border-white/5 rounded-full"></div>

        <div className="absolute w-[500px] h-[500px] rounded-full animate-radar-spin pointer-events-none">
          <div className="w-1/2 h-full absolute right-0 bg-gradient-to-r from-transparent to-cryptoCyan/10 origin-left border-l border-white/5" style={{ transformOrigin: '0 50%' }}></div>
        </div>

        <div className="absolute w-4 h-4 bg-cryptoCyan rounded-full shadow-[0_0_15px_#00D4FF]"></div>

        {loading && (
          <div className="absolute text-gray-400 text-sm">Loading whale alerts...</div>
        )}

        {error && (
          <div className="absolute text-red-400 text-sm">{error}</div>
        )}

        {blips.map((blip) => {
          const type = getTransactionType(blip.text);
          const mainAmount = blip.amounts[0];

          return (
            <div
              key={blip.id}
              className="absolute flex items-center justify-center"
              style={{ transform: `translate(${blip.x}px, ${blip.y}px)` }}
            >
              <div className={`w-3 h-3 rounded-full ${getBlipColor(type)} animate-pulse`}></div>
              <div className={`absolute top-4 text-[10px] font-mono whitespace-nowrap ${getTypeConfig(type).color} bg-black/70 px-1.5 py-0.5 rounded`}>
                {mainAmount?.symbol} {formatAmount(mainAmount?.value_usd || 0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Feed */}
      <div className="h-72 bg-[#0d0d14] border-t border-white/5 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Whale Transactions</h3>
          {lastFetch && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] text-gray-600">{lastFetch.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {transactions.slice(0, 25).map((tx) => {
            const type = getTransactionType(tx.text);
            const typeConfig = getTypeConfig(type);
            const mainAmount = tx.amounts[0];

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 border border-transparent hover:border-white/5"
              >
                {/* Token Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border ${getTokenBgColor(mainAmount?.symbol)}`}>
                  {getTokenIcon(mainAmount?.symbol)}
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-white">{mainAmount?.symbol}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeConfig.bg} ${typeConfig.color} border ${typeConfig.border}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {formatTokenAmount(mainAmount?.amount || 0, mainAmount?.symbol)}
                  </div>
                </div>

                {/* Amount & Time */}
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-sm font-semibold text-white">
                    {formatAmount(mainAmount?.value_usd || 0)}
                  </div>
                  <div className="text-[10px] text-gray-600">{formatTimeAgo(tx.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WhaleRadarView;
