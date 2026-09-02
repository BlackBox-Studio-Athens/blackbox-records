## 1. Characterize the Measured Boundary

- [x] 1.1 Record commit `81ce9976` as the baseline and verify its ignored raw evidence includes bundle, mobile-load, Store-activation, wide-scroll, mobile-scroll, and legacy-scroll outputs.
- [x] 1.2 Add a focused failing test proving Store Item and Distro cards share the bounded Coverflow preview `sizes` value while ordinary catalog sizes remain unchanged.

## 2. Right-Size Existing Coverflow Images

- [x] 2.1 Make `StoreItemCard.astro` use the bounded preview slot only when `coverflowPreview` is true; verify its existing width ladder, source, alt text, loading, card markup, and catalog slot remain unchanged.
- [x] 2.2 Make `DistroCard.astro` use the same bounded preview slot only when `coverflowPreview` is true; verify its home/page variants and ordinary catalog slot remain unchanged.
- [x] 2.3 Run the focused image and Store markup tests and verify the two card components cannot drift on the preview slot contract.

## 3. Verify and Close the Child

- [x] 3.1 Build one exact implementation commit, run `pnpm performance:bundles`, and store outputs under ignored `.codex-artifacts/runtime-performance/<commit>/`.
- [x] 3.2 Rerun Store All and Store Distro mobile-stress load, Store activation, wide scroll, mobile scroll, and legacy scroll; verify reduced transfer/LCP, one listing projection per activation, zero per-card Store Offer reads, and zero Store 5xx responses.
- [x] 3.3 Use Browser Use on direct and shell-managed Store All/Distro at desktop and 390 px to verify cover sharpness, Next/Previous traversal, View all/Show Coverflow, complete cards, no blank state, no overflow, focus behavior, and console cleanliness.
- [x] 3.4 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, strict OpenSpec validation, and `git diff --check` against the final tree.
- [ ] 3.5 Append concise before/after evidence and the child decision to `production-go-live-readiness/README.md`, update its performance tasks, sync the `site-images` delta, and archive this child.
