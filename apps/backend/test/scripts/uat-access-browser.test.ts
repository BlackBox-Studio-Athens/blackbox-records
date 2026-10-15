import type { APIResponse, BrowserContext, Request, Route } from 'playwright';
import { afterEach, expect, it, vi } from 'vitest';
import { authenticateUatBrowser } from '../../../../scripts/smoke-browser';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

async function createAuthenticatedRoute() {
  vi.stubEnv('UAT_ACCESS_CLIENT_ID', 'fixture-client');
  vi.stubEnv('UAT_ACCESS_CLIENT_SECRET', 'fixture-secret');
  const context = { route: vi.fn<BrowserContext['route']>() };
  await authenticateUatBrowser(
    context as unknown as BrowserContext,
    'https://preview.blackbox-records-web-uat.pages.dev/',
  );
  const [pattern, handler] = context.route.mock.calls[0];
  const request = { headers: () => ({ Accept: 'application/json' }) } as unknown as Request;
  const response = { status: () => 302 } as APIResponse;
  const route = {
    request: () => request,
    fetch: vi.fn<Route['fetch']>().mockResolvedValue(response),
    fulfill: vi.fn<Route['fulfill']>().mockResolvedValue(undefined),
    continue: vi.fn<Route['continue']>().mockResolvedValue(undefined),
  };
  return { handler, pattern, request, response, route };
}

it('authenticates only the exact UAT origin and fulfills redirects without forwarding credentials', async () => {
  const { handler, pattern, request, response, route } = await createAuthenticatedRoute();
  expect(pattern).toBe('https://preview.blackbox-records-web-uat.pages.dev/**');
  await handler(route as unknown as Route, request);
  expect(route.fetch).toHaveBeenCalledExactlyOnceWith({
    headers: {
      Accept: 'application/json',
      'CF-Access-Client-Id': 'fixture-client',
      'CF-Access-Client-Secret': 'fixture-secret',
    },
    maxRedirects: 0,
  });
  expect(route.fulfill).toHaveBeenCalledExactlyOnceWith({ response });
  expect(route.continue).not.toHaveBeenCalled();
});

it.each([
  'route.fetch: read ECONNRESET',
  'route.fetch: connect ECONNREFUSED',
  'route.fetch: socket hang up',
  'route.fetch: Timeout 30000ms exceeded',
  'route.fetch: request timed out',
  'route.fetch: ETIMEDOUT',
])('retries a transient fetch error after a short delay: %s', async (message) => {
  vi.useFakeTimers();
  const { handler, request, response, route } = await createAuthenticatedRoute();
  route.fetch.mockRejectedValueOnce(new Error(message));
  const handled = handler(route as unknown as Route, request);
  await vi.advanceTimersByTimeAsync(249);
  expect(route.fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  await handled;
  expect(route.fetch).toHaveBeenCalledTimes(2);
  expect(route.fetch.mock.calls[1]).toEqual(route.fetch.mock.calls[0]);
  expect(route.fulfill).toHaveBeenCalledExactlyOnceWith({ response });
  expect(route.continue).not.toHaveBeenCalled();
});

it.each([
  ['route.fetch: read ECONNRESET', 2, false],
  ['route.fetch: unsupported protocol', 1, false],
  ['route.fetch: read ECONNRESET', 2, true],
])('falls back after %s (%i attempts, continue rejects: %s)', async (message, attempts, continueRejects) => {
  vi.useFakeTimers();
  const { handler, request, route } = await createAuthenticatedRoute();
  route.fetch.mockRejectedValue(new Error(message));
  if (continueRejects) route.continue.mockRejectedValue(new Error('Target page, context or browser has been closed'));
  const handled = handler(route as unknown as Route, request);
  await vi.runAllTimersAsync();
  await handled;
  expect(route.fetch).toHaveBeenCalledTimes(attempts);
  expect(route.fulfill).not.toHaveBeenCalled();
  expect(route.continue).toHaveBeenCalledExactlyOnceWith();
});

it('does not intercept PRD or public API requests', async () => {
  vi.stubEnv('UAT_ACCESS_CLIENT_ID', 'fixture-client');
  vi.stubEnv('UAT_ACCESS_CLIENT_SECRET', 'fixture-secret');
  const context = { route: vi.fn<BrowserContext['route']>() };
  await authenticateUatBrowser(context as unknown as BrowserContext, 'https://blackboxrecordsathens.com/');
  await authenticateUatBrowser(
    context as unknown as BrowserContext,
    'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev/',
  );
  expect(context.route).not.toHaveBeenCalled();
});
