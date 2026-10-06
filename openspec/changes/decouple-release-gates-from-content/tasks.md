# Tasks

## 1. Repository gates

- [x] 1.1 Give validation runs unique ids and omit `--nxBail` in CI; cover both in `scripts/validate.test.mjs`.
- [x] 1.2 Select image-markup detail pages by route pattern and the first page that renders the checked classes, treating single cover and gallery as alternatives; cover it in `apps/web/test/assets/check-image-markup.test.ts`.
- [x] 1.3 Sample UAT static media from the first published page per section with a content image; cover it in `apps/backend/test/scripts/smoke-uat-static.test.ts`.
- [x] 1.4 Omit a missing PRD Holding Page action with a build warning; keep `apps/web/scripts/check-prd-holding.ts` failing when either action is missing.

## 2. Remaining

- [ ] 2.1 Make the UAT provider smoke content-independent. `scripts/stripe-sandbox-smoke/constants.ts` pins `disintegration-black-vinyl-lp` and `atopia-atopia-cd`, and expected price, name and image come from repository content through `loadStripeCatalogStoreItemContracts`. The provider smoke is no longer a release gate (the archived `simplify-software-release` removed `accept-uat-providers` from `pages.yml`); it runs only as the manual `uat-smoke.yml`, so a withdrawn, renamed or repriced item or drained stock no longer blocks promotion. This task now belongs to that manual provider smoke. Select the first checkout-ready fixed-price item and the first pay-what-you-want item from the UAT Worker (`/api/store/listing-prices`, `/api/store/items/<slug>`), thread slug and variant through `scenario-policy.ts`, `d1-sql.ts` and `checkout-surface.ts`, take expected values from the Worker offer and runtime catalog, and add a failing-first test in `apps/backend/test/scripts/stripe-sandbox-smoke.test.ts` with a catalog lacking both slugs. Until then, the manual provider smoke is not content-independent.

## 3. Acceptance

- [x] 3.1 Run `pnpm validate` on the final tree and `pnpm openspec -- validate decouple-release-gates-from-content --type change --strict`; record evidence in `validation.md`. Done 2026-10-07; see `validation.md`.
- [x] 3.2 Confirm the next Release BlackBox push run passes validate, the image-markup check and the push-run UAT static smoke (the last steps of `deploy-uat`). Confirmed 2026-10-07: push runs `37531332465` and `37534311548` passed validate, the image-markup check inside the e2e `build:web` and the `deploy-uat` static smoke (`37534311548` after one rerun of `deploy-uat`, for the Pages fail-closed setting).
