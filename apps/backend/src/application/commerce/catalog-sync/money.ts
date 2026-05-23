import type { StoreOfferPrice } from './types';

const STORE_OFFER_PRICE_LOCALE = 'en-US';

export function createStoreOfferPrice(input: { amountMinor: number; currencyCode: string }): StoreOfferPrice {
  return {
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode.toUpperCase(),
    display: new Intl.NumberFormat(STORE_OFFER_PRICE_LOCALE, {
      currency: input.currencyCode.toUpperCase(),
      style: 'currency',
    }).format(input.amountMinor / 100),
  };
}
