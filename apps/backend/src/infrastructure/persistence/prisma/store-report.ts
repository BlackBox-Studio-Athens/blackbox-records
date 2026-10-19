import type { PrismaClient } from '../../../generated/prisma/client';

type Client = Pick<PrismaClient, '$queryRawUnsafe'>;
type Figures = { paidOrders: number; itemsSold: number; paidTotalMinor: number; checkoutsStarted: number };
type Filters = { item?: string | undefined; format?: string | undefined };
const format = `COALESCE(NULLIF((SELECT "itemType" FROM "StoreItemOption" WHERE "variantId" = l."variantId"), ''), NULLIF(l."optionLabel", ''), 'unknown')`;
const day = (column: string) =>
  `CASE WHEN typeof(${column}) IN ('integer', 'real') THEN strftime('%Y-%m-%d', ${column} / 1000, 'unixepoch') ELSE substr(${column}, 1, 10) END`;
const blank = (): Figures => ({ paidOrders: 0, itemsSold: 0, paidTotalMinor: 0, checkoutsStarted: 0 });
const sum = (rows: Figures[]) =>
  rows.reduce(
    (result, row) => ({
      paidOrders: result.paidOrders + row.paidOrders,
      itemsSold: result.itemsSold + row.itemsSold,
      paidTotalMinor: result.paidTotalMinor + row.paidTotalMinor,
      checkoutsStarted: result.checkoutsStarted + row.checkoutsStarted,
    }),
    blank(),
  );

export async function readStoreReportData(prisma: Client, start: Date, end: Date, filters: Filters, details = true) {
  const clauses: string[] = [],
    parameters: string[] = [];
  if (filters.item) {
    clauses.push('l."storeItemSlug" = ?');
    parameters.push(filters.item);
  }
  if (filters.format) {
    clauses.push(`${format} = ?`);
    parameters.push(filters.format);
  }
  const lineFilter = clauses.length ? clauses.join(' AND ') : '1 = 1';
  const orderFilter = clauses.length
    ? `AND EXISTS (SELECT 1 FROM "CheckoutOrderLine" l WHERE l."orderId" = o."id" AND ${lineFilter})`
    : '';
  const money = clauses.length
    ? `(SELECT COALESCE(SUM(l."lineAmountMinor"), 0) FROM "CheckoutOrderLine" l WHERE l."orderId" = o."id" AND ${lineFilter})`
    : 'o."amountTotalMinor"';
  const paid = await prisma.$queryRawUnsafe<Array<Figures & { date: string }>>(
    `SELECT ${day('o."paidAt"')} AS date, COUNT(*) AS "paidOrders",
      COALESCE(SUM((SELECT SUM(l."quantity") FROM "CheckoutOrderLine" l WHERE l."orderId" = o."id" AND ${lineFilter})), 0) AS "itemsSold",
      COALESCE(SUM(${money}), 0) AS "paidTotalMinor", 0 AS "checkoutsStarted"
     FROM "CheckoutOrder" o WHERE o."paidAt" >= ? AND o."paidAt" < ? ${orderFilter} GROUP BY date ORDER BY date`,
    ...parameters,
    ...(clauses.length ? parameters : []),
    start,
    end,
    ...parameters,
  );
  const started = await prisma.$queryRawUnsafe<Array<{ date: string; checkoutsStarted: number }>>(
    `SELECT ${day('o."createdAt"')} AS date, COUNT(*) AS "checkoutsStarted" FROM "CheckoutOrder" o
     WHERE o."createdAt" >= ? AND o."createdAt" < ? AND o."checkoutSessionId" IS NOT NULL ${orderFilter} GROUP BY date ORDER BY date`,
    start,
    end,
    ...parameters,
  );
  const days = new Map<string, Figures & { date: string }>();
  for (const row of paid) days.set(row.date, row);
  for (const row of started) {
    const current = days.get(row.date) ?? { date: row.date, ...blank() };
    current.checkoutsStarted = row.checkoutsStarted;
    days.set(row.date, current);
  }
  const daily = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  const totals = sum(daily);
  const breakdowns: { dimension: 'item' | 'format'; rows: { value: string; label: string; metrics: Figures }[] }[] = [];
  const fields: { key: 'item' | 'format'; label: string; options: { value: string; label: string }[] }[] = [];
  if (details) {
    const options = await prisma.$queryRawUnsafe<Array<{ item: string; label: string; format: string }>>(
      `SELECT l."storeItemSlug" AS item, MAX(COALESCE(l."displayName",l."storeItemSlug")) AS label, ${format} AS format
       FROM "CheckoutOrderLine" l JOIN "CheckoutOrder" o ON o."id" = l."orderId"
       WHERE (o."paidAt" >= ? AND o."paidAt" < ?) OR (o."createdAt" >= ? AND o."createdAt" < ? AND o."checkoutSessionId" IS NOT NULL)
       GROUP BY item, format ORDER BY label LIMIT 500`,
      start,
      end,
      start,
      end,
    );
    fields.push({
      key: 'item',
      label: 'Item / release',
      options: [...new Map(options.map((row) => [row.item, { value: row.item, label: row.label }])).values()],
    });
    fields.push({
      key: 'format',
      label: 'Format',
      options: [...new Set(options.map((row) => row.format))]
        .sort()
        .map((value) => ({ value, label: value === 'unknown' ? 'Unknown format' : value })),
    });
    for (const dimension of ['item', 'format'] as const) {
      const expression = dimension === 'item' ? 'l."storeItemSlug"' : format;
      const label = dimension === 'item' ? 'MAX(COALESCE(l."displayName",l."storeItemSlug"))' : format;
      const rows = await prisma.$queryRawUnsafe<Array<{ value: string; label: string } & Figures>>(
        `SELECT ${expression} AS value, ${label} AS label,
         COUNT(DISTINCT CASE WHEN o."paidAt" >= ? AND o."paidAt" < ? THEN o."id" END) AS "paidOrders",
         COALESCE(SUM(CASE WHEN o."paidAt" >= ? AND o."paidAt" < ? THEN l."quantity" ELSE 0 END),0) AS "itemsSold",
         COALESCE(SUM(CASE WHEN o."paidAt" >= ? AND o."paidAt" < ? THEN l."lineAmountMinor" ELSE 0 END),0) AS "paidTotalMinor",
         COUNT(DISTINCT CASE WHEN o."createdAt" >= ? AND o."createdAt" < ? AND o."checkoutSessionId" IS NOT NULL THEN o."id" END) AS "checkoutsStarted"
         FROM "CheckoutOrder" o JOIN "CheckoutOrderLine" l ON l."orderId" = o."id"
         WHERE ((o."paidAt" >= ? AND o."paidAt" < ?) OR (o."createdAt" >= ? AND o."createdAt" < ? AND o."checkoutSessionId" IS NOT NULL)) AND ${lineFilter}
         GROUP BY value ORDER BY "paidTotalMinor" DESC, value LIMIT 100`,
        start,
        end,
        start,
        end,
        start,
        end,
        start,
        end,
        start,
        end,
        start,
        end,
        ...parameters,
      );
      breakdowns.push({ dimension, rows: rows.map(({ value, label, ...metrics }) => ({ value, label, metrics })) });
    }
  }
  return {
    totals,
    daily: daily.map(({ date, ...metrics }) => ({ date, available: true, metrics })),
    fields,
    breakdowns,
  };
}
