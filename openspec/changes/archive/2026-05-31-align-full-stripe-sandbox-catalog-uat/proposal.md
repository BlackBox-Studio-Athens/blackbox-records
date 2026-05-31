## Why

GitHub Pages UAT currently proves hosted Stripe checkout with a narrow sandbox catalog, while most Astro Store Items remain unavailable to buy. That blocks realistic UAT because the storefront, Worker, D1, and Stripe sandbox catalog are not aligned for the full visible catalog.

## What Changes

- Make every current Astro Store Item except excluded placeholder content checkout-eligible in sandbox UAT.
- Derive backend Product Projection entries deterministically from Astro content so the Worker catalog manifest cannot drift from storefront items.
- Seed sandbox D1 checkout readiness for every current Store Item with `StoreItemOption`, `ItemAvailability`, and `Stock`.
- Add sandbox-only Stripe catalog reset tooling that reports and deactivates old repo-owned sandbox Products and Prices before catalog apply recreates fresh active objects.
- Keep Catalog Field Ownership intact: Astro/repo owns Product Projection fields, Stripe owns Price Authority, and Worker/D1 owns checkout readiness and Store Offer snapshots.
- Update UAT docs with price defaults, stock defaults, reset/apply sequence, GitHub Pages smoke commands, and no-secret evidence rules.

## Capabilities

### New Capabilities

- `stripe-sandbox-catalog-uat`: Defines full-catalog sandbox UAT alignment, sandbox price defaults, stock defaults, and sandbox reset safety.

### Modified Capabilities

- `commerce-checkout`: Static store pages may show all current Store Items as available with Worker-confirmed checkout while continuing to omit Stripe Price IDs, D1 IDs, secrets, and authoritative prices.
- `tooling-validation`: Adds deterministic generated catalog artifact checks and the full sandbox reset/seed/apply/smoke proof sequence.

## Impact

- `scripts/stripe-catalog-contract.ts`
- `scripts/generate-stripe-uat-catalog-artifacts.ts`
- `scripts/stripe-catalog-reset-sandbox.ts`
- `apps/backend/src/application/commerce/catalog-sync/catalog-product-projections.ts`
- `apps/backend/prisma/seeds/sandbox-uat-commerce-state.sql`
- `apps/backend/package.json`
- `apps/web/src/lib/item-availability.ts`
- `package.json`
- `docs/stripe-sandbox-uat.md`
- Backend and web unit tests
