# Design

## Context

Backend, web and staff were split into Nx module projects by `shorten-validation-release-feedback` and `modularize-staff-frontend`. Web kept one catch-all module, `storefront-catalog`, whose test target runs 41 files for any edit. See `proposal.md` and the delta spec.

## Goals / Non-Goals

**Goals:** Acyclic closed web feature modules using the existing `project.json` `metadata.boundaries` and `scripts/module-test-projects.ts` machinery, with no behavior change.

**Non-Goals:** Per-module lint or `astro check`, new tooling, or changes to routes, styles or the release flow.

## Decisions

- **Layering:** feature modules (`web-editorial`, later `web-artists` and `web-store`) depend on `storefront-catalog` and the existing leaf modules; `storefront-catalog` never depends on a feature module. All are `closed`, tags `module`, `scope:web`.
- **Slice 1 `web-editorial`** (root `apps/web/src/components/editorial`, flat): `NewsCard`, `ReleaseCard`, `NewsDetailContent`, `ReleaseDetailContent`, `HomeHero`, `release-commerce.ts` and `release-commerce.test.ts`. Depends on `storefront-catalog`, `player`, `ui-foundation`, `web-platform`. Exports the five components and `release-commerce.ts`, which `web-pages` imports.
- **Cycle decision:** `ArtistDetailContent` (staying in `storefront-catalog` until slice 2) imports `lib/release-feature.ts`, a dependency-free helper also used by the releases pages. Moving it to `web-editorial` would make `storefront-catalog` depend on `web-editorial`, which depends on `storefront-catalog`. It stays in `storefront-catalog` and remains an export.
- **Source-reading tests:** tests that read other modules' source as text live in the lowest module that depends on every file they read: `web-pages` (`pages/_*.test.ts`, ignored by Astro routing) or `web-layouts` (`distro-coverflow`, `catalog-containment`). This lets `storefront-catalog` drop its `apps/web/src/**/*.astro` test input, so an `.astro` edit no longer affects it and its dependents.
- **Consumers:** `web-pages` gains `web-editorial` in `dependsOn` and `implicitDependencies` (Nx cannot see `.astro` imports). Files in the moved modules keep `@/` aliases for other modules and use `./` only inside `web-editorial`.
- **Moving files:** `git mv` plus a scoped `sed` on specifiers; `astro check`, tests, eslint boundaries and the architecture check verify.
- **Slice 2 `web-artists`** (root `apps/web/src/components/artists`, flat): `ArtistCard`, `ArtistDetailContent`, `ArtistsRosterFilters`, `artist-roster-search` and its test. Depends on `storefront-catalog`, `player`, `ui-foundation`, `web-platform`. Exports the three presentation files; `app-shell` (lazy roster filters) and `web-pages` consume it. `storefront-catalog` now also exports `SocialIcon.astro` and `lib/exact-first-search.ts`.
- **Slice 3 `web-store`** (root `apps/web/src/components/store`, flat; nested `cart` and `checkout` stay separate modules): `StoreBrowsePane`, `StoreCategoryNavigation`, `StoreCoverflowControls`, `StoreCoverflowController`, `StoreDistroCatalog`, `StoreDistroSearch`, `StoreImageGallery`, `StoreListingPricePresentation`, `StoreOfferPriceDisplay`, `StoreItemCard` (from `components/cards`), `store-page-data` (from `lib`) and their tests. Depends on `storefront-catalog`, `player`, `store-cart`, `checkout-web`, `ui-foundation`, `web-platform`; exports the ten files other modules import. `app-shell`, `web-editorial` (`StoreImageGallery`), `web-layouts`, `web-pages` and `web-test-support` depend on it. `storefront-catalog` drops its store exports and gains `lib/item-availability.ts` (imported by `store-page-data`). `store-categories`, `store-collection`, `store-item-ownership`, `store-tax-category`, `distro-data` and `published-purchase-browser` stay in the core (catalog-data imports them, or nothing imports them). `styles/distro-format-navigation.test.ts` reads `StoreDistroCatalog` and `StoreBrowsePane` as text, so it moved to `web-layouts`.

