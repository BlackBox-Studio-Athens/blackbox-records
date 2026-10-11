# Tasks

Scope and acceptance are defined by [design.md](design.md) and [the staff-workspace delta](specs/staff-workspace/spec.md). Keep the implementation on the existing EmDash adapter, staff primitives, and browser history. Planning does not authorize hosted changes.

## 1. Establish the regressions and native contract

- [x] 1.1 Extend the existing loopback browser fixture with first-viewport pager visibility, next-page arrival position, and page-one/page-two browser Back assertions. Run them before the fix and record the expected failures; retain the current successful item-open/return regression.
- [x] 1.2 Extend the workspace service tests and existing local native EmDash runtime check for 251+ mixed entries, duplicate sort values, both sorts, server filters, unchanged opaque cursors, and the final page. Verify complete stable-ID traversal on a fixed dataset using installed 0.38.0, distinguishing real-runtime proof from mocked browser fixtures. Change the backend only if a failing contract test identifies a defect.

## 2. Repair catalog paging and state restoration

- [x] 2.1 Make page reads commit rows, cursor, trail, URL, and status only on the newest success. Verify failed Next/Previous retries, double activation, criteria reset, access denial, stale success/error/finally responses, repeated cursors, and background-refresh overlap without page drift or duplicate transitions.
- [x] 2.2 Add the shared presentational top/bottom pager, truthful position text, First page fallback, and empty-filter recovery using existing buttons. Verify 0/1/25/26/50/51-entry boundaries, visible top controls, correct disabled states, and successful page changes focusing/scrolling to the results heading; update tests to use distinct pager region labels.
- [x] 2.3 Restore all content browse state from the URL and history entry on mount and popstate, including media mode and meaningful tabs. Verify three-page Back/Forward, changed criteria, same-tab reload, a copied cursor URL without a trail, and return to the same filtered page and row without extra pushes or filter-reset races.

## 3. Provide consistent staff return navigation

- [x] 3.1 Add only the shared native-history/return-target utilities required by the surface matrix, preserving unrelated history state and using one optional full-document handoff. Verify recognized same-origin targets, direct-entry fallbacks, malformed/external targets, storage denial, nested-return removal, and UI-only metadata exclusion from strict API queries. No router, vendor deep import, or persistent content cache is added.
- [x] 3.2 Integrate one visible labeled Back action per task with StaffShell and ContentApp, including Artists, Releases, Distro & merch, News, Website singleton editors, Pages, and Navigation & footer. Verify the matrix destinations, no duplicate Back controls, legacy variant resolution, saved list position, and absence of list/editor history loops.
- [x] 3.3 Carry originating task context through item creation, Review changes, and Images. Verify creation exit versus previous-step behavior, review selection and pending operation retention, editor-to-review-to-editor returns, and image/history panel closure restoring focus without leaving the task.
- [x] 3.4 Align existing Stock and Orders return controls and root fallbacks with the same contract. Verify filtered later-page detail returns, reloads, stable row focus, direct links, and browser Back/Forward without resetting inventory/order criteria or submitting a business operation.
- [x] 3.5 Route all new returns through existing autosave, conflict, stock-input, setup, and recovery guards. Verify in-flight saves with newer typing, failed/conflicting saves, canceled popstate, rapid repeated navigation, entered counts, uncertain operation results, and native unload protection; clean navigation remains confirmation-free.

## 4. Verify usability and update guidance

- [x] 4.1 Extend `scripts/test-content-workspace.mjs` with the design's history, failure, and task-safety matrix, using disposable fixtures. Run Chromium and Firefox checks at 390/768/1280/1600 px plus keyboard, reduced motion, and 200% zoom; record visible controls, 44 px targets, announcements, focus, scroll restoration, and lack of horizontal overflow. Reuse existing tests rather than duplicating their coverage.
- [x] 4.2 Inspect the built local UI with the native Codex browser and update `docs/content-workspace.md` and `docs/backoffice-design.md` to match verified paging and Back behavior. Confirm the instructions distinguish page Previous from task Back, deep-link First page fallback, and draft/recovery protection.

## 5. Complete repository acceptance and release handoff

- [x] 5.1 Run `pnpm validate` on the final implementation tree and inspect its compact summary; resolve relevant failures and record the passed source fingerprint. Iteration may use `pnpm validate:fast --scope all`, which does not replace this gate.
- [x] 5.2 Run `pnpm validate:editor` and the applicable Local checks documented in `docs/content-workspace.md` and `docs/content-publication.md`, including preview-policy and real shared-template editor/autosave smoke. Verify canonical CMS source/generated no-KV checks and preserve drafts and pending operations; reuse already-passed checks for the same unchanged source fingerprint.
- [x] 5.3 Record the local acceptance evidence and release/rollback handoff in the change. Verify bounded request behavior, no new dependency/resource/migration, and the complete surface matrix. Mark hosted acceptance separately pending until authorized UAT deployment and Free-tier preflight; do not claim that local gates, the planning diagnostic, or this plan approve PRD promotion.
