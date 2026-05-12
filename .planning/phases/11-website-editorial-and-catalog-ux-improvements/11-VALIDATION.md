---
phase: 11
phase_name: website-editorial-and-catalog-ux-improvements
created: 2026-05-12
source: 11-RESEARCH.md
---

# Phase 11 - Validation Strategy

## Test Infrastructure

Existing infrastructure covers this phase:

- `pnpm test:unit` for focused data/helper behavior.
- `pnpm check` for formatting, lint, Astro, TypeScript, and content collection validation.
- `pnpm build` for static route generation.
- Browser Use for rendered direct-route, overlay, responsive, and app-shell continuity checks.

## Sampling Rate

- Deterministic command validation: 100% of final implementation tree.
- Browser Use validation: targeted high-risk paths, not full site crawl.
- Representative enriched artist: Afterwise.
- Responsive check: at least one narrow mobile viewport for homepage, artist detail, releases, and Distro.

## Per-Task Verification Map

- 11-01 content model/data foundation:
  - `pnpm test:unit`
  - `pnpm check`
  - schema/source assertions for artist profile links, YouTube references, Distro group order, and optional Distro date.
- 11-02 artist detail:
  - `pnpm check`
  - `pnpm build`
  - Browser Use direct artist route and overlay route.
  - Browser Use check that app-shell player ownership remains intact.
- 11-03 homepage News and release banner:
  - `pnpm check`
  - `pnpm build`
  - Browser Use homepage and releases routes on desktop and a narrow viewport.
- 11-04 Distro grouping and copy:
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
  - Browser Use Distro route on desktop and a narrow viewport.
- 11-05 verification:
  - final `pnpm test:unit`
  - final `pnpm check`
  - final `pnpm build`
  - Browser Use acceptance pass for all Phase 11 high-risk paths.

## Wave 0 Requirements

No new test infrastructure is required before implementation. Existing unit tests may need focused updates when the Distro grouping helper and content model change.

## Manual-Only Verifications

- Visual quality of the artist story-first composition.
- Visual quality of optional YouTube embeds in direct and overlay artist routes.
- App-shell/player continuity through an enriched artist overlay.
- Mobile layout sanity for homepage News, artist detail, releases banner, and Distro grouping.

## Validation Sign-Off

Phase 11 is ready for execution only when all plans include deterministic validation commands and Browser Use manual checks for the rendered UI surfaces they affect.

## Final Validation Run - 2026-05-12

### Tooling Note

Browser Use was not exposed in this Codex session. DevTools MCP was used as the local rendered-validation fallback, and this note should not be treated as Browser Use evidence.

### Deterministic Commands

- `pnpm test:unit` - passed: 24 web test files / 144 tests, 28 backend test files / 146 tests, 1 API client test file / 2 tests.
- `pnpm check` - passed. Astro reported the existing Zod deprecation hints for `z.string().url()` and `z.string().email()`, with 0 errors and 0 warnings.
- `pnpm build` - passed, 114 static pages built.

### Rendered Acceptance Evidence

- Direct Afterwise artist route: rendered `Afterwise`, four story paragraphs, three profile/action links, one YouTube `youtube-nocookie.com` embed, no previous-release section, canonical `/blackbox-records/releases/disintegration/` release link, and no horizontal overflow.
- Direct Afterwise player check: Listen opened the app-shell player overlay and loaded the Bandcamp iframe `https://afterwise.bandcamp.com/track/silverfeedssilence`.
- App-shell artist overlay: clicking Afterwise from `/blackbox-records/artists/` opened the shell overlay, rendered the enriched artist content, preserved the canonical Disintegration link, rendered the YouTube embed, and kept no horizontal overflow.
- App-shell overlay player check: overlay Listen opened the player while the artist overlay remained open.
- Homepage News strip: rendered the News section and archive link, kept News out of global header navigation, and had no horizontal overflow on the narrow viewport.
- Releases route: rendered the latest-release feature before the grid, linked to `/blackbox-records/releases/disintegration/`, included the shared Listen trigger, preserved two release cards in the grid, and had no horizontal overflow on the narrow viewport.
- Distro route: rendered available groups in order as `Vinyl 12-inch`, `Vinyl 7-inch`, `Clothes`, `Tapes`; omitted empty `CDs` and fallback `Other`; rendered ten explicit month/year metadata rows; showed no visible `Vinyls`, `vinyls`, `TBA`, `Unknown`, or `TBD`; and had no horizontal overflow on the narrow viewport.
- DevTools console: no errors or warnings on checked routes.

### Content Limitation

The homepage News implementation renders up to three latest entries, but the repository currently contains one News Markdown entry: `apps/web/src/content/news/lorem-ipsum.md`. The final rendered check therefore confirmed one News card, not three. This is a content availability limitation, not a rendering failure.

### Final Status

Phase 11 implementation is accepted with the Browser Use tooling limitation and the current one-entry News content limitation recorded above.
