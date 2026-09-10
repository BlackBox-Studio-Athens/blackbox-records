Sections 1–4 retain the historical experiment. Final closure follows the explicit user acceptance recorded below and in README.md.

## 1. Historical Contract and Implementation

- [x] 1.1 Extend the existing containment source-contract test to prove the first chunk of the first group stays eager, later first chunks and all non-first chunks are contained, chunk size remains six, cards are not individually contained, and no client-rendering or duplicate-catalog boundary is added; verify the focused test fails before CSS implementation.
- [x] 1.2 Apply the exact two-selector native CSS containment rule without changing Astro markup, controllers, cards, image loading, dependencies, APIs, types, or content; verify the focused containment test passes.
- [x] 1.3 Run the focused Store/Distro tests and commit the exact implementation tree used for all later measurements.

## 2. Performance Acceptance

- [x] 2.1 Run the bundle graph and five cold mobile-load runs each for Store All and Store Distro; verify median LCP is at most 2.5 seconds and CLS is at most 0.1.
- [x] 2.2 Run three desktop Store activation profiles and verify exactly one listing-price projection per activation, zero per-card Store Offer reads, zero Store 5xx responses, and the static local listing-price `404` remains separately classified.
- [x] 2.3 After section 5, run three equivalent wide first/repeat, mobile first/repeat, and legacy Store/Distro traversal profiles, separating default preview from expanded catalog; verify application-work p95 is at most 8 milliseconds, no application rendering slice exceeds 16.7 milliseconds, no application-attributable task or long animation frame reaches 50 milliseconds, and frame cadence meets the baseline spec or its measured control allowance. Completed by explicit user acceptance of the retained traversal-attribution caveats; not an unconditional numerical pass.
- [x] 2.4 Record the rejected `6ce07d20` experiment, including its passing cold-load/request results and repeatable first-traversal failures.

## 3. Browser Acceptance

- [x] 3.1 Use Browser Use on production output at desktop and 390 pixels to verify direct and shell-managed Store All/Distro navigation, Distro search/clear/empty results, later-group format jumps, Coverflow controls, complete card presence, focus reset to `MAIN`, and no blank corridor, card pop, scrollbar jump, overflow, failed image, console warning, or console error.
- [x] 3.2 Use Browser Use to verify overlay open/close, player start/minimize/stop, mobile layout, keyboard operation, visible focus, find-in-page, and accessibility structure on the exact implementation tree; additionally verify reduced motion and enhancement-disabled fallback with complete cards and no clipping, overflow, or scroll jumps.

## 4. Closure

- [x] 4.1 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, `pnpm performance:bundles`, and `git diff --check` against the restored tree.
- [x] 4.2 Strict-validate this child, production readiness, Coverflow image performance, and Sveltia-overlapping active changes; record the separate pre-existing baseline warnings reported by repository-wide strict validation.
- [x] 4.3 Restore the previous selector and source-contract test after the traversal gate rejected implementation commit `6ce07d20`.
- [x] 4.4 Following explicit user acceptance of sections 2.3 and 5.5 with caveats, record the decision in this change and production readiness, synchronize `frontend-runtime-performance`, and archive this child.

## 5. Revised Diagnosis and Bounded Remedy

- [x] 5.1 Inspect current chunk CSS, server-rendered group modes, traversal setup, and saved rejected/later diagnostics; record the layout-box mismatch, missing expanded-catalog coverage, and attribution limitations in `design.md` without claiming a current runtime pass.
- [x] 5.2 Extend the existing runner to record revision/dirty-input hashes, browser/build/profile metadata, readiness, group modes, computed chunk display/containment, card counts, and scroll extent; preserve raw failed traces and individual slice/task maxima. Verify focused helper checks reject incomplete setup and retain a long slice even when windowed p95 passes.
- [x] 5.3 Add expanded-catalog traversal through real View all controls to the existing runner, preserving separate disclosure timing and untouched first-scroll corridors; verify recorded modes, first/repeat labels, small groups, and later-group selection on production output.
- [x] 5.4 Capture three equivalent current baseline traversals per declared profile and mode; correlate failing raw events with script/layout/paint/font/image/third-party activity and record the responsible work before selecting a CSS candidate.
- [x] 5.5 Compare the recorded native/eager baselines with the revised retained-layout, font, and disclosure candidate. Preserve six-card markup and first-viewport eagerness; use eager catalog layout without intrinsic estimates. Run three equivalent candidate traversals and cold-load/disclosure checks, retain the candidate under the explicit user-approved disclosure exception, preserving the original failed timings.
- [x] 5.6 Extend the source contract and controller cancellation regression, prove red/green behavior, and run focused Store/Distro tests. Record final source/build identity through the runner.

## 6. Fresh Final-Tree Acceptance

- [x] 6.1 Run the bundle graph and five cold mobile-load runs each for Store All and Store Distro on the selected tree; verify median LCP at most 2.5 seconds and CLS at most 0.1, reporting median/p75 and preserving slow runs.
- [x] 6.2 Run three desktop Store activations on the selected tree; verify exactly one listing-price projection per activation, zero per-card Store Offer reads, zero Store 5xx, current complete card counts, and separate classification of local static listing-price `404` responses.
- [x] 6.3 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, `pnpm audit:commerce-boundaries`, `pnpm performance:bundles`, and `git diff --check`; verify measured inputs remain unchanged and record results without reusing historical checked tasks.
- [x] 6.4 Strict-validate this child and affected active readiness/image/disclosure changes; record unrelated baseline warnings separately and verify no remaining performance task is represented as passing in parent readiness.

On 2026-09-10 the user explicitly accepted this implementation with its recorded caveats and authorized closure. This is a change-specific acceptance exception, not a claim that every raw timing meets the original gate: mobile disclosure records 51 ms uninstrumented and 51–77 ms with tracing; wide traversal has occasional large low-CPU spans whose attribution remains inconclusive. Original budgets and raw failures remain intact for future work.
