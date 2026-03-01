import React from 'react';
import { Html } from '@react-three/drei';
import { CRYPTO_COLORS } from '../../../types/three-scene';

// =============================================
// 3D HUD Panel Component (using drei Html)
// =============================================

interface HUDPanelProps {
  position: [number, number, number];
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  width?: number;
}

export const HUDPanel: React.FC<HUDPanelProps> = ({
  position,
  visible,
  title,
  children,
  onClose,
  width = 280,
}) => {
  if (!visible) return null;

  return (
    <Html
      position={position}
      center
      distanceFactor={10}
      style={{
        transition: 'opacity 0.2s',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="backdrop-blur-xl rounded-xl border shadow-2xl"
        style={{
          width: `${width}px`,
          backgroundColor: 'rgba(18, 18, 26, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: `0 0 30px ${CRYPTO_COLORS.cryptoCyan}40`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="text-gray-400 text-lg leading-none">&times;</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </Html>
  );
};

// =============================================
// Whale Info Panel
// =============================================

interface WhaleInfoProps {
  position: [number, number, number];
  visible: boolean;
  walletLabel: string;
  walletCategory: string;
  totalVolume: number;
  transactionCount: number;
  winRate: number;
  onClose: () => void;
}

export const WhaleInfoPanel: React.FC<WhaleInfoProps> = ({
  position,
  visible,
  walletLabel,
  walletCategory,
  totalVolume,
  transactionCount,
  winRate,
  onClose,
}) => {
  const formatAmount = (amount: number): string => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <HUDPanel
      position={position}
      visible={visible}
      title={walletLabel}
      onClose={onClose}
    >
      <div className="space-y-3">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${CRYPTO_COLORS.purple}30`,
              color: CRYPTO_COLORS.purple,
            }}
          >
            {walletCategory}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Total Volume</div>
            <div className="text-sm font-mono font-bold text-white">
              {formatAmount(totalVolume)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Transactions</div>
            <div className="text-sm font-mono font-bold text-white">
              {transactionCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Win Rate</div>
            <div
              className="text-sm font-mono font-bold"
              style={{
                color: winRate >= 50 ? CRYPTO_COLORS.cryptoGreen : CRYPTO_COLORS.cryptoRed,
              }}
            >
              {winRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </HUDPanel>
  );
};

// =============================================
// Token Info Panel
// =============================================

interface TokenInfoProps {
  position: [number, number, number];
  visible: boolean;
  tokenSymbol: string;
  tokenName: string;
  amountUSD: number;
  priceChange?: number;
  trustScore?: number;
  onClose: () => void;
  onAnalyze?: () => void;
}

export const TokenInfoPanel: React.FC<TokenInfoProps> = ({
  position,
  visible,
  tokenSymbol,
  tokenName,
  amountUSD,
  priceChange,
  trustScore,
  onClose,
  onAnalyze,
}) => {
  const formatAmount = (amount: number): string => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <HUDPanel
      position={position}
      visible={visible}
      title={tokenSymbol}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="text-xs text-gray-400 truncate">{tokenName}</div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Volume</div>
            <div className="text-sm font-mono font-bold text-white">
              {formatAmount(amountUSD)}
            </div>
          </div>
          {priceChange !== undefined && (
            <div>
              <div className="text-xs text-gray-500">Change 1h</div>
              <div
                className="text-sm font-mono font-bold"
                style={{
                  color: priceChange >= 0 ? CRYPTO_COLORS.cryptoGreen : CRYPTO_COLORS.cryptoRed,
                }}
              >
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
              </div>
            </div>
          )}
          {trustScore !== undefined && (
            <div>
              <div className="text-xs text-gray-500">Trust Score</div>
              <div className="text-sm font-mono font-bold text-white">
                {trustScore}/7
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: `${CRYPTO_COLORS.cryptoCyan}20`,
              color: CRYPTO_COLORS.cryptoCyan,
              border: `1px solid ${CRYPTO_COLORS.cryptoCyan}40`,
            }}
          >
            AI Analysis
          </button>
        )}
      </div>
    </HUDPanel>
  );
};

export default HUDPanel;
