import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  EMAIL_PREFERENCES_COPY,
  confirmNewsletter,
  readEmailPreferencesFragment,
  requestWithdrawalLink,
  withdrawAlerts,
} from './email-preferences';
import {
  PUBLIC_CHECKOUT_CONNECTION_MESSAGE,
  PublicCheckoutApiError,
  confirmNewsletterRequest,
  requestAvailabilityAlertWithdrawalLink,
  withdrawAvailabilityAlerts,
} from './public-checkout-api';

const token = 'a'.repeat(64);
const rejectWith = (status: number) => () => Promise.reject(new PublicCheckoutApiError(status, 'x'));
const offline = () => Promise.reject(new PublicCheckoutApiError(0, PUBLIC_CHECKOUT_CONNECTION_MESSAGE));

afterEach(() => vi.unstubAllGlobals());

describe('email-preferences fragment', () => {
  it('accepts only a known action with a 64 lowercase hex token', () => {
    expect(readEmailPreferencesFragment(`#action=newsletter&token=${token}`)).toEqual({ action: 'newsletter', token });
    expect(readEmailPreferencesFragment(`#token=${token}&action=availability-withdrawal`)).toEqual({
      action: 'availability-withdrawal',
      token,
    });
    expect(readEmailPreferencesFragment(`#action=newsletter&token=${'A'.repeat(64)}`)).toEqual({
      action: 'newsletter',
    });
    expect(readEmailPreferencesFragment(`#action=availability-withdrawal&token=${token}0`)).toEqual({
      action: 'availability-withdrawal',
    });
    expect(readEmailPreferencesFragment(`#action=other&token=${token}`)).toEqual({});
    expect(readEmailPreferencesFragment('')).toEqual({});
  });
});

describe('email-preferences outcomes', () => {
  it('confirms once and never offers to resubmit a token the server answered', async () => {
    const send = vi.fn(() => Promise.resolve({ status: 'confirmed' }));
    await expect(confirmNewsletter(token, send)).resolves.toEqual({
      tone: 'status',
      lines: EMAIL_PREFERENCES_COPY.confirmed,
      final: true,
    });
    expect(send).toHaveBeenCalledWith(token);
    await expect(confirmNewsletter(token, rejectWith(400))).resolves.toEqual({
      tone: 'error',
      lines: [EMAIL_PREFERENCES_COPY.confirmExpired],
      final: true,
    });
    await expect(confirmNewsletter(token, rejectWith(503))).resolves.toEqual({
      tone: 'error',
      lines: [EMAIL_PREFERENCES_COPY.confirmUnavailable],
      final: true,
    });
    await expect(confirmNewsletter(token, offline)).resolves.toEqual({
      tone: 'error',
      lines: [EMAIL_PREFERENCES_COPY.network],
      final: false,
    });
  });

  it('reports withdrawal without claiming the link was valid and lets network failures retry', async () => {
    await expect(withdrawAlerts(token, () => Promise.resolve({ status: 'withdrawn' }))).resolves.toMatchObject({
      tone: 'status',
      lines: EMAIL_PREFERENCES_COPY.withdrawn,
      final: true,
    });
    await expect(withdrawAlerts(token, rejectWith(400))).resolves.toMatchObject({
      lines: [EMAIL_PREFERENCES_COPY.incomplete],
      final: true,
    });
    await expect(withdrawAlerts(token, offline)).resolves.toMatchObject({ final: false });
  });

  it('validates the recovery email before sending and keeps failures generic', async () => {
    const send = vi.fn(() => Promise.resolve({ status: 'requested' }));
    await expect(requestWithdrawalLink(' nope ', send)).resolves.toMatchObject({ invalidEmail: true });
    expect(send).not.toHaveBeenCalled();
    await expect(requestWithdrawalLink(' fan@example.com ', send)).resolves.toMatchObject({
      tone: 'status',
      lines: [EMAIL_PREFERENCES_COPY.recoverySent],
    });
    expect(send).toHaveBeenCalledWith('fan@example.com');
    await expect(requestWithdrawalLink('fan@example.com', rejectWith(400))).resolves.toMatchObject({
      lines: [EMAIL_PREFERENCES_COPY.invalidEmail],
      invalidEmail: true,
    });
    for (const failure of [rejectWith(503), offline])
      await expect(requestWithdrawalLink('fan@example.com', failure)).resolves.toMatchObject({
        tone: 'error',
        lines: [EMAIL_PREFERENCES_COPY.recoveryFailed],
      });
  });
});

describe('email-preferences API wrappers', () => {
  it('post capabilities in strict JSON bodies with no query string and keep the HTTP status', async () => {
    const requests: Array<{ url: string; method: string; body: unknown }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        requests.push({ url, method: init?.method ?? 'GET', body: JSON.parse(String(init?.body)) });
        const status = url.endsWith('/withdrawals') ? 400 : 200;
        const body = url.endsWith('/confirmations') ? { status: 'confirmed' } : { status: 'requested' };
        return new Response(JSON.stringify(status === 200 ? body : { error: 'invalid_request' }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
    await expect(confirmNewsletterRequest(token)).resolves.toEqual({ status: 'confirmed' });
    await expect(requestAvailabilityAlertWithdrawalLink('fan@example.com')).resolves.toEqual({ status: 'requested' });
    const failure = await withdrawAvailabilityAlerts(token).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(PublicCheckoutApiError);
    expect((failure as PublicCheckoutApiError).status).toBe(400);
    expect(requests.map(({ url, method, body }) => [new URL(url, 'http://local').pathname, method, body])).toEqual([
      ['/api/newsletter/confirmations', 'POST', { token }],
      ['/api/availability-alerts/withdrawal-links', 'POST', { email: 'fan@example.com' }],
      ['/api/availability-alerts/withdrawals', 'POST', { token }],
    ]);
    for (const { url } of requests) {
      expect(url).not.toContain('?');
      expect(url).not.toContain(token);
    }
  });
});
