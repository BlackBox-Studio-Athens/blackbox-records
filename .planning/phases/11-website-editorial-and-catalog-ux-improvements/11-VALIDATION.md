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
