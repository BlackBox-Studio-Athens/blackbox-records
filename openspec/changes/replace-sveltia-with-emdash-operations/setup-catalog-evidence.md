# Item Setup runtime identity preparation

`D1CatalogOperationRepository.linkSetupCatalog` advances a claimed source-linked setup and inserts its Store Item/variant identity in one native D1 batch. It requires the recorded CMS source, the expected new-item revision, and a current claim. The row starts withheld at revision zero, without a buyable availability record. Runtime projection and readiness still belong to subsequent setup work.

Existing variant, slug, source identity, CMS linkage, provider mapping, stock, or availability prevents insertion. No existing record is overwritten. A successful retry reads the retained journal step; submitting the stale step cannot insert another row. Database failure rolls back both progress and insertion.

Isolated Local D1 tests cover Release and Distro setup, stale and expired claims, existing provider mapping, rollback on a failing insert, concurrent duplicate submissions, retained state after replay, and another operation attempting the same CMS source with a different variant/slug. No hosted calls or persistent Local database changes occur.

Task 7.2 remains open for the complete Item Setup application/API, including server-owned identity derivation and source adapter integration. Task 7.3 also remains open for provider binding, runtime projection, opening-stock integration, and final readiness.

Verification passes: `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation. Logs: `.codex-artifacts/emdash-m1/setup-catalog-{unit,check,build,openspec}.log`.
