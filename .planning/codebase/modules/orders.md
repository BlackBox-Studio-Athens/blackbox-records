# Module Canvas: orders

## Responsibility

Own checkout-order lifecycle, order reconciliation, order readback, and the operator-facing order read surface used for
low-volume manual review.

## Owned Files And Directories

- `apps/backend/src/application/commerce/orders/**`
- `apps/backend/src/interfaces/http/routes/register-internal-order-routes.ts`
- `apps/backend/src/interfaces/http/routes/internal-order-services.ts`
- `apps/backend/test/application/commerce/orders/**`
- `apps/backend/test/http/internal-order-routes.test.ts`

## Provided Interface

- `apps/backend/src/application/commerce/orders/index.ts`
- internal order readback HTTP surface

## Internal Implementation Area

- order transition details
- paid vs non-paid reconciliation details
- low-volume readback projection details

## Allowed Dependencies

- `stock`
- `commerce-domain`
- `operator-auth`
- `commerce-persistence`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- root API through `application/commerce/orders/index.ts`
- named interface for internal operator order readback routes

## Published Events

- none formal today

## Listened-To Events

- none formal today; order transitions currently react through direct use-case invocation

## Verification Strategy

- preserve idempotent paid transition and non-paid transition tests
- keep internal order routes dependent on order APIs, not internal persistence details

## Tests Required Before Refactors

- `apps/backend/test/application/commerce/orders/order-state.test.ts`
- `apps/backend/test/application/commerce/orders/order-use-cases.test.ts`
- `apps/backend/test/application/commerce/orders/paid-checkout-reconciliation.test.ts`
- `apps/backend/test/application/commerce/orders/non-paid-checkout-reconciliation.test.ts`
- `apps/backend/test/application/commerce/orders/order-readback.test.ts`
- `apps/backend/test/http/internal-order-routes.test.ts`

## Migration Status

`closed`
