## 1. Establish the Baseline

- [x] 1.1 Run `pnpm openspec:guard`, archive the completed `clarify-releases-page-hierarchy` change, and confirm its three-tier requirements are present in the baseline `release-catalog-presentation` spec before editing runtime files.
- [x] 1.2 Re-run strict validation for the archived baseline and confirm the selected research memo and Evolved Split Showcase PoC remain available as implementation evidence.

## 2. Add the Layout Contract

- [x] 2.1 Add `apps/web/src/styles/releases-page-layout.test.ts` with focused assertions for the compact route identity, latest–Upcoming–Our Releases source order, 12-track wide placement, full-width lower row, sparse-card alignment, and narrow stacked reflow.
- [x] 2.2 Run the focused test against the unchanged route and confirm it fails only for the planned redesign differences, while existing release-selection tests continue to pass.

## 3. Recompose the Releases Route

- [x] 3.1 Replace the Releases call to shared `InternalPageHero` with a route-local `Catalog` eyebrow and single `Releases` `h1`, retaining `transition:name="internal-page-hero-title"` and leaving the shared component unchanged.
- [x] 3.2 Keep the existing latest feature, Upcoming, and Our Releases blocks in semantic source order while adding only the release-scoped structure and class hooks required by the showcase.
- [x] 3.3 Preserve current player triggers, detail and commerce links, prefetch attributes, optional-content guards, image priority/loading, release order, and framed-artwork `ReleaseCard` usage during the markup change.

## 4. Implement the Evolved Split Showcase

- [x] 4.1 Update release-scoped rules in `apps/web/src/styles/global.css` so viewports at or above 64rem use a 12-track grid with an 8-track latest feature, 4-track Upcoming rail, and full-width Our Releases row.
- [x] 4.2 Implement one continuous separator system and absence-aware placement so missing tiers leave no empty columns, rows, headings, rules, or placeholders.
- [x] 4.3 Keep a single remaining release left aligned at normal catalog-card width, while multiple remaining releases retain the existing responsive two/three-column grid and catalog order.
- [x] 4.4 Implement intrinsic narrow reflow at 390px and 320px with `min-width: 0`, wrapping content/actions, no fixed-height clipping, no showcase-caused horizontal scrolling, visible focus, current target sizes, and existing reduced-motion behavior.

## 5. Verify and Hand Off

- [x] 5.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final implementation tree.
- [x] 5.2 Use native Codex Browser Use to verify direct and shell-managed `/releases/` navigation at desktop, 390px, and 320px, plus enlarged text or zoom and reduced motion.
- [x] 5.3 In Browser Use, confirm each current release appears once; focus/source order is latest, Upcoming, then Our Releases; player launch/minimize/reopen/stop, detail overlay, and optional commerce navigation still work; and no horizontal overflow or console errors appear.
- [x] 5.4 Run `pnpm openspec -- validate redesign-releases-evolved-split-showcase --strict` and `git diff --check`, then review the final diff for changes outside the route, release-scoped CSS, focused test, and planned OpenSpec/docs surfaces.
