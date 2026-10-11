# Tasks

## 1. Markup and hydration

- [x] 1.1 Rework the Releases variant of `ReleaseCard.astro` and `releases/index.astro`: one `releases-feature` block for both featured roles, the new copy order with Listen below the artist, contained cover frames for every role, no catalog Listen overlay or scrim, the hidden More releases heading, price and terms nodes, the purchase label span, `data-release-name`, the catalog record mark and the new image `sizes`. Verify with `pnpm test apps/web/src/pages/_releases-page-layout.test.ts`.
- [x] 1.2 Add the price, label span, accessible name and terms handling to `release-presentation.ts`, and the optional Listen context to `MusicStreamingServiceListenTrigger.astro`. Verify with `ReleaseCatalogPresentation.test.ts` and `shell-page-snapshot.test.ts` cases for each state.
- [x] 1.3 Export `StoreBuyIcon.tsx` from `web-store` and extend the `releases-merchandising` contract note. Verify with the boundary check selected by `pnpm validate`.

## 2. Styles and documentation

- [x] 2.1 Replace the Releases rules in `global.css` with the twin-row, catalog tile, price, terms and catalog Buy chrome rules, keeping other variants' rules. Verify with `_releases-page-layout.test.ts`, `_catalog-description-typography.test.ts`, `touch-ergonomics-css.test.ts` and `music-listen-trigger-css.test.ts`.
- [x] 2.2 Update the Releases slot in `apps/web/scripts/check-image-markup.ts` and the Releases and Listen placement paragraphs in `DESIGN.md`.

## 3. Acceptance

- [x] 3.1 Update and run `e2e/release-merchandising.spec.ts` and `e2e/store-formats.spec.ts`; rerun `e2e/player-continuity.spec.ts` and `e2e/shell-navigation.spec.ts`.
- [x] 3.2 Compare the Local page with canvas v10 at 320, 390, 768, 1024, 1440 and 2120 px: equal featured covers, no overflow, keyboard order and focus, 200% text, reduced motion, Listen and player continuity, direct load and shell entry. Measure layout shift while offers hydrate at 390 and 1440 (target 0.02, budget 0.1).
- [x] 3.3 Refresh the local Graphify index, run `pnpm openspec -- validate stack-releases-twin-features --type change --strict` and `pnpm validate` on the final tree, and record source-bound evidence in `validation.md`.

The approved canvas (Releases Stacked Layouts, option A, version 10) is the shape brief; image generation is not needed. Content fixes for the LOTUS summary and cover alt text belong to Content Publication and are not part of this change.
