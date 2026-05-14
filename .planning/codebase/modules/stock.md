# Module Canvas: stock

## Responsibility

Own stock read and mutation use cases, stock search/history logic, and the stock repository contract behind those use
cases.

## Owned Files And Directories

- `apps/backend/src/application/commerce/stock/**`
- `apps/backend/src/domain/commerce/repositories/stock-repository.ts`
- `apps/backend/src/domain/commerce/repositories/stock-change-repository.ts`
- `apps/backend/src/domain/commerce/repositories/stock-count-repository.ts`
- `apps/backend/test/application/commerce/stock/**`

## Provided Interface

- `apps/backend/src/application/commerce/stock/index.ts`

## Internal Implementation Area

- stock search internals
- stock history formatting
- stock change and stock count mutation details

## Allowed Dependencies

- `platform-shared`

## Named Interfaces / SPI Surfaces

- root API through `application/commerce/stock/index.ts`
- SPI surfaces through stock repository interfaces

## Published Events

- none formal today

## Listened-To Events

- none formal today; stock changes currently occur through direct use-case invocation and webhook-owned order flows

## Verification Strategy

- preserve stock use-case tests
- keep stock logic free of UI and route-layer concerns
- preserve persistence repository contract tests

## Tests Required Before Refactors

- `apps/backend/test/application/commerce/stock/stock-use-cases.test.ts`
- `apps/backend/test/persistence/prisma/repositories.test.ts`

## Migration Status

`closed`
