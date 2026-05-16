# 12-58 Summary: Commerce Domain Boundary Extraction

## Outcome

Completed the `platform-shared` shrinkage slice for backend commerce domain contracts.

Backend commerce identity aliases and repository port contracts now belong to a closed `commerce-domain` module instead
of `platform-shared`. Checkout, orders, and stock modules depend on that provided domain SPI explicitly, while
`platform-shared` keeps only bootstrap/foundation concerns. No runtime code paths, persistence behavior, checkout
contracts, generated API output, D1, Stripe, BOX NOW, or shopper-visible UI changed.

## Changes

- Added the `commerce-domain` module canvas.
- Added `commerce-domain` to `.planning/codebase/MODULES.md` and `.planning/codebase/module-boundaries.manifest.json`.
- Moved `apps/backend/src/domain/commerce/ids.ts` and `apps/backend/src/domain/commerce/repositories/**` out of the
  `platform-shared` manifest entry.
- Updated checkout, orders, and stock module dependencies to consume `commerce-domain` explicitly.
- Updated affected module canvases so repository SPI ownership matches the manifest.
- Hardened `scripts/module-boundaries-manifest.cjs` so `platform-shared` cannot own backend commerce domain paths.
- Added an architecture test for the new validator rule.

## Verification

- `pnpm --filter @blackbox/backend exec vitest run test/architecture/module-boundaries-manifest.test.ts`
- `pnpm audit:module-boundaries`
- `pnpm depcruise:boundaries`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
