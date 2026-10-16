# Tasks

## 6. Legacy catalog-number publication comparison (16 October 2026)

- [x] 6.1 Compare publication review and saved-change discovery with checksum-verified stored fields, while retaining compatibility defaults for rendering and candidate assembly; test legacy backfill visibility, explicit accepted numbers, and strict validation.
- [x] 6.2 Run focused checks and final validation; record the reproduced PRD failure and source-bound evidence. Hosted release and publication remain separate acceptance.
- [x] 6.3 Route an already-on-sale Release's catalog-number-only edit with no price draft through normal reviewed website publication. Keep new items, price drafts and other/mixed changes on the shop path; preserve retained shop operations. Cover the PRD retained-operation case with focused tests and record checks separately from hosted release/publication. Release 613 and PRD promotion 38982845505 passed; live Anarchotribal review exposes the website action without the shop block. Actual content publication remains the owner's action.

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

## 4. Structured Staff catalog-number operations (15 October 2026)

- [x] 4.1 Add safe ordinal construction/read operations and BigInt maximum-plus-one suggestions; add bounds and round-trip tests without changing the stored canonical string or legacy parser range.
- [x] 4.2 Add the authenticated private catalog-number inventory and typed Staff backend read, including pagination, saved draft/live reservation, ownership failures and client tests.
- [x] 4.3 Reject another release's number on native Staff draft saves with field-scoped named errors; allow self/empty values, serialize simultaneous release saves, and retain publication validation. Add worker regression tests.
- [x] 4.4 Run focused checks and strict change validation, refresh Graphify, and record exact results and the UI contract in design.md/validation.md. All three focused test commands passed after Nx startup failures; scoped lint/format/LF checks passed. No full validation, commit, push, hosted mutation or UI implementation was performed for this follow-up.

## 5. Public display and Staff input (15 October 2026)

- [x] 5.1 [Claude] Review three subtle public placements with the owner; build the approved date-line placement on release pages and Releases cards with an accessible name and an e2e check.
- [x] 5.2 [Claude] Replace the Staff free-text input with the structured catalog-number field (BBR# prefix, digits only, availability, next free number) in the Release editor and new-release setup; unit tests and a visual check of every state.
