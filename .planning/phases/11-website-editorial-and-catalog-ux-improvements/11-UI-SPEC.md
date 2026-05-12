---
phase: 11
slug: website-editorial-and-catalog-ux-improvements
status: planned
created: 2026-05-12
---

# Phase 11 - UI Design Contract

## Experience Principles

1. The site should feel more current and label-operated without becoming a generic ecommerce grid.
2. Artist pages should read like real roster profiles: quick context, useful links, media, latest release, and discography.
3. Homepage freshness should come from News, not from repeating release cards already available elsewhere.
4. Release and distro improvements must preserve the monochrome BlackBox visual language and existing shell behavior.
5. Distro should be easier to scan by physical format without adding marketplace-density controls.

## Artist Detail

- Desktop layout should make artist identity, bio, links, and latest release readable above the discography.
- Mobile layout should stack in this order:
  1. artist image and identity
  2. latest release/listen action
  3. bio
  4. links
  5. videos
  6. previous releases
- Artist links use compact text/icon rows, not large marketing cards.
- Videos should be embedded or linked in a restrained section that does not fight the music player modal.
- Previous releases should reuse existing release card language where possible.
- The player/listen action must use the existing embedded-player trigger attributes and app-shell player behavior.

## Homepage News Module

- Replace the current Latest Releases section in the first content slot after the hero.
- Render up to three latest news items by date.
- Keep a small section action linking to `/news/`.
- Do not remove Artists, Distro, Journey/About, or newsletter sections in this phase.

## Releases Feature Banner

- Add a latest-release banner at the top of `/releases/`.
- The banner should include cover image, artist, release title, year/date, short summary if present, and primary actions.
- The existing release grid remains below the banner and still includes the latest release unless implementation chooses a clearly documented de-duplication rule.
- Player actions must reuse current release-card/provider behavior.

## Distro Catalog

- Group order:
  1. Vinyls - 12-inch
  2. Vinyls - 7-inch
  3. CDs
  4. Clothes
  5. Tapes
  6. Other only if existing data cannot be classified safely
- Distro cards should show release date when provided, alongside existing format/eyebrow metadata.
- Descriptions should remain concise, editorial, and content-owned.
- No visible debug metadata, stock counts, Stripe IDs, or backend identifiers.

## Responsive And Accessibility Rules

- Keep card dimensions stable across hover and loading states.
- Text must not overlap images, controls, or adjacent cards at mobile widths.
- Headings must preserve meaningful hierarchy: one page `h1`, section `h2`, card titles below.
- Links, player buttons, and embedded video controls must have accessible labels or native accessible text.
- Browser Use validation is required for rendered homepage, artist direct route, artist overlay, releases, distro, and representative mobile views.

## Non-Goals

- No checkout UI redesign.
- No cart changes.
- No stock or availability UI changes.
- No visual rewrite of the global header/footer/shell.
- No removal of homepage sections beyond replacing Latest Releases with News.
