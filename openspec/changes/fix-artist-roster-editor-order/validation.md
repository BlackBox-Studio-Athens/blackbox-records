# Source and scope

Worktree `C:/Users/SVall/.codex/worktrees/b553/blackbox-records`, branch `codex/staff-release-updates`, source HEAD `ecbf6e9d79c872d5a4803a2e31d7ef97dd26a570`. Other chats are concurrently implementing their changes. This task changes only the Artist guidance paragraph in `docs/content-workspace.md` and this scoped OpenSpec change. No ordering code was changed; do not describe documentation as implementation of a new order. Parent owns final source fingerprint, integrated `pnpm validate`, and graph refresh after all edits.

Selected acceptance: Staff/editor and CMS/schema/publication diagnosis, public roster observation. Commerce, player, route lifecycle and hosted/provider mutation are excluded because this task changes no runtime behavior. Impeccable context and product register were read; no visual design or UI mutation was performed.

# Read-only Local evidence

The normal Local stack belongs to the primary checkout, not this worktree. No primary source, stored draft, status or publication was changed. Its runtime reports software SHA `f170ef67be0f353eb89fc4cb817f5caec7a0fd0f`, so these observations do not establish acceptance of the worktree's final integrated source.

Evidence: `.codex-artifacts/artist-roster-order/local-read-only.json` in this worktree. Native workspace GET returned 200 and title order Afterwise, Chronoboros, Ouranopithecus, Sidus. Chronoboros has native `is_active: 0`, live revision `01M3WR22PXMTEMG1MVH3TZB9AY`, no private draft, and publication state published. The other three profiles have absent activity and default active.

Public Local `/blackbox-records/artists/` returned 200 with rendered headings AFTERWISE, OURANOPITHECUS, SIDUS, CHRONOBOROS. Accepted publication `3b2ef1f9-fa8b-49b1-88e4-2a5ae5794482`, snapshot SHA-256 `698f0b52db1829d4eba8469e701e2291fb7b29f39c5122a1d3bfb29e41a1bf8f`.

Chrome blackbox inventory succeeded, but creating the Local Staff tab timed out (browser_backend_unavailable for that operation). The documented DevTools fallback could not start because its profile was already running. The in-app browser successfully opened the Local Chronoboros editor and showed Inactive, Changes saved · Everything is live, and disabled Publish changes. Selecting View → Listing timed out before rendering, including one Retry preview. Diagnostic reference `37610696-99f3-47f5-9042-e4987328537a`: timeout, waiting on script. Current appearance rendering acceptance is therefore unresolved, not passed. The earlier activity change contains historical Local preview/publication acceptance, which is context rather than current source-bound evidence.

# Checks

- `pnpm test apps/web/src/lib/catalog-data.test.ts`: passed, 8 affected test targets, cached. Existing roster regression explicitly asserts Afterwise, Ouranopithecus, Sidus, Chronoboros and the Home first three while retaining ordinary alphabetical queries and source data.
- `pnpm test scripts/cms-content-schema.test.mjs`: passed, 8 tasks, 5 cached. Existing native false/zero/default and accepted-versus-draft publication regression passed. Nx reported the existing `architecture-tests:test` task as flaky although the command passed.
- `pnpm test apps/backend/src/cms/catalog-schema.test.ts`: passed, 3 affected targets, uncached. Optional field and idempotent preparation are covered. Concurrent footer schema work was included by the affected selection.
- `pnpm test apps/staff/src/components/content/ContentFields.test.tsx`: passed, staff-content target uncached, including the existing default-active, native-zero/inactive, stable switch label and disabled-control checks. Concurrent staff icon work was included by the affected selection.
- `pnpm openspec -- --allow-worktree validate fix-artist-roster-editor-order --type change --strict`: passed.
- Scoped `git diff --check`: passed.

# Remaining work

The human subsequently confirmed resolution in the parent chat; see the final section below. No further adoption or inspection is required for this task. The preview timeouts remain observations, not claimed fixes. Final integrated validation remains with the parent chat.

# PRD inspection, October 5, 2026

The user explicitly requested read-only inspection of the actual PRD Staff site using Chrome's blackbox profile through the GPT extension. That path succeeded in this follow-up. Inspected `https://staff.blackboxrecordsathens.com/content/`, navigated Catalog → Artists → Chronoboros, and read the visible control state without editing or publishing.

PRD displays **Active artist: Active**, switch checked, **Changes saved · Everything is live**, disabled **Publish changes**, and **No changes to review**. The production Artist image is the authored `Chronoboros-band-photo.jpg`, 1600 × 1200 px, unlike the retained Local logo fixture. This supports preserving populated CMS content rather than reseeding.

Following Staff's View website destination, `https://blackbox-records-web.pages.dev/artists/` visibly shows Afterwise, Chronoboros, Ouranopithecus, Sidus. Chronoboros is second on PRD public Artists as well as the Staff alphabetical finder. The earlier Local result did not establish production ordering, and the production observation replaces the uncertainty about which environment lacks adoption.

PRD's detail appearance preview shows **Could not connect to preview** and requests sign-in at `https://preview.blackboxrecordsathens.com/_preview/session`. No preview sign-in or repeated probe was performed; Listing appearance parity remains unverified. This access issue is separate from the checked activity setting and public second-place order.

The concrete pending correction is to turn off Chronoboros's existing Active artist setting in PRD, review the resulting saved revision, and publish through the normal Content Publication operation. With the other three active, the existing implementation yields Afterwise, Ouranopithecus, Sidus, Chronoboros. This task did not perform a hosted write or publication. No new software ordering patch or seed replacement is required for the observed activity adoption issue.

# Human-confirmed resolution

The human later replied in parent chat `01a109d2-8fcc-7433-963b-fefa41bfe655`: “THe chronoboros appearing fourth issue has been resolved already. It was about flagging them as inactive in PRD.” This exact reply was read through `read_thread`, user message `01a109ea-6f91-7dc3-a430-7415cd8a49eb`.

This supersedes the earlier pending PRD adoption step. The issue is resolved by direct human confirmation. No additional hosted inspection, publication, mutation or source-code fix is needed. Earlier read-only observations describe the state at their observation time; they are not independent verification of the subsequent resolution. Additional Local preview acceptance is no longer required for this content issue, and its timeout remains unfixed historical evidence.
