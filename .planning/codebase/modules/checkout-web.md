# Module Canvas: checkout-web

## Responsibility

Own the shopper-facing checkout browser flow from offer readiness through shipping step, embedded checkout mounting, and
checkout return behavior.

## Owned Files And Directories

- `apps/web/src/components/store/checkout-offer-status-state.ts`
- `apps/web/src/components/store/checkout-return-status-state.ts`
- `apps/web/src/components/store/checkout-shipping-step-state.ts`
- `apps/web/src/components/store/CheckoutOfferStatus.tsx`
- `apps/web/src/components/store/CheckoutOfferStatus.test.ts`
- `apps/web/src/components/store/CheckoutOrderSummary.tsx`
- `apps/web/src/components/store/CheckoutOrderSummary.test.tsx`
- `apps/web/src/components/store/CheckoutReturnStatus.tsx`
- `apps/web/src/components/store/CheckoutReturnStatus.test.tsx`
- `apps/web/src/components/store/CheckoutShippingStep.tsx`
- `apps/web/src/components/store/CheckoutShippingStep.test.tsx`
- `apps/web/src/components/store/StoreItemPurchaseActions.tsx`
- `apps/web/src/components/store/StoreItemPurchaseActions.test.tsx`
- `apps/web/src/components/store/StorePurchaseFlow.test.ts`
- `apps/web/src/pages/store/[slug]/checkout/**`
- `apps/web/src/lib/backend/public-backend-config.ts`
- `apps/web/src/lib/backend/public-checkout-api.ts`
- `apps/web/src/lib/backend/stripe-embedded-checkout.ts`

## Provided Interface

- shopper checkout routes
- browser-safe checkout API adapter
- embedded checkout mounting surface

## Internal Implementation Area

- checkout reset behavior
- shipping-step UI state details
- embedded checkout mount and teardown details

## Allowed Dependencies

- `storefront-catalog`
- `store-cart`
- `public-commerce-http`
- `ui-foundation`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- browser checkout API facade through `apps/web/src/lib/backend/public-checkout-api.ts`

## Published Events

- `CHECKOUT_CART_UPDATED_EVENT`
- `STORE_CART_OPEN_REQUESTED_EVENT`

## Listened-To Events

- `CHECKOUT_CART_UPDATED_EVENT`

## Verification Strategy

- keep checkout-web limited to browser-safe public backend contracts
- reject backend runtime imports and private contract leaks
- preserve Browser Use coverage for checkout, return, and cart handoff flows

## Tests Required Before Refactors

- `apps/web/src/components/store/CheckoutOfferStatus.test.ts`
- `apps/web/src/components/store/CheckoutOrderSummary.test.tsx`
- `apps/web/src/components/store/CheckoutReturnStatus.test.tsx`
- `apps/web/src/components/store/CheckoutShippingStep.test.tsx`
- `apps/web/src/components/store/StoreItemPurchaseActions.test.tsx`
- `apps/web/src/components/store/StorePurchaseFlow.test.ts`

## Migration Status

`closed`
