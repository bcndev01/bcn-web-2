// =============================================
// AI Analysis Panel Component
// Shows AI-powered token analysis
// =============================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  Shield,
  Zap,
  Target,
  BarChart3,
  Clock,
} from 'lucide-react';
import { SmartMoneyTransaction, AITokenAnalysis, AIVerdict } from '../types/smartMoney';

// =============================================
// Props
// =============================================

interface AIAnalysisPanelProps {
  transaction: SmartMoneyTransaction;
  onClose: () => void;
  analyzeToken: (tokenAddress: string, tokenData?: any) => Promise<AITokenAnalysis | null>;
}

// =============================================
// Component
// =============================================

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  transaction,
  onClose,
  analyzeToken,
}) => {
  const [analysis, setAnalysis] = useState<AITokenAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Fetch analysis when transaction changes
  useEffect(() => {
    let isMounted = true;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await analyzeToken(transaction.tokenAddress);

        if (isMounted) {
          if (result) {
            setAnalysis(result);
          } else {
            setError('Failed to analyze token');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Analysis failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();

    return () => {
      isMounted = false;
    };
  }, [transaction.tokenAddress, analyzeToken]);

  // =============================================
  // Verdict Config
  // =============================================

  const verdictConfig: Record<AIVerdict, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    STRONG_BUY: {
      color: '#00D68F',
      bg: 'rgba(0, 214, 143, 0.1)',
      icon: <TrendingUp size={16} />,
      label: 'Strong Buy',
    },
    BUY: {
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.1)',
      icon: <TrendingUp size={16} />,
      label: 'Buy',
    },
    HOLD: {
      color: '#FBBF24',
      bg: 'rgba(251, 191, 36, 0.1)',
      icon: <Target size={16} />,
      label: 'Hold',
    },
    AVOID: {
      color: '#F87171',
      bg: 'rgba(248, 113, 113, 0.1)',
      icon: <AlertTriangle size={16} />,
      label: 'Avoid',
    },
    STRONG_AVOID: {
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      icon: <XCircle size={16} />,
      label: 'Strong Avoid',
    },
  };

  // =============================================
  // Render
  // =============================================

  return (
    <div className="border-t border-white/[0.06] bg-[#0A0A0F]">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Brain size={14} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">AI Analysis</span>
              <span className="text-[10px] text-gray-500">{transaction.tokenSymbol}</span>
            </div>
            {analysis && !loading && (
              <div className="flex items-center gap-1">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: verdictConfig[analysis.verdict].color }}
                >
                  {verdictConfig[analysis.verdict].label}
                </span>
                <span className="text-[10px] text-gray-500">
                  ({analysis.confidence}% confidence)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin text-purple-400" />}
          {expanded ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronUp size={14} className="text-gray-400" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          {loading ? (
            <div className="py-6 text-center">
              <Loader2 size={24} className="animate-spin text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Analyzing {transaction.tokenSymbol}...</p>
              <p className="text-[10px] text-gray-600">Powered by BeaconAI</p>
            </div>
          ) : error ? (
            <div className="py-4 text-center">
              <AlertTriangle size={20} className="text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-amber-400">{error}</p>
            </div>
          ) : analysis ? (
            <>
              {/* Verdict Card */}
              <div
                className="p-3 rounded-xl border"
                style={{
                  backgroundColor: verdictConfig[analysis.verdict].bg,
                  borderColor: verdictConfig[analysis.verdict].color + '30',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ color: verdictConfig[analysis.verdict].color }}>
                    {verdictConfig[analysis.verdict].icon}
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: verdictConfig[analysis.verdict].color }}
                  >
                    {verdictConfig[analysis.verdict].label}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <Zap size={10} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{analysis.confidence}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-300">{analysis.summary}</p>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Risk Score */}
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                    <Shield size={9} /> Risk
                  </div>
                  <div className={`text-sm font-bold ${
                    analysis.riskScore <= 3 ? 'text-emerald-400' :
                    analysis.riskScore <= 6 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {analysis.riskScore}/10
                  </div>
                </div>

                {/* Technical Outlook */}
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                    <BarChart3 size={9} /> Technical
                  </div>
                  <div className={`text-sm font-bold capitalize ${
                    analysis.technicalOutlook === 'bullish' ? 'text-emerald-400' :
                    analysis.technicalOutlook === 'bearish' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {analysis.technicalOutlook}
                  </div>
                </div>

                {/* Smart Money Signal */}
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[9px] text-gray-500 uppercase flex items-center gap-1">
                    <Target size={9} /> Signal
                  </div>
                  <div className={`text-sm font-bold capitalize ${
                    analysis.smartMoneySignal === 'accumulating' ? 'text-emerald-400' :
                    analysis.smartMoneySignal === 'distributing' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {analysis.smartMoneySignal}
                  </div>
                </div>
              </div>

              {/* Bullish Factors */}
              {analysis.bullishFactors.length > 0 && (
                <div className="p-2 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 font-medium mb-1.5 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Bullish Factors
                  </div>
                  <ul className="space-y-1">
                    {analysis.bullishFactors.map((factor, i) => (
                      <li key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bearish Factors */}
              {analysis.bearishFactors.length > 0 && (
                <div className="p-2 rounded-lg bg-red-500/[0.05] border border-red-500/20">
                  <div className="text-[10px] text-red-400 font-medium mb-1.5 flex items-center gap-1">
                    <XCircle size={10} /> Bearish Factors
                  </div>
                  <ul className="space-y-1">
                    {analysis.bearishFactors.map((factor, i) => (
                      <li key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5">-</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Factors */}
              {analysis.riskFactors.length > 0 && (
                <div className="p-2 rounded-lg bg-amber-500/[0.05] border border-amber-500/20">
                  <div className="text-[10px] text-amber-400 font-medium mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={10} /> Risk Factors
                  </div>
                  <ul className="space-y-1">
                    {analysis.riskFactors.map((factor, i) => (
                      <li key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">!</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="text-[9px] text-gray-600 pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-1">
                  <Clock size={9} />
                  Analyzed {new Date(analysis.analyzedAt).toLocaleTimeString()}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
