## 1. Prerequisite and approved visual contract

- [x] 1.1 Confirm `refine-store-catalog-discovery` is accepted and archived, then reconcile its All format-discovery contract by preserving derived groups, order, counts, canonical links, and no-JavaScript behavior while removing only the repeated Distro intro and standalone subtotal.
- [x] 1.2 Use `docs/ui-mockups/store-category-signal-rail-poc.png` and `docs/ui-mockups/store-orientation-approved-poc.png` as visual references while treating OpenSpec, repository tokens, accessible reflow, and source-derived values as implementation authority.
- [x] 1.3 Confirm the implementation applies the selected research IDs recorded in `design.md` without adding a runtime consumer for `docs/ui-design-patterns.csv`.

## 2. Signal rail implementation

- [x] 2.1 Update `StoreCategoryNavigation.astro` to render two full-cell columns on narrow screens, one equal-width desktop row, complete wrapping labels, at least 44px targets, and an odd final mobile category without a placeholder cell.
- [x] 2.2 Apply the active foreground/weight, 3px Store-accent rule, restrained Store-accent tint, and distinct inactive/hover/focus states using existing tokens, static native links, and only colour/background/border transitions.

## 3. Purpose-specific Store orientation panels

- [x] 3.1 Refine the All branch in `StoreCollectionPage.astro` to render `Store shelf`, the existing shelf-purpose headline, one source-derived total, and source-derived Distro format links/counts while removing the repeated All heading, collection-total block, Distro paragraph, and separate Distro subtotal.
- [x] 3.2 Add the compact BlackBox Releases branch using the existing category label, category description, and source-derived total without changing metadata copy; retain a safe generic non-Distro branch for future populated Merch.
- [x] 3.3 Add scoped responsive styling for the ruled desktop ledger and compact BlackBox band, then stack both with content-driven height, complete text, and 44px format links at narrow widths and enlarged text.
- [x] 3.4 Update `StoreCollectionPage.test.ts` and static Store output assertions for source-derived totals, canonical format links, information appearing once, BlackBox-specific composition, generic fallback behavior, and absence of hardcoded approved-PoC counts in component logic.

## 4. Explicit Coverflow catalog depth

- [x] 4.1 Update `StoreDistroCatalog.astro` to derive total, fixed preview count, remainder, and preview ratio once per eligible group and render the three labelled values, accessible summary sentence, decorative continuation rail, and primary `View all {total}` action without duplicating Store Item nodes.
- [x] 4.2 Preserve current toggle/status/snapshot data hooks, active-record live status, native item links, six-item preview order, exclusive modes, search ownership, focus transfer, and unsupported/no-JavaScript full-catalog fallback.
- [x] 4.3 Add compact responsive Coverflow-band styling with secondary Previous/Next controls, a distinct 44px full-catalog action, labelled reflow at 320px/zoom, and no pagination dots, thumbnails, drag affordance, or horizontal-scroll dependency.
- [x] 4.4 Add one-shot transform/opacity CSS motion using the source-derived ratio and existing state attributes: fill and retain the visible rail during the first 180ms of disclosure, start the hard-edged catalog reveal only after the fill, finish by 480ms, and make reduced-motion transitions immediate and static.

## 5. Focused regression coverage

- [x] 5.1 Extend Store category render/style tests for landmark naming, native/base-aware links, exact order, `aria-current`, active-state hooks, independent focus, target sizing, three/four-category output, narrow two-column reflow, and odd final-category span.
- [x] 5.2 Extend Coverflow server/style tests for source-derived total/preview/remainder, labelled rail semantics, primary disclosure hierarchy, preview-only visibility, responsive geometry, no-JavaScript fallback, and reduced-motion rules.
- [x] 5.3 Extend `StoreDistroSearch.test.ts` only where presentation hooks require it, proving Previous/Next, disclosure/collapse, focus, search, transition cleanup, and exclusive modes retain current behavior without a new state model.
- [x] 5.4 Extend app-shell snapshot restoration tests so cached Distro re-entry restores the source-authored preview counts, ratio, labels, first-record state, and clean transition attributes.

## 6. Visual, accessibility, and performance validation

- [x] 6.1 Compare Browser Use captures with both approved PoCs at matching desktop, 390px, and 320px viewports; correct hierarchy, density, rules, type, alignment, and active-state mismatches.
- [x] 6.2 Validate direct and shell-managed Store switching, current state, ordinary format/item links, keyboard focus, 200% text sizing, 400% zoom equivalent, reduced motion, no-JavaScript fallback, and console cleanliness with Browser Use.
- [x] 6.3 Confirm one-shot rail/remainder motion, full-catalog disclosure, catalog return, search entry/clear, and shell restoration meet existing Coverflow timing, LCP, CLS, INP, and long-task budgets without looping or layout animation.

## 7. Final verification and handoff

- [x] 7.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final implementation tree.
- [x] 7.2 Run `pnpm openspec -- validate strengthen-store-category-signal-rail --strict` and record implementation evidence in the change.

## 8. Approved Distro cohesion extension

