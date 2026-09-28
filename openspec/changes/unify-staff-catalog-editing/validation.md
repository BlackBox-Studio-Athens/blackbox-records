# Validation

## Scope and data preservation

Work is local on main. PRD review was inspected using the blackbox Chrome profile without publishing, discarding or editing content. Crawl (`01M2J1EYK9DRGHPCTW5R7VYAV3`) and Magic Sleazeball Corrida remained pending. The reported release is `0e79351e996de90e0edbd3b4c9049ae7605088d4`; the Crawl review and both images loaded on that release in Chrome. The member reports the first-load failure in Firefox, retry recovery, poor review rendering and Publish becoming disabled after Alt+Tab.

## Preview findings

- The original simple-image policy check passed in Chromium and Firefox. A responsive lazy image, delayed response and frame resize reproduced an `image` readiness failure with valid bytes. Waiting for image load before decode passed the same check in both browsers. This establishes the reproduced loading race, not a captured trace of the original PRD request.
- The standalone review lacked the stylesheet imported by ContentApp and MediaLibrary. PRD browser inspection showed a 150px iframe. ContentPreview now imports its existing stylesheet; local standalone review visibly fills the pane. The simplified fixture establishes layout behavior, not full public-template parity.
- PublicationReviewFlow marked every visible return stale. It now retains review on visibility changes, while reconnect and confirmed editorial changes still mark it stale. Exact publication revisions remain server-validated.
- The editor regression checks standalone frame height, unchanged frame generation and retained Publish eligibility after hidden/visible events. Existing checks retain real image failure and retry coverage.

## Checks

- Band search now filters bounded native pages after resolving credits, with direct artist reads limited to the current release page. Empty-page continuation does not retain the whole catalogue. Backend coverage includes native release references, case-insensitive band search, distro credits, title matches and continuation; 10 workspace tests passed.

- `node --import tsx scripts/test-preview-policy.mjs`: passed Chromium and Firefox after reproducing the pre-fix image failure.
- `pnpm test:changed --scope staff`: 9 files, 29 tests passed at this intermediate tree.
- Strict OpenSpec validation passed.
- Full editor phases passed (staff build, preview policy, Chromium and Firefox) in `.codex-artifacts/validation/2026-09-28T10-55-54-345Z-77020/summary.json`. The run is invalidated because tracked documentation and test formatting changed during execution. A settled-tree run is required.
- Initial `pnpm validate` stopped on formatting in the bulk-upload helper and test. Both files were formatted; final validation remains pending.
- Settled editor acceptance passed all four phases in `.codex-artifacts/validation/2026-09-28T11-14-00-499Z-98856/summary.json`, source fingerprint `9ca948ab7d07e229b785cae89b5554a3fd9dc43a81e3a4e3a463c94d13d0920c`. This includes sparse band-search pagination, review layout and visibility-return checks in Chromium and Firefox. Subsequent task/evidence documentation updates are outside that recorded fingerprint.

## Remaining acceptance

The approved UI is implemented with Details & photos / Price & stock tabs and secondary field accordions. Both tab panels remain mounted. Local Chromium fixture checks exercise partial bulk upload and retry on releases/distro, unchanged cover, intervening text edits, tab preservation, navigation cancellation, stale stock revisions and successful reassessment. The upload helper passed 9 tests; changed staff tests passed 42 tests across 13 files. Source-only tests establish gallery projection and stored-media references; they do not establish hosted schema registration.

The retained selling journey (`node --import tsx scripts/test-content-workspace.mjs --selling`) passed keyboard submission, decimal comma/point, revision conflicts, retained inputs, refresh failure after a confirmed save, 320px layout and existing Stock deep links. `pnpm test:app-shell` passed 192 tests across 42 files. The additive gallery upgrade smoke (`pnpm --filter @blackbox/backend exec node test/emdash/upgrade-smoke.mjs --source-state .wrangler/state`) passed against a disposable copy of stopped Local state: pending Release draft/revision bytes, existing dates, stock, prices and accepted publication pointer survived migration and two Worker starts. Reapplying reports no missing gallery field. No source Local store or hosted data was changed by the copied-state smoke.

Manual Chrome verification uses the blackbox profile and the local fixture server at `127.0.0.1:4399`. The full-width commerce panel places price beside stock on wide screens. The monochrome header was checked at desktop and 390px; a mobile containing-block regression initially overlaid the form, was corrected, and is guarded by a canvas/header bounding-box assertion. The gradient remains within the header and form text retains its normal contrast. The static CSS fallback covers reduced motion and unavailable WebGL.

Final validation uses the staff/editor, content/schema and commerce acceptance rows. No checkout authority or external provider behavior changed, so provider checkout rehearsal is not applicable. Existing stock revision/idempotency behavior remains owned by the Worker; fixture writes are Local-only.

The artist picker retains the installed shadcn Popover/Command components, resolves saved references outside list pagination, and rejects stale lookup responses. Browser coverage loads Mass Culture outside page one before opening the picker, selects another artist during a delayed lookup and checks the retained selection. Mobile focus styling uses the search row instead of an inset input outline. Shop-publication controls are always visible above price/stock, with explicit status and clear separation from saving the selling price. The browser fixture also exercises the backend-required live-price confirmation without performing a price mutation.

The integrated editor acceptance passed staff build, preview policy, Chromium and Firefox in `.codex-artifacts/validation/2026-09-28T12-49-07-220Z-36168/summary.json`. The retained selling journey, staff type check (zero errors), 42 affected staff tests and strict OpenSpec validation passed. This handoff documentation was finalized afterward; `pnpm validate` runs against that final tree. Source SHA, matching before/after fingerprints for each run, phase results and screenshot paths are recorded in `.codex-artifacts/unify-staff-catalog-editing/final-evidence.json`; this ignored receipt avoids invalidating the tested source while recording results. Earlier summaries above are historical.

Hosted deployment, exact Firefox PRD replay, public-template parity and release/provider acceptance remain unverified. Existing CMS environments require the additive gallery registration before release gallery editing. No PRD promotion, content publication, migration or stock/price writes were performed.

The publishing extension reuses the existing publication operations. Browser checks cover flushing the latest edit, exact revision submission, private autosave after publication, reopening without publication, explicit review, conflict recovery without automatic retry, and new distro setup followed by shop publication. Unfinished setup restores its title, price and starting stock in the same browser session without issuing setup or publication commands. Session setup values are bound to their draft identity; website content remains stored in the CMS. The primary editor action uses installed shadcn ButtonGroup/DropdownMenu primitives. Final editor and repository run receipts supersede earlier source fingerprints above.
