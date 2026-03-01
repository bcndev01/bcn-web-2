import React from 'react';
import { ProcessedToken } from '../types/dexScreener';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  Activity,
  ExternalLink,
  Droplets,
  BarChart3,
  Globe,
  Twitter,
  ChevronRight,
  Zap,
  Target,
  Lock,
  Unlock,
  Flame,
  Snowflake,
  FileEdit,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getCategoryColor, getCategoryIcon } from '../utils/gemAlgorithm';

interface TokenAnalysisProps {
  token: ProcessedToken | null;
}

const TokenAnalysis: React.FC<TokenAnalysisProps> = ({ token }) => {
  if (!token) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0D0D12] rounded-2xl border border-white/[0.06]">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
          <Target size={28} className="text-gray-600" />
        </div>
        <p className="text-gray-500 text-sm">Select a token to analyze</p>
      </div>
    );
  }

  const riskLevel =
    token.redFlags.length > 2
      ? 'Critical'
      : token.redFlags.length > 1
        ? 'High'
        : token.redFlags.length === 1
          ? 'Medium'
          : 'Low';

  const riskConfig = {
    Critical: { color: '#FF3B5C', bg: 'rgba(255,59,92,0.1)', border: 'rgba(255,59,92,0.2)' },
    High: { color: '#FF6B4A', bg: 'rgba(255,107,74,0.1)', border: 'rgba(255,107,74,0.2)' },
    Medium: { color: '#FFB84D', bg: 'rgba(255,184,77,0.1)', border: 'rgba(255,184,77,0.2)' },
    Low: { color: '#00D68F', bg: 'rgba(0,214,143,0.1)', border: 'rgba(0,214,143,0.2)' },
  }[riskLevel];

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (price: number): string => {
    if (price < 0.00001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(6);
    return price.toFixed(4);
  };

  const PriceChangeBox = ({ label, value }: { label: string; value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</span>
        <span className={`font-mono text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
      </div>
    );
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    subValue
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    subValue?: string;
  }) => (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center">
          <Icon size={12} className="text-gray-400" />
        </div>
        <span className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-mono text-white font-medium">{value}</div>
      {subValue && <div className="text-[10px] text-gray-500 mt-0.5">{subValue}</div>}
    </div>
  );

  // Buy/Sell ratio bar
  const buyPercent = token.buyRatio * 100;
  const sellPercent = 100 - buyPercent;

  return (
    <div className="h-full bg-[#0D0D12] rounded-2xl border border-white/[0.06] overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-lg font-bold text-white overflow-hidden ring-1 ring-white/10">
              {token.logoUrl ? (
                <img src={token.logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
              ) : (
                token.symbol[0]
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">{token.name}</h1>
                {token.isNew && (
                  <span className="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/20 text-emerald-400 rounded">
                    NEW
                  </span>
                )}
              </div>
              <span className="text-gray-500 text-xs font-mono">{token.symbol}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono font-semibold text-white">${formatPrice(token.price)}</div>
            <div className={`text-xs font-medium flex items-center justify-end gap-1 ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {token.priceChange24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Categories */}
        {token.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {token.categories.map((cat) => (
              <span
                key={cat}
                className="text-[10px] px-2 py-1 rounded-lg font-medium flex items-center gap-1"
                style={{
                  backgroundColor: getCategoryColor(cat) + '15',
                  color: getCategoryColor(cat),
                  border: `1px solid ${getCategoryColor(cat)}30`,
                }}
              >
                {getCategoryIcon(cat)} {cat}
              </span>
            ))}
          </div>
        )}

        {/* Price Changes */}
        <div className="grid grid-cols-4 gap-2">
          <PriceChangeBox label="5M" value={token.priceChangeM5} />
          <PriceChangeBox label="1H" value={token.priceChange1h} />
          <PriceChangeBox label="6H" value={token.priceChangeH6} />
          <PriceChangeBox label="24H" value={token.priceChange24h} />
        </div>
      </div>

      {/* Trust & Risk Section */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="grid grid-cols-2 gap-3">
          {/* Trust Score */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap size={10} /> Trust Score
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color: token.trustScoreColor }}>
                  {token.trustScore}
                </span>
                <span className="text-gray-600 text-sm">/7</span>
              </div>
              {/* Score bar */}
              <div className="mt-3 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(token.trustScore / 7) * 100}%`,
                    backgroundColor: token.trustScoreColor
                  }}
                />
              </div>
            </div>
            <div
              className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-20"
              style={{ backgroundColor: token.trustScoreColor }}
            />
          </div>

          {/* Risk Level */}
          <div
            className="p-4 rounded-xl border relative overflow-hidden"
            style={{
              backgroundColor: riskConfig.bg,
              borderColor: riskConfig.border
            }}
          >
            <div className="relative z-10">
              <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: riskConfig.color }}>
                <Shield size={10} /> Risk Level
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: riskConfig.color }}>
                  {riskLevel}
                </span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: riskConfig.color, opacity: 0.7 }}>
                {token.redFlags.length === 0 ? 'No issues found' : `${token.redFlags.length} issue${token.redFlags.length > 1 ? 's' : ''} detected`}
              </div>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        {token.redFlags.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/[0.06] border border-red-500/20">
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium mb-2">
              <AlertTriangle size={12} />
              Warning Flags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {token.redFlags.map((flag) => (
                <span
                  key={flag}
                  className="text-[10px] px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Market Data Section */}
      <div className="p-5 border-b border-white/[0.04]">
        {/* Market Cap & FDV - Highlighted */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/[0.08] to-transparent border border-cyan-500/20 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-cyan-400/70 uppercase tracking-wider mb-1">Market Cap</div>
              <div className="text-xl font-mono font-bold text-white">{formatNumber(token.marketCap)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">FDV</div>
              <div className="text-lg font-mono text-gray-400">{formatNumber(token.fdv)}</div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <MetricCard icon={Droplets} label="Liquidity" value={formatNumber(token.liquidity)} />
          <MetricCard icon={BarChart3} label="24h Vol" value={formatNumber(token.volume24h)} />
          <MetricCard icon={Activity} label="1h Vol" value={formatNumber(token.volumeH1)} />
          <MetricCard icon={Clock} label="Age" value={token.ageHours < 24 ? `${token.ageHours.toFixed(1)}h` : `${(token.ageHours / 24).toFixed(1)}d`} />
          <MetricCard icon={Users} label="24h Txns" value={token.transactions24h.toLocaleString()} />
          <MetricCard icon={Target} label="MC/Liq" value={token.liquidity > 0 ? `${(token.marketCap / token.liquidity).toFixed(1)}x` : 'N/A'} />
        </div>
      </div>

      {/* Transaction Flow */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity size={10} /> 1H Transaction Flow
        </div>

        {/* Buy/Sell Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-emerald-400 font-medium">Buys {token.txnsH1.buys}</span>
            <span className="text-red-400 font-medium">Sells {token.txnsH1.sells}</span>
          </div>
          <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${buyPercent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
              style={{ width: `${sellPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[10px] text-gray-500 mb-1">Buy Ratio</div>
            <div className={`text-lg font-mono font-semibold ${token.buyRatio >= 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(token.buyRatio * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-[10px] text-gray-500 mb-1">Avg Tx Size</div>
            <div className="text-lg font-mono font-semibold text-white">
              {formatNumber(token.avgTxSize)}
            </div>
          </div>
        </div>
      </div>

      {/* On-Chain Security Section */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Shield size={10} /> On-Chain Security
          {!token.security.loaded && (
            <Loader2 size={10} className="animate-spin ml-1 text-gray-400" />
          )}
        </div>

        {token.security.loaded ? (
          <>
            {/* Security Flags Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Mintable */}
              <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 ${
                token.security.isMintable
                  ? 'bg-red-500/[0.08] border-red-500/20'
                  : 'bg-emerald-500/[0.08] border-emerald-500/20'
              }`}>
                {token.security.isMintable ? (
                  <XCircle size={14} className="text-red-400" />
                ) : (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                )}
                <span className={`text-[10px] font-medium ${
                  token.security.isMintable ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {token.security.isMintable ? 'Mintable' : 'Not Mintable'}
                </span>
              </div>

              {/* Freezable */}
              <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 ${
                token.security.isFreezable
                  ? 'bg-red-500/[0.08] border-red-500/20'
                  : 'bg-emerald-500/[0.08] border-emerald-500/20'
              }`}>
                {token.security.isFreezable ? (
                  <Snowflake size={14} className="text-red-400" />
                ) : (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                )}
                <span className={`text-[10px] font-medium ${
                  token.security.isFreezable ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {token.security.isFreezable ? 'Freezable' : 'Not Freezable'}
                </span>
              </div>

              {/* Mutable */}
              <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 ${
                token.security.isMutable
                  ? 'bg-amber-500/[0.08] border-amber-500/20'
                  : 'bg-emerald-500/[0.08] border-emerald-500/20'
              }`}>
                {token.security.isMutable ? (
                  <FileEdit size={14} className="text-amber-400" />
                ) : (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                )}
                <span className={`text-[10px] font-medium ${
                  token.security.isMutable ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {token.security.isMutable ? 'Mutable' : 'Immutable'}
                </span>
              </div>
            </div>

            {/* LP Status */}
            <div className={`p-3 rounded-xl border mb-3 ${
              token.security.isLpSafe
                ? 'bg-emerald-500/[0.08] border-emerald-500/20'
                : 'bg-amber-500/[0.08] border-amber-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {token.security.isLpSafe ? (
                    <Lock size={12} className="text-emerald-400" />
                  ) : (
                    <Unlock size={12} className="text-amber-400" />
                  )}
                  <span className={`text-[11px] font-medium ${
                    token.security.isLpSafe ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    Liquidity Pool
                  </span>
                </div>
                <span className={`text-[10px] font-medium ${
                  token.security.isLpSafe ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {token.security.isLpSafe ? 'Safe' : 'At Risk'}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <Lock size={10} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Locked:</span>
                  <span className="text-[10px] font-mono text-white">{token.security.lpLockedPct.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame size={10} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Burned:</span>
                  <span className="text-[10px] font-mono text-white">{token.security.lpBurnedPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Top Holder Info */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Top Holder</span>
                </div>
                <span className={`text-[11px] font-mono font-medium ${
                  token.security.topHolderPct > 20 ? 'text-red-400' :
                  token.security.topHolderPct > 10 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {token.security.topHolderPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-gray-500">Top 10 Holders</span>
                <span className={`text-[10px] font-mono ${
                  token.security.top10HolderPct > 50 ? 'text-amber-400' : 'text-gray-300'
                }`}>
                  {token.security.top10HolderPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
            <span className="text-[11px] text-gray-500">Loading security data...</span>
          </div>
        )}
      </div>

      {/* Verification & Links */}
      <div className="p-5">
        {/* Verification Status */}
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 ${
            token.hasWebsite
              ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400'
              : 'bg-white/[0.02] border-white/[0.06] text-gray-500'
          }`}>
            <Globe size={12} />
            <span className="text-[11px] font-medium">Website</span>
          </div>
          <div className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 ${
            token.hasSocials
              ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400'
              : 'bg-white/[0.02] border-white/[0.06] text-gray-500'
          }`}>
            <Twitter size={12} />
            <span className="text-[11px] font-medium">Socials</span>
          </div>
        </div>

        {/* DexScreener Link */}
        <a
          href={token.dexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <ExternalLink size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-300">View on DexScreener</span>
          </div>
          <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
};

export default TokenAnalysis;
