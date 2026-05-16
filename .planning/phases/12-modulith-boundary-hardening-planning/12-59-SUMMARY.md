# 12-59 Summary: UI Foundation Boundary Extraction

## Outcome

Completed the frontend UI foundation shrinkage slice for `platform-shared`.

Shared shadcn/Radix-style primitives and the `cn` helper now belong to a closed `ui-foundation` module instead of
`platform-shared`. Frontend modules that consume those primitives now depend on `ui-foundation` explicitly. No component
APIs, styling, DOM behavior, route behavior, checkout behavior, StoreCart behavior, generated API output, or backend
runtime behavior changed.

## Changes

- Added the `ui-foundation` module canvas.
- Added `ui-foundation` to `.planning/codebase/MODULES.md` and `.planning/codebase/module-boundaries.manifest.json`.
- Removed `apps/web/src/components/ui/**` and `apps/web/src/lib/utils.ts` from the `platform-shared` manifest entry.
- Updated app-shell, player, storefront-catalog, store-cart, checkout-web, and operator-stock dependencies to consume
  `ui-foundation` explicitly.
- Hardened `scripts/module-boundaries-manifest.cjs` so `platform-shared` cannot own frontend UI foundation paths.
- Added architecture test coverage for the new validator rule.

## Verification

- `pnpm --filter @blackbox/backend exec vitest run test/architecture/module-boundaries-manifest.test.ts`
- `pnpm audit:module-boundaries`
- `pnpm depcruise:boundaries`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
