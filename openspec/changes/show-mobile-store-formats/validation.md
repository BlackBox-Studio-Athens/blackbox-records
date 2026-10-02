# Validation

## Source and scope

- Base source: `eae1dc9a6cd4d76bf8b61fa4ce2d7cc80664005f`, branch `claude/mobile-store-format-selection-ab45e0`.
- Changed: `StoreBrowsePane.astro`, `StoreDistroCatalog.astro`, `StoreCollectionPage.astro`, `StoreDistroSearch.tsx`, `global.css`, `DESIGN.md`, plus unit tests and `e2e/store-formats.spec.ts`. No API, content, commerce or dependency changes.
- Product Environment: Local. The shell/player row applies for navigation continuity. CMS, publication, commerce authority and release rows do not apply to this presentation change.

## Problem evidence

Before the change, PRD (`https://blackbox-records-web.pages.dev/store/distro/`) and UAT at 390px rendered the format links inside the closed `<details data-store-browse-disclosure>`. PRD's summary read `Browse All artists · All formats`, and All Store's read `Browse All artists`. Opening the disclosure worked, so the defect was discoverability.

## Checks

- Vitest (web config): `distro-format-navigation.test.ts`, `StoreDistroSearch.test.ts` and `shell-page-snapshot.test.ts` passed 3 files and 24 tests. Log: `.codex-artifacts/unit-formats.log`.
- `pnpm test:e2e e2e/store-formats.spec.ts` passed. At 390px the CDs chip is visible without opening anything; selecting it leaves one presented group, marks the chip `aria-current`, and causes no horizontal overflow. Log: `.codex-artifacts/e2e-formats.log`.
- Strict guarded OpenSpec validation passed.
- `pnpm validate` runs on the final tree after this note. Its summary path and status are retained in `.codex-artifacts/validation/` (latest run).

## Browser acceptance (Local, built-in browser)

- 390px Store Distro: six chips in three wrapped rows, `All formats` selected with a check mark. Selecting CDs presented only CDs.
- 320px All Store: five Distro chips wrapped with no overflow, followed by the `Artist` disclosure and `Top`.
- 1280px Store Distro: the sticky pane keeps the uppercase block ledger. Measured spacing is 12px above the ledger and 24px from ledger to artists, which matches the previous layout.

## Unverified

- UAT and PRD presentation until the change is released and promoted. PRD is the target environment.
- The baseline scenario "Distro search query is active" says the format landmark hides during search. No current code does this; the gap predates this change and is left unchanged.

## Follow-up: native mobile artist select (2026-10-02)

- Base source: `23b2161e`, branch `main`. Changed `StoreBrowsePane.astro`, `StoreDistroSearch.tsx`, `global.css`, `shell-page-snapshot.ts`, their unit tests and `scripts/check-store-category-output.ts`.
- Problem: PRD at 390px showed `Artist` as a bare text summary below bordered chips; opening it revealed about 100 radios in a nested 22rem scroller.
- Vitest (web config): `distro-format-navigation.test.ts` and `shell-page-snapshot.test.ts` passed 2 files and 11 tests.
- Local side-port Astro (4335, this tree; the stack on 4321 served an older build), Playwright Chromium: at 390px the `ARTIST` select is 44px high with 83 options and no horizontal overflow; choosing Afterwise left `1 item`, synced the hidden radio, and Clear filters reset the select to All artists. At 320px no overflow. At 1280px the select is `display: none` and the radio list shows.
- Unverified: real iOS and Android pickers, UAT and PRD until release.
