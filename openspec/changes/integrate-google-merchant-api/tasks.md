# Tasks

Final design and local implementation were approved on 2026-10-27. On 2026-10-28, the owner authorized task 3.2's isolated Google test-account pilot and required setup. The later production and completion authorizations below supersede that historical boundary; paid ads and conversion tracking remain excluded.

On 2026-10-29, after the recorded synthetic and real PRD-source test-account pilots, the owner instructed: **Skip further testing, move on with the real implementation.** Focused static inspection confirmed that the implementation tasks below are already complete. Further tests and provider pilots are deferred under that instruction; unchecked acceptance tasks 3.2 and 3.3 remain open, not passed. The next operational step is separately authorized PRD Merchant account/source/credential configuration and gated activation. This instruction does not enable the hosted job or authorize production product mutations.

## 1. Product mapping and provider access

The owner later superseded the testing deferral: **I want to switch it on fully, and you make sure it works, automatically updates, and there are no errors and inconsistencies.** Production setup, required verification, scoped release and activation are now authorized. The owner also approved the combined Staff/Merchant release after its scope was presented. Paid ads and conversion tracking remain excluded. Readiness review found two required fixes: explicit accepted physical condition and a two-candidate implementation cap to fit D1 Free's invocation limit. The owner confirmed only the three published Distro tapes are used; the remaining current catalog is new. Publication must preserve unrelated private drafts. Acceptance tasks remain open until their actual evidence exists.

- [x] 1.1 Implement and test conversion of accepted public catalog and authoritative in-stock offers to Google inputs, including price, checkout holds, stable offer identity and Greece-only targeting. Exclude any uncleared raw stock pre-order, including elapsed exact dates. Test omission of unknown identifiers and identifierExists, no catalog-number/artist substitutions, and verified condition handling.
- [x] 1.2 Implement and test environment-isolated Merchant API authentication and bounded upsert/removal requests, with job-specific timeouts and no immediate provider retries; never log credentials.

## 2. Reconciliation and operations

- [x] 2.1 Implement and test the persistent rotating scan, complete accepted-inventory checks, partial-read safety, removal/reinsertion, safe replay and seven-day refresh without affecting checkout or paid-order delivery.
- [x] 2.2 Integrate disabled-by-default controls and at most five candidates per fifteen minutes on the existing schedule; test overlap protection, fair rotation, isolation and operation limits. Document measured Free-tier budget, delayed convergence, Merchant Center diagnostics and operator recovery; add no event hooks, change detector or automatic status polling.
- [x] 2.3 Complete physical condition authoring: explicit New/Used controls in existing Staff editors and Add to catalog, preserved through autosave/recovery, plus selected-publication validation. Keep drafts and historical accepted records readable without condition; block only selected physical publication until the owner supplies it. Claude owns UI implementation/tests; Codex owns the shared predicate and backend guards. See [Claude handoff](claude-condition-ui-handoff.md). Do not publish unrelated private edits. Combined local validation passed; browser/release/provider acceptance remains separately recorded below.

## 3. Acceptance

- [x] 3.0 Resolve final-review findings with regression tests: claim once per fifteen-minute clock slot despite delivery jitter, retain real-time leases and quota cooldowns, and preserve managed listings when checkout flag evaluation fails while keeping shopper fallback unchanged.

- [x] 3.1 Run focused tests, strict OpenSpec validation, graph update and final `pnpm validate`; record source-bound evidence and unverified behaviors.
- [ ] 3.2 In an isolated Google test account, verify product submission/processing, price and stock changes, removal/reinsertion and pre-order exclusion, including elapsed exact-date state and explicit clearing. Document the existing authenticated API recovery when Copies arrived is hidden. Inspect actual processing and issue statuses; do not assume test-account approval or treat provider acceptance as proof of real eligibility or displayed shipping.
- [ ] 3.3 Verify pilot product condition and available identifiers, then after the separate deployment and activation gates verify actual production identifier diagnostics, listing eligibility and accurate shipping/returns. Resolve affected product data through its existing owner; record evidence without exposing credentials.
- [ ] 3.4 Update the pre-existing Staff browser fixtures to supply explicit physical condition, preserve intentional blank drafts, and normalize the separate signed-zero viewport assertion without changing UI/tolerance. Claude owns these test changes; see [browser handoff](claude-condition-browser-handoff.md). Review the returned diff, validate the new source, and require its complete CI acceptance before production promotion.
