## 1. Completed Source Consolidation

- [x] 1.1 Create and validate scripts/data/distro-inventory-source.json as the sole inventory source with 101 emitted rows, two approved provenance extras, aliases, and one rejected duplicate.
- [x] 1.2 Reconcile Astro distro content, the Calf item, duplicate handling, aliases, membership, and ordering from the manifest; verify no unapproved content reaches current catalog or checkout projection.
- [x] 1.3 Reconcile artwork through existing repo assets and tools/artwork-fetcher, allowing fallback only for known-missing evidence.

## 2. Completed Pricing and Checkout

- [x] 2.1 Implement the closed fixed/pay-what-you-want generated price shape and validate numeric, ΕΣ, blank defaults, and EUR-only policy.
- [x] 2.2 Generate catalog/D1 artifacts from the manifest, map Stripe custom_unit_amount, and keep Store Offer/cart output browser-safe.
- [x] 2.3 Keep Checkout Price-ID based and verify paid amount authority comes from Stripe reconciliation, not display/cart state.

## 3. Evidence and Closeout

- [x] 3.1 Pass artwork tests, artifact checks, pnpm test:unit, pnpm check, pnpm build, and strict OpenSpec validation.
- [x] 3.2 UAT catalog promotion run 28713586951 applied/verified the manifest; static run 28714799447 and provider smoke run 28714881460 proved fixed-price and pay-what-you-want paid paths with redacted evidence.
- [x] 3.3 Keep PRD provider mutation in production-go-live-readiness, sync these completed deltas, and archive this change.
