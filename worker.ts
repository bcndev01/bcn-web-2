interface Env {
  ASSETS: Fetcher;
}

const PROXY_ROUTES: Record<string, { target: string; pathRewrite: (path: string) => string }> = {
  '/api/dexscreener': {
    target: 'https://api.dexscreener.com',
    pathRewrite: (path) => path.replace(/^\/api\/dexscreener/, ''),
  },
  '/api/rugcheck': {
    target: 'https://api.rugcheck.xyz',
    pathRewrite: (path) => path.replace(/^\/api\/rugcheck/, ''),
  },
  '/api/whale-alerts': {
    target: 'https://whale-alert.io',
    pathRewrite: (path) => path.replace(/^\/api\/whale-alerts/, '/alerts.json'),
  },
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    for (const [prefix, config] of Object.entries(PROXY_ROUTES)) {
      if (url.pathname.startsWith(prefix)) {
        const rewrittenPath = config.pathRewrite(url.pathname);
        const targetUrl = `${config.target}${rewrittenPath}${url.search}`;

        const response = await fetch(targetUrl, {
          method: request.method,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BeaconAI/1.0',
          },
        });

        const newResponse = new Response(response.body, response);
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        return newResponse;
      }
    }

    // Fall through to static assets
    return env.ASSETS.fetch(request);
  },
};
