import { describe, expect, it } from 'vitest';

import {
  AVAILABILITY_ALERT_DAILY_BUDGET,
  AVAILABILITY_ALERT_PENDING_CAP,
  availabilityAlertExpiryCutoff,
  availabilityAlertRetryAt,
  isAvailabilityAlertDue,
  isAvailabilityAlertEligible,
  normalizeAvailabilityAlertEmail,
} from './availability-alerts';
import { createStockQuantity } from './quantities';

const stock = (quantity: number) => ({
  onlineQuantity: createStockQuantity(quantity),
  zeroStockState: 'coming_soon' as const,
});

describe('availability alert rules', () => {
  it('keeps the fixed budget and cap', () => {
    expect(AVAILABILITY_ALERT_DAILY_BUDGET).toBe(40);
    expect(AVAILABILITY_ALERT_PENDING_CAP).toBe(2_000);
  });

  it.each([
    ['coming_soon', true],
    ['repressing', true],
    ['sold_out', false],
    ['stocked', false],
    ['unavailable', false],
  ] as const)('accepts requests for %s: %s', (state, eligible) => {
    expect(isAvailabilityAlertEligible(state)).toBe(eligible);
  });

  it('is due only when the variant can be bought', () => {
    const available = { status: 'available', canBuy: true } as const;
    expect(isAvailabilityAlertDue(available, stock(1))).toBe(true);
    expect(isAvailabilityAlertDue(available, stock(0))).toBe(false);
    expect(isAvailabilityAlertDue({ status: 'available', canBuy: false }, stock(3))).toBe(false);
    expect(isAvailabilityAlertDue({ status: 'sold_out', canBuy: false }, stock(3))).toBe(false);
    expect(isAvailabilityAlertDue(null, stock(3))).toBe(false);
    expect(isAvailabilityAlertDue(available, null)).toBe(false);
  });

  it('stores one address form', () => {
    expect(normalizeAvailabilityAlertEmail('  Shopper@Example.COM ')).toBe('shopper@example.com');
  });

  it('expires alerts twelve months after the request', () => {
    expect(availabilityAlertExpiryCutoff(new Date('2027-10-07T09:00:00.000Z')).toISOString()).toBe(
      '2026-10-07T09:00:00.000Z',
    );
  });

  it('backs off between attempts and stops after the fifth', () => {
    const failedAt = new Date('2026-10-07T09:00:00.000Z');
    expect([1, 2, 3, 4].map((attempt) => availabilityAlertRetryAt(attempt, failedAt)?.toISOString())).toEqual([
      '2026-10-07T09:15:00.000Z',
      '2026-10-07T10:00:00.000Z',
      '2026-10-07T15:00:00.000Z',
      '2026-10-08T09:00:00.000Z',
    ]);
    expect(availabilityAlertRetryAt(5, failedAt)).toBeNull();
  });
});
