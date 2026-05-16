# Module Canvas: ui-foundation

## Responsibility

Own reusable frontend UI primitives and the class-name composition helper shared by Astro pages and React islands.
This module is a design-system foundation surface, not a storefront, checkout, cart, stock, app-shell, or CMS module.

## Owned Files And Directories

- `apps/web/src/components/ui/**`
- `apps/web/src/lib/utils.ts`

## Provided Interface

- shadcn/Radix-style primitives in `apps/web/src/components/ui/`
- `apps/web/src/lib/utils.ts`

## Internal Implementation Area

- primitive component variants
- shared class-name composition details

## Allowed Dependencies

- no business-module dependencies

## Named Interfaces / SPI Surfaces

- none

## Published Events

- none

## Listened-To Events

- none

## Verification Strategy

- keep primitives free of commerce, routing, shell, CMS, stock, and checkout policy
- keep component APIs stable for consuming modules
- reject ownership drift back into `platform-shared`

## Tests Required Before Refactors

- consumer module tests for UI behavior that depends on these primitives
- module-boundary manifest architecture tests

## Migration Status

`closed`
