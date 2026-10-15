# Tasks

## 1. Domain and editorial contract

- [x] 1.1 Add canonical catalog number parser, formatting/comparison and unit tests; verify storefront-catalog tests.
- [x] 1.2 Require catalog_number in complete Release schemas, preserve incomplete drafts, enforce candidate uniqueness and publication review issues; verify shared schema and CMS regressions.
- [x] 1.3 Add idempotent CMS schema field and explicit tested backfill; do not run it. Verify seed field shape and backfill check/apply/idempotence/failure tests.

## 2. Snapshot compatibility and Store ordering

- [x] 2.1 Add accepted-only legacy upgrade with confirmed slug assignments and strict unknown/invalid handling; verify parser, checksum-bound R2/raw export and local-file reader regressions and strict candidate validation.
- [x] 2.2 Add discriminated StoreItem catalog value, All-only numeric ordering and unit tests; verify storefront-catalog tests and type constraints.
- [x] 2.3 Update repository release records and non-UI unit/integration fixtures. Apply the complete table supplied directly by the owner on 2026-10-15: caregivers=BBR#001, disintegration=BBR#002, anarchotribal=BBR#003, lotus=BBR#004, independent of release dates. Store All starts Caregivers, Disintegration, Anarchotribal, then Distro by artist. Correction check results are recorded separately in validation.md.

## 3. Verification and coordinator handoff

- [x] 3.1 Run focused tests, Graphify update, strict OpenSpec validation and pnpm validate; record exact evidence in validation.md and the final ignored completion receipt. All 59 selected tasks passed in Local mode; browser/hosted acceptance is separate.
- [x] 3.2 Document rollout findings, staff input contract and e2e expectations in design.md and handover.md.
- [x] 3.3 Coordinator adds staff input/default handling and updates e2e tests; run browser acceptance.
- [ ] 3.4 Owner prepares schema, reviews/applies the full CMS inventory backfill, releases compatible code to UAT only and accepts next publication. The 2026-10-15 PRD public listing and owner UAT confirmation cover the four assigned Releases including LOTUS BBR#004; private CMS revision checks and rollout remain pending. PRD promotion requires separate authorization.
