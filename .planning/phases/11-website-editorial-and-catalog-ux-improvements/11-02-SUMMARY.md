---
phase: 11-website-editorial-and-catalog-ux-improvements
plan: 02
subsystem: frontend-ui
tags: [astro, artist-detail, app-shell-player, youtube, release-routing, social-icons]
requires:
  - phase: 11-01
    provides: Artist profile links and structured YouTube video content fields
provides:
  - Story-first artist detail layout shared by direct and overlay routes
  - Quiet artist profile link row using shared social icons
  - Structured YouTube video rendering for artist pages
  - Reusable Listen trigger component with compact and standalone variants
  - Canonical Disintegration release detail routing for public release links
affects: [11-03, 11-05, artist-detail, release-detail, app-shell-player]
tech-stack:
  added: []
  patterns:
    - Shared Astro component for app-shell embedded-player Listen triggers
    - Structured YouTube IDs rendered through controlled iframe attributes
    - Canonical public release detail slug mapping separate from content entry IDs
key-files:
  created:
    - apps/web/src/components/icons/SocialIcon.astro
    - apps/web/src/components/music/MusicStreamingServiceListenTrigger.astro
    - .planning/phases/11-website-editorial-and-catalog-ux-improvements/11-02-SUMMARY.md
  modified:
    - apps/web/src/components/detail/ArtistDetailContent.astro
    - apps/web/src/components/detail/ReleaseDetailContent.astro
    - apps/web/src/components/cards/ReleaseCard.astro
    - apps/web/src/components/Footer.astro
    - apps/web/src/content/artists/mass-culture.md
    - apps/web/src/lib/catalog-data.ts
    - apps/web/src/pages/app-shell-overlay/releases/[slug].astro
    - apps/web/src/pages/sitemap.xml.ts
    - apps/web/src/styles/global.css
key-decisions:
  - 'Artist detail pages render profile story Markdown first and keep bio as concise summary copy.'
  - 'Artist videos are rendered only from structured YouTube IDs through youtube-nocookie embeds.'
  - 'Listen controls use one reusable Astro trigger component while the app shell remains the player owner.'
  - "Afterwise's public release detail route is canonicalized to /releases/disintegration/ while the content entry ID remains barren-point."
requirements-completed: [SITE-ARTIST-01]
duration: ~1h 20min
completed: 2026-05-12
---

# Phase 11 Plan 02: Rework Artist Detail Pages Summary

Story-first artist detail pages now combine rich profile copy, quiet social links, structured YouTube video embeds, latest-release Listen actions, and canonical release-detail routing without moving player ownership out of the app shell.

## Performance

- **Duration:** ~1h 20min
- **Started:** 2026-05-12T15:04:00+03:00
- **Completed:** 2026-05-12T16:24:00+03:00
- **Tasks:** 3 completed
- **Files modified:** 11

## Accomplishments

- Reworked artist detail content so rich Markdown body becomes the primary profile story, with `bio` retained for concise summary/meta copy.
- Added quiet profile links using a reusable `SocialIcon` component shared with the footer.
- Added structured YouTube video rendering for artist pages and configured Afterwise with `Cl7rWCTGEqY`.
- Extracted the app-shell Listen trigger into `MusicStreamingServiceListenTrigger.astro` and reused it on release cards, artist detail, and release detail.
- Preserved app-shell player ownership and verified the standalone Listen trigger still opens the Bandcamp iframe.
- Canonicalized Afterwise's `Disintegration` release links and generated release routes to `/releases/disintegration/`.

## Task Commits

Each task was committed atomically:

1. **Tasks 11-02-01 through 11-02-03: Artist detail story, links, videos, release/player behavior** - `112d082` (feat)

**Plan metadata:** pending this SUMMARY commit.

## Files Created/Modified

- `apps/web/src/components/detail/ArtistDetailContent.astro` - Renders story-first artist detail content, profile links, videos, latest release, and previous releases.
- `apps/web/src/components/music/MusicStreamingServiceListenTrigger.astro` - Reusable app-shell player Listen trigger.
- `apps/web/src/components/icons/SocialIcon.astro` - Shared social icon renderer for profile/footer links.
- `apps/web/src/components/detail/ReleaseDetailContent.astro` - Reuses the shared Listen trigger on release detail pages.
- `apps/web/src/components/cards/ReleaseCard.astro` - Reuses canonical release detail URLs and the shared Listen trigger.
- `apps/web/src/components/Footer.astro` - Reuses the shared social icon renderer.
- `apps/web/src/content/artists/mass-culture.md` - Adds Afterwise structured YouTube video content.
- `apps/web/src/lib/catalog-data.ts` - Adds canonical release detail slug helpers.
- `apps/web/src/pages/app-shell-overlay/releases/[slug].astro` - Uses canonical release detail slug for overlay fragments.
- `apps/web/src/pages/sitemap.xml.ts` - Emits canonical release detail paths.
- `apps/web/src/styles/global.css` - Styles the story-first artist page, route links, videos, and reusable Listen trigger variants.

