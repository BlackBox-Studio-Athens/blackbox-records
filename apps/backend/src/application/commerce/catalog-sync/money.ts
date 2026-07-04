import type { StoreOfferPrice, StripeCatalogPrice } from './types';

const STORE_OFFER_PRICE_LOCALE = 'en-US';

export function createStoreOfferPrice(
  input:
    | { amountMinor: number; currencyCode: string; kind: 'fixed' }
    | {
        currencyCode: string;
        kind: 'pay_what_you_want';
        maximumAmountMinor: number;
        minimumAmountMinor: number;
        presetAmountMinor: number;
      },
): StoreOfferPrice {
  if (input.kind === 'pay_what_you_want') {
    return {
      currencyCode: input.currencyCode.toUpperCase(),
      display: 'Pay what you want',
      kind: input.kind,
      maximumAmountMinor: input.maximumAmountMinor,
      minimumAmountMinor: input.minimumAmountMinor,
      presetAmountMinor: input.presetAmountMinor,
    };
  }

  return {
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode.toUpperCase(),
    display: new Intl.NumberFormat(STORE_OFFER_PRICE_LOCALE, {
      currency: input.currencyCode.toUpperCase(),
      style: 'currency',
    }).format(input.amountMinor / 100),
    kind: input.kind,
  };
}

export function createStoreOfferPriceFromCatalogPrice(price: StripeCatalogPrice): StoreOfferPrice | null {
  if (!price.currencyCode) {
    return null;
  }

  if (price.priceKind === 'pay_what_you_want') {
    if (
      price.customUnitAmount?.minimumAmountMinor === null ||
      price.customUnitAmount?.minimumAmountMinor === undefined ||
      price.customUnitAmount?.presetAmountMinor === null ||
      price.customUnitAmount?.presetAmountMinor === undefined ||
      price.customUnitAmount?.maximumAmountMinor === null ||
      price.customUnitAmount?.maximumAmountMinor === undefined
    ) {
      return null;
    }

    return createStoreOfferPrice({
      currencyCode: price.currencyCode,
      kind: 'pay_what_you_want',
      maximumAmountMinor: price.customUnitAmount.maximumAmountMinor,
      minimumAmountMinor: price.customUnitAmount.minimumAmountMinor,
      presetAmountMinor: price.customUnitAmount.presetAmountMinor,
    });
  }

  if (price.amountMinor === null) {
    return null;
  }

  return createStoreOfferPrice({
    amountMinor: price.amountMinor,
    currencyCode: price.currencyCode,
    kind: 'fixed',
  });
}
