---
phase: 11-website-editorial-and-catalog-ux-improvements
plan: 03
subsystem: frontend-ui
tags: [astro, homepage, news, releases, app-shell-player]
requires:
  - phase: 11-02
    provides: Reusable app-shell Listen trigger and canonical release detail paths
provides:
  - Homepage News strip backed by the news collection
  - Releases page latest-release editorial feature
  - Latest-release Listen action using the shared app-shell player trigger
affects: [11-05, homepage, releases, app-shell-player]
tech-stack:
  added: []
  patterns:
    - Collection-backed homepage section type for News
    - Editorial latest-release feature that reuses catalog/player helpers
key-files:
  created:
    - .planning/phases/11-website-editorial-and-catalog-ux-improvements/11-03-SUMMARY.md
  modified:
    - apps/web/src/content.config.ts
    - apps/web/src/content/home/site.json
    - apps/web/src/pages/index.astro
    - apps/web/src/pages/releases/index.astro
    - apps/web/src/styles/global.css
key-decisions:
  - 'Homepage replaces the old Latest Releases strip with collection-backed News and keeps News out of global header/footer navigation.'
  - 'The releases page owns the latest-release editorial emphasis while the full release grid remains unchanged below it.'
  - 'The latest-release feature uses the shared standalone accent Listen trigger and preserves app-shell player ownership.'
requirements-completed: [SITE-HOME-01, SITE-RELEASE-01]
duration: ~45min
completed: 2026-05-12
---

# Phase 11 Plan 03: Homepage News And Latest Release Feature Summary

The homepage now surfaces current News instead of repeating releases, and the Releases page now carries the editorial latest-release emphasis with a shared player Listen action.

## Performance

- **Duration:** ~45min
- **Started:** 2026-05-12T16:45:00+03:00
- **Completed:** 2026-05-12T17:30:00+03:00
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments

- Replaced the homepage `latest_releases` content section with a `news` section backed by `listNewsArticles()`.
- Rendered up to three latest news entries on the homepage; with the current content set, one news card is shown.
- Kept News hidden from the global header/footer IA while the homepage section links quietly to `/news/`.
- Added a compact latest-release feature above the releases grid.
- Reused `createReleaseDetailPath()`, `resolveReleaseArtistDisplayName()`, `buildEmbeddedPlayerData()`, and `MusicStreamingServiceListenTrigger.astro` so release links and player behavior stay canonical.
- Preserved the full releases grid below the editorial feature.

## Task Commits

Each task was committed atomically:

1. **Tasks 11-03-01 through 11-03-02: Homepage News strip and releases latest feature** - `bc1263a` (feat)

**Plan metadata:** pending this SUMMARY commit.

## Files Created/Modified

- `apps/web/src/content.config.ts` - Changes the homepage collection section discriminant from `latest_releases` to `news`.
- `apps/web/src/content/home/site.json` - Replaces homepage Latest Releases copy/link with News copy/link.
- `apps/web/src/pages/index.astro` - Renders latest news cards from the news collection.
- `apps/web/src/pages/releases/index.astro` - Adds the latest-release feature and shared Listen trigger.
- `apps/web/src/styles/global.css` - Adds responsive homepage News grid and latest-release feature styles.

## Decisions Made

- The homepage News strip is hidden when there are no news entries, matching the existing optional-content behavior used elsewhere in Phase 11.
- The releases latest feature uses the canonical public release detail path, so `Disintegration` links to `/releases/disintegration/`.
- The standalone latest-release Listen button uses the accent tone on this non-main-page surface.

## Deviations from Plan

None.

## Issues Encountered

- Browser Use was not exposed in this Codex session. DevTools MCP was used as the local rendered-validation fallback, and this limitation is recorded in validation notes rather than treated as Browser Use evidence.
- `pnpm check` reports existing Astro/Zod deprecation hints for `z.string().url()` and `z.string().email()`, but exits successfully with 0 errors and 0 warnings.

## User Setup Required

None.

## Validation

- `pnpm exec prettier --write apps/web/src/pages/index.astro apps/web/src/pages/releases/index.astro apps/web/src/content.config.ts apps/web/src/content/home/site.json apps/web/src/styles/global.css` - passed
- `pnpm test:unit` - passed: 24 web test files / 144 tests, 28 backend test files / 146 tests, 1 API client test file / 2 tests
- `pnpm check` - passed with existing Astro/Zod deprecation hints only
- `pnpm build` - passed, 114 static pages built
- DevTools fallback: homepage News section rendered with one current news card and linked to `/blackbox-records/news/`
- DevTools fallback: global header/footer links did not include News
- DevTools fallback: releases page rendered latest-release feature above the grid, linked to `/blackbox-records/releases/disintegration/`, and kept two release cards in the grid
- DevTools fallback: latest-release Listen trigger opened the app-shell player overlay and loaded the Bandcamp iframe
- DevTools fallback: desktop and narrow viewport checks reported no horizontal overflow
- DevTools fallback: browser console reported no errors or warnings during checked routes

## Self-Check: PASSED

- Both task acceptance gates passed.
- Homepage News and releases latest-release responsibilities are separated.
- App-shell player ownership and shared Listen trigger behavior were preserved.

## Next Phase Readiness

Ready for `11-04: Group Distro Items And Polish Storefront Copy`.

---

_Phase: 11-website-editorial-and-catalog-ux-improvements_
_Completed: 2026-05-12_
