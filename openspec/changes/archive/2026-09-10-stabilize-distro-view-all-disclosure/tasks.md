## 1. First-Click Lifecycle

- [x] 1.1 Add a focused failing test for a pre-ready disclosure activation, repeated-click coalescing, and transient-state cleanup; verify it fails before implementation.
- [x] 1.2 Retain one pre-ready Coverflow disclosure intent in the synchronous capability bootstrap and consume it once after shared controller listener setup; verify focused controller and snapshot tests pass.
- [x] 1.3 Start the existing Distro lazy import on Distro prefetch/activation and connect its portal without the `window.load` gate; verify code-splitting and portal lifecycle tests prove unrelated routes remain unloaded and unmounted.

## 2. Fast Disclosure

- [x] 2.1 Move catalog state, accessible toggle state, focus, and nearest-block scroll ahead of animation waits; verify focused controller tests observe catalog state synchronously.
- [x] 2.2 Remove the serial disclosure rail-fill phase and use one 180ms hard-edged reveal while leaving collapse, search, and format selection unchanged. Preserve the static reduced-motion grid and animation suppression while keeping its controls and counts visible; verify focused style and interaction tests pass.

## 3. Runtime Acceptance

- [x] 3.1 Extend the existing runtime-performance harness with direct-load and shell-entry Distro disclosure profiles, including a delayed lazy-module first-click check and ready-controller timing milestones; verify the focused harness source contracts and type checks pass.
- [x] 3.2 Use Browser Use against production output at desktop and 390px to verify one-click disclosure, keyboard activation, reduced motion, direct and shell navigation, cached return, search, format selection, focus, overflow, and console cleanliness.
  - Native browser initialization timed out; DevTools could not reliably deliver pointer clicks or emulate reduced motion. The user authorized Playwright fallback and the reduced-motion correction.
  - Playwright passed against rebuilt production output on port 4399 at exact 1440px and 390px, with normal and reduced motion: one trusted pointer click, Enter/Space disclosure and collapse, direct load, cached same-document return, cleared search state, search filtering, format selection, focus, and no horizontal overflow. Reduced motion keeps controls visible without Coverflow transforms or reveal animation. Screenshots were visually inspected.
  - The static preview has no listing-prices API, producing only expected `/api/store/listing-prices` 404s; no JavaScript exceptions occurred. Runnable checks, screenshots, and results are in `.codex-artifacts/distro-acceptance/`.

## 4. Validation

- [x] 4.1 Run strict OpenSpec validation plus `pnpm test:unit`, `pnpm check`, `pnpm build`, and the extended `pnpm performance:runtime`; record any environment-only limitation without marking a failing acceptance task complete.
  - Final validation passed on 2026-09-10: unit/contract suites, check, build, strict OpenSpec validation, and desktop/mobile disclosure runtime profiles (direct and shell entry, one fresh run each). All four runtime entries retained the delayed first click with no rejection reasons; ready reveal times were 191–197.4ms. The first unit run collided with the preview on test port 4322; moving the preview to 4399 and rerunning the full suite passed.
