# Module Canvas: operator-auth

## Responsibility

Own protected-operator identity extraction from Cloudflare Access request headers for backend internal routes.

## Owned Files And Directories

- `apps/backend/src/interfaces/http/auth/**`

## Provided Interface

- `apps/backend/src/interfaces/http/auth/index.ts`

## Internal Implementation Area

- Access-authenticated email header constant
- header parsing and normalization details

## Allowed Dependencies

- no business-module dependencies

## Named Interfaces / SPI Surfaces

- none

## Published Events

- none

## Listened-To Events

- none

## Verification Strategy

- preserve Access header parsing tests
- keep operator identity parsing independent from stock and order route orchestration
- reject ownership drift back into `platform-shared`

## Tests Required Before Refactors

- `apps/backend/test/http/operator-identity.test.ts`
- module-boundary manifest architecture tests

## Migration Status

`closed`
