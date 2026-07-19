## 1. Establish the Baseline and Regression Contract

- [x] 1.1 Run `pnpm openspec:guard`, archive the completed `redesign-releases-evolved-split-showcase` change through the OpenSpec archive workflow, and confirm its Releases identity and showcase requirements are present in baseline `openspec/specs/release-catalog-presentation/spec.md` before editing overlapping runtime files.
- [x] 1.2 Add `apps/web/src/lib/page-identity.test.ts` and `apps/web/src/styles/section-page-identity.test.ts`, then extend `apps/web/src/styles/releases-page-layout.test.ts` plus `apps/web/src/lib/store-categories.test.ts`; directly exercise case/whitespace normalization and supporting-label omission, and cover shared title typography ownership, the exact custom identity pairs, and `Store` / `All`. Run the focused Vitest files against the unchanged runtime and confirm they fail only for the planned differences.

## 2. Standardize Page Identity

- [x] 2.1 Add the pure supporting-label resolver in `apps/web/src/lib/page-identity.ts`, use it from `apps/web/src/components/InternalPageHero.astro` to omit only an equivalent or empty label while retaining the authored `h1`, and run the behavioral resolver test plus focused shared-hero wiring contract.
- [x] 2.2 Change only the base category `heading` in `apps/web/src/lib/store-categories.ts` from `Store` to `All`, keep its metadata title and all other category records unchanged, and run `apps/web/src/lib/store-categories.test.ts` plus `apps/web/src/components/store/StoreCollectionPage.test.ts`.
- [x] 2.3 Update `apps/web/src/pages/services/index.astro` to render `What We Do` / `Services` and apply `internal-page-hero__title` to its `h1` without changing the patterned intro, copy, or inquiry action.
- [x] 2.4 Apply `internal-page-hero__title` to the existing `Catalog` / `Releases` route-local `h1` in `apps/web/src/pages/releases/index.astro`, preserving its transition name and showcase markup.
- [x] 2.5 Remove the competing title font family, size, line height, letter spacing, and wrapping declarations from the Services and Releases title selectors in `apps/web/src/styles/global.css`, retain their route-specific layout/surface rules, and run the focused section-page identity, Releases layout, and Store category tests until green.

## 3. Verify Direct and Shell-Managed Rendering

- [x] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final implementation tree.
- [x] 3.2 Start the canonical background static site and use native Codex Browser Use to check direct loads and app-shell navigation for Artists, Releases, Store All, Services, and About at desktop, 390px, and 320px; confirm matching computed title typography, canonical distinct label/title pairs, one `h1`, no horizontal overflow, preserved Releases/Services composition and interactions, and no console errors.
- [x] 3.3 Run `pnpm openspec -- validate standardize-section-page-titles --strict` and `git diff --check`, then review the final diff for changes outside the shared hero, Store category heading, two custom intros, title CSS, focused tests, predecessor archive, and this OpenSpec change.
