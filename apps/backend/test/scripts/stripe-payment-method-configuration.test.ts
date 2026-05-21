import { describe, expect, it } from 'vitest';

import {
  buildMutationParams,
  formatStripePaymentMethodConfigurationReport,
  redactStripeObjectId,
  verifyStripePaymentMethodConfiguration,
  type StripePaymentMethodConfiguration,
  type StripePaymentMethodConfigurationClient,
  type StripePaymentMethodConfigurationMutationParams,
} from '../../../../scripts/verify-stripe-payment-method-configuration';

function method(available: boolean, preference: 'off' | 'on' = available ? 'on' : 'off') {
  return {
    available,
    display_preference: {
      overridable: true,
      preference,
      value: preference,
    },
  };
}

function configuration(overrides: Partial<StripePaymentMethodConfiguration> = {}): StripePaymentMethodConfiguration {
  return {
    active: true,
    apple_pay: method(true),
    card: method(true),
    google_pay: method(true),
    id: 'pmc_1234567890abcdef',
    is_default: false,
    link: method(true),
    livemode: false,
    name: 'BlackBox merch checkout',
    object: 'payment_method_configuration',
    paypal: method(false),
    sepa_debit: method(false),
    ...overrides,
  };
}

function fakeClient(seed: StripePaymentMethodConfiguration) {
  const calls: Array<{
    id?: string;
    params?: StripePaymentMethodConfigurationMutationParams;
    type: 'create' | 'list' | 'retrieve' | 'update';
  }> = [];
  const client: StripePaymentMethodConfigurationClient = {
    async create(params) {
      calls.push({ params, type: 'create' });

      return configuration({ ...seed, ...params });
    },
    async list() {
      calls.push({ type: 'list' });

      return [seed];
    },
    async retrieve(id) {
      calls.push({ id, type: 'retrieve' });

      return seed;
    },
    async update(id, params) {
      calls.push({ id, params, type: 'update' });

      return seed;
    },
  };

  return { calls, client };
}

describe('Stripe Payment Method Configuration verification', () => {
  it('verifies an existing configuration in dry-run mode without mutating Stripe', async () => {
    const { calls, client } = fakeClient(configuration());
    const result = await verifyStripePaymentMethodConfiguration({
      apply: false,
      client,
      configurationId: 'pmc_1234567890abcdef',
    });

    expect(result.issues).toEqual([]);
    expect(result.mutation).toBe('none');
    expect(calls).toEqual([{ id: 'pmc_1234567890abcdef', type: 'retrieve' }]);
    expect(formatStripePaymentMethodConfigurationReport(result)).toContain('Mode: dry-run');
  });

  it('updates an existing configuration only when apply is explicit', async () => {
    const { calls, client } = fakeClient(configuration());
    const result = await verifyStripePaymentMethodConfiguration({
      apply: true,
      client,
      configurationId: 'pmc_1234567890abcdef',
    });

    expect(result.issues).toEqual([]);
    expect(result.mutation).toBe('update');
    expect(calls).toEqual([
      { id: 'pmc_1234567890abcdef', type: 'retrieve' },
      {
        id: 'pmc_1234567890abcdef',
        params: expect.objectContaining({
          'apple_pay[display_preference][preference]': 'on',
          'card[display_preference][preference]': 'on',
          'google_pay[display_preference][preference]': 'on',
          'link[display_preference][preference]': 'on',
          'paypal[display_preference][preference]': 'off',
          'sepa_debit[display_preference][preference]': 'off',
        }) as StripePaymentMethodConfigurationMutationParams,
        type: 'update',
      },
    ]);
  });

  it('fails when a banned method is effectively on', async () => {
    const { client } = fakeClient(configuration({ klarna: method(true) }));
    const result = await verifyStripePaymentMethodConfiguration({
      apply: false,
      client,
      configurationId: 'pmc_1234567890abcdef',
    });

    expect(result.issues).toContain('Banned payment method klarna is effectively on.');
  });

  it('fails when an unapproved returned method is effectively on', async () => {
    const { client } = fakeClient(configuration({ bancontact: method(true) }));
    const result = await verifyStripePaymentMethodConfiguration({
      apply: false,
      client,
      configurationId: 'pmc_1234567890abcdef',
    });

    expect(result.issues).toContain('Unapproved payment method bancontact is effectively on.');
  });

  it('passes banned methods that are absent, unavailable, or off', async () => {
    const { client } = fakeClient(
      configuration({
        affirm: method(false),
        paypal: undefined,
        sepa_debit: {
          available: false,
          display_preference: {
            preference: 'off',
            value: 'off',
          },
        },
      }),
    );
    const result = await verifyStripePaymentMethodConfiguration({
      apply: false,
      client,
      configurationId: 'pmc_1234567890abcdef',
    });

    expect(result.issues).toEqual([]);
  });

  it('reports dashboard or account eligibility gaps for allowed methods that are not effectively on', async () => {
    const { client } = fakeClient(configuration({ google_pay: method(false) }));
    const result = await verifyStripePaymentMethodConfiguration({
      apply: false,
      client,
      configurationId: 'pmc_1234567890abcdef',
    });

    expect(result.gaps).toContain('Allowed payment method google_pay is not effectively on.');
    expect(result.issues).toEqual([]);
  });

  it('redacts configuration IDs in human-readable evidence', async () => {
    const { client } = fakeClient(configuration());
    const result = await verifyStripePaymentMethodConfiguration({
      apply: false,
      client,
      configurationId: 'pmc_1234567890abcdef',
    });
    const report = formatStripePaymentMethodConfigurationReport(result);

    expect(redactStripeObjectId('pmc_1234567890abcdef')).toBe('pmc_...cdef');
    expect(report).toContain('pmc_...cdef');
    expect(report).not.toContain('pmc_1234567890abcdef');
    expect(report).not.toContain('sk_test_secret');
  });

  it('creates the named configuration only when apply is explicit and no existing configuration is found', async () => {
    const calls: Array<{ params?: StripePaymentMethodConfigurationMutationParams; type: string }> = [];
    const client: StripePaymentMethodConfigurationClient = {
      async create(params) {
        calls.push({ params, type: 'create' });

        return configuration();
      },
      async list() {
        calls.push({ type: 'list' });

        return [];
      },
      async retrieve() {
        throw new Error('retrieve should not run');
      },
      async update() {
        throw new Error('update should not run');
      },
    };
    const result = await verifyStripePaymentMethodConfiguration({
      apply: true,
      client,
      configurationId: null,
    });

    expect(result.mutation).toBe('create');
    expect(calls).toEqual([
      { type: 'list' },
      {
        params: expect.objectContaining({
          'card[display_preference][preference]': 'on',
          name: 'BlackBox merch checkout',
          'paypal[display_preference][preference]': 'off',
        }) as StripePaymentMethodConfigurationMutationParams,
        type: 'create',
      },
    ]);
  });

  it('keeps mutation params limited to allowed and banned policy methods', () => {
    expect(buildMutationParams(configuration({ bancontact: method(true) }))).toEqual(
      expect.objectContaining({
        'apple_pay[display_preference][preference]': 'on',
        'card[display_preference][preference]': 'on',
        'google_pay[display_preference][preference]': 'on',
        'link[display_preference][preference]': 'on',
        'paypal[display_preference][preference]': 'off',
        'sepa_debit[display_preference][preference]': 'off',
      }),
    );
    expect(buildMutationParams(configuration({ bancontact: method(true) }))).not.toHaveProperty(
      'bancontact[display_preference][preference]',
    );
  });
});
