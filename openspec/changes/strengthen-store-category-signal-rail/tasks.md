## 1. Prerequisite and approved visual contract

- [ ] 1.1 Confirm `refine-store-catalog-discovery` is accepted and archived, then reconcile its All format-discovery contract by preserving derived groups, order, counts, canonical links, and no-JavaScript behavior while removing only the repeated Distro intro and standalone subtotal.
- [ ] 1.2 Use `docs/ui-mockups/store-category-signal-rail-poc.png` and `docs/ui-mockups/store-orientation-approved-poc.png` as visual references while treating OpenSpec, repository tokens, accessible reflow, and source-derived values as implementation authority.
- [ ] 1.3 Confirm the implementation applies the selected research IDs recorded in `design.md` without adding a runtime consumer for `docs/ui-design-patterns.csv`.

## 2. Signal rail implementation

- [ ] 2.1 Update `StoreCategoryNavigation.astro` to render two full-cell columns on narrow screens, one equal-width desktop row, complete wrapping labels, at least 44px targets, and an odd final mobile category without a placeholder cell.
- [ ] 2.2 Apply the active foreground/weight, 3px Store-accent rule, restrained Store-accent tint, and distinct inactive/hover/focus states using existing tokens, static native links, and only colour/background/border transitions.

## 3. Purpose-specific Store orientation panels

- [ ] 3.1 Refine the All branch in `StoreCollectionPage.astro` to render `Store shelf`, the existing shelf-purpose headline, one source-derived total, and source-derived Distro format links/counts while removing the repeated All heading, collection-total block, Distro paragraph, and separate Distro subtotal.
- [ ] 3.2 Add the compact BlackBox Releases branch using the existing category label, category description, and source-derived total without changing metadata copy; retain a safe generic non-Distro branch for future populated Merch.
- [ ] 3.3 Add scoped responsive styling for the ruled desktop ledger and compact BlackBox band, then stack both with content-driven height, complete text, and 44px format links at narrow widths and enlarged text.
- [ ] 3.4 Update `StoreCollectionPage.test.ts` and static Store output assertions for source-derived totals, canonical format links, information appearing once, BlackBox-specific composition, generic fallback behavior, and absence of hardcoded approved-PoC counts in component logic.

## 4. Explicit Coverflow catalog depth

- [ ] 4.1 Update `StoreDistroCatalog.astro` to derive total, fixed preview count, remainder, and preview ratio once per eligible group and render the three labelled values, accessible summary sentence, decorative continuation rail, and primary `View all {total}` action without duplicating Store Item nodes.
- [ ] 4.2 Preserve current toggle/status/snapshot data hooks, active-record live status, native item links, six-item preview order, exclusive modes, search ownership, focus transfer, and unsupported/no-JavaScript full-catalog fallback.
- [ ] 4.3 Add compact responsive Coverflow-band styling with secondary Previous/Next controls, a distinct 44px full-catalog action, labelled reflow at 320px/zoom, and no pagination dots, thumbnails, drag affordance, or horizontal-scroll dependency.
- [ ] 4.4 Add one-shot transform/opacity CSS motion using the source-derived ratio and existing state attributes: fill and retain the visible rail during the first 180ms of disclosure, start the hard-edged catalog reveal only after the fill, finish by 480ms, and make reduced-motion transitions immediate and static.

## 5. Focused regression coverage

- [ ] 5.1 Extend Store category render/style tests for landmark naming, native/base-aware links, exact order, `aria-current`, active-state hooks, independent focus, target sizing, three/four-category output, narrow two-column reflow, and odd final-category span.
- [ ] 5.2 Extend Coverflow server/style tests for source-derived total/preview/remainder, labelled rail semantics, primary disclosure hierarchy, preview-only visibility, responsive geometry, no-JavaScript fallback, and reduced-motion rules.
- [ ] 5.3 Extend `StoreDistroSearch.test.ts` only where presentation hooks require it, proving Previous/Next, disclosure/collapse, focus, search, transition cleanup, and exclusive modes retain current behavior without a new state model.
- [ ] 5.4 Extend app-shell snapshot restoration tests so cached Distro re-entry restores the source-authored preview counts, ratio, labels, first-record state, and clean transition attributes.

## 6. Visual, accessibility, and performance validation

- [ ] 6.1 Compare Browser Use captures with both approved PoCs at matching desktop, 390px, and 320px viewports; correct hierarchy, density, rules, type, alignment, and active-state mismatches.
- [ ] 6.2 Validate direct and shell-managed Store switching, current state, ordinary format/item links, keyboard focus, 200% text sizing, 400% zoom equivalent, reduced motion, no-JavaScript fallback, and console cleanliness with Browser Use.
- [ ] 6.3 Confirm one-shot rail/remainder motion, full-catalog disclosure, catalog return, search entry/clear, and shell restoration meet existing Coverflow timing, LCP, CLS, INP, and long-task budgets without looping or layout animation.

## 7. Final verification and handoff

- [ ] 7.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final implementation tree.
- [ ] 7.2 Run `pnpm openspec -- validate strengthen-store-category-signal-rail --strict` and record implementation evidence in the change.
