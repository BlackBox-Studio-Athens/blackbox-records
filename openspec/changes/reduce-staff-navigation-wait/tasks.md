# Tasks

Implementation started from `be3c6b5c78ab04d8506616334f38b2de102af504`. [measurements.md](measurements.md) and [investigation.md](investigation.md) retain the baseline reproductions. The pagination/Back proposal is unimplemented; its paging/history scope remains separate. Unrelated working-tree spec archival changes are preserved. Hosted release and performance acceptance remain separate from local implementation.

## 1. Establish the implementation baseline

- [x] 1.1 Pin the implementation revision, account for overlapping pagination/Back work, and reuse the recorded reproductions for focused regression checks. Do not require new tracing or index benchmarks before fixing the demonstrated causes.

## 2. Reduce Overview work and preserve settled panels

- [x] 2.1 Add validated `view=overview` to the existing adapter and its Overview caller. Use bounded EmDash ContentRepository reads, overlap independent collection and accepted-pointer retrieval, skip artist/SEO/byline/commerce enrichment, and preserve pending/revision checks and other adapter modes.
- [x] 2.2 Extend existing native integration fixtures to compare incomplete, changed, accepted, pending and empty summaries, ordering and limits. Verify one recent-page call per collection, no extra enrichment, current-pointer freshness and existing manifest-cache behavior. Record SQL statements separately from binding calls and rows read; 27 statements is the installed reader's expected comparison, not a permanent minimum or exact-count assertion.
- [x] 2.3 Use existing readStaffQuery for each Overview resource across initial/retry/focus/reconnect paths, with distinct outer-wrapper keys. Track settlement separately from array length. Verify three API reads in the reproduced race, independent panels, retained empty/error presentation and rejection of obsolete results; do not rewrite the shared helper.

## 3. Start Stock reads promptly

- [x] 3.1 Resolve initial URL state before one immediate inventory read; make filter/page changes immediate. Verify nonempty search and cursor entry do not issue an obsolete default read or wait for the 300 ms typing debounce.
- [x] 3.2 Retain typing debounce and existing query/stale-response guards; verify rapid typing, hidden/offline behavior, selected-item recovery, protected input and nonblocking artwork using existing Stock checks.

## 4. Remove closed features from browse startup

- [x] 4.1 Lazy-load unopened editing, picker, selling/stock and publication-review features at their existing intent boundaries; verify Pages/Releases/Distro built captures exclude feature-specific resources while preserving shared controls and catalog summaries.
- [x] 4.2 Keep editor/picker CSS inside the lazy feature using processed inline CSS, retaining cascade order and styled readiness; verify no eager equivalent CSS in HTML or browse JavaScript, direct editor and browse-to-editor loading, keyboard focus, private preview and accessible load failure.
- [x] 4.3 Replace unresolved Artists/zero/no-results markup with neutral or destination-appropriate loading using existing layout primitives; verify delayed Website/Releases/Distro startup and successful empty/error states. Coordinate with the pagination/Back change; no shell redesign or preload work is included.

## 5. Validate locally, then verify the authorized hosted release

- [x] 5.1 Extend existing backend and built workspace checks with the above regressions. Retain private 200/304 authorization, no auth-session/KV writes, thumbnail limits/placeholders, direct editor loading, autosave, failed/conflicting saves, leave/reload and recovery. Complete relevant content-workspace/publication checks and update staff guidance.
- [x] 5.2 Run `pnpm validate` and `pnpm validate:editor` against the final source and retain passing fingerprints. The editor command already runs Chromium and Firefox workspace checks; do not rerun them separately unless a failure or changed source requires it.
- [x] 5.3 Deploy the canonical UAT candidate and smoke Overview, Website, Stock and Distro once each. The reviewed run and built resource-boundary checks passed; route results are recorded in `implementation-evidence.md`.
- [x] 5.4 Promote the reviewed SHA after the fresh budget check and collect at most 16 PRD route activations. All 16 are recorded in `measurements.md`; the Overview target was missed, so measurement completion does not close latency acceptance.
- [ ] 5.5 Keep the PRD Overview startup follow-up open. The request is faster once issued, but repeated request-start delay and the incomplete readiness sample prevent a passing visible-content median. Retain the documented outliers and resolve the scoped startup cause before archiving.
