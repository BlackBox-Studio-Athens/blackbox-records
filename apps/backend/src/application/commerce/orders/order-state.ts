import type { OrderStatus } from '../../../domain/commerce/repositories';

export type OrderTransitionOrigin = 'server' | 'browser_read';

export type OrderTransitionDecision =
  | {
      kind: 'transition';
      fromStatus: OrderStatus;
      toStatus: OrderStatus;
    }
  | {
      kind: 'noop';
      fromStatus: OrderStatus;
      toStatus: OrderStatus;
      reason: 'replay';
    }
  | {
      kind: 'rejected';
      fromStatus: OrderStatus;
      toStatus: OrderStatus;
      reason: string;
    };

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  needs_review: [],
  not_paid: [],
  paid: ['needs_review'],
  pending_payment: ['paid', 'not_paid', 'needs_review'],
};

const replayNoopStatuses = new Set<OrderStatus>(['paid', 'not_paid', 'needs_review']);

export function evaluateOrderTransition(input: {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  origin?: OrderTransitionOrigin;
}): OrderTransitionDecision {
  const origin = input.origin ?? 'server';

  if (origin === 'browser_read') {
    return {
      fromStatus: input.fromStatus,
      kind: 'rejected',
      reason: 'Browser read paths cannot mutate persisted order state.',
      toStatus: input.toStatus,
    };
  }

  if (input.fromStatus === input.toStatus && replayNoopStatuses.has(input.fromStatus)) {
    return {
      fromStatus: input.fromStatus,
      kind: 'noop',
      reason: 'replay',
      toStatus: input.toStatus,
    };
  }

  if (allowedTransitions[input.fromStatus].includes(input.toStatus)) {
    return {
      fromStatus: input.fromStatus,
      kind: 'transition',
      toStatus: input.toStatus,
    };
  }

  return {
    fromStatus: input.fromStatus,
    kind: 'rejected',
    reason: `Order cannot transition from ${input.fromStatus} to ${input.toStatus}.`,
    toStatus: input.toStatus,
  };
}
