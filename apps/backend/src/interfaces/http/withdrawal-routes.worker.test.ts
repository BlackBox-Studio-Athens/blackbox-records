import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { createHttpApp } from './app';
import type { AppBindings } from '../../platform/env';

const bindings: AppBindings = {
  ...env,
  PRODUCT_ENVIRONMENT: 'LOCAL',
  COMMERCE_DB: env.COMMERCE_DB,
  LOCAL_OPERATOR_EMAIL: 'operator@blackboxrecords.example',
  RESEND_API_KEY: 're_mock_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock',
  EMAIL_BRAND_HOME_URL: 'https://blackbox-records-web-uat.pages.dev/',
  EMAIL_BRAND_LOGO_URL: 'https://blackbox-records-web-uat.pages.dev/assets/images/brand/logo-horizontal.png',
};
const app = createHttpApp();
function input() {
  return {
    submissionId: crypto.randomUUID(),
    name: 'Test buyer',
    email: `${crypto.randomUUID()}@example.com`,
    contract: 'A record ordered last week; reference lost',
    confirmed: true,
  };
}
async function request(body: unknown) {
  const promises: Promise<unknown>[] = [];
  const response = await app.request(
    'http://127.0.0.1/api/store/withdrawals',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': crypto.randomUUID() },
      body: JSON.stringify(body),
    },
    bindings,
    {
      waitUntil: (promise) => {
        promises.push(promise);
      },
      passThroughOnException: vi.fn(),
      props: {},
    },
  );
  await Promise.all(promises);
  return response;
}

describe('withdrawal HTTP', () => {
  it('accepts a descriptive reference without login, records receipt time and sends from the outbox', async () => {
    const declaration = input();
    const response = await request(declaration);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const receipt = await response.json<{ receiptText: string; submittedAt: string }>();
    expect(receipt.receiptText).toContain(declaration.contract);
    expect(receipt.receiptText).toContain(receipt.submittedAt);
    expect(receipt.receiptText).toContain('does not confirm refund approval');
    const replay = await request(declaration);
    expect(await replay.json()).toEqual(receipt);
    const rows = await env.COMMERCE_DB.prepare(
      'SELECT "status", "attemptCount" FROM "OrderWithdrawalDelivery" WHERE "withdrawalId" = ?',
    )
      .bind(declaration.submissionId)
      .all();
    expect(rows.results).toEqual([
      { status: 'delivered', attemptCount: 1 },
      { status: 'delivered', attemptCount: 1 },
    ]);
    expect((await request({ ...declaration, name: 'Different' })).status).toBe(409);
  });

  it.each([
    { confirmed: false },
    { name: ' ' },
    { email: 'invalid' },
    { contract: '' },
    { contract: 'x'.repeat(2001) },
    { to: 'arbitrary@example.com' },
    { html: '<p>spam</p>' },
  ])('rejects unconfirmed, incomplete or recipient/content override input %j', async (override) => {
    expect((await request({ ...input(), ...override })).status).toBe(400);
  });

  it('rejects oversized bodies and keeps all public receipt reads unavailable', async () => {
    expect((await request({ ...input(), contract: 'x'.repeat(17000) })).status).toBe(400);
    expect((await app.request('http://127.0.0.1/api/store/withdrawals', {}, bindings)).status).toBe(404);
    const response = await app.request(
      'https://public.example/api/internal/order-withdrawals',
      {},
      { ...bindings, PRODUCT_ENVIRONMENT: 'PRD' },
    );
    expect([401, 403, 503]).toContain(response.status);
    expect(await response.text()).not.toContain('Test buyer');
  });

  it('retains declaration and queued delivery when email configuration is unavailable', async () => {
    const body = input();
    const pending: Promise<unknown>[] = [];
    const response = await app.request(
      'http://127.0.0.1/api/store/withdrawals',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': crypto.randomUUID() },
        body: JSON.stringify(body),
      },
      { ...bindings, RESEND_API_KEY: undefined },
      {
        waitUntil: (promise) => {
          pending.push(promise);
        },
        passThroughOnException: vi.fn(),
        props: {},
      },
    );
    await Promise.all(pending);
    expect(response.status).toBe(200);
    expect(
      (
        await env.COMMERCE_DB.prepare('SELECT "status" FROM "OrderWithdrawalDelivery" WHERE "withdrawalId" = ?')
          .bind(body.submissionId)
          .all()
      ).results,
    ).toEqual([{ status: 'pending' }, { status: 'pending' }]);
  });
});
