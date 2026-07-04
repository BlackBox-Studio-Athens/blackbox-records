## Why

The distro catalog currently has multiple sources of truth: Astro content, generated catalog artifacts, Stripe test objects, and an operator-maintained inventory table can drift from each other. The full pasted distro table needs to become the explicit planning source for future catalog implementation, while preserving current site items that are intentionally stocked but absent from that table.

This change is OpenSpec-only. It defines the inventory, pricing, artwork, checkout, and rollout contracts before any content, catalog code, Stripe, D1, or artwork mutation happens.

## What Changes

- Define the pasted full distro table as the primary Distro Inventory Source for later implementation.
- Retain current site/catalog extras not present in the table: `S/T - Spinners` and `Three Way Plane - Wreckquiem`.
- Define catalog pricing policy:
  - numeric table prices become fixed EUR prices
  - `ΕΣ` means Stripe pay-what-you-want
  - blank prices default by item type: Vinyl 12-inch `20 EUR`, Vinyl 10-inch `20 EUR`, Vinyl 7-inch `15 EUR`, Tape `5 EUR`, CD `10 EUR`
- Define duplicate handling: ignore the duplicate `Living Under Drones - Knot On Knot?` row and keep one `Living Under Drones - Knot On Knot` item.
- Define `Calf - —` as a real Vinyl 10-inch distro item, replacing the current excluded placeholder intent.
- Define later implementation requirements for fixed and custom Stripe Price shapes, including Stripe `custom_unit_amount` for pay-what-you-want rows.
- Define artwork sourcing through `tools/artwork-fetcher`, with fallback assets allowed only when a source is known missing.
- Define UAT-first rollout, manual/fresh Stripe cleanup expectations, and PRD constraints.
- No implementation is part of this OpenSpec change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `project-language`: add canonical terminology for Distro Inventory Source, `ΕΣ`, pay-what-you-want price, and current-site extras.
- `stripe-catalog-sync`: specify fixed/custom desired price shapes, Distro Inventory Source reconciliation, verify/apply behavior, and Stripe cleanup limits.
- `commerce-checkout`: specify hosted Checkout behavior for custom-amount Stripe Prices.
- `tooling-validation`: specify validation expectations for the later implementation, including OpenSpec gates, catalog artifacts, repository gates, artwork-fetcher checks, UAT proof, and PRD readiness.
- `site-images`: specify artwork-fetcher-backed distro asset sourcing and fallback policy.

## Impact

- Future implementation will affect distro content, generated catalog artifacts, public Store Offer price contracts, Stripe catalog reconciliation, checkout price display, D1 Store Offer snapshots, and UAT/PRD provider rollout.
- Later implementation MUST NOT put commerce authority into Decap-authored distro JSON.
- Later provider work MAY require manual Stripe Dashboard cleanup or fresh Stripe environments. Existing Stripe Price history cannot be guaranteed empty by repo automation alone.
- This planning slice only creates OpenSpec artifacts under `openspec/changes/full-distro-catalog-source-of-truth/`.
