# Item Setup provider preparation

The existing Stripe catalog gateway now provides `ensureSetupProduct`. It addresses one deterministic Product ID using the same environment/variant naming scheme as the existing bootstrap path. A retry retrieves and validates that Product directly; it never scans account Products or creates another identity. Product metadata records the setup operation and input fingerprint.

Creation requires a recognized matching test/live key mode, explicit live setup confirmation for PRD, valid setup identity, HTTPS image references, and the approved tangible-goods tax code. Uncertain retrieval errors propagate without creating a Product. Existing inactive, foreign-mode, wrong-tax, or conflicting-operation Products require review. A lost creation acknowledgement is recovered through the deterministic identity, independently of an idempotency response cache.

The scoped Price methods now accept an explicitly empty prior default for initial setup. They retain bounded Product-scoped recovery, identity/money/tax validation, and default rereads. Unrecognized Prices on an initial Product cause a conflict before another Price is created; normal replacement behavior still preserves historical Prices.

Local SDK-double tests cover test/live creation recovery, one Product/Price/default after replay, absent live confirmation, key-mode mismatch, changed operation/fingerprint, inactive Product, uncertain retrieval, and unrecognized initial Prices. No hosted provider call occurs. This is provider preparation for task 7.3; CMS linkage, the complete Item Setup application/API, and opening-stock integration remain unfinished.
Final verification: `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation pass. Logs: `.codex-artifacts/emdash-m1/setup-product-{unit,check,build}.log`; the initial focused run is `setup-product-targeted.log`. The full suite includes the subsequent uncertain-read and unrecognized-Price regressions.
