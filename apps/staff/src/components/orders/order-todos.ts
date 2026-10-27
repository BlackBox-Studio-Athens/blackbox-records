import type { InternalOrder } from './internal-order-api';

export type OrderTodos = {
  toShip: number;
  waiting: number;
  /** More matching orders exist beyond the bounded read, so counts are minimums. */
  more: boolean;
  oldestPaidAt: string | null;
  waitingNames: string[];
};

/** Splits one bounded paid-and-not-shipped page into ready and waiting-for-stock orders. */
export function orderTodos(items: InternalOrder[], nextCursor: string | null): OrderTodos {
  const ready = items.filter((order) => !order.awaitingStock);
  const waiting = items.filter((order) => order.awaitingStock);
  const paidTimes = ready.map((order) => order.paidAt).filter((value): value is string => !!value);
  const names = waiting.flatMap((order) =>
    order.fulfillment.kind === 'current' ? order.fulfillment.lines.map((line) => line.displayName) : [],
  );
  return {
    toShip: ready.length,
    waiting: waiting.length,
    more: !!nextCursor,
    oldestPaidAt: paidTimes.sort()[0] ?? null,
    waitingNames: [...new Set(names)].slice(0, 2),
  };
}

export const countLabel = (count: number, more: boolean) => `${count}${more ? '+' : ''}`;

/** "today", "1 day ago", "3 days ago" in Athens calendar days. */
export function paidAge(paidAt: string, now = new Date()): string {
  const day = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(value);
  const days = Math.round((Date.parse(day(now)) - Date.parse(day(new Date(paidAt)))) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
}
