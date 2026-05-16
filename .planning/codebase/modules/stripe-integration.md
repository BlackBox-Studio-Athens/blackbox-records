# Module Canvas: stripe-integration

## Responsibility

Own backend Stripe SDK integration for Checkout Session creation, Checkout Session reads, and webhook signature
verification.

## Owned Files And Directories

- `apps/backend/src/infrastructure/stripe/**`

## Provided Interface

- `apps/backend/src/infrastructure/stripe/index.ts`

## Internal Implementation Area

- Stripe SDK client creation and local API override handling
- Stripe Checkout Session mapping
- Stripe webhook event allowlisting and signature verification

## Allowed Dependencies

- `checkout-core`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- `apps/backend/src/infrastructure/stripe/index.ts`

## Published Events

- none

## Listened-To Events

- none

## Verification Strategy

- keep Stripe SDK details out of route handlers and checkout use cases
- preserve existing checkout creation, checkout readback, and webhook verification behavior
- keep Stripe secrets inside Worker runtime bindings only

## Tests Required Before Refactors

- `apps/backend/test/application/commerce/checkout/checkout-use-cases.test.ts`
- `apps/backend/test/http/public-commerce-routes.test.ts`
- `apps/backend/test/http/stripe-webhook-routes.test.ts`
- architecture manifest tests for ownership and dependency rules

## Migration Status

`closed`
