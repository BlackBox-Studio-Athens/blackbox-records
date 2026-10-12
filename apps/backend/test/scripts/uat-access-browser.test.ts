import type { APIResponse, BrowserContext, Request, Route } from 'playwright';
import { afterEach, expect, it, vi } from 'vitest';
import { authenticateUatBrowser } from '../../../../scripts/smoke-browser';

afterEach(() => vi.unstubAllEnvs());

it('authenticates only the exact UAT origin and fulfills redirects without forwarding credentials', async () => {
  vi.stubEnv('UAT_ACCESS_CLIENT_ID', 'fixture-client');
  vi.stubEnv('UAT_ACCESS_CLIENT_SECRET', 'fixture-secret');
  const context = { route: vi.fn<BrowserContext['route']>() };
  await authenticateUatBrowser(
    context as unknown as BrowserContext,
    'https://preview.blackbox-records-web-uat.pages.dev/',
  );
  const [pattern, handler] = context.route.mock.calls[0];
  expect(pattern).toBe('https://preview.blackbox-records-web-uat.pages.dev/**');
  const request = { headers: () => ({ Accept: 'application/json' }) } as unknown as Request;
  const response = { status: () => 302 } as APIResponse;
  const route = {
    request: () => request,
    fetch: vi.fn<Route['fetch']>().mockResolvedValue(response),
    fulfill: vi.fn<Route['fulfill']>().mockResolvedValue(undefined),
  };
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
