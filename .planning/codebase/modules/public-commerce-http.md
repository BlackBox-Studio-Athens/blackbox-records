# Module Canvas: public-commerce-http

## Responsibility

Own the public Worker HTTP surface for store and checkout APIs, plus the public contract and generated public client
ownership tied to that surface.

## Owned Files And Directories

- `apps/backend/src/interfaces/http/routes/register-public-routes.ts`
- `apps/backend/src/interfaces/http/routes/register-public-commerce-routes.ts`
- `apps/backend/src/interfaces/http/routes/public-checkout-return-url.ts`
- `apps/backend/src/interfaces/http/routes/public-commerce-services.ts`
- `apps/backend/src/interfaces/http/contracts/public-contracts.ts`
- `apps/backend/src/interfaces/http/openapi/api-documents.ts`
- `apps/backend/test/http/public-commerce-routes.test.ts`
- `apps/backend/test/http/public-checkout-return-url.test.ts`
- `packages/api-client/src/public-client.ts`
- `packages/api-client/src/generated/public/schema.ts`

## Provided Interface

- `/api/store/*`
- `/api/checkout/*`
- public OpenAPI document and generated public client

## Internal Implementation Area

- route registration details
- handler wiring and error mapping
- checkout return-origin policy
- current service-composition details

## Allowed Dependencies

- `checkout-core`
- `orders`
- `stock`
- `commerce-persistence`
- `stripe-integration`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- `apps/backend/src/interfaces/http/contracts/public-contracts.ts`
- `packages/api-client/src/public-client.ts`

## Published Events

- none formal today

## Listened-To Events

- none formal today

## Verification Strategy

- keep public HTTP routes browser-safe and free of internal/operator-only leakage
- preserve route behavior with characterization tests before moving composition logic
- require callers to use the public contracts or public client entrypoints instead of route-internal files
- keep the commerce-boundary audit in the default verification loop

## Tests Required Before Refactors

- `apps/backend/test/http/public-commerce-routes.test.ts`
- `apps/backend/test/openapi/api-documents.test.ts`
- `packages/api-client/src/client-factories.test.ts`
- `pnpm audit:commerce-boundaries`
- future boundary or route tests that move with the module should relocate closer to this surface during hardening work

## Migration Status

`closed`
