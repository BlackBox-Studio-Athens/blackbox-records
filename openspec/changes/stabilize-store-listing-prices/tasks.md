## 1. Implemented Price Contract

- [x] 1.1 Make valid listing snapshots state-based, preserve pay-what-you-want presentation, and retain fail-closed malformed/inactive behavior; verified by reader and reconciler tests.
- [x] 1.2 Remove scheduled full-catalog verification and Cron, add one-item verification/apply, and verify no unrelated variant is inspected or mutated.
- [x] 1.3 Make Desired Price bootstrap-only, keep UAT reset separate, and verify the deterministic two-item regression preserves the existing item's Price identity and amount.
- [x] 1.4 Gate catalog-affecting static deployment on one ready hosted record per canonical Store Item; verify independent push deployment cannot race it.
- [x] 1.5 Pass repository gates and UAT readiness/browser evidence: 81 canonical items, 81 ready listings, seven pay-what-you-want records, zero false Price unavailable cards, and zero catalog Cron triggers.

## 2. Remaining UAT Proof

- [ ] 2.1 Replace one explicitly chosen UAT Price in Stripe Dashboard and verify the signed event updates only the target variant's D1 mapping and listing snapshot while every unrelated mapping/snapshot remains byte-for-byte or value-for-value unchanged.
- [ ] 2.2 Record redacted evidence, rerun pnpm openspec -- validate stabilize-store-listing-prices --strict, and archive the change. Do not repeat live new-item promotion proof; the deterministic two-item regression owns that invariant.
