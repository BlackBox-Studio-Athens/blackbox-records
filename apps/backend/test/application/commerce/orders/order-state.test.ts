import { describe, expect, it } from 'vitest';

import { evaluateOrderTransition } from '../../../../src/application/commerce/orders';
import type { OrderStatus } from '../../../../src/domain/commerce/repositories';

describe('order transition guard', () => {
  it.each([
    ['pending_payment', 'paid'],
    ['pending_payment', 'not_paid'],
    ['pending_payment', 'needs_review'],
    ['paid', 'needs_review'],
  ] satisfies Array<[OrderStatus, OrderStatus]>)('allows %s -> %s', (fromStatus, toStatus) => {
    expect(evaluateOrderTransition({ fromStatus, toStatus })).toEqual({
      fromStatus,
      kind: 'transition',
      toStatus,
    });
  });

  it.each([['paid'], ['not_paid'], ['needs_review']] satisfies Array<[OrderStatus]>)(
    'treats duplicate %s webhook delivery as a no-op',
    (status) => {
      expect(evaluateOrderTransition({ fromStatus: status, toStatus: status })).toEqual({
        fromStatus: status,
        kind: 'noop',
        reason: 'replay',
        toStatus: status,
      });
    },
  );

  it.each([
    ['paid', 'not_paid'],
    ['not_paid', 'pending_payment'],
    ['needs_review', 'paid'],
  ] satisfies Array<[OrderStatus, OrderStatus]>)('rejects %s -> %s', (fromStatus, toStatus) => {
    expect(evaluateOrderTransition({ fromStatus, toStatus })).toMatchObject({
      fromStatus,
      kind: 'rejected',
      toStatus,
    });
  });

  it('rejects browser read paths that attempt to persist order state', () => {
    expect(
      evaluateOrderTransition({
        fromStatus: 'pending_payment',
        origin: 'browser_read',
        toStatus: 'paid',
      }),
    ).toEqual({
      fromStatus: 'pending_payment',
      kind: 'rejected',
      reason: 'Browser read paths cannot mutate persisted order state.',
      toStatus: 'paid',
    });
  });
});
