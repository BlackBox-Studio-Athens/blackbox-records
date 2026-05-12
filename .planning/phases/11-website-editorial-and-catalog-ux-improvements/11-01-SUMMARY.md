---
phase: 11-website-editorial-and-catalog-ux-improvements
plan: 01
subsystem: frontend-content
tags: [astro, content-collections, decap, distro, catalog-data, testing]
requires:
  - phase: 06
    provides: Astro content collections and static storefront foundations
provides:
  - Artist editorial schema fields for quiet profile links and YouTube video references
  - Distro display group vocabulary and optional release-date model
  - StoreItem metadata projection that omits unknown Distro release dates
  - Focused tests for Distro grouping and optional date metadata
affects: [11-02, 11-03, 11-04, storefront-content, decap-admin]
tech-stack:
  added: []
  patterns:
    - Structured Astro content fields for editorial-only artist media
    - Display-only Distro metadata kept separate from commerce authority
key-files:
  created:
    - .planning/phases/11-website-editorial-and-catalog-ux-improvements/11-01-SUMMARY.md
  modified:
    - apps/web/src/content.config.ts
    - apps/web/src/lib/admin/decap-config.ts
    - apps/web/src/lib/distro-data.ts
    - apps/web/src/lib/catalog-data.ts
    - apps/web/src/lib/catalog-data.test.ts
    - apps/web/src/pages/distro/index.astro
    - apps/web/src/content/distro/*.json
key-decisions:
  - 'Artist profile videos are modeled as structured YouTube video IDs, not raw iframe HTML.'
  - 'Distro release dates are optional first-class metadata and are omitted when unknown.'
requirements-completed: [SITE-ARTIST-01, SITE-DISTRO-01, SITE-DISTRO-02, SITE-DISTRO-03]
duration: ~35min
completed: 2026-05-12
---

# Phase 11 Plan 01: Extend Editorial Content Models Summary

Content schemas, editor config, Distro grouping, and focused tests now support the Phase 11 editorial UX work without changing commerce authority.

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-12T13:30:00+03:00
- **Completed:** 2026-05-12T14:04:24+03:00
- **Tasks:** 3 completed
- **Files modified:** 35

## Accomplishments

- Added optional artist `profile_links` and `videos` fields, with videos constrained to YouTube video IDs.
- Added the new Distro group vocabulary and optional Distro `release_date` field across schema, Decap config, helper logic, and content entries.
- Updated StoreItem Distro metadata to include a known release year when present and omit unknown dates entirely.
- Added tests for Distro group ordering and optional release-date metadata.

## Task Commits

Each task was committed atomically:

1. **Task 11-01-01: Add artist editorial fields** - `e33e96a` (feat)
2. **Task 11-01-02: Update Distro grouping and date model** - `6a464e1` (feat)
3. **Task 11-01-03: Refresh focused data tests** - `abf1ebd` (test)

Supporting cleanup:

- `eee2c33` docs - formatted Phase 11 planning artifacts and reset the stale auto-chain flag before execution commits.

## Files Created/Modified

- `apps/web/src/content.config.ts` - Added artist editorial fields and Distro group/date schema.
- `apps/web/src/lib/admin/decap-config.ts` - Mirrored artist and Distro schema additions in Decap config.
- `apps/web/src/lib/distro-data.ts` - Updated canonical Distro group order.
- `apps/web/src/lib/catalog-data.ts` - Included optional Distro release year in StoreItem metadata.
- `apps/web/src/lib/catalog-data.test.ts` - Added focused group-order and optional-date coverage.
- `apps/web/src/pages/distro/index.astro` - Kept Distro group intro mapping type-safe for the new group vocabulary.
- `apps/web/src/content/distro/*.json` - Migrated existing Distro entries from the old `Vinyls` group to the new display groups.

## Decisions Made

- Artist videos use `youtube_video_id` instead of raw embed markup to keep the future UI renderer controlled.
- Existing Distro records did not receive inferred dates. Dates remain absent until known first-class metadata is supplied.
- Existing vinyl Distro entries moved to `Vinyl 12-inch` except the explicit split 7-inch item, which moved to `Vinyl 7-inch`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Validation blocker] Phase 11 planning artifacts failed Prettier**

- **Found during:** Task 11-01-01 acceptance validation
- **Issue:** `pnpm check` failed before source validation because Phase 11 planning docs and `decap-config.ts` needed formatting.
- **Fix:** Ran Prettier on the reported Phase 11 planning files plus `decap-config.ts`.
- **Files modified:** `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`, Phase 11 planning Markdown files, `apps/web/src/lib/admin/decap-config.ts`
- **Verification:** `pnpm check` passed after formatting.
- **Committed in:** `eee2c33`

**2. [Rule 2 - Missing critical integration] Distro page intro mapping needed the new group keys**

- **Found during:** Task 11-01-02 implementation
- **Issue:** Updating `DistroGroupName` required `apps/web/src/pages/distro/index.astro` to cover the new group names.
- **Fix:** Updated the intro mapping for `Vinyl 12-inch`, `Vinyl 7-inch`, `CDs`, `Clothes`, `Tapes`, and fallback-only `Other`.
- **Files modified:** `apps/web/src/pages/distro/index.astro`
- **Verification:** `pnpm check` and `pnpm build` passed.
- **Committed in:** `6a464e1`

---

**Total deviations:** 2 auto-fixed.
**Impact on plan:** Both fixes were required to keep the planned content-model change buildable. No checkout, stock, Stripe, BOX NOW, order, or cart authority changed.

## Issues Encountered

- `pnpm check` reports existing Astro/Zod deprecation hints for `z.string().url()` and `z.string().email()`, but the command exits successfully with 0 errors and 0 warnings.

## User Setup Required

None - no external service configuration required.

## Validation

- `git diff --check` - passed
- `pnpm test:unit` - passed: 24 web test files / 144 tests, 28 backend test files / 146 tests, 1 API client test file / 2 tests
- `pnpm check` - passed with existing Astro/Zod deprecation hints only
- `pnpm build` - passed, 114 static pages built

## Self-Check: PASSED

- All three task acceptance gates passed.
- Plan-level validation commands passed.
- Storefront routes and checkout path generation remained stable; only display metadata changed.

## Next Phase Readiness

Ready for `11-02: Rework Artist Detail Pages`. The artist schema/editor fields exist, and Distro grouping/date foundations are available for `11-04`.

---

_Phase: 11-website-editorial-and-catalog-ux-improvements_
_Completed: 2026-05-12_
