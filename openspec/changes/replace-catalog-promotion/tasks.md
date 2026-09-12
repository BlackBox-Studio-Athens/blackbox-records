## 1. Product authority

- [x] 1.1 Add additive Product bindings and validated migration/backfill.
- [x] 1.2 Resolve Product default Prices for detail, checkout, and targeted webhook refresh with regression coverage.

## 2. Catalog preparation

- [x] 2.1 Replace duplicate committed catalogs with one generated build manifest.
- [x] 2.2 Scope synchronization to release items and preserve operational state; make interruption recovery safe.

## 3. Release

- [x] 3.1 Consolidate generation, gates, catalog preparation, deployments, and same-SHA smoke in one non-cancelling workflow.
- [x] 3.2 Remove obsolete promotion/reset orchestration and update contracts and runbooks.

## 4. Verification and rollout

- [ ] 4.1 Export and inventory affected UAT state, then recover missing listings without foreign-object mutation.
- [ ] 4.2 Pass unit tests, checks, and builds on the final tree.
- [ ] 4.3 Commit, push, and verify fresh UAT release and smoke evidence.
