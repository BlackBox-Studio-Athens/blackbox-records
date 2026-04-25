import { spawn, type ChildProcess } from 'node:child_process';
import http, { type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from 'node:http';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const STRIPE_MOCK_PROXY_PORT = 12110;
export const STRIPE_MOCK_HTTP_PORT = 12111;
export const STRIPE_MOCK_HTTPS_PORT = 12112;
export const STRIPE_MOCK_UPSTREAM_ORIGIN = `http://127.0.0.1:${STRIPE_MOCK_HTTP_PORT}`;

export function patchStripeMockRequest(input: { body: string; method?: string; url?: string }): string {
  if (!isCheckoutSessionCreate(input)) {
    return input.body;
  }

  const params = new URLSearchParams(input.body);

  if (params.get('ui_mode') === 'embedded_page') {
    params.set('ui_mode', 'embedded');
  }

  return params.toString();
}

export function patchStripeMockResponse(input: {
  body: string;
  method?: string;
  requestBody: string;
  url?: string;
}): string {
  if (!isCheckoutSessionCreate(input)) {
    return input.body;
  }

  const responseJson = readJsonObject(input.body);

  if (!responseJson) {
    return input.body;
  }

  const requestParams = new URLSearchParams(input.requestBody);
  const variantId = requestParams.get('metadata[variantId]') ?? 'local';

  if (!responseJson.client_secret) {
    responseJson.client_secret = `cs_mock_secret_${toSafeStripeMockFragment(variantId)}`;
  }

  return JSON.stringify(responseJson);
}

export function createStripeMockProxyServer(upstreamOrigin = STRIPE_MOCK_UPSTREAM_ORIGIN): http.Server {
  return http.createServer((request, response) => {
    void proxyRequest({ request, response, upstreamOrigin }).catch((error: unknown) => {
      writeProxyError(response, error);
    });
  });
}

async function main() {
  const stripeMock = spawnStripeMock();

  await waitForStripeMock();

  const proxy = createStripeMockProxyServer();
  await new Promise<void>((resolve) => {
    proxy.listen(STRIPE_MOCK_PROXY_PORT, '127.0.0.1', resolve);
  });

  console.log(
    `stripe-mock proxy listening on http://127.0.0.1:${STRIPE_MOCK_PROXY_PORT} -> ${STRIPE_MOCK_UPSTREAM_ORIGIN}`,
  );

  const shutdown = () => {
    proxy.close();

    if (!stripeMock.killed) {
      stripeMock.kill('SIGTERM');
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  stripeMock.once('exit', (code) => {
    proxy.close();
    process.exit(code ?? 1);
  });
}

async function proxyRequest({
  request,
  response,
  upstreamOrigin,
}: {
  request: IncomingMessage;
  response: ServerResponse;
  upstreamOrigin: string;
}) {
  const requestBody = await readRequestBody(request);
  const patchedRequestBody = patchStripeMockRequest({
    body: requestBody,
    method: request.method,
    url: request.url,
  });
  const upstreamUrl = new URL(request.url ?? '/', upstreamOrigin);
  const upstreamResponse = await fetch(upstreamUrl, {
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : patchedRequestBody,
    headers: copyHeaders(request.headers, patchedRequestBody),
    method: request.method,
  });
  const upstreamBody = await upstreamResponse.text();
  const patchedResponseBody = patchStripeMockResponse({
    body: upstreamBody,
    method: request.method,
    requestBody,
    url: request.url,
  });

  response.writeHead(upstreamResponse.status, copyResponseHeaders(upstreamResponse.headers, patchedResponseBody));
  response.end(patchedResponseBody);
}

function spawnStripeMock(): ChildProcess {
  return spawn(
    'go',
    [
      'run',
      'github.com/stripe/stripe-mock@latest',
      '-http-port',
      String(STRIPE_MOCK_HTTP_PORT),
      '-https-port',
      String(STRIPE_MOCK_HTTPS_PORT),
    ],
    {
      stdio: 'inherit',
    },
  );
}

function writeProxyError(response: ServerResponse, error: unknown) {
  response.writeHead(502, {
    'content-type': 'application/json',
  });
  response.end(
    JSON.stringify({
      error: error instanceof Error ? error.message : 'Stripe mock proxy failed.',
    }),
  );
}

async function waitForStripeMock() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${STRIPE_MOCK_UPSTREAM_ORIGIN}/v1/charges`, {
        headers: {
          Authorization: 'Bearer sk_test_mock',
        },
      });

      if (response.status < 500) {
        return;
      }
    } catch {
      // Keep polling until go run finishes compiling and starts stripe-mock.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('stripe-mock did not start on http://127.0.0.1:12111.');
}

function isCheckoutSessionCreate(input: { method?: string; url?: string }) {
  return input.method === 'POST' && input.url?.startsWith('/v1/checkout/sessions');
}

function readJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function toSafeStripeMockFragment(value: string) {
  return value.replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'local';
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

function copyHeaders(headers: IncomingHttpHeaders, body: string): Headers {
  const copied = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (!value || key.toLowerCase() === 'host' || key.toLowerCase() === 'content-length') {
      continue;
    }

    copied.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  copied.set('content-length', Buffer.byteLength(body).toString());

  return copied;
}

function copyResponseHeaders(headers: Headers, body: string): Record<string, string> {
  const copied: Record<string, string> = {};

  for (const [key, value] of headers.entries()) {
    if (key.toLowerCase() === 'content-length') {
      continue;
    }

    copied[key] = value;
  }

  copied['content-length'] = Buffer.byteLength(body).toString();

  return copied;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
