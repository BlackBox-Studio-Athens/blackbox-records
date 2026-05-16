# Module Canvas: platform-shared

## Responsibility

Hold only the smallest shared foundation code needed across modules: path or URL helpers, bootstrap helpers, shared API
client factories, and other truly cross-cutting non-business seams.

## Owned Files And Directories

- `apps/web/src/config/site.ts`
- `apps/web/src/utils/urls.ts`
- `apps/web/src/lib/backend/api-client.ts`
- `apps/web/src/lib/backend/public-backend-config.ts`
- `apps/backend/src/env.ts`
- `apps/backend/src/interfaces/http/error-handler.ts`
- `apps/backend/src/interfaces/http/not-found-handler.ts`

## Provided Interface

- backend app bootstrap and cross-cutting HTTP plumbing
- base-path and URL helper surfaces
- public backend API client configuration

## Internal Implementation Area

- framework bootstrap details
- shared helper implementation details
- environment wiring details

## Allowed Dependencies

- no business-module dependencies

## Named Interfaces / SPI Surfaces

- `packages/api-client/src/index.ts`

## Published Events

- none

## Listened-To Events

- none

## Verification Strategy

- keep this module free of business rules and domain-specific orchestration
- keep this module strict bootstrap-only even when generated or shared artifacts need an owner
- reject back-references from `platform-shared` into business modules
- reject new convenience helpers that really belong to a business module
- shrink it over time instead of letting it become the permanent escape hatch

## Tests Required Before Refactors

- `packages/api-client/src/client-factories.test.ts`
- shared helper tests when new shared code is introduced

## Migration Status

`closed`

## Exit Criteria

- residual helper code is minimized to true bootstrap or factory concerns only
- any leaked business behavior is moved into the owning module
- backend commerce IDs and repository contracts stay in `commerce-domain`
- frontend UI primitives and `cn` stay in `ui-foundation`
- operator identity parsing stays in `operator-auth`
- Prisma-backed repository adapters stay in `commerce-persistence`
- Stripe SDK integration stays in `stripe-integration`
- the module stays dependency-light and non-authoritative
