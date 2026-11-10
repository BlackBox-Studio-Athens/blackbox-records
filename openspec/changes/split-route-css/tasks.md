# Tasks

## 1. Baseline and measurement

- [ ] 1.1 [Codex] Extend `scripts/check-runtime-bundle-graphs.ts` to report render-blocking CSS per public route (emitted files, raw and maximum-quality Brotli bytes) and to enforce the spec's Home and per-route gates behind a recorded baseline; verify with its tests and a `pnpm build:web` report.
- [ ] 1.2 [Claude] Record the baseline commit, CSS byte report, 0-pixel noise-control screenshots (390×844 and 1440×900, reduced motion, every route the spec lists) and three `mobile-load` runs on Home and Store in `validation.md`; verify that each artifact path exists and that the measurement reports `treeUnchanged=true`.

## 2. Route styles before the swap

- [ ] 2.1 [Claude] Make the shell page loader await newly adopted route stylesheets (`load` or `error`, capped at 1,000 ms) before resolving a snapshot, with no wait for links already present; verify with `shell-page-loader` and `shell-page-snapshot` unit tests for loaded, failed, slow and already-linked stylesheets.
- [ ] 2.2 [Claude] Extend the `e2e/shell-navigation.spec.ts` layout-shift regression to delay the Store stylesheet and require no catalog shift after the swap; verify that it fails without 2.1 and passes with it on chromium-mobile and chromium-desktop, and that `e2e/player-continuity.spec.ts` passes.

## 3. Cascade inventory

- [ ] 3.1 [Claude] Inventory `global.css` rule groups by the routes and islands that render their classes, mark each group route-only, shell-wide or shared, and list each unlayered rule's later same-element competitors; record the inventory in `design.md` or `validation.md` and confirm it covers every group above 1 KB from `css-profile.cjs`.

## 4. Route-owned CSS slices

- [ ] 4.1 [Claude] Move checkout and checkout-return rules into CSS owned by their components, keeping layer context; verify 0-pixel checkout screenshots at both viewports, the checkout e2e specs and the CSS byte report.
- [ ] 4.2 [Claude] Move Store Item page rules into component-owned CSS; verify 0-pixel Store Item screenshots, `e2e/store-item-preorders.spec.ts` and `e2e/store-formats.spec.ts`, and the byte report.
- [ ] 4.3 [Claude] Move Store collection page rules into component-owned CSS; verify 0-pixel Store and Distro screenshots, `e2e/store-crate.spec.ts`, `e2e/store-cart.spec.ts`, `catalog-containment.test.ts` and the byte report.
- [ ] 4.4 [Claude] Move Home-only section rules into component-owned CSS, unless 3.1 shows that another route renders them; verify 0-pixel Home screenshots, the Home e2e specs (`home-*.spec.ts`) and the byte report.
- [ ] 4.5 [Claude] Stop when the Home gate passes or when the remaining groups are shared; update the CSS contract tests in `apps/web/src/styles/*-css.test.ts` that read moved rules from `global.css`, and verify `pnpm test apps/web/src/styles`.

## 5. Integration checks

- [ ] 5.1 [Claude] Run the matched screenshot set on all spec routes, three `mobile-load` runs on the final build and the shell-navigation, routes and player-continuity e2e suites; record per-run FCP, LCP and CLS with the build identity in `validation.md`, without claiming gains within the run spread.
- [ ] 5.2 [Coordinator] Pass strict OpenSpec validation, `pnpm validate` on the final tree and one Graphify update; record the evidence.

## Workflow follow-up

- Software Release and UAT acceptance follow the normal release gates; this change does not touch Content Publication.
- Archive after release acceptance.
