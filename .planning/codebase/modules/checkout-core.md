# Module Canvas: checkout-core

## Responsibility

Own checkout use cases, checkout validation, shipping-locker validation, checkout session reconciliation, and the
backend read model used to derive checkout-ready store offers.

## Owned Files And Directories

- `apps/backend/src/application/commerce/checkout/**`
- `apps/backend/src/application/commerce/readers/store-offer-reader.ts`
- `apps/backend/src/domain/commerce/repositories/item-availability-repository.ts`
- `apps/backend/src/domain/commerce/repositories/store-item-option-repository.ts`
- `apps/backend/src/domain/commerce/repositories/variant-stripe-mapping-repository.ts`
- `apps/backend/test/application/commerce/checkout/**`
- `apps/backend/test/application/commerce/readers/store-offer-reader.test.ts`

## Provided Interface

- `apps/backend/src/application/commerce/checkout/index.ts`

## Internal Implementation Area

- checkout reconciliation internals
- feature-gate evaluation details
- shipping locker normalization and validation details
- offer projection internals

## Allowed Dependencies

- `orders`
- `stock`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- root API through `application/commerce/checkout/index.ts`
- SPI surfaces through repository interfaces in `domain/commerce/repositories/`

## Published Events

- none formal today

## Listened-To Events

- none formal today

## Verification Strategy

- preserve application-level tests for checkout use cases and reconciliation
- keep route layers dependent on exported checkout APIs, not internal helper files
- prevent Stripe or persistence implementation details from leaking through the provided interface

## Tests Required Before Refactors

- `apps/backend/test/application/commerce/checkout/checkout-use-cases.test.ts`
- `apps/backend/test/application/commerce/checkout/checkout-reconciliation.test.ts`
- `apps/backend/test/application/commerce/readers/store-offer-reader.test.ts`

## Migration Status

`closed`
