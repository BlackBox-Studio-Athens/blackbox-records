# Module Canvas: commerce-persistence

## Responsibility

Own backend Prisma/D1 adapter construction and Prisma-backed implementations of commerce repository ports.

## Owned Files And Directories

- `apps/backend/src/infrastructure/persistence/prisma/**`

## Provided Interface

- `apps/backend/src/infrastructure/persistence/prisma/index.ts`

## Internal Implementation Area

- Prisma client adapter construction
- Prisma row-to-domain mapping
- D1-compatible repository implementation details

## Allowed Dependencies

- `commerce-domain`
- `platform-shared`

## Named Interfaces / SPI Surfaces

- none; this module implements the `commerce-domain` repository SPI and exposes its Prisma construction through its root
  provided interface

## Published Events

- none

## Listened-To Events

- none

## Verification Strategy

- keep persistence details behind commerce repository ports
- keep application modules dependent on repository interfaces, not Prisma internals
- keep Worker runtime bindings limited to the Prisma client factory seam

## Tests Required Before Refactors

- repository behavior is covered through checkout, order, stock, and HTTP route tests
- architecture manifest tests for ownership and dependency rules

## Migration Status

`closed`
