# Module Canvas: commerce-domain

## Responsibility

Own backend commerce identity aliases and repository port contracts shared by checkout, order, stock, public HTTP, and
persistence adapters. This module is the backend commerce domain contract surface, not a shared utility bucket.

## Owned Files And Directories

- `apps/backend/src/domain/commerce/ids.ts`
- `apps/backend/src/domain/commerce/index.ts`
- `apps/backend/src/domain/commerce/repositories/**`

## Provided Interface

- `apps/backend/src/domain/commerce/index.ts`

## Internal Implementation Area

- individual repository contract files
- canonical backend commerce identity aliases

## Allowed Dependencies

- no business-module dependencies

## Named Interfaces / SPI Surfaces

- repository SPI through `apps/backend/src/domain/commerce/repositories/spi.ts`

## Published Events

- none

## Listened-To Events

- none

## Verification Strategy

- keep repository contracts free of persistence implementation details
- keep canonical commerce IDs independent from Stripe raw IDs or D1 implementation details
- keep identity aliases on the root provided interface and repository contracts on the SPI named interface
- reject ownership drift back into `platform-shared`

## Tests Required Before Refactors

- `apps/backend/test/architecture/module-boundaries-manifest.test.ts`
- application and persistence tests for consumers of the repository contracts

## Migration Status

`closed`
