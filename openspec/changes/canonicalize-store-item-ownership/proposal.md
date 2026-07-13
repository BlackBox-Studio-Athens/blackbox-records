## Why

Release and Distro records can independently project the same physical edition into Store Items. `Caregivers` currently demonstrates the resulting duplicate sellable identity, availability, stock, and provider-catalog risk.

## What Changes

- Represent one explicit Release-to-Distro relationship for a shared physical edition and select exactly one canonical Store Item owner.
- Make the Distro record the canonical owner of `caregivers-vinyl` and `variant_caregivers-vinyl_standard`; the Release links to that Store Item instead of projecting another one.
- Reject invalid relation endpoints, duplicate source identities, Store Item slugs, variant IDs, and unresolved cross-source physical duplicates before artifact generation.
- Keep Store Offer states coherent: only `ready` can be checkout-enabled with a price; `sold_out` and `catalog_drift` remain disabled and price-free.
- Migrate current catalog/readiness data without deleting historical provider or order records.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commerce-checkout`: Tightens native Store Item projection and browser-safe Store Offer state around one canonical physical-edition owner.
- `stripe-catalog-sync`: Requires unique, resolved app identity before provider artifacts and mappings are generated.

## Impact

- Code-owned Release-to-Distro ownership data and Store Item projection helpers.
- Desired catalog, availability, and stock artifact generation.
- Worker Store Offer types and resolution.
- UAT catalog/readiness migration and focused contract tests.
