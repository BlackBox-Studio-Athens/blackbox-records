# Module Canvas: platform-shared

## Responsibility

Hold only the smallest shared foundation code needed across modules: path or URL helpers, bootstrap helpers, shared API
client factories, and other truly cross-cutting non-business seams.

## Owned Files And Directories

- `apps/web/src/config/site.ts`
- `apps/web/src/utils/urls.ts`
- `apps/web/src/lib/backend/api-client.ts`
- `apps/backend/src/env.ts`
- `apps/backend/src/interfaces/http/app.ts`
- `apps/backend/src/interfaces/http/error-handler.ts`
- `apps/backend/src/interfaces/http/not-found-handler.ts`
- `apps/backend/src/infrastructure/feature-flags/**`
- `apps/backend/src/infrastructure/persistence/prisma/create-prisma-client.ts`
- `packages/api-client/src/index.ts`
- `packages/api-client/src/client-factories.test.ts`

## Provided Interface

- shared API-client root exports
- backend app bootstrap and cross-cutting HTTP plumbing
- base-path and URL helper surfaces

## Internal Implementation Area

- framework bootstrap details
- shared helper implementation details
- environment and feature-flag wiring details

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

`split-pending`

## Exit Criteria

- residual helper code is minimized to true bootstrap or factory concerns only
- any leaked business behavior is moved into the owning module
- the module stays dependency-light and non-authoritative
