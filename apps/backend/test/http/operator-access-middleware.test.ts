import { describe, expect, it, vi } from 'vitest';

import {
  CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER,
  CF_ACCESS_JWT_ASSERTION_HEADER,
} from '../../src/interfaces/http/auth';
import { createHttpApp } from '../../src/interfaces/http/app';

const HOSTED_ENV = {
  PRODUCT_ENVIRONMENT: 'UAT' as const,
  COMMERCE_DB: {} as D1Database,
  CF_ACCESS_POLICY_AUD: 'operator-audience',
  CF_ACCESS_TEAM_DOMAIN: 'https://blackbox.cloudflareaccess.com',
  LOCAL_OPERATOR_EMAIL: 'ignored@example.com',
};

describe('operator access middleware', () => {
  it.each([
    ['GET', '/api/internal/variants'],
    ['GET', '/api/internal/variants/variant_1/stock'],
    ['GET', '/api/internal/variants/variant_1/stock/history'],
    ['POST', '/api/internal/variants/variant_1/stock/changes'],
    ['POST', '/api/internal/variants/variant_1/stock/counts'],
    ['GET', '/api/internal/orders'],
    ['GET', '/api/internal/orders/checkout-sessions/cs_test_1'],
  ])('protects %s %s before route work', async (method, path) => {
    const response = await createHttpApp().request(`https://ops.example${path}`, { method }, HOSTED_ENV);

    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      code: 'unauthorized',
      error: 'Unauthorized.',
      requestId: expect.any(String),
    });
  });

  it('returns generic 503 when hosted trust is missing', async () => {
    const response = await createHttpApp().request('https://ops.example/api/internal/orders', undefined, {
      PRODUCT_ENVIRONMENT: 'UAT',
      COMMERCE_DB: {} as D1Database,
      LOCAL_OPERATOR_EMAIL: 'ignored@example.com',
    });

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      code: 'operator_access_unavailable',
      error: 'Operator access temporarily unavailable.',
      requestId: expect.any(String),
    });
  });

  it('does not expose assertion, forwarded identity, or trust values in logs or responses', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const assertion = 'malformed.secret.assertion';
    const forwardedEmail = 'attacker@example.com';

    try {
      const response = await createHttpApp().request(
        'https://ops.example/api/internal/orders',
        {
          headers: {
            [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: forwardedEmail,
            [CF_ACCESS_JWT_ASSERTION_HEADER]: assertion,
          },
        },
        HOSTED_ENV,
      );
      const body = await response.text();
      const evidence = JSON.stringify({ body, logs: warn.mock.calls });

      expect(response.status).toBe(401);
      expect(evidence).not.toContain(assertion);
      expect(evidence).not.toContain(forwardedEmail);
      expect(evidence).not.toContain(HOSTED_ENV.CF_ACCESS_POLICY_AUD);
      expect(evidence).not.toContain(HOSTED_ENV.CF_ACCESS_TEAM_DOMAIN);
      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'operator_access_rejected',
          outcome: 'unauthorized',
          routeFamily: 'internal',
          safeReason: 'invalid_token',
        }),
      );
    } finally {
      warn.mockRestore();
    }
  });
});
