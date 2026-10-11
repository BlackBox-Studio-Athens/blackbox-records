# Validation

Local, 8 October 2026, source SHA `b9926275bf99036910bfac33fc9553bec352ab2f` with this change uncommitted.

## Repository checks

- `pnpm validate`: passed, `mode: local`, run `2026-10-08T12-40-25-859Z-59156-ca06a8` (`.codex-artifacts/validation/…/summary.json`), source fingerprint `75dab619…88cbb` unchanged before and after. A first run failed `@blackbox/web:lint` because the record photo sat under `src/assets` (storefront-catalog internals); it now lives beside `ReleaseCard.astro` in the editorial module.
- `pnpm test apps/web/src/components/editorial`: passed (web-editorial, web-pages, app-shell).
- `pnpm openspec -- validate share-release-edition-link --type change --strict`: valid.

## Browser acceptance (Shell/player/routing row)

Product Environment: Local. The full stack on 4321 served a prebuilt site, so checks ran against `astro dev` from this checkout on 4331 (`BLACKBOX_E2E=1`) with a Playwright override config in `.codex-artifacts/pw-4331.config.ts`.

- `e2e/release-merchandising.spec.ts`, chromium-desktop and chromium-mobile: 41 passed, 1 failed. The failure, "Releases keeps badge typography and date spacing after entering from Home at 390px", times out clicking Home's footer Releases link under a fixed clock before Releases loads; it passed in the previous full run and in 5 of 6 repeats, so it is dev-server flakiness outside this change. CI runs the whole suite.
- Playwright pass at 1440px with listing prices unavailable: all three cards (lead, supporting, catalog) carry `data-release-edition-link`, artwork and action share one Store href, the artwork is named "<Title>, Vinyl edition", the record photo is not requested at load and is requested once on first card hover (26 KB), hovering the artwork or the action slides the lead record 24% down and closes the brackets identically, hovering Listen leaves the record at rest, and the page has no horizontal overflow. The supporting record slides out to the right.
- With a stubbed pre-order offer, hovering Pre-order vinyl slides the record and gives the action its pre-order fill; hovering the artwork does the same.

## Not verified

Firefox and Safari rendering of `transition-behavior: allow-discrete` (without it the photo clears as the record slides back), hosted UAT/PRD, and the push-only runtime bundle budget (`pnpm build:web`), which inlines the larger stylesheet.
