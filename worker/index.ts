const SERVICE_NAME = 'blackbox-records-worker';

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    ...init,
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/healthz') {
      return json(
        {
          service: SERVICE_NAME,
          status: 'ok',
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
        },
      );
    }

    return json(
      {
        error: 'Not Found',
      },
      {
        status: 404,
      },
    );
  },
};
