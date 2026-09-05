## 1. Contract and Implementation

- [x] 1.1 Extend the existing containment source-contract test to prove the first chunk of the first group stays eager, later first chunks and all non-first chunks are contained, chunk size remains six, cards are not individually contained, and no client-rendering or duplicate-catalog boundary is added; verify the focused test fails before CSS implementation.
- [x] 1.2 Apply the exact two-selector native CSS containment rule without changing Astro markup, controllers, cards, image loading, dependencies, APIs, types, or content; verify the focused containment test passes.
- [x] 1.3 Run the focused Store/Distro tests and commit the exact implementation tree used for all later measurements.

## 2. Performance Acceptance

- [x] 2.1 Run the bundle graph and five cold mobile-load runs each for Store All and Store Distro; verify median LCP is at most 2.5 seconds and CLS is at most 0.1.
- [x] 2.2 Run three desktop Store activation profiles and verify exactly one listing-price projection per activation, zero per-card Store Offer reads, zero Store 5xx responses, and the static local listing-price `404` remains separately classified.
- [ ] 2.3 Run wide first/repeat, mobile first/repeat, and legacy Store/Distro traversal profiles; verify application-work p95 is at most 8 milliseconds, no repeatable application rendering slice exceeds 16.7 milliseconds, and no application-attributable task or long animation frame reaches 50 milliseconds.
- [x] 2.4 Record the rejected `6ce07d20` experiment, including its passing cold-load/request results and repeatable first-traversal failures.

## 3. Browser Acceptance

- [ ] 3.1 Use Browser Use on production output at desktop and 390 pixels to verify direct and shell-managed Store All/Distro navigation, Distro search/clear/empty results, later-group format jumps, Coverflow controls, complete card presence, focus reset to `MAIN`, and no blank corridor, card pop, scrollbar jump, overflow, failed image, console warning, or console error.
- [ ] 3.2 Use Browser Use to verify overlay open/close, player start/minimize/stop, mobile layout, keyboard operation, visible focus, and accessibility structure on the exact implementation tree.

## 4. Closure

- [ ] 4.1 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, `pnpm performance:bundles`, strict OpenSpec validation, and `git diff --check` against the exact final tree.
- [x] 4.2 Restore the previous selector and source-contract test after the traversal gate rejected implementation commit `6ce07d20`.
- [ ] 4.3 If a later bounded implementation passes every gate, append concise evidence to this change and production readiness, synchronize `frontend-runtime-performance`, and archive this child.
