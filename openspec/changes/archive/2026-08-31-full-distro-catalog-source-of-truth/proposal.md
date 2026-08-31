## Why

The distro catalog once drifted between an operator table, Astro content, generated artifacts, and provider state. The implemented solution makes one validated repository manifest authoritative and treats every other surface as a projection.

## What Changes

- Make scripts/data/distro-inventory-source.json the sole Distro Inventory Source.
- Keep one canonical manifest row per current item, source aliases for matching, and rejected duplicate rows outside emitted inventory.
- Keep currentSiteExtra as provenance for the two approved historical additions, not as another source or precedence layer.
- Encode numeric, ΕΣ pay-what-you-want, and blank-by-format EUR pricing in the manifest.
- Preserve the real Calf Vinyl 10-inch item, the rejected Knot On Knot? duplicate, Spinners, and Wreckquiem decisions in the manifest.
- Reconcile Astro distro content, generated catalog artifacts, Stripe price shape, checkout display, and artwork from that manifest.
- Keep Decap distro content editorial-only.
- Preserve UAT implementation/proof and leave live PRD provider mutation to production-go-live-readiness.
- Delete the duplicated row table from OpenSpec planning.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- stripe-catalog-sync: The validated distro manifest projects one canonical catalog and fixed/custom desired price shapes.
- commerce-checkout: Hosted Checkout supports provider-owned pay-what-you-want Prices safely.
- site-images: Distro artwork uses approved repository/tool evidence and explicit known-missing fallback.
- tooling-validation: Manifest, projection, artwork, repository, and UAT parity are verified.

## Impact

- The manifest, distro content projection, artifact generation, price model, Store Offer/cart display, Stripe mapping, artwork evidence, tests, and UAT promotion are implemented.
- No CMS commerce fields, second inventory list, PRD reset, or pending PRD promotion task.
