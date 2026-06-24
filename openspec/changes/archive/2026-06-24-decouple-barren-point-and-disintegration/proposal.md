## Why

`barren-point` currently carries two unrelated meanings in commerce paths: it is a legacy source identity for the Disintegration release checkout path, while Barren Point is also a distro item. This makes generated Stripe, D1, smoke, and static storefront state ambiguous.

## What Changes

- Rename the Disintegration release content ID from `barren-point` to `disintegration`.
- Rename the Barren Point distro content ID from `mass-culture-lp` to `barren-point`.
- Derive release Store Item slugs, variant IDs, and option labels generically from release title and first physical sellable format.
- Remove the `/store/barren-point/` and `/store/barren-point/checkout/` compatibility redirects to Disintegration.
- Regenerate Product Projection and sandbox UAT D1 seed artifacts from the renamed Astro content identities.
- Clean sandbox UAT seed state for stale `mass-culture-lp` and `variant_mass-culture-lp_standard` rows.

## Capabilities

### Modified Capabilities

- `commerce-checkout`: Store Item identities for Disintegration and Barren Point are separate and derived from their own content sources.
- `tooling-validation`: Generated catalog artifacts, local mock seeds, sandbox reset/apply, and smoke fixtures must use the decoupled identities.

## Impact

- `apps/web/src/content/releases/*.md`
- `apps/web/src/content/distro/*.json`
- `apps/web/src/lib/catalog-data.ts`
- `apps/web/src/lib/item-availability.ts`
- `scripts/stripe-catalog-contract.ts`
- `scripts/generate-stripe-uat-catalog-artifacts.ts`
- `apps/backend/scripts/seed-local-mock-commerce-state.ts`
- Generated catalog projection and sandbox UAT seed artifacts
- Store redirect pages, docs, OpenSpec wording, and tests