## Alternatives Considered

- Moving `release-feature.ts` with the releases feature: creates a cycle, see above.
- Moving the multi-module source-reading tests into `web-editorial`: each would read files it does not own.

## Measurements

Slice 1 gate: `bddc501b` (before) against `23645406` (after), 3 timed runs per side after a warm-up, interleaved, `nx affected -t test --files=<f> --exclude=workspace,*-tooling --skip-nx-cache`. All runs passed. Raw data is in `.codex-artifacts/web-modules/bench/`. Values are medians with min-max ranges.

| Scenario                       | Before             | After              | Change                   | Test tasks run after                                                                                       |
| ------------------------------ | ------------------ | ------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Edit `release-commerce.ts`     | 22.6s (22.2-22.7s) | 5.4s (4.9-5.6s)    | about -76%               | `web-editorial`, `web-pages`                                                                               |
| Edit `NewsDetailContent.astro` | 22.8s (22.5-23.2s) | 22.3s (22.2-22.5s) | no measurable difference | `web-editorial`, `web-pages`, `storefront-catalog`, `app-shell`, `web-layouts`, `commerce-web-integration` |

A result is "no measurable difference" when the before and after ranges overlap or differ by under about 20%. `.astro` edits still reran `storefront-catalog` because its `test` target listed `apps/web/src/**/*.astro` as an input (its source-reading tests). The test-ownership move removed that input.

### Gate after test-ownership move and slice 2

`bddc501b` (before) against `13fd066d` (after slices 1 and 2 and the test-ownership move), same method (3 interleaved runs per side after a warm-up, `--skip-nx-cache`, `NX_DAEMON=false`), all runs passed. Medians with min-max ranges.

| Scenario                        | Before             | After           | Change     | Test tasks run after         |
| ------------------------------- | ------------------ | --------------- | ---------- | ---------------------------- |
| Edit `NewsDetailContent.astro`  | 20.8s (20.4-20.9s) | 6.9s (6.8-7.0s) | about -67% | `web-editorial`, `web-pages` |
| Edit `ArtistsRosterFilters.tsx` | 20.7s (20.5-21.1s) | 7.1s (6.8-7.7s) | about -66% | `web-artists`, `web-pages`   |
| Edit `ArtistCard.astro`         | 21.1s (20.6-21.4s) | 7.2s (7.0-7.7s) | about -66% | `web-artists`, `web-pages`   |

`web-pages` dominates the remaining time because it depends on every feature module. Nx does not see the lazy `app-shell` import of `ArtistsRosterFilters`, so a roster edit does not rerun `app-shell`; its tests only read `app-shell` files.

### Gate after slice 3

`bddc501b` (before) against `551f9adc` (after slice 3), same method (3 interleaved runs per side after a warm-up, `--skip-nx-cache`, `NX_DAEMON=false`), all runs passed. Medians with min-max ranges.

| Scenario                     | Before             | After              | Change     | Test tasks run after                                                                 |
| ---------------------------- | ------------------ | ------------------ | ---------- | ------------------------------------------------------------------------------------ |
| Edit `StoreDistroSearch.tsx` | 20.9s (20.7-21.2s) | 10.3s (10.1-10.5s) | about -51% | `web-store`, `web-editorial`, `web-pages`, `web-layouts`, `commerce-web-integration` |
| Edit `StoreItemCard.astro`   | 21.1s (21.1-21.4s) | 10.5s (9.9-10.6s)  | about -50% | same five                                                                            |
| Edit `store-page-data.ts`    | 20.9s (20.8-21.2s) | 10.1s (10.0-10.2s) | about -52% | same five                                                                            |

Before, the same edits ran `storefront-catalog`, `app-shell`, `web-layouts`, `web-pages` and `commerce-web-integration`. Slice 3 is kept. `web-editorial` now reruns because `ReleaseDetailContent` imports `StoreImageGallery`; `web-layouts` and `web-pages` still dominate the remaining time.

## Risks

- `storefront-catalog` stays the fan-in hub: an edit there reruns every feature module's tests.
- Identical reruns vary by up to 40% on this machine; differences under about 20% are noise.
