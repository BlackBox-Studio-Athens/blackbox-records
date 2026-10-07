import { z } from 'zod';

export type PreorderShipEstimate =
  { kind: 'month'; month: string; part: 'early' | 'mid' | 'late' | null } | { kind: 'date'; date: string };
export type StockPreorder = { shipEstimate: PreorderShipEstimate; startedAt: string };
export type ShopperPreorder = { shipEstimate: PreorderShipEstimate | null };

const isRealDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const calendarMonth = /^\d{4}-(0[1-9]|1[0-2])$/;

/** A `YYYY-MM` calendar month. */
export const isCalendarMonth = (value: unknown): value is string =>
  typeof value === 'string' && calendarMonth.test(value);

/** A `YYYY-MM` month has passed once Europe/Athens `today` (`YYYY-MM-DD`) is in a later month. */
export const isMonthPassed = (month: string, today: string): boolean => month < today.slice(0, 7);

const shipEstimateSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('month'),
    month: z.string().regex(calendarMonth),
    part: z.enum(['early', 'mid', 'late']).nullable(),
  }),
  z.object({
    kind: z.literal('date'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(isRealDate),
  }),
]);

const athensDateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Athens',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar date `YYYY-MM-DD` in Europe/Athens, where shoppers and staff live. */
export function athensToday(now: Date = new Date()): string {
  const parts = Object.fromEntries(athensDateFormat.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function parsePreorderShipEstimate(value: unknown): PreorderShipEstimate {
  return shipEstimateSchema.parse(value);
}

export function stockPreorderFromColumns(row: {
  preorderStartedAt: string | null;
  preorderShipMonth: string | null;
  preorderShipPart: string | null;
  preorderShipDate: string | null;
}): StockPreorder | null {
  if (row.preorderStartedAt === null) return null;
  return {
    shipEstimate: parsePreorderShipEstimate(
      row.preorderShipDate === null
        ? { kind: 'month', month: row.preorderShipMonth, part: row.preorderShipPart }
        : { kind: 'date', date: row.preorderShipDate },
    ),
    startedAt: row.preorderStartedAt,
  };
}

/** A month estimate stays open until staff end it; an exact date ends the pre-order on that day. */
export function isPreorderOpen(preorder: StockPreorder, today: string): boolean {
  return preorder.shipEstimate.kind === 'month' || preorder.shipEstimate.date > today;
}

/** What a shopper sees: nothing once an exact date arrives, no estimate once a month has passed. */
export function deriveShopperPreorder(preorder: StockPreorder | null, today: string): ShopperPreorder | null {
  if (!preorder || !isPreorderOpen(preorder, today)) return null;
  const { shipEstimate } = preorder;
  const passed = shipEstimate.kind === 'month' && isMonthPassed(shipEstimate.month, today);
  return { shipEstimate: passed ? null : shipEstimate };
}

export function samePreorderShipEstimate(a: PreorderShipEstimate, b: PreorderShipEstimate): boolean {
  return a.kind === 'month'
    ? b.kind === 'month' && a.month === b.month && a.part === b.part
    : b.kind === 'date' && a.date === b.date;
}

const partDay = { early: '10', mid: '20', late: '31' } as const;

// A month sorts as its last day and a part as day 10, 20 or 31, so the sort key stays a plain date string.
const sortKey = (estimate: PreorderShipEstimate) =>
  estimate.kind === 'date' ? estimate.date : `${estimate.month}-${estimate.part ? partDay[estimate.part] : '31'}`;

/** The latest estimate, or null when there is none or any entry is withheld. */
export function latestShipEstimate(estimates: readonly (PreorderShipEstimate | null)[]): PreorderShipEstimate | null {
  let latest: PreorderShipEstimate | null = null;
  for (const estimate of estimates) {
    if (!estimate) return null;
    if (!latest || sortKey(estimate) > sortKey(latest)) latest = estimate;
  }
  return latest;
}
