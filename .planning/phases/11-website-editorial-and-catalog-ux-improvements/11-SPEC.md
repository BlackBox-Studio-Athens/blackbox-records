---
phase: 11
slug: website-editorial-and-catalog-ux-improvements
status: planned
created: 2026-05-12
source: partner handwritten website notes
---

# Phase 11 - Website Editorial And Catalog UX Improvements Spec

## Objective

Turn the partner's handwritten website-improvement notes into one implementation-ready GSD phase that improves editorial richness, homepage freshness, release prominence, and distro/catalog clarity without changing commerce authority boundaries.

## Source Notes

Transcribed from the partner note:

- Artist pages:
  - bio and links should sit on the right or otherwise become more prominent.
  - bio content should allow proper paragraphs.
  - add videos.
  - add previous releases.
  - add a list/listen player under the latest release.
- Releases:
  - add a top banner for the latest release.
- Homepage:
  - replace the current latest releases module with news.
- Vinyls/distro:
  - show release date on each entry.
  - separate vinyls into 12-inch and 7-inch groups.
  - fix descriptions.
- Add a CD section under distro.
- Ambiguous note: "hide all sections from main page?" is not accepted scope until clarified.

## Requirements

- `SITE-ARTIST-01`: Artist detail pages must support richer artist profile content: multi-paragraph biography, optional links, optional videos, latest release, previous releases, and a player/listen action near latest release context.
- `SITE-RELEASE-01`: `/releases/` must feature the latest release in a top banner before the release grid.
- `SITE-HOME-01`: The homepage must replace the current Latest Releases section with a News section using current news content and links.
- `SITE-DISTRO-01`: Distro/catalog entries must support optional release date metadata and render it where present.
- `SITE-DISTRO-02`: Distro grouping must distinguish 12-inch vinyl, 7-inch vinyl, CDs, Clothes, and Tapes without breaking current store item projection.
- `SITE-DISTRO-03`: Distro descriptions must be cleaned editorially, while preserving existing item identity, image, route, and commerce linkage.
- `SITE-VERIFY-01`: Implementation must pass standard repo gates and Browser Use rendered checks for desktop and mobile views.

## Boundaries

- This phase is UI/content/catalog planning and implementation. It must not alter Worker checkout, D1 stock, Stripe, BOX NOW, webhook, order, or feature-gate authority.
- Storefront and catalog data may expose display metadata, but the browser must still not own price, stock, payment, order, Stripe IDs, or backend secrets.
- Existing app-shell routing, overlays, and persistent player ownership must remain intact.
- The homepage hide-all-sections idea remains deferred unless a later discussion explicitly accepts a homepage simplification scope.

## Acceptance Criteria

- Artist pages render richer content cleanly on direct routes and app-shell overlays.
- Release index has a latest-release feature that does not duplicate broken navigation or player triggers.
- Homepage News replaces Latest Releases and preserves the rest of the homepage by default.
- Distro page renders the new grouping order and optional release dates without collection schema failures.
- Existing store item routes still resolve for release-derived and distro-derived items.
- `pnpm test:unit`, `pnpm check`, and `pnpm build` pass.
- Browser Use validation covers homepage, artist detail, artist overlay, releases, distro, representative store item continuity, and narrow mobile layout.
