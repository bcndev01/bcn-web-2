// =============================================
// Config Service
// Fetches app config from Supabase
// =============================================

import { createClient } from '@supabase/supabase-js';

// =============================================
// Supabase Client
// =============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[ConfigService] Supabase credentials not configured');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// =============================================
// Types
// =============================================

export interface AppConfig {
  TOKEN_CA: string;
  TWITTER_URL: string;
  DISCORD_URL: string;
  TELEGRAM_URL: string;
  CHART_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  [key: string]: string;
}

// =============================================
// Default Config (Fallback)
// =============================================

const DEFAULT_CONFIG: AppConfig = {
  TOKEN_CA: 'YOUR_TOKEN_CA_HERE',
  TWITTER_URL: 'https://x.com/YOUR_HANDLE',
  DISCORD_URL: 'https://discord.gg/YOUR_INVITE',
  TELEGRAM_URL: 'https://t.me/YOUR_GROUP',
  CHART_URL: 'https://dexscreener.com/solana/YOUR_TOKEN_CA',
  APP_NAME: 'BeaconAI',
  APP_VERSION: '1.0.0',
};

// =============================================
// Cache
// =============================================

let cachedConfig: AppConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// =============================================
// Config Service
// =============================================

class ConfigService {
  // Get all public config
  async getConfig(): Promise<AppConfig> {
    // Return cache if valid
    if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
      return cachedConfig;
    }

    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .eq('is_public', true);

      if (error) {
        console.error('[ConfigService] Error fetching config:', error);
        return cachedConfig || DEFAULT_CONFIG;
      }

      // Convert array to object
      const config: AppConfig = { ...DEFAULT_CONFIG };
      if (data) {
        data.forEach((row: { key: string; value: string }) => {
          config[row.key] = row.value;
        });
      }

      // Update cache
      cachedConfig = config;
      cacheTimestamp = Date.now();

      console.log('[ConfigService] Config loaded from Supabase');
      return config;
    } catch (error) {
      console.error('[ConfigService] Error:', error);
      return cachedConfig || DEFAULT_CONFIG;
    }
  }

  // Get single config value
  async getValue(key: string): Promise<string | null> {
    const config = await this.getConfig();
    return config[key] || null;
  }

  // Force refresh config
  async refresh(): Promise<AppConfig> {
    cachedConfig = null;
    cacheTimestamp = 0;
    return this.getConfig();
  }

  // Clear cache
  clearCache(): void {
    cachedConfig = null;
    cacheTimestamp = 0;
  }
}

export const configService = new ConfigService();

// =============================================
// React Hook for Config
// =============================================

import { useState, useEffect } from 'react';

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        const data = await configService.getConfig();
        if (isMounted) {
          setConfig(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load config');
          setLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    const data = await configService.refresh();
    setConfig(data);
    setLoading(false);
  };

  return { config, loading, error, refresh };
}
