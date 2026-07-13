## 1. Canonical Store Item projection

- [ ] 1.1 Add the typed code-owned `caregivers` → `chronoboros-caregivers-vinyl` → `caregivers-vinyl` relation and validate relation endpoints, uniqueness, source tuples, slugs, variants, and inventory matches in one projection pass.
- [ ] 1.2 Make list/detail/release-commerce consumers use the Distro-owned projection, yielding 81 unique current Store Items and only `variant_caregivers-vinyl_standard` for the shared edition.
- [ ] 1.3 Regenerate Desired Catalog State and Product Projections from the validated owner, preserving the 2000-cent Desired Price and Stripe runtime Price Authority.

## 2. Coherent Store Offers

- [ ] 2.1 Refactor application Store Offers and their constructors into `catalogStatus`-discriminated branches with literal checkout, availability, and price combinations.
- [ ] 2.2 Mirror the union in the public Zod/OpenAPI contract, regenerate the API client, and update browser/fixture consumers to narrow on `catalogStatus`.

## 3. Data migration

- [ ] 3.1 Add an idempotent D1 data migration that assigns the canonical option to the Distro source and retires duplicate readiness rows without deleting provider objects, orders, or historical evidence.
- [ ] 3.2 Verify the migration and regenerated catalog locally, then record the existing environment-scoped dry-run/apply sequence for UAT; do not apply remote mutation without its explicit gate.

## 4. Verification

- [ ] 4.1 Add focused projection, collision, catalog-artifact, Store Offer union, OpenAPI, and migration tests, including `Caregivers` ownership and price cases.
- [ ] 4.2 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, local D1 readiness checks, and catalog verification against the final tree.
