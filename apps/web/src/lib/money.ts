import { z } from 'zod';

const moneySchema = z
  .object({
    amountMinor: z.number().int().min(0),
    currencyCode: z
      .string()
      .trim()
      .length(3)
      .transform((value) => value.toUpperCase()),
  })
  .brand<'Money'>();

export type Money = z.infer<typeof moneySchema>;

export function createMoney(input: { amountMinor: unknown; currencyCode: unknown }): Money {
  return moneySchema.parse(input);
}

export function moneyToMinorAmount(money: Money): number {
  return money.amountMinor;
}

export function moneyToCurrencyCode(money: Money): string {
  return money.currencyCode;
}

export function formatMoney(money: Money, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    currency: money.currencyCode,
    currencyDisplay: 'narrowSymbol',
    style: 'currency',
  }).format(money.amountMinor / 100);
}
