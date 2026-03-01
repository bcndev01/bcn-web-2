import React, { useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Radar,
  MessageSquare,
  Settings,
  Menu,
  X,
  Wallet,
  Brain,
  TrendingUp,
  Copy,
  ExternalLink,
  Check,
  Loader2,
  Zap,
  Box,
  Map,
  Sparkles,
  Bell,
  Share2,
  Layers,
  Shield,
  Bot,
  Target,
  Smartphone
} from 'lucide-react';
import GemBubbleMap from './components/GemBubbleMap';
import WhaleRadarView from './components/WhaleRadarView';
import Assistant from './components/Assistant';
import TokenAnalysis from './components/TokenAnalysis';
import SmartMoneyFeed from './components/SmartMoneyFeed';
import TokenChat from './components/TokenChat';
import TokenInsightCard from './components/TokenInsightCard';
import { ProcessedToken } from './types/dexScreener';
import { useAppConfig } from './services/configService';

// Lazy load 3D components for better performance
const WhaleNexus = lazy(() => import('./components/3d/whale-nexus/WhaleNexusPremium'));
const GemGalaxy = lazy(() => import('./components/3d/gem-galaxy/GemGalaxy'));

// --- Page Components ---

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-end">
        <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 transition-colors">
          <Wallet size={18} />
          <span>Connect Phantom</span>
        </button>
      </div>

      {/* Early Access Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="relative px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Early Access</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full">FREE</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                All features free until iOS app launch. After release, <span className="text-cyan-400 font-medium">$BCNAI</span> holding required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Info & Socials */}
      <TokenInfoSection />

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NavLink to="/gem-hunter" className="group relative h-64 bg-[#12121A] rounded-2xl border border-white/5 overflow-hidden hover:border-cryptoCyan/50 transition-all shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cryptoCyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div>
               <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-cryptoCyan/10 rounded-lg flex items-center justify-center text-cryptoCyan">
                    <Search size={20} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur px-2 py-1 rounded-full border border-cryptoGreen/30">
                    <div className="w-1.5 h-1.5 bg-cryptoGreen rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-cryptoGreen font-bold">LIVE</span>
                  </div>
               </div>
               <h3 className="text-xl font-bold text-white">Gem Hunter</h3>
               <p className="text-gray-400 text-sm mt-1">Real-time token discovery engine. Find 100x opportunities before they trend.</p>
            </div>
            <div className="text-cryptoCyan text-sm font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
               Launch Interface &rarr;
            </div>
          </div>
          {/* Decorative bubbles background */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-cryptoCyan/10 rounded-full blur-2xl"></div>
        </NavLink>

        <NavLink to="/smart-money" className="group relative h-64 bg-[#12121A] rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/50 transition-all shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div>
               <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <Brain size={20} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur px-2 py-1 rounded-full border border-purple-500/30">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-purple-400 font-bold">AI</span>
                  </div>
               </div>
               <h3 className="text-xl font-bold text-white">Trending Activity</h3>
               <p className="text-gray-400 text-sm mt-1">Track hot tokens in real-time. AI-powered analysis for trending opportunities.</p>
            </div>
            <div className="text-purple-400 text-sm font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
               View Trending &rarr;
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
        </NavLink>
      </div>

      {/* Second Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NavLink to="/whale-radar" className="group relative h-48 bg-[#12121A] rounded-2xl border border-white/5 overflow-hidden hover:border-cryptoRed/50 transition-all shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cryptoRed/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div>
               <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-cryptoRed/10 rounded-lg flex items-center justify-center text-cryptoRed">
                    <Radar size={20} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur px-2 py-1 rounded-full border border-cryptoRed/30">
                    <div className="w-1.5 h-1.5 bg-cryptoRed rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-cryptoRed font-bold">LIVE</span>
                  </div>
               </div>
               <h3 className="text-xl font-bold text-white">Whale Radar</h3>
               <p className="text-gray-400 text-sm mt-1">Track large wallet movements in real-time.</p>
            </div>
            <div className="text-cryptoRed text-sm font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
               Open Radar &rarr;
            </div>
          </div>
        </NavLink>

        <NavLink to="/assistant" className="group relative h-48 bg-[#12121A] rounded-2xl border border-white/5 overflow-hidden hover:border-amber-500/50 transition-all shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="p-6 relative z-10 h-full flex flex-col justify-between">
            <div>
               <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
                    <MessageSquare size={20} />
                  </div>
               </div>
               <h3 className="text-xl font-bold text-white">AI Assistant</h3>
               <p className="text-gray-400 text-sm mt-1">Ask anything about crypto markets and get AI-powered answers.</p>
            </div>
            <div className="text-amber-400 text-sm font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
               Start Chat &rarr;
            </div>
          </div>
        </NavLink>
      </div>

    </div>
  );
};

// ============================================
// Token Info Section - Loads from Supabase
// ============================================

const TokenInfoSection = () => {
  const { config, loading } = useAppConfig();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.TOKEN_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#12121A] rounded-2xl border border-white/5 p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-[#12121A] rounded-2xl border border-white/5 p-6">
      {/* CA Address */}
      <div className="mb-6">
        <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Contract Address</div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-0 bg-black/30 rounded-xl px-4 py-3 border border-white/5">
            <code className="text-sm text-gray-300 font-mono truncate block">
              {config.TOKEN_CA}
            </code>
          </div>
          <button
            onClick={handleCopy}
            className={`p-3 rounded-xl border transition-all ${
              copied
                ? 'bg-cryptoGreen/20 border-cryptoGreen/30 text-cryptoGreen'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Copy CA"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <a
            href={config.CHART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-cryptoCyan/10 border border-cryptoCyan/30 text-cryptoCyan hover:bg-cryptoCyan/20 transition-all flex items-center gap-2"
            title="View Chart"
          >
            <TrendingUp size={18} />
            <span className="text-sm font-medium hidden sm:inline">Chart</span>
          </a>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <div className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Community</div>
        <div className="flex gap-3 flex-wrap">
          {/* Twitter/X */}
          <a
            href={config.TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="text-sm font-medium">Twitter</span>
          </a>

          {/* Discord */}
          <a
            href={config.DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/20 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
            </svg>
            <span className="text-sm font-medium">Discord</span>
          </a>

          {/* Telegram */}
          <a
            href={config.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="text-sm font-medium">Telegram</span>
          </a>
        </div>
      </div>
    </div>
  );
};

const GemHunterPage = () => {
  const [selectedToken, setSelectedToken] = useState<ProcessedToken | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [insightPos, setInsightPos] = useState<{ x: number; y: number } | null>(null);

  const handleBubbleClick = (info: { token: ProcessedToken; x: number; y: number }) => {
    setInsightPos({ x: info.x, y: info.y });
  };

  return (
    <div className="h-full flex flex-col md:flex-row p-4 gap-4 overflow-hidden relative">
      <div className="flex-1 min-h-[50vh] md:h-full relative">
        <GemBubbleMap onSelectToken={setSelectedToken} onBubbleClick={handleBubbleClick} />
      </div>
      <div className="w-full md:w-[400px] h-[40vh] md:h-full">
        <TokenAnalysis token={selectedToken} />
      </div>

      {/* AI Insight Card */}
      {selectedToken && insightPos && !showChat && (
        <TokenInsightCard
          token={selectedToken}
          position={insightPos}
          onClose={() => setInsightPos(null)}
          onOpenChat={() => {
            setInsightPos(null);
            setShowChat(true);
          }}
        />
      )}

      {/* Token Chat Modal */}
      {showChat && selectedToken && (
        <TokenChat token={selectedToken} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};

// ============================================
// Whale Radar Page - 2D Radar View
// ============================================

const WhaleRadarPage = () => {
  return (
    <div className="h-full">
      <WhaleRadarView />
    </div>
  );
};

// ============================================
// Whale Nexus Page - 3D Visualization
// ============================================

const WhaleNexusPage = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-[#0A0A0F] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-cryptoCyan animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading 3D Whale Nexus...</p>
          </div>
        </div>
      }
    >
      <WhaleNexus />
    </Suspense>
  );
};

// ============================================
// Gem Galaxy Page - 3D Token Galaxy
// ============================================

const GemGalaxyPage = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-[#050510] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading Gem Galaxy...</p>
          </div>
        </div>
      }
    >
      <GemGalaxy />
    </Suspense>
  );
};

// ============================================
// Roadmap Page - Vision & Future Plans
// ============================================

const RoadmapPage = () => {
  const phases = [
    {
      phase: 'Phase 1',
      title: 'Enhanced Intelligence',
      tagline: 'Deeper Insights, Smarter Conversations',
      status: 'ACTIVE',
      isActive: true,
      color: 'amber',
      items: [
        { icon: <Search size={18} />, title: 'Specialist Agents', description: 'DeFi Sniper for gems, NFT Valuator for expert analysis.' },
        { icon: <Brain size={18} />, title: 'Contextual Memory', description: 'Personalized advice based on chat history and portfolio.' },
        { icon: <Share2 size={18} />, title: 'Social Alpha', description: 'Shareable cards with charts and AI predictions.' }
      ]
    },
    {
      phase: 'Phase 2',
      title: 'The Pro Ecosystem',
      tagline: 'Professional Tools for Serious Traders',
      status: 'SOON',
      isActive: false,
      color: 'purple',
      items: [
        { icon: <Bell size={18} />, title: 'Whale Radar 2.0', description: 'Push notifications for whale movements.' },
        { icon: <Bot size={18} />, title: 'Multi-LLM Core', description: 'o1, Claude Opus, Llama 4 for analysis.' },
        { icon: <Smartphone size={18} />, title: 'BeaconAI iOS App', description: 'Native app with widgets & Apple Watch.' }
      ]
    },
    {
      phase: 'Phase 3',
      title: 'The Future',
      tagline: 'From Analysis to Autonomy',
      status: 'VISION',
      isActive: false,
      color: 'cyan',
      items: [
        { icon: <Wallet size={18} />, title: 'Web3 Connect', description: 'Read-only wallet for portfolio analysis.' },
        { icon: <Shield size={18} />, title: 'Autonomous Sentinels', description: 'AI monitoring RSI, Volume, alerts.' },
        { icon: <Zap size={18} />, title: 'In-App Execution', description: 'Swap via Jupiter/1inch in chat.' }
      ]
    }
  ];

  const colorClasses: Record<string, { bg: string; border: string; text: string; line: string }> = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', line: 'bg-amber-500' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', line: 'bg-purple-500' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', line: 'bg-cyan-500' }
  };

  return (
    <div className="min-h-full bg-[#0A0A0F] overflow-auto">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 px-4 py-12 md:px-8 md:py-16 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Roadmap</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Building the Future
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Our journey to create the ultimate crypto intelligence platform.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {phases.map((phase, index) => {
            const colors = colorClasses[phase.color];
            return (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < phases.length - 1 && (
                  <div className="hidden md:block absolute left-[39px] top-[80px] w-0.5 h-[calc(100%-40px)] bg-gradient-to-b from-white/20 to-transparent"></div>
                )}

                <div className={`relative bg-[#12121A] rounded-2xl border ${colors.border} overflow-hidden`}>
                  {/* Left Accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.line}`}></div>

                  <div className="p-6 md:p-8">
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                      {/* Phase Icon */}
                      <div className={`w-16 h-16 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} flex-shrink-0`}>
                        {phase.color === 'amber' && <Zap size={28} />}
                        {phase.color === 'purple' && <Layers size={28} />}
                        {phase.color === 'cyan' && <Sparkles size={28} />}
                      </div>

                      {/* Title Section */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-xs font-bold ${colors.text} uppercase tracking-wider`}>{phase.phase}</span>
                          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            phase.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-white/5 text-gray-500'
                          }`}>
                            {phase.isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>}
                            {phase.status}
                          </div>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">{phase.title}</h2>
                        <p className={`text-sm ${colors.text} opacity-80`}>"{phase.tagline}"</p>
                      </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {phase.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} flex-shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white mb-0.5">{item.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            This roadmap evolves based on community feedback.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Mobile App Page - App Preview & Coming Soon
// ============================================

const MobileAppPage = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const screens = [
    { src: '/mobile-app/home.png', label: 'Dashboard', description: 'Your crypto command center' },
    { src: '/mobile-app/whale_radar.png', label: 'Whale Radar', description: 'Track smart money moves' },
    { src: '/mobile-app/gem_hunter.png', label: 'Gem Hunter', description: 'Discover early opportunities' },
    { src: '/mobile-app/ai_assistant.png', label: 'AI Assistant', description: 'Get instant market insights' },
    { src: '/mobile-app/crypto_analysis.png', label: 'Token Analysis', description: 'Deep dive into any token' },
    { src: '/mobile-app/crypto_ai.png', label: 'Crypto AI', description: 'AI-powered market intelligence' },
    { src: '/mobile-app/ai_studio.png', label: 'AI Studio', description: 'Advanced AI tools' },
  ];

  const features = [
    {
      icon: <Bell size={20} />,
      title: 'Real-Time Alerts',
      description: 'Instant push notifications for whale movements, price alerts, and gem discoveries.',
      color: 'cyan'
    },
    {
      icon: <Radar size={20} />,
      title: 'Whale Tracker',
      description: 'Monitor smart money movements on the go with our mobile-optimized radar.',
      color: 'emerald'
    },
    {
      icon: <Brain size={20} />,
      title: 'AI Assistant',
      description: 'Chat with our AI anywhere, anytime. Get instant market analysis.',
      color: 'blue'
    },
    {
      icon: <Target size={20} />,
      title: 'Watchlists',
      description: 'Create and manage your token watchlists with price targets.',
      color: 'cyan'
    },
    {
      icon: <Zap size={20} />,
      title: 'Quick Actions',
      description: 'One-tap access to charts, analysis, and trading via deep links.',
      color: 'emerald'
    },
    {
      icon: <Shield size={20} />,
      title: 'Secure & Private',
      description: 'Your data stays on your device. No wallet connection required.',
      color: 'blue'
    }
  ];

  const getFeatureColors = (color: string) => {
    switch(color) {
      case 'cyan': return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' };
      case 'emerald': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' };
      case 'blue': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' };
      default: return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' };
    }
  };

  return (
    <div className="min-h-full bg-[#0A0A0F] overflow-auto">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 px-4 py-12 md:px-8 md:py-20 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12121A] border border-white/10 mb-8">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">Coming Soon</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-white">BeaconAI</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Mobile
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed mb-12">
            Professional-grade crypto intelligence in your pocket. Track whales, discover gems, and get AI insights — anywhere.
          </p>

          {/* Main Phone Display */}
          <div className="relative max-w-sm mx-auto mb-8">
            {/* Phone Frame */}
            <div className="relative mx-auto">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-transparent to-emerald-500/20 rounded-[3rem] blur-2xl scale-110 opacity-50"></div>

              {/* Phone */}
              <div className="relative w-64 md:w-72 h-[520px] md:h-[580px] bg-[#1a1a1a] rounded-[3rem] p-2 mx-auto border border-gray-800 shadow-2xl">
                <div className="w-full h-full bg-[#0A0A0F] rounded-[2.5rem] overflow-hidden relative">
                  {/* Dynamic Island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20"></div>
                  {/* Screenshot */}
                  <img
                    src={screens[activeScreen].src}
                    alt={screens[activeScreen].label}
                    className="w-full h-full object-cover object-top transition-opacity duration-300"
                  />
                  {/* Screen Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Screen Label */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
                <div className="text-white font-medium">{screens[activeScreen].label}</div>
                <div className="text-gray-500 text-sm">{screens[activeScreen].description}</div>
              </div>
            </div>
          </div>

          {/* Screen Selector */}
          <div className="flex justify-center gap-2 mt-16 mb-12 flex-wrap px-4">
            {screens.map((screen, index) => (
              <button
                key={index}
                onClick={() => setActiveScreen(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeScreen === index
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {screen.label}
              </button>
            ))}
          </div>

        </div>

        {/* Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Built for Serious Traders
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Everything you need to stay ahead of the market, optimized for mobile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const colors = getFeatureColors(feature.color);
              return (
                <div
                  key={index}
                  className="group p-6 bg-[#12121A] border border-white/5 rounded-2xl hover:border-white/10 transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email Signup */}
        <div className="max-w-lg mx-auto">
          <div className="p-8 bg-[#12121A] border border-white/5 rounded-2xl">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                <Bell size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Get Early Access
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Be first in line when we launch. Early subscribers get exclusive features.
              </p>

              {subscribed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 py-3">
                  <Check size={20} />
                  <span className="font-medium">You're on the list!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl transition-all text-sm"
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Layout & Nav ---

const Sidebar = () => {
  return (
    <div className="hidden md:flex flex-col w-64 bg-[#0A0A0F] border-r border-white/5 h-full">
      <div className="p-6">
        <img src="/beacon-logo.png" alt="BeaconAI" className="h-12" />
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-cryptoCyan/10 text-cryptoCyan font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/gem-hunter" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-cryptoCyan/10 text-cryptoCyan font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Search size={20} />
          <span>Gem Hunter</span>
        </NavLink>
        <NavLink to="/smart-money" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-purple-500/10 text-purple-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <TrendingUp size={20} />
          <span>Trending</span>
        </NavLink>
        <NavLink to="/whale-radar" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-cryptoCyan/10 text-cryptoCyan font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Radar size={20} />
          <span>Whale Radar</span>
        </NavLink>
        <NavLink to="/whale-nexus" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-cryptoCyan/10 text-cryptoCyan font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Box size={20} />
          <span className="flex items-center gap-2">
            Whale Nexus
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Beta</span>
          </span>
        </NavLink>
        <NavLink to="/gem-galaxy" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-orange-500/10 text-orange-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Zap size={20} />
          <span className="flex items-center gap-2">
            Gem Galaxy
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">3D</span>
          </span>
        </NavLink>
        <NavLink to="/assistant" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-cryptoCyan/10 text-cryptoCyan font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <MessageSquare size={20} />
          <span>AI Assistant</span>
        </NavLink>
        <NavLink to="/roadmap" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-cryptoCyan/10 text-cryptoCyan font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Map size={20} />
          <span>Roadmap</span>
        </NavLink>
        <NavLink to="/mobile-app" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <Smartphone size={20} />
          <span className="flex items-center gap-2">
            Mobile App
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Soon</span>
          </span>
        </NavLink>
      </nav>
      <div className="p-4 border-t border-white/5">
         <NavLink to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors">
            <Settings size={20} />
            <span>Settings</span>
         </NavLink>
      </div>
    </div>
  );
};

const MobileNav = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0F] border-t border-white/10 flex justify-around p-4 z-50 pb-6">
      <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-cryptoCyan' : 'text-gray-500'}`}>
        <Home size={24} />
      </NavLink>
      <NavLink to="/gem-hunter" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-cryptoCyan' : 'text-gray-500'}`}>
        <Search size={24} />
      </NavLink>
      <NavLink to="/smart-money" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>
        <TrendingUp size={24} />
      </NavLink>
      <NavLink to="/assistant" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-cryptoCyan' : 'text-gray-500'}`}>
        <MessageSquare size={24} />
      </NavLink>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen bg-[#0A0A0F] text-white font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Mobile Header */}
          <div className="md:hidden h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0A0A0F]">
             <img src="/beacon-logo.png" alt="BeaconAI" className="h-8" />
             <button className="p-2 bg-white/5 rounded-full"><Wallet size={18} /></button>
          </div>

          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gem-hunter" element={<GemHunterPage />} />
              <Route path="/smart-money" element={
                <div className="h-full p-4">
                  <SmartMoneyFeed />
                </div>
              } />
              <Route path="/whale-radar" element={<WhaleRadarPage />} />
              <Route path="/whale-nexus" element={<WhaleNexusPage />} />
              <Route path="/gem-galaxy" element={<GemGalaxyPage />} />
              <Route path="/assistant" element={
                <div className="h-full p-4 md:p-6 max-w-4xl mx-auto">
                   <Assistant />
                </div>
              } />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/mobile-app" element={<MobileAppPage />} />
              <Route path="/settings" element={<div className="p-8 text-center text-gray-500">Settings Coming Soon</div>} />
            </Routes>
          </main>
          
          <MobileNav />
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
