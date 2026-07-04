import { describe, expect, it, vi } from 'vitest';

import {
  buildStripeSandboxSmokeEvidence,
  buildStripeSandboxSmokeSummary,
  calculateMinimumSmokeOnlineQuantity,
  checkStripeSandboxSmokePreflight,
  createStripeCheckoutSessionProjectionObservation,
  createStripeCheckoutSurfaceObservation,
  createEmptyStripeSandboxSmokeDurations,
  createCheckoutOrderBySessionSql,
  createCheckoutPageUrl,
  createRemoteD1ReadinessSql,
  createSandboxSmokeStockTopUpSql,
  createScenarioEmail,
  createSmokeStoreCartStorageEntry,
  createStripeSandboxWebhookDeliveryDiagnostics,
  countPaidStripeSandboxScenarios,
  didScenarioPass,
  fillFirstVisibleSelector,
  formatStripeSandboxSmokePreflightSummary,
  formatStripeSandboxSmokeRunHeader,
  groupStripeSandboxSmokeScenarios,
  isPresetCustomCheckoutAmountText,
  parseD1CheckoutOrderRows,
  parseRemoteD1ReadinessSummary,
  parseStripeSandboxSmokeArgs,
  resolveCheckoutSurfaceExpectation,
  resolveSelectedStripeSandboxScenarios,
  runInBatches,
  scrubSensitiveStripeSmokeText,
  selectFirstVisibleSelector,
  STRIPE_SANDBOX_SMOKE_SCENARIOS,
  STRIPE_TEST_CARD_DOCS_URL,
  type LocalCheckoutOrderRow,
  type RemoteD1ReadinessSummary,
} from '../../../../scripts/smoke-stripe-sandbox';
import { readStoreCartState, STORE_CART_STORAGE_KEY } from '../../../../apps/web/src/lib/store-cart';

const paidOrder: LocalCheckoutOrderRow = {
  checkoutSessionId: 'cs_test_123',
  createdAt: '2026-05-17T00:00:00.000Z',
  id: 'order_1',
  needsReviewAt: null,
  notPaidAt: null,
  paidAt: '2026-05-17T00:01:00.000Z',
  shippingLockerCountryCode: null,
  shippingLockerId: null,
  shippingLockerNameOrLabel: null,
  status: 'paid',
  stripePaymentIntentId: 'pi_test_123',
  updatedAt: '2026-05-17T00:01:00.000Z',
};

const pendingOrder: LocalCheckoutOrderRow = {
  ...paidOrder,
  paidAt: null,
  status: 'pending_payment',
  stripePaymentIntentId: null,
};

const readySummary: RemoteD1ReadinessSummary = {
  availableStockCount: 3,
  checkoutOrderCount: 0,
  realStripeMappingCount: 1,
  smokeVariantCanBuy: true,
  smokeVariantOnlineQuantity: 3,
};
const sessionProjectionExpectation = {
  expectedAmountMinor: 2800,
  expectedCurrencyCode: 'EUR',
  expectedProductImageUrl:
    'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/disintegration.jpg',
  expectedProductName: 'BlackBox Records - Disintegration - Black Vinyl LP',
};
const checkoutSurfaceExpectation = {
  expectedAmountText: '€28.00',
  expectedPaymentMethodLabels: [],
  expectedSessionProjection: sessionProjectionExpectation,
  minimumDynamicPaymentMethodCount: 1,
};
const passingSessionProjection = createStripeCheckoutSessionProjectionObservation(
  {
    amountMinor: 2800,
    currencyCode: 'eur',
    productImageUrls: [sessionProjectionExpectation.expectedProductImageUrl],
    productName: sessionProjectionExpectation.expectedProductName,
  },
  sessionProjectionExpectation,
);

