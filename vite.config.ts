import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/whale-alerts': {
            target: 'https://whale-alert.io',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/whale-alerts/, '/alerts.json'),
          },
          '/api/dexscreener': {
            target: 'https://api.dexscreener.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/dexscreener/, ''),
          },
          '/api/rugcheck': {
            target: 'https://api.rugcheck.xyz',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/rugcheck/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
