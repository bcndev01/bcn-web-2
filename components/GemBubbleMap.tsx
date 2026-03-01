import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RefreshCw, Loader2 } from 'lucide-react';
import { useGemHunter, useTimeSinceUpdate } from '../hooks/useGemHunter';
import { ProcessedToken, GemFilterType } from '../types/dexScreener';
import { getCategoryColor, getCategoryIcon } from '../utils/gemAlgorithm';

interface BubbleClickInfo {
  token: ProcessedToken;
  x: number;
  y: number;
}

interface GemBubbleMapProps {
  onSelectToken: (token: ProcessedToken) => void;
  onBubbleClick?: (info: BubbleClickInfo) => void;
}

const filterOptions: { key: GemFilterType; label: string; color: string; icon?: string }[] = [
  { key: 'ALL', label: 'All Gems', color: 'cryptoCyan' },
  { key: 'BREAKOUT', label: 'Breakout', color: 'orange-500', icon: '🔥' },
  { key: 'STRONG_TREND', label: 'Trending', color: 'blue-500', icon: '🚀' },
  { key: 'WHALE_MAGNET', label: 'Whale Magnet', color: 'purple-500', icon: '💎' },
  { key: 'HIGH_TRUST', label: 'High Trust', color: 'green-500' },
];

const GemBubbleMap: React.FC<GemBubbleMapProps> = ({ onSelectToken, onBubbleClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { tokens, allTokens, loading, error, lastUpdated, activeFilter, setFilter, refresh, fetchTokenSecurity } = useGemHunter();
  const timeSince = useTimeSinceUpdate(lastUpdated);

  // When tokens update (e.g., after security data loads), update selectedToken
  useEffect(() => {
    if (selectedId) {
      const updatedToken = allTokens.find(t => t.id === selectedId);
      if (updatedToken) {
        onSelectToken(updatedToken);
      }
    }
  }, [allTokens, selectedId, onSelectToken]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // If no tokens, just clear and return
    if (tokens.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Force Simulation with pre-calculated bubble radius
    const simulation = d3
      .forceSimulation<ProcessedToken>(tokens)
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .force(
        'collide',
        d3.forceCollide<ProcessedToken>((d) => d.bubbleRadius + 3).strength(0.8)
      )
      .force('charge', d3.forceManyBody().strength(-10));

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Render Bubbles
    const nodes = g
      .selectAll('.node')
      .data(tokens)
      .enter()
      .append('g')
      .attr('class', 'node cursor-pointer')
      .on('click', (event, d) => {
        console.log('Token clicked:', d.symbol, d.address);
        console.log('Security loaded?', d.security.loaded);

        setSelectedId(d.id);
        onSelectToken(d);

        // Get click position for AI chat button
        if (onBubbleClick) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            onBubbleClick({
              token: d,
              x: event.clientX,
              y: event.clientY
            });
          }
        }

        // Fetch security data if not loaded
        if (!d.security.loaded) {
          console.log('Calling fetchTokenSecurity...');
          fetchTokenSecurity(d.address);
        }

        // Visual feedback
        d3.select(event.currentTarget)
          .select('circle.main-bubble')
          .transition()
          .duration(100)
          .attr('r', d.bubbleRadius * 0.9)
          .transition()
          .duration(100)
          .attr('r', d.bubbleRadius);
      });

    // Outer glow for high trust tokens
    nodes
      .filter((d) => d.trustScore >= 5)
      .append('circle')
      .attr('r', (d) => d.bubbleRadius + 6)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.trustScoreColor)
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 3)
      .classed('animate-pulse', true);

    // Main bubble circle
    nodes
      .append('circle')
      .attr('class', 'main-bubble')
      .attr('r', (d) => d.bubbleRadius)
      .attr('fill', (d) => {
        // Use category color if available, otherwise trust score color
        if (d.categories.length > 0) {
          return getCategoryColor(d.categories[0]) + '30';
        }
        return d.trustScoreColor + '30';
      })
      .attr('stroke', (d) => {
        if (d.categories.length > 0) {
          return getCategoryColor(d.categories[0]);
        }
        return d.trustScoreColor;
      })
      .attr('stroke-width', 2);

    // NEW badge for recent tokens
    nodes
      .filter((d) => d.isNew)
      .append('text')
      .attr('dy', (d) => -d.bubbleRadius - 8)
      .attr('text-anchor', 'middle')
      .text('NEW')
      .attr('fill', '#00FF88')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .classed('animate-pulse', true);

    // Category icon
    nodes
      .filter((d) => d.categories.length > 0)
      .append('text')
      .attr('dy', (d) => -d.bubbleRadius / 2 - 2)
      .attr('text-anchor', 'middle')
      .text((d) => getCategoryIcon(d.categories[0]))
      .attr('font-size', (d) => Math.min(d.bubbleRadius / 2.5, 14));

    // Token Symbol
    nodes
      .append('text')
      .attr('dy', (d) => (d.categories.length > 0 ? 5 : -2))
      .attr('text-anchor', 'middle')
      .text((d) => {
        const maxLen = d.bubbleRadius > 50 ? 8 : 5;
        return d.symbol.length > maxLen ? d.symbol.slice(0, maxLen) : d.symbol;
      })
      .attr('font-size', (d) => Math.min(d.bubbleRadius / 3, 11))
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Price Change %
    nodes
      .append('text')
      .attr('dy', (d) => (d.categories.length > 0 ? 18 : 12))
      .attr('text-anchor', 'middle')
      .text((d) => `${d.priceChange1h >= 0 ? '+' : ''}${d.priceChange1h.toFixed(1)}%`)
      .attr('font-size', (d) => Math.min(d.bubbleRadius / 3.5, 10))
      .attr('fill', (d) => (d.priceChange1h >= 0 ? '#00FF88' : '#FF3B5C'))
      .style('pointer-events', 'none');

    // Simulation Tick
    simulation.on('tick', () => {
      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [tokens, onSelectToken]);

  // Loading state
  if (loading && tokens.length === 0) {
    return (
      <div className="relative w-full h-full bg-[#0A0A0F] overflow-hidden rounded-xl border border-white/5 shadow-2xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cryptoCyan animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Scanning for gems...</p>
          <p className="text-gray-600 text-xs mt-2">Fetching data from DexScreener</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && tokens.length === 0) {
    return (
      <div className="relative w-full h-full bg-[#0A0A0F] overflow-hidden rounded-xl border border-white/5 shadow-2xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-cryptoRed text-lg mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-cryptoCyan/20 text-cryptoCyan rounded-lg hover:bg-cryptoCyan/30 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0A0A0F] overflow-hidden rounded-xl border border-white/5 shadow-2xl">
      <div ref={containerRef} className="w-full h-full">
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Empty filter result message */}
      {tokens.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-2">No tokens match this filter</p>
            <p className="text-gray-600 text-sm">Try selecting a different category</p>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
              activeFilter === opt.key
                ? `bg-${opt.color}/20 border-${opt.color} text-${opt.color}`
                : 'bg-[#12121A] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
            style={
              activeFilter === opt.key
                ? {
                    backgroundColor:
                      opt.key === 'ALL'
                        ? 'rgba(0, 212, 255, 0.2)'
                        : opt.key === 'BREAKOUT'
                          ? 'rgba(255, 165, 0, 0.2)'
                          : opt.key === 'STRONG_TREND'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : opt.key === 'WHALE_MAGNET'
                              ? 'rgba(168, 85, 247, 0.2)'
                              : 'rgba(34, 197, 94, 0.2)',
                    borderColor:
                      opt.key === 'ALL'
                        ? '#00D4FF'
                        : opt.key === 'BREAKOUT'
                          ? '#FFA500'
                          : opt.key === 'STRONG_TREND'
                            ? '#3B82F6'
                            : opt.key === 'WHALE_MAGNET'
                              ? '#A855F7'
                              : '#22C55E',
                    color:
                      opt.key === 'ALL'
                        ? '#00D4FF'
                        : opt.key === 'BREAKOUT'
                          ? '#FFA500'
                          : opt.key === 'STRONG_TREND'
                            ? '#3B82F6'
                            : opt.key === 'WHALE_MAGNET'
                              ? '#A855F7'
                              : '#22C55E',
                  }
                : {}
            }
          >
            {opt.icon && <span>{opt.icon}</span>}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Live Feed Indicator */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-[#12121A]/80 backdrop-blur-md p-2 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cryptoGreen animate-pulse"></div>
            <span className="text-[10px] text-cryptoGreen font-bold tracking-wider">LIVE FEED</span>
          </div>
          <div className="text-[10px] text-gray-500 text-right">
            {timeSince ? `Updated ${timeSince}` : 'Updating...'}
          </div>
          <div className="text-[10px] text-gray-600 text-right">{tokens.length} gems found</div>
        </div>

        <button
          onClick={refresh}
          className="bg-[#12121A]/80 backdrop-blur-md p-2 rounded-lg border border-white/10 hover:border-cryptoCyan/50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#12121A]/80 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs">
        <h4 className="text-gray-400 mb-2 font-semibold">Categories</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span className="text-orange-400">Breakout</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🚀</span>
            <span className="text-blue-400">Strong Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💎</span>
            <span className="text-purple-400">Whale Magnet</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GemBubbleMap;