## Decisions Made

- The reusable Listen trigger keeps the existing app-shell data-attribute contract instead of introducing page-local player scripts.
- Red Listen styling is limited to standalone detail surfaces; homepage/repeated card buttons stay neutral.
- YouTube embeds use `youtube-nocookie.com` and structured IDs, not arbitrary iframe HTML.
- Release detail URLs use a canonical display slug map where legacy content IDs do not match shopper/editorial naming.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical integration] Canonical release route for Afterwise**

- **Found during:** Task 11-02-03 (Preserve release and player behavior)
- **Issue:** Afterwise's latest release detail links pointed at `/releases/barren-point/` because the release content entry ID did not match the public release title.
- **Fix:** Added canonical release detail slug helpers and updated cards, artist links, sitemap, static paths, and overlay fragments to use `/releases/disintegration/`.
- **Files modified:** `apps/web/src/lib/catalog-data.ts`, `apps/web/src/components/cards/ReleaseCard.astro`, `apps/web/src/components/detail/ArtistDetailContent.astro`, `apps/web/src/pages/app-shell-overlay/releases/[slug].astro`, `apps/web/src/pages/sitemap.xml.ts`
- **Verification:** DevTools route checks confirmed no rendered `/releases/barren-point/` links on the homepage or Afterwise artist page, and the canonical overlay route returned HTTP 200.
- **Committed in:** `112d082`

**2. [Rule 2 - Missing critical reuse] Listen trigger component extraction**

- **Found during:** Task 11-02-03 (Preserve release and player behavior)
- **Issue:** The planned artist page Listen action needed to reuse the same app-shell player trigger behavior as release cards.
- **Fix:** Extracted `MusicStreamingServiceListenTrigger.astro`, reused it across release cards, artist detail, and release detail, and preserved the existing player data attributes.
- **Files modified:** `apps/web/src/components/music/MusicStreamingServiceListenTrigger.astro`, `apps/web/src/components/cards/ReleaseCard.astro`, `apps/web/src/components/detail/ArtistDetailContent.astro`, `apps/web/src/components/detail/ReleaseDetailContent.astro`, `apps/web/src/styles/global.css`
- **Verification:** DevTools interaction opened the player modal with the Bandcamp iframe from the artist detail Listen button.
- **Committed in:** `112d082`

---

**Total deviations:** 2 auto-fixed.
**Impact on plan:** Both fixes supported the plan's behavior-preservation goal and did not change commerce, checkout, order, stock, Stripe, or BOX NOW authority.

## Issues Encountered

- Browser Use was not exposed in this Codex session. DevTools MCP was used as the local rendered-validation fallback, and this limitation is recorded in validation notes rather than treated as Browser Use evidence.
- `pnpm check` reports existing Astro/Zod deprecation hints for `z.string().url()` and `z.string().email()`, but exits successfully with 0 errors and 0 warnings.

## User Setup Required

None - no external service configuration required.

## Validation

- `pnpm exec prettier --check apps/web/src/styles/global.css` - passed
- `pnpm test:unit` - passed: 24 web test files / 144 tests, 28 backend test files / 146 tests, 1 API client test file / 2 tests
- `pnpm check` - passed with existing Astro/Zod deprecation hints only
- `pnpm build` - passed, 114 static pages built
- DevTools fallback: homepage compact Listen button remained neutral and centered
- DevTools fallback: Afterwise direct artist route rendered story content, latest release, accent Listen button, and requested YouTube embed
- DevTools fallback: artist detail Listen button opened the app-shell player modal with the Bandcamp iframe
- DevTools fallback: `/blackbox-records/app-shell-overlay/releases/disintegration/` returned HTTP 200 and no `/releases/barren-point/` URL
- DevTools fallback: browser console reported no errors, warnings, or issues during the checked routes

## Self-Check: PASSED

- All three task acceptance gates passed.
- Direct and overlay release routes use the canonical `Disintegration` URL.
- App-shell player ownership and trigger contract were preserved.
- Optional videos and previous releases remain hidden when not configured.

## Next Phase Readiness

Ready for `11-03: Add Homepage News And Latest Release Feature`. The reusable Listen trigger and canonical release detail path helpers are available for the releases latest-banner work.

---

_Phase: 11-website-editorial-and-catalog-ux-improvements_
_Completed: 2026-05-12_