- [x] 8.1 Review the configured shadcn registries and compare the available carousel patterns against the existing Coverflow; retain the current zero-dependency controller unless a registry option covers its full progressive behavior without duplication.
- [x] 8.2 Recompose the Distro title, existing description, one source-derived total, and search slot as a compact purpose-specific orientation panel; remove idle search-count duplication while preserving active result status, Clear search, and format navigation.
- [x] 8.3 Restyle eligible Coverflow groups as one smaller square-edged artwork rack joining overview, live record identity, and stage without changing the six card nodes, controller, modes, disclosure timing, or fallbacks.
- [x] 8.4 Extend focused Astro, search, style, output, and snapshot tests for the Distro panel, non-duplicative idle search, active search status, compact Coverflow geometry, and preserved interaction contracts.
- [x] 8.5 Validate desktop, 390px, 320px, enlarged text, reduced motion, no-JavaScript, direct/shell navigation, Coverflow controls/disclosure, search, focus, and console state with Browser Use; update `design-qa.md` to `final result: passed`.
- [x] 8.6 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, Store output verification, and strict OpenSpec validation, record evidence, then amend the local snapshot commit.

## 9. Full-catalog Coverflow position extension

- [x] 9.1 Revise the Coverflow server contract so every eligible group entry belongs to the existing controller in canonical order while at most six positioned cards remain presented in preview mode and the complete no-JavaScript/catalog fallback stays unchanged.
- [x] 9.2 Replace fixed preview progress with source-derived active position, remaining-after-current value, and `You're viewing {current} of {total}` summary; align all three stat values and labels at desktop and narrow widths.
- [x] 9.3 Extend the existing controller and shell snapshot sanitizer for arbitrary group size, six visible positions, offstage removal from presentation/focus order, dynamic position state, and a Store-accent rail that glides to the active ratio with an immediate reduced-motion equivalent.
- [x] 9.4 Extend focused server, controller, CSS, and shell snapshot tests for 53-item traversal, item 34 state, full wrap, six-position staging, current ratio motion, and progressive fallbacks.
- [x] 9.5 Validate the revised Coverflow at desktop, 390px, and 320px with Browser Use, including item 34, wrap, disclosure/return, keyboard focus, reduced motion, no-JavaScript fallback, shell restoration, and console state; update `design-qa.md` to `final result: passed`.
- [x] 9.6 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, Store output verification, WebStorm build, and strict OpenSpec validation, record evidence, then amend the local snapshot commit.

## Implementation evidence

- Prerequisite: archived `refine-store-catalog-discovery` after strict validation and synced its Store-category deltas into baseline specs.
- Static output: `pnpm store:categories:check` passed with All 81, BlackBox Releases 3, Distro 79, and the empty Merch redirect.
- Browser Use visual QA: compared the approved PoCs with combined desktop and mobile comparison boards; `design-qa.md` records `final result: passed`.
- Browser Use responsive/accessibility QA: passed direct and shell-managed Store switching, `aria-current`, focus reset, native format/item links, 44px targets, 390px and 320px layouts, 200% text sizing, 400%-zoom-equivalent reflow, reduced motion, no-JavaScript full-catalog access, and console checks.
- Browser Use interaction QA: passed Previous/Next, View all, Show Coverflow, search entry, Clear search, exclusive modes, catalog return, and shell restoration.
- Browser Use production traces: five valid disclosure runs completed in catalog mode with no application slice at or above 50ms; the largest layout slice was 5.231ms. The load trace had no 50ms slice, and the change adds no request, eager JavaScript graph, image, font, or LCP-owned asset. CSS/controller coverage fixes disclosure at 180ms rail fill plus 300ms catalog reveal, with immediate reduced-motion states.
- Distro registry review: official shadcn and the configured 21st, Magic UI, Aceternity, Blocks, and Hexta registries offered flat Embla or card-carousel patterns, but no option preserved the six-cover 3D shelf, search handoff, full-catalog disclosure, no-JavaScript catalog, and shell snapshot restoration. The existing controller was retained with no dependency or duplicate-card graph.
- Distro extension Browser Use QA: passed the ruled orientation panel, single idle collection total, active-only result count, Clear search, format navigation restoration, six-cover rack, Previous/Next, View all/Show Coverflow, shell-managed All→Distro return, focus reset, 44px controls, 1380px/390px/320px reflow, reduced-motion static grid, no horizontal overflow, and clean console.
- Distro extension visual comparison: `.codex-artifacts/store-distro-redesign/distro-panel-comparison.png` and `.codex-artifacts/store-distro-redesign/distro-coverflow-comparison.png` were reviewed as combined source/implementation inputs; `design-qa.md` remains `final result: passed`.
- Full-catalog Coverflow Browser Use QA: passed all 53 records in canonical order with six staged covers, record 34 reporting `34 of 53` and `19 More` at a 34/53 rail ratio, record 53 wrapping to record 1, side-cover focus transfer, full disclosure/return, search, shell restoration, reduced motion, no-JavaScript fallback, clean console, and overflow-free 1380px/390px/320px layouts.
- Full-catalog Coverflow visual comparison: the supplied reference and rendered 1305×749 state were reviewed together in `.codex-artifacts/store-distro-redesign/distro-coverflow-request-comparison.png`; `design-qa.md` records `final result: passed`.
- Independent diff review: no actionable findings across arbitrary-count traversal, six-position staging, stat semantics, position rail, focus, progressive fallbacks, snapshot reset, tests, or OpenSpec consistency.
- Final gates: `pnpm test:unit` passed (web 487, backend 432 across both suites, API client 6); `pnpm check` passed; WebStorm project build passed; `pnpm build` passed with 277 pages plus cache, brand-font, and image-markup validation; Store category static output checks passed.
- OpenSpec: `pnpm openspec -- validate strengthen-store-category-signal-rail --strict` passed.