describe('Stripe sandbox Playwright smoke runner', () => {
  it('defaults to sandbox-only all-scenario automation', () => {
    expect(parseStripeSandboxSmokeArgs([])).toEqual({
      debug: false,
      declineConcurrency: 3,
      expectedPaymentMethodLabels: [],
      fieldActionTimeoutMs: 2_000,
      headed: false,
      scenarioSelection: 'all',
      screenshots: 'on-failure',
      siteUrl: 'https://blackbox-studio-athens.github.io/blackbox-records',
      timeoutMs: 120_000,
      trace: false,
      workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
    });
  });

  it('parses automation flags while keeping scenario validation strict', () => {
    expect(
      parseStripeSandboxSmokeArgs([
        '--',
        '--scenario',
        'three_d_secure',
        '--headed',
        '--trace',
        '--decline-concurrency',
        '2',
        '--field-action-timeout-ms=1500',
        '--expected-payment-label',
        'Link',
        '--expected-payment-label=Google Pay',
        '--screenshots',
        'always',
        '--timeout-ms=30000',
        '--site-url',
        'https://example.pages.dev/',
        '--worker-url=https://example.workers.dev/',
      ]),
    ).toEqual({
      debug: false,
      declineConcurrency: 2,
      expectedPaymentMethodLabels: ['Link', 'Google Pay'],
      fieldActionTimeoutMs: 1_500,
      headed: true,
      scenarioSelection: 'three_d_secure',
      screenshots: 'always',
      siteUrl: 'https://example.pages.dev',
      timeoutMs: 30_000,
      trace: true,
      workerUrl: 'https://example.workers.dev',
    });

    expect(() => parseStripeSandboxSmokeArgs(['--scenario', 'live_card'])).toThrow(
      'Unknown Stripe sandbox smoke scenario: live_card.',
    );
    expect(() => parseStripeSandboxSmokeArgs(['--screenshots', 'sometimes'])).toThrow(
      '--screenshots must be one of: on-failure, always, never.',
    );
    expect(
      parseStripeSandboxSmokeArgs(['--expected-payment-labels=Link,Google Pay']).expectedPaymentMethodLabels,
    ).toEqual(['Link', 'Google Pay']);
    expect(() => parseStripeSandboxSmokeArgs(['--expected-payment-label', ''])).toThrow(
      '--expected-payment-label must include a payment method label.',
    );
  });

  it('derives the checkout surface amount from the Worker Store Offer', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        canCheckout: true,
        price: {
          display: '€28.00',
        },
      }),
      status: 200,
    }));
    vi.stubGlobal('fetch', fetchMock);

    try {
      await expect(
        resolveCheckoutSurfaceExpectation(
          'https://worker.example.test/',
          {
            expectedAmountText: 'Worker Store Offer price',
            expectedPaymentMethodLabels: [],
            expectedSessionProjection: sessionProjectionExpectation,
            minimumDynamicPaymentMethodCount: 1,
          },
          ['Link'],
        ),
      ).resolves.toEqual({
        expectedAmountText: '€28.00',
        expectedPaymentMethodLabels: ['Link'],
        expectedSessionProjection: sessionProjectionExpectation,
        minimumDynamicPaymentMethodCount: 1,
      });
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchMock).toHaveBeenCalledWith('https://worker.example.test/api/store/items/disintegration-black-vinyl-lp');
  });

  it('resolves all supported Stripe sandbox scenarios including 3DS', () => {
    const scenarios = resolveSelectedStripeSandboxScenarios('all');

    expect(scenarios.map((scenario) => scenario.name)).toEqual([
      'checkout_surface',
      'happy_path_paid',
      'pay_what_you_want_paid',
      'three_d_secure',
      'card_declined',
      'insufficient_funds',
      'expired_card',
      'incorrect_cvc',
      'processing_error',
    ]);
    expect(countPaidStripeSandboxScenarios(scenarios)).toBe(3);
    expect(calculateMinimumSmokeOnlineQuantity(scenarios)).toBe(4);
    expect(calculateMinimumSmokeOnlineQuantity([STRIPE_SANDBOX_SMOKE_SCENARIOS.happy_path_paid])).toBe(1);
    expect(calculateMinimumSmokeOnlineQuantity([STRIPE_SANDBOX_SMOKE_SCENARIOS.card_declined])).toBe(1);

    expect(groupStripeSandboxSmokeScenarios(scenarios)).toEqual({
      checkoutSurfaceScenarios: [STRIPE_SANDBOX_SMOKE_SCENARIOS.checkout_surface],
      declineScenarios: [
        STRIPE_SANDBOX_SMOKE_SCENARIOS.card_declined,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.insufficient_funds,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.expired_card,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.incorrect_cvc,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.processing_error,
      ],
      paidScenarios: [
        STRIPE_SANDBOX_SMOKE_SCENARIOS.happy_path_paid,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.pay_what_you_want_paid,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.three_d_secure,
      ],
    });
  });

  it('creates stable sandbox URLs and scenario emails', () => {
    expect(createCheckoutPageUrl('https://blackbox-records-web.pages.dev/')).toBe(
      'https://blackbox-records-web.pages.dev/store/checkout/',
    );
    expect(createScenarioEmail('20260517000102', 'happy_path_paid')).toBe(
      'sandbox-checkout+20260517000102-happy_path_paid@blackbox.example',
    );
  });

  it('creates a browser cart seed for the smoke checkout route', () => {
    const storageEntry = createSmokeStoreCartStorageEntry();
    const storage = createMemoryStorage();

    storage.setItem(storageEntry.key, storageEntry.value);

    expect(storageEntry.key).toBe(STORE_CART_STORAGE_KEY);
    expect(storage.getItem(STORE_CART_STORAGE_KEY)).toContain('disintegration-black-vinyl-lp');
    expect(readStoreCartState(storage).lines).toMatchObject([
      {
        priceAmountMinor: 2800,
        priceCurrencyCode: 'EUR',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
    ]);
  });

  it('creates a browser cart seed for the pay-what-you-want smoke checkout route', () => {
    const storageEntry = createSmokeStoreCartStorageEntry(STRIPE_SANDBOX_SMOKE_SCENARIOS.pay_what_you_want_paid);
    const storage = createMemoryStorage();

    storage.setItem(storageEntry.key, storageEntry.value);

    expect(readStoreCartState(storage).lines).toMatchObject([
      {
        priceAmountMinor: null,
        priceCurrencyCode: 'EUR',
        priceDisplay: 'Pay what you want',
        priceKind: 'pay_what_you_want',
        storeItemSlug: 'atopia-atopia-cd',
        variantId: 'variant_atopia-atopia-cd_standard',
      },
    ]);
  });

  it('accepts hosted Checkout preset custom amount text', () => {
    expect(
      isPresetCustomCheckoutAmountText(
        'BlackBox Records - Atopia - CD €5.00 CD edition. Change amount OR Shipping information Email',
        '€5.00',
      ),
    ).toBe(true);
    expect(isPresetCustomCheckoutAmountText('BlackBox Records - Atopia - CD €5.00 Shipping information', '€5.00')).toBe(
      false,
    );
    expect(isPresetCustomCheckoutAmountText('BlackBox Records - Atopia - CD Change amount', '€5.00')).toBe(false);
  });

  it('runs bounded parallel batches in input order groups', async () => {
    const started: number[] = [];
    const finished: number[] = [];

    await runInBatches([1, 2, 3, 4], 2, async (value) => {
      started.push(value);
      await Promise.resolve();
      finished.push(value);
    });

    expect(started).toEqual([1, 2, 3, 4]);
    expect(finished).toEqual([1, 2, 3, 4]);
  });

  it('checks sandbox preflight without printing secret values', () => {
    expect(
      checkStripeSandboxSmokePreflight({
        gitignoreText: '.codex-artifacts/\n',
        minimumSmokeOnlineQuantity: 2,
        options: {
          siteUrl: 'https://blackbox-records-web.pages.dev',
          workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
        },
        remoteD1Summary: readySummary,
        scenarios: [STRIPE_SANDBOX_SMOKE_SCENARIOS.checkout_surface],
        secretNames: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
        siteReady: true,
        workerReady: true,
        wranglerReady: true,
      }),
    ).toEqual([]);

    const issues = checkStripeSandboxSmokePreflight({
      gitignoreText: '',
      minimumSmokeOnlineQuantity: 2,
      options: {
        siteUrl: 'https://blackbox-records-web.pages.dev',
        workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
      },
      remoteD1Summary: {
        availableStockCount: 0,
        checkoutOrderCount: 0,
        realStripeMappingCount: 0,
        smokeVariantCanBuy: false,
        smokeVariantOnlineQuantity: 0,
      },
      scenarios: [STRIPE_SANDBOX_SMOKE_SCENARIOS.happy_path_paid],
      secretNames: [],
      siteReady: false,
      workerReady: false,
      wranglerReady: false,
    });

    expect(issues).toContain(
      'Sandbox Worker secret STRIPE_SECRET_KEY is not configured. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_SECRET_KEY --env uat',
    );
    expect(issues).toContain(
      'Sandbox Worker secret STRIPE_WEBHOOK_SECRET is not configured. Set it from apps/backend with: pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --env uat',
    );
    expect(issues).toContain('Sandbox D1 has no real Stripe price mappings.');
    expect(issues).toContain('Sandbox D1 has no positive online stock rows.');
    expect(issues).toContain(
      'Sandbox D1 smoke item variant_disintegration-black-vinyl-lp_standard is not marked buyable.',
    );
    expect(issues).toContain(
      'Sandbox D1 smoke item variant_disintegration-black-vinyl-lp_standard needs at least 2 online stock for the selected paid scenario(s). Current online stock: 0.',
    );
    expect(JSON.stringify(issues)).not.toContain('sk_test_');
    expect(JSON.stringify(issues)).not.toContain('whsec_');
  });

  it('prints a sandbox preflight summary and run header', () => {
    const header = formatStripeSandboxSmokeRunHeader({
      options: parseStripeSandboxSmokeArgs(['--scenario', 'happy_path_paid']),
      runId: '20260517000102',
      scenarios: [STRIPE_SANDBOX_SMOKE_SCENARIOS.happy_path_paid],
    });
    const summary = formatStripeSandboxSmokePreflightSummary({
      issues: [],
      remoteD1Summary: readySummary,
      secretNames: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
      siteReady: true,
      workerReady: true,
      wranglerReady: true,
    });

    expect(header).toContain('Stripe sandbox checkout Playwright smoke');
    expect(header).toContain('Persistent Stripe Dashboard/Workbench webhook endpoint');
    expect(header).toContain('pnpm stripe:webhooks:verify --env uat');
    expect(header).toContain('stripe listen is local/temporary diagnostic tooling only');
    expect(header).not.toContain('STRIPE_WEBHOOK_SECRET must match that listener');
    expect(header).toContain(STRIPE_TEST_CARD_DOCS_URL);
    expect(summary).toContain('real Stripe mappings: 1');
    expect(summary).toContain('preflight result: OK');
  });

  it('creates remote D1 queries for readiness and checkout evidence', () => {
    expect(createRemoteD1ReadinessSql()).toContain('VariantStripeMapping');
    expect(createRemoteD1ReadinessSql()).toContain('realStripeMappingCount');
    expect(createRemoteD1ReadinessSql()).toContain('smokeVariantOnlineQuantity');
    expect(createSandboxSmokeStockTopUpSql(2)).toContain('"onlineQuantity" < 2');
    expect(createSandboxSmokeStockTopUpSql(2)).toContain('variant_disintegration-black-vinyl-lp_standard');
    expect(createSandboxSmokeStockTopUpSql(2, "variant_'quoted")).toContain("variant_''quoted");
    expect(() => createSandboxSmokeStockTopUpSql(0)).toThrow(
      'Sandbox smoke stock top-up quantity must be a positive integer.',
    );
    expect(createCheckoutOrderBySessionSql("cs_test_'quoted")).toContain("cs_test_''quoted");
  });

  it('parses remote D1 readiness and checkout order rows', () => {
    expect(
      parseRemoteD1ReadinessSummary(
        JSON.stringify([
          {
            results: [
              {
                availableStockCount: 3,
                checkoutOrderCount: 2,
                realStripeMappingCount: 1,
                smokeVariantCanBuy: 1,
                smokeVariantOnlineQuantity: 3,
              },
            ],
            success: true,
          },
        ]),
      ),
    ).toEqual({
      availableStockCount: 3,
      checkoutOrderCount: 2,
      realStripeMappingCount: 1,
      smokeVariantCanBuy: true,
      smokeVariantOnlineQuantity: 3,
    });

    expect(
      parseD1CheckoutOrderRows(
        JSON.stringify([
          {
            results: [paidOrder],
            success: true,
          },
        ]),
      ),
    ).toEqual([paidOrder]);
  });

  it('classifies paid and decline scenarios', () => {
    const passingSurface = createStripeCheckoutSurfaceObservation(
      'BlackBox UAT - Disintegration\n€28.00\nPayment method\nGoogle Pay\nCard\nCard information',
      {
        expectedAmountText: '€28.00',
        expectedPaymentMethodLabels: [],
        expectedSessionProjection: sessionProjectionExpectation,
        minimumDynamicPaymentMethodCount: 1,
      },
    );
    const failingSurface = createStripeCheckoutSurfaceObservation(
      'BlackBox UAT - Disintegration\n€10.00\nPayment method\nCard\nCard information',
      {
        expectedAmountText: '€28.00',
        expectedPaymentMethodLabels: [],
        expectedSessionProjection: sessionProjectionExpectation,
        minimumDynamicPaymentMethodCount: 1,
      },
    );

    expect(
      didScenarioPass(
        paidOrder,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.happy_path_paid,
        '',
        passingSurface,
        passingSessionProjection,
      ),
    ).toBe(true);
    expect(
      didScenarioPass(
        pendingOrder,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.happy_path_paid,
        '',
        passingSurface,
        passingSessionProjection,
      ),
    ).toBe(false);
    expect(
      didScenarioPass(
        null,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.checkout_surface,
        '',
        passingSurface,
        passingSessionProjection,
      ),
    ).toBe(true);
    expect(
      didScenarioPass(
        null,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.checkout_surface,
        '',
        failingSurface,
        passingSessionProjection,
      ),
    ).toBe(false);
    expect(
      didScenarioPass(
        pendingOrder,
        STRIPE_SANDBOX_SMOKE_SCENARIOS.insufficient_funds,
        'Your card has insufficient funds.',
      ),
    ).toBe(true);
    expect(
      didScenarioPass(paidOrder, STRIPE_SANDBOX_SMOKE_SCENARIOS.insufficient_funds, 'Your card was declined.'),
    ).toBe(false);
  });

  it('extracts hosted Checkout surface amount and dynamic payment method expectations', () => {
    const expectation = {
      expectedAmountText: '€28.00',
      expectedPaymentMethodLabels: ['Google Pay'],
      minimumDynamicPaymentMethodCount: 1,
    };

    expect(
      createStripeCheckoutSurfaceObservation(
        'BlackBox UAT - Disintegration\n€28.00\nPayment method\nGoogle Pay\nCard\nCard information',
        { ...expectation, expectedSessionProjection: sessionProjectionExpectation },
      ),
    ).toMatchObject({
      amountTextPresent: true,
      dynamicPaymentMethodLabels: ['Google Pay'],
      issues: [],
      observedAmountTexts: ['€28.00'],
      paymentMethodLabels: ['Google Pay', 'Card'],
    });

    expect(
      createStripeCheckoutSurfaceObservation(
        'BlackBox UAT - Disintegration\n€10.00\nPayment method\nCard\nCard information\nSave my information for faster checkout',
        { ...expectation, expectedSessionProjection: sessionProjectionExpectation },
      ),
    ).toMatchObject({
      amountTextPresent: false,
      dynamicPaymentMethodLabels: [],
      issues: [
        'Expected hosted Checkout amount €28.00; observed: €10.00.',
        'Expected at least 1 dynamic payment method surface label(s); observed: Card.',
        'Expected hosted Checkout payment method label(s) Google Pay; observed: Card.',
      ],
      observedAmountTexts: ['€10.00'],
      paymentMethodLabels: ['Card'],
    });

    expect(
      createStripeCheckoutSurfaceObservation(
        'BlackBox UAT - Disintegration\n€28.00\nPayment method\nCard\nCard information\nSave my information for faster checkout\nPay securely at Giannakos Dimitrios sandbox and everywhere Link is accepted.',
        {
          expectedAmountText: '€28.00',
          expectedPaymentMethodLabels: ['Link'],
          expectedSessionProjection: sessionProjectionExpectation,
          minimumDynamicPaymentMethodCount: 1,
        },
      ),
    ).toMatchObject({
      amountTextPresent: true,
      dynamicPaymentMethodLabels: ['Link'],
      issues: [],
      observedAmountTexts: ['€28.00'],
      paymentMethodLabels: ['Card'],
    });
  });

  it('passes short field action timeouts to Stripe field helpers', async () => {
    const fill = vi.fn().mockResolvedValue(undefined);
    const selectOption = vi.fn().mockResolvedValue(undefined);
    const field = {
      fill,
      isVisible: vi.fn().mockResolvedValue(true),
      selectOption,
    };
    const page = {
      frames: () => [],
      locator: () => ({
        first: () => field,
      }),
    };

    await expect(
      fillFirstVisibleSelector(page as never, 'input[name="email"]', 'buyer@example.test', 1_500),
    ).resolves.toBe(true);
    await expect(
      selectFirstVisibleSelector(page as never, 'select[name="shippingCountry"]', 'Greece', 1_500),
    ).resolves.toBe(true);

    expect(fill).toHaveBeenCalledWith('buyer@example.test', { timeout: 1_500 });
    expect(selectOption).toHaveBeenCalledWith({ label: 'Greece' }, { timeout: 1_500 });
  });

  it('builds scrubbed evidence JSON shape', () => {
    const evidence = buildStripeSandboxSmokeEvidence({
      artifactPaths: {
        tracePath: '.codex-artifacts/smoke/uat/stripe-sandbox/run/happy_path_paid/trace.zip',
      },
      checkoutPageUrl: 'https://blackbox-records-web.pages.dev/store/checkout/',
      options: {
        siteUrl: 'https://blackbox-records-web.pages.dev',
        workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
      },
      result: {
        checkoutSurface: createStripeCheckoutSurfaceObservation(
          'BlackBox UAT - Disintegration\n€28.00\nPayment method\nGoogle Pay\nCard\nCard information',
          checkoutSurfaceExpectation,
        ),
        checkoutSessionProjection: passingSessionProjection,
        checkoutSessionId: 'cs_test_123',
        durations: {
          ...createEmptyStripeSandboxSmokeDurations(),
          checkoutOpenMs: 100,
          remoteOrderPollMs: 300,
          stripeFormFillMs: 200,
          totalMs: 600,
        },
        finalUrl: 'https://blackbox-records-web.pages.dev/store/checkout/return/?session_id=cs_test_123',
        observedStripeUi: 'Checkout paid',
        order: paidOrder,
        screenshotPath: null,
        webhookDeliveryDiagnostics: null,
      },
      runId: '20260517000102',
      scenario: STRIPE_SANDBOX_SMOKE_SCENARIOS.happy_path_paid,
    });

    expect(evidence).toMatchObject({
      order: {
        status: 'paid',
        stripePaymentIntentRecorded: true,
      },
      passed: true,
      runId: '20260517000102',
      scenario: {
        name: 'happy_path_paid',
      },
      screenshotPath: null,
    });
    expect(evidence.durations).toMatchObject({
      checkoutOpenMs: 100,
      evidenceWriteMs: 0,
      remoteOrderPollMs: 300,
      stripeFormFillMs: 200,
      totalMs: 600,
    });
    expect(JSON.stringify(evidence)).not.toContain('sk_test_');
    expect(JSON.stringify(evidence)).not.toContain('whsec_');
    expect(JSON.stringify(evidence)).not.toContain('cs_test_123');
    expect(evidence.finalUrl).toContain('[redacted_checkout_session_id]');
    expect(evidence.order?.checkoutSessionId).toBe('[redacted_checkout_session_id]');
  });

  it('builds a standardized run summary for passed and blocked runs', () => {
    const passedSummary = buildStripeSandboxSmokeSummary({
      evidence: [
        {
          checkoutPageUrl: 'https://blackbox-records-web.pages.dev/store/checkout/',
          checkoutSessionProjection: null,
          checkoutSurface: null,
          durations: createEmptyStripeSandboxSmokeDurations(),
          finalUrl: 'https://blackbox-records-web.pages.dev/store/checkout/',
          generatedAt: '2026-05-17T00:00:00.000Z',
          observedStripeUi: 'Checkout ready',
          order: null,
          passed: true,
          runId: '20260517000102',
          scenario: {
            expectedOrderStatus: 'not_submitted',
            name: 'checkout_surface',
          },
          screenshotPath: null,
          siteUrl: 'https://blackbox-records-web.pages.dev',
          tracePath: null,
          webhookDeliveryDiagnostics: null,
          workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
        },
      ],
      options: {
        siteUrl: 'https://blackbox-records-web.pages.dev',
        workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
      },
      runId: '20260517000102',
      scenarios: [STRIPE_SANDBOX_SMOKE_SCENARIOS.checkout_surface],
    });

    const blockedSummary = buildStripeSandboxSmokeSummary({
      blocker: 'Sandbox D1 readiness could not be inspected.',
      evidence: [],
      options: {
        siteUrl: 'https://blackbox-records-web.pages.dev',
        workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
      },
      runId: '20260517000102',
      scenarios: [STRIPE_SANDBOX_SMOKE_SCENARIOS.checkout_surface],
    });

    expect(passedSummary).toMatchObject({
      environment: 'uat',
      failedScenarioCount: 0,
      passedScenarioCount: 1,
      runId: '20260517000102',
      scenarioNames: ['checkout_surface'],
      status: 'passed',
      suite: 'stripe-sandbox',
    });
    expect(blockedSummary).toMatchObject({
      blocker: 'Sandbox D1 readiness could not be inspected.',
      environment: 'uat',
      failedScenarioCount: 0,
      passedScenarioCount: 0,
      runId: '20260517000102',
      scenarioNames: ['checkout_surface'],
      status: 'failed',
      suite: 'stripe-sandbox',
    });
  });

  it('diagnoses pending Stripe checkout webhook event delivery after paid finalization misses D1', async () => {
    const fetchMock = vi.fn(async (url: string, _init?: { headers?: Record<string, string>; method?: string }) => {
      if (url.includes('/checkout/sessions/')) {
        return new Response(
          JSON.stringify({
            id: 'cs_test_123',
            payment_intent: 'pi_test_123',
            payment_status: 'paid',
            status: 'complete',
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          data: [
            {
              created: 1_775_000_000,
              data: {
                object: {
                  id: 'cs_test_123',
                },
              },
              id: 'evt_test_pending',
              livemode: false,
              pending_webhooks: 1,
              type: 'checkout.session.completed',
            },
            {
              created: 1_775_000_001,
              data: {
                object: {
                  id: 'cs_test_other',
                },
              },
              id: 'evt_test_other',
              livemode: false,
              pending_webhooks: 0,
              type: 'checkout.session.completed',
            },
          ],
        }),
        { status: 200 },
      );
    });

    const diagnostics = await createStripeSandboxWebhookDeliveryDiagnostics({
      checkoutSessionId: 'cs_test_123',
      fetchImpl: fetchMock,
      scenarioStartedAt: 1_775_000_000_000,
      secretKey: 'sk_test_123',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.headers?.Authorization).toBe('Bearer sk_test_123');
    expect(diagnostics.checkoutSession).toMatchObject({
      lookup: 'ok',
      paymentIntentRecorded: true,
      paymentStatus: 'paid',
      status: 'complete',
    });
    expect(diagnostics.events).toMatchObject({
      lookup: 'ok',
      pendingRelatedEventCount: 1,
      related: [
        {
          id: 'evt_test_pending',
          pendingWebhooks: 1,
          type: 'checkout.session.completed',
        },
      ],
    });
    expect(diagnostics.issues).toContain(
      '1 related Stripe checkout webhook event(s) still have pending webhook delivery.',
    );
  });

  it('does not call Stripe diagnostics without a secret key', async () => {
    const fetchMock = vi.fn();

    const diagnostics = await createStripeSandboxWebhookDeliveryDiagnostics({
      checkoutSessionId: 'cs_test_123',
      fetchImpl: fetchMock,
      scenarioStartedAt: 1_775_000_000_000,
      secretKey: '',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(diagnostics.checkoutSession.lookup).toBe('missing_secret');
    expect(diagnostics.events.lookup).toBe('missing_secret');
  });

  it('scrubs Stripe secrets, session IDs, and client secrets from logs', () => {
    const text = [
      'STRIPE_SECRET_KEY=sk_test_should_not_print',
      'STRIPE_WEBHOOK_SECRET=whsec_should_not_print',
      'session_id=cs_test_should_not_print',
      'client_secret=cs_test_abc_secret_should_not_print',
      'setup_secret=seti_test_abc_secret_should_not_print',
    ].join('\n');

    expect(scrubSensitiveStripeSmokeText(text)).toBe(
      [
        'STRIPE_SECRET_KEY=[redacted_stripe_secret_key]',
        'STRIPE_WEBHOOK_SECRET=[redacted_stripe_webhook_secret]',
        'session_id=[redacted_checkout_session_id]',
        'client_secret=cs_test_abc_secret_[redacted]',
        'setup_secret=seti_test_abc_secret_[redacted]',
      ].join('\n'),
    );
  });
});

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
