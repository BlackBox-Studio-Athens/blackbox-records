# Module Canvas: operator-stock

## Responsibility

Own the protected operator stock UI, the internal stock HTTP surface behind it, and the internal generated client used
to talk to that protected surface.

## Owned Files And Directories

- `apps/web/src/pages/stock/index.astro`
- `apps/web/src/components/stock/StockOperationsApp.tsx`
- `apps/web/src/lib/backend/internal-stock-api.ts`
- `apps/web/src/lib/backend/internal-stock-api.test.ts`
- `apps/backend/src/interfaces/http/auth/operator-identity.ts`
- `apps/backend/src/interfaces/http/contracts/internal-contracts.ts`
- `apps/backend/src/interfaces/http/routes/register-internal-stock-routes.ts`
- `apps/backend/src/interfaces/http/routes/internal-stock-services.ts`
- `apps/backend/test/http/internal-stock-routes.test.ts`
- `apps/backend/test/http/internal-stock-ui-boundary.test.ts`
- `apps/backend/test/http/operator-identity.test.ts`
- `packages/api-client/src/internal-client.ts`
- `packages/api-client/src/generated/internal/schema.ts`

## Provided Interface

- `/stock/`
- internal stock HTTP routes under `/api/internal/*`
- internal generated client surface

## Internal Implementation Area

- Access identity parsing details
- internal stock UI state orchestration
- internal stock route wiring details

## Allowed Dependencies

- `stock`
- `orders`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- internal contract surface through `contracts/internal-contracts.ts`
- internal generated client through `packages/api-client/src/internal-client.ts`

## Published Events

- none formal today

## Listened-To Events

- none formal today

## Verification Strategy

- preserve Access-boundary and operator-identity tests
- keep internal routes and generated internal client separate from public browser surfaces
- preserve protected stock UI boundary tests

## Tests Required Before Refactors

- `apps/backend/test/http/internal-stock-routes.test.ts`
- `apps/backend/test/http/internal-stock-ui-boundary.test.ts`
- `apps/backend/test/http/operator-identity.test.ts`
- `apps/web/src/lib/backend/internal-stock-api.test.ts`

## Migration Status

`closed`
