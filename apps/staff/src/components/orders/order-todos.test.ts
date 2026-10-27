import { describe, expect, it } from 'vitest';
import type { InternalOrder } from './internal-order-api';
import { countLabel, orderTodos, paidAge } from './order-todos';

const order = (awaitingStock: boolean, paidAt: string, names: string[]) =>
  ({
    awaitingStock,
    paidAt,
    fulfillment: { kind: 'current', lines: names.map((displayName) => ({ displayName })) },
  }) as unknown as InternalOrder;

describe('Overview to-do counts', () => {
  it('splits paid unshipped orders into ready and waiting, with the oldest ready payment', () => {
    const todos = orderTodos(
      [
        order(false, '2026-10-26T08:00:00Z', ['Caregivers · Vinyl']),
        order(true, '2026-10-20T08:00:00Z', ['Disintegration · Black Vinyl LP']),
        order(false, '2026-10-25T08:00:00Z', ['Anarchotribal · Vinyl']),
        order(true, '2026-10-21T08:00:00Z', ['Disintegration · Black Vinyl LP']),
      ],
      null,
    );
    expect(todos).toEqual({
      toShip: 2,
      waiting: 2,
      more: false,
      oldestPaidAt: '2026-10-25T08:00:00Z',
      waitingNames: ['Disintegration · Black Vinyl LP'],
    });
  });

  it('marks counts as minimums when the bounded read has more pages', () => {
    const todos = orderTodos([order(false, '2026-10-26T08:00:00Z', [])], 'next');
    expect(countLabel(todos.toShip, todos.more)).toBe('1+');
  });

  it('describes payment age in Athens calendar days', () => {
    const now = new Date('2026-10-27T10:00:00Z');
    expect(paidAge('2026-10-27T05:00:00Z', now)).toBe('today');
    // Athens is UTC+2 after 25 October: 22:30 UTC on the 26th is already the 27th there.
    expect(paidAge('2026-10-26T22:30:00Z', now)).toBe('today');
    expect(paidAge('2026-10-26T21:30:00Z', now)).toBe('1 day ago');
    expect(paidAge('2026-10-26T10:00:00Z', now)).toBe('1 day ago');
    expect(paidAge('2026-10-24T10:00:00Z', now)).toBe('3 days ago');
  });
});
