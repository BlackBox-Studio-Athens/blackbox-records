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

- [x] 4.1 Export and inventory affected UAT state, then recover missing listings without foreign-object mutation.
- [x] 4.2 Pass unit tests, checks, and builds on the final tree.
- [x] 4.3 Commit, push, and verify fresh UAT release and smoke evidence.

## Verification — 2026-09-12

- Local unit tests, checks, builds, unused-code audit, and local D1 mock readiness passed.
- Recovered 104 UAT bindings (97 fixed-price, seven pay-what-you-want) from the last reset report and matching artwork URLs. Preserved existing default Prices and all amounts; stock and availability were identical before and after recovery. Backups and the reviewed binding inventory are retained in ignored migration evidence.
- Source `5c539bb4634bdbdc163acf1e7f5d4134b0ae0664` passed [the complete release](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/34667202133): repository gates, catalog validation, UAT Worker, all static deployments, paid fixed/custom-amount checkout, email, and static smoke tests. The 104-item synchronization took nine seconds; hosted UAT returned all 104 listings. PRD catalog and checkout authorization remained unchanged.
