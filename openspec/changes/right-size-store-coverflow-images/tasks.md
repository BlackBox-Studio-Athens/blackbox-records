## 1. Characterize the Measured Boundary

- [x] 1.1 Record commit `81ce9976` as the baseline and verify its ignored raw evidence includes bundle, mobile-load, Store-activation, wide-scroll, mobile-scroll, and legacy-scroll outputs.
- [x] 1.2 Add a focused failing test proving Store Item and Distro cards share the bounded Coverflow preview `sizes` value while ordinary catalog sizes remain unchanged.

## 2. Right-Size Existing Coverflow Images

- [x] 2.1 Make `StoreItemCard.astro` use the bounded preview slot only when `coverflowPreview` is true; verify its existing width ladder, source, alt text, loading, card markup, and catalog slot remain unchanged.
- [x] 2.2 Make `DistroCard.astro` use the same bounded preview slot only when `coverflowPreview` is true; verify its home/page variants and ordinary catalog slot remain unchanged.
- [x] 2.3 Run the focused image and Store markup tests and verify the two card components cannot drift on the preview slot contract.

## 3. Evaluate the Responsive-Metadata Pass

- [x] 3.1 Build one exact implementation commit, run `pnpm performance:bundles`, and store outputs under ignored `.codex-artifacts/runtime-performance/<commit>/`.
- [x] 3.2 Rerun Store All and Store Distro mobile-stress load, Store activation, wide scroll, mobile scroll, and legacy scroll; verify reduced transfer/LCP, one listing projection per activation, zero per-card Store Offer reads, and zero Store 5xx responses.
- [x] 3.3 Use Browser Use on direct and shell-managed Store All/Distro at desktop and 390 px to verify cover sharpness, Next/Previous traversal, View all/Show Coverflow, complete cards, no blank state, no overflow, focus behavior, and console cleanliness.
- [x] 3.4 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, strict OpenSpec validation, and `git diff --check` against the final tree.
- [x] 3.5 Append concise before/after evidence and the decision to retain the responsive-size fix while keeping this child active to `production-go-live-readiness/README.md`.

## 4. Prioritize Only the Initial Active Cover

- [ ] 4.1 Extend the existing Store source-contract test to prove both cards share one `priority | eager | lazy` mode and map it to coherent loading and fetch-priority attributes.
- [ ] 4.2 Add the shared Store card loading-mode type and update both card components without changing responsive sizes, width ladders, sources, alt text, or markup.
- [ ] 4.3 Update Store category and Store Distro renderers so only the initial first-viewport Coverflow cover is priority, Coverflow neighbors and later groups are lazy, and ordinary leading eager behavior remains unchanged.
- [ ] 4.4 Run the focused Store component test and verify every loading-policy scenario passes.

## 5. Verify and Close the Child

- [ ] 5.1 Commit the implementation, build that exact commit, run `pnpm performance:bundles`, and store mobile-load, Store-activation, wide-scroll, mobile-scroll, and legacy-scroll outputs under ignored `.codex-artifacts/runtime-performance/<commit>/`.
- [ ] 5.2 Verify Store All and Store Distro meet the 2.5-second LCP, 0.1 CLS, application-work, rendering-slice, and long-task gates while retaining one listing projection, zero per-card Store Offer reads, and zero Store 5xx responses.
- [ ] 5.3 Use Browser Use on direct and shell-managed Store All/Distro at desktop and 390 px to verify sharp and ready covers, first/repeat traversal, View all/Show Coverflow, complete cards, no blank state, no overflow or layout jump, focus behavior, and console/network cleanliness.
- [ ] 5.4 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, strict OpenSpec validation, and `git diff --check` against the final tree.
- [ ] 5.5 When every gate passes, append accepted evidence to the parent README, complete only parent tasks 2.1, 2.2, 2.4, and 2.5, sync the `site-images` delta, strict-validate, and archive this child; otherwise record the exact miss and keep it active.
