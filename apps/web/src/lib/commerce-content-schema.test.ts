import { describe, expect, it } from 'vitest';

import { commerceFields } from './commerce-content-schema';

describe('commerce content schema', () => {
  it('defaults missing release and distro commerce fields to a non-buyable draft state', () => {
    expect(commerceFields.parse(undefined)).toEqual({
      enabled: false,
      publish_target: 'draft',
      tax_code: 'txcd_99999999',
      smoke_candidate: false,
      retired: false,
    });
  });

  it('accepts explicit UAT and production promotion fields for release entries', () => {
    expect(
      commerceFields.parse({
        enabled: true,
        publish_target: 'uat_and_production',
        price: {
          amount_minor: 2800,
          currency: 'EUR',
          revision: 'first-pressing',
        },
        option_label: 'Black Vinyl LP',
        tax_code: 'txcd_99999999',
        stock: {
          initial_online_quantity: 25,
        },
        smoke_candidate: true,
      }),
    ).toMatchObject({
      enabled: true,
      publish_target: 'uat_and_production',
      price: {
        amount_minor: 2800,
        currency: 'EUR',
        revision: 'first-pressing',
      },
      option_label: 'Black Vinyl LP',
      stock: {
        initial_online_quantity: 25,
      },
      smoke_candidate: true,
      retired: false,
    });
  });

  it('accepts retired distro entries without deleting editorial publication intent', () => {
    expect(
      commerceFields.parse({
        enabled: false,
        publish_target: 'draft',
        retired: true,
      }),
    ).toEqual({
      enabled: false,
      publish_target: 'draft',
      tax_code: 'txcd_99999999',
      smoke_candidate: false,
      retired: true,
    });
  });

  it('rejects invalid commerce amounts, currencies, and target environments', () => {
    expect(() =>
      commerceFields.parse({
        enabled: true,
        publish_target: 'uat_and_production',
        price: {
          amount_minor: 0,
          currency: 'EUR',
        },
      }),
    ).toThrow();

    expect(() =>
      commerceFields.parse({
        enabled: true,
        publish_target: 'uat',
        price: {
          amount_minor: 2800,
          currency: 'USD',
        },
      }),
    ).toThrow();

    expect(() =>
      commerceFields.parse({
        enabled: true,
        publish_target: 'production',
      }),
    ).toThrow();
  });

  it('rejects negative initial online stock', () => {
    expect(() =>
      commerceFields.parse({
        stock: {
          initial_online_quantity: -1,
        },
      }),
    ).toThrow();
  });
});
