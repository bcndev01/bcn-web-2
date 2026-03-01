export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/api\/whale-alerts/, '');
  const targetUrl = `https://whale-alert.io${path || '/alerts.json'}${url.search}`;

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'BeaconAI/1.0',
    },
  });

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  return newResponse;
};
