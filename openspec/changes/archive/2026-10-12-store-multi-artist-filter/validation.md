# Validation

## Source and repository checks

- Source SHA `258d41b87647c4f3549301e68d215fe96c97089a` with uncommitted working-tree changes; before/after fingerprint `b9777e4cadb8ea28f0d48f41d12113a836afb61871bdceaf5d6fd206a61a87a2` (28 files, unchanged during the run). The fingerprint also covers the uncommitted `alphabetize-main-store-by-band` and `migrate-stripe-to-blackboxrecords` edits already in the tree.
- `pnpm validate`: `mode: local`, status passed, `.codex-artifacts/validation/2026-10-08T21-40-51-845Z-59776-2580fa/summary.json`.
- `pnpm openspec -- validate store-multi-artist-filter --type change --strict`: valid.
- Focused unit tests: `StoreDistroSearch.test.ts`, `StoreListingPricePresentation.test.ts`, `distro-format-navigation.test.ts` and `src/components/app-shell/navigation` passed (167 tests).

## Product Environment and acceptance rows

Local. Rows: Shell/player/routing (Store filters, the phone sheet, snapshot sanitation and player continuity through Distro filters). Staff, CMS, commerce and release rows do not apply: no API, schema, checkout, stock or hosted change.

## Browser evidence

The full Local stack on 4321 served an older build, so checks ran against a side-port Astro dev server of this tree on 4335 (no Worker; prices read "Price unavailable", which these checks do not depend on).

- `pnpm exec playwright test -c .codex-artifacts/artist-check/playwright.side.config.ts e2e/store-formats.spec.ts e2e/store-preorders.spec.ts`: 24 passed, including the new desktop multi-artist test, the 390px Distro sheet flow and the 390px pre-order, format, artist and search combination. Summary: `.codex-artifacts/artist-check/summary.json`.
- `.codex-artifacts/artist-check/check.mjs` (Chromium):
  - 1280px Distro: two ticked artists show only their 4 items; `Selected · 2` lists them in server order; Space on a moved checkbox keeps focus; Find shows `No artist matches.` and narrows the list; Clear filters is Inter 700 16px underlined; clearing restores 98 items and the list order; the Artists chip is hidden; no page errors or horizontal overflow.
  - 390px and 375px Store All: the sheet opens with the list inside it, locks page scroll, `Show 4 items` closes it, focus returns to `Artists · 2`, and the list returns to the pane. With the Pre-orders chip forced visible with a 2-digit count, Artists (107px), Pre-orders (107px) and Clear filters (110px) share one row ending at 352px. At 360px Clear filters wraps to the next row. No horizontal overflow.
  - Screenshots: `.codex-artifacts/artist-check/desktop-1280.png`, `phone-390.png`, `phone-390-sheet.png`, `phone-375.png`, `phone-360.png`.

## Not verified

- Firefox and WebKit, real touch devices and screen readers.
- Shell snapshot restore with ticked artists in a browser (covered by the sanitizer unit test only).
- UAT and PRD, which wait for an authorized release.

## Observation

The artist list order comes from the existing `getStoreArtistChoices` sort, which places some Greek-script names before Latin ones (for example `Ατοπια` before `Adolf plays the Jazz`). This change keeps that order.
