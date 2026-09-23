# Proposal

## Why

Staff cannot readily discover the next Distro & merch batch or return to their previous task with their place intact. A bounded UAT check on 2026-09-22 confirmed that Next loads more entries, but the controls are below all 25 rows, the next batch leaves the viewport at the bottom, and browser Back skips the previous batch.

## What Changes

- Make the existing 25-entry catalog pagination easy to find: labeled Previous and Next controls above and below the list, honest position feedback, and focus/scroll movement to the start of a newly requested batch.
- Preserve search, area, format, sort, page, selected entry, and return position through editor navigation, browser Back/Forward, and same-tab reloads. Commit page changes only after successful reads; retain the current page on errors.
- Provide a consistent, visible `Back to <destination>` action throughout the staff workspace, including Website singleton editors, catalog creation, Images, Stock, Orders, and Review changes. Restore a known originating task when available and use a safe, named parent otherwise.
- Reuse EmDash 0.38.0 content-list queries, opaque cursors, server filtering/ordering, existing staff query caching, draft autosave, and current UI primitives. Keep BlackBox publication and commerce authority in their existing adapters.
- Add regression coverage for paging discoverability, exact return state, failed/stale reads, and navigation while work is unsaved or recovering.

The user confirmed that Back navigation covers the whole staff workspace. Public website navigation is outside this change. This is a focused follow-up to `redesign-staff-workspace`, not another staff redesign or a replacement for that change's outstanding acceptance gates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-workspace`: Strengthen growing-catalog browsing and specify discoverable paging, contextual return navigation, browser-history restoration, and safe leave behavior across staff tasks.

## Impact

- Main implementation seams: `apps/staff/src/components/content/ContentApp.tsx`, `StaffShell.tsx`, and the existing Website, Images, item setup, Stock, Orders, and Review components. Reuse `use-draft-autosave.ts`, `staff-query.ts`, and staff Button/link styles.
- Preserve `/_emdash/api/blackbox/workspace`, `readStaffWorkspace`, and native `handleContentList` behavior. Backend changes are conditional on a failing contract regression; no replacement list API, CMS table queries, data migration, or dependency upgrade is planned.
- Extend `scripts/test-content-workspace.mjs` and focused existing backend/staff tests; update the staff navigation guidance in `docs/content-workspace.md` and `docs/backoffice-design.md` during implementation.
- No new router, infinite scrolling, total-count scan, persistent content cache, provider binding, paid service, commerce mutation, or publication action is introduced. Hosted rollout remains subject to the existing Free-tier and release gates.

See [design.md](design.md) for the evidence, behavior matrix, implementation boundaries, and validation plan; [tasks.md](tasks.md) records the implementation sequence.
