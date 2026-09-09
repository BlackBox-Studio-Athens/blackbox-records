## 1. First-Click Lifecycle

- [x] 1.1 Add a focused failing test for a pre-ready disclosure activation, repeated-click coalescing, and transient-state cleanup; verify it fails before implementation.
- [x] 1.2 Retain one pre-ready Coverflow disclosure intent in the synchronous capability bootstrap and consume it once after shared controller listener setup; verify focused controller and snapshot tests pass.
- [x] 1.3 Start the existing Distro lazy import on Distro prefetch/activation and connect its portal without the `window.load` gate; verify code-splitting and portal lifecycle tests prove unrelated routes remain unloaded and unmounted.

## 2. Fast Disclosure

- [x] 2.1 Move catalog state, accessible toggle state, focus, and nearest-block scroll ahead of animation waits; verify focused controller tests observe catalog state synchronously.
- [x] 2.2 Remove the serial disclosure rail-fill phase and use one 180ms hard-edged reveal while leaving collapse, search, format selection, and reduced motion unchanged; verify focused style and interaction tests pass.

## 3. Runtime Acceptance

- [x] 3.1 Extend the existing runtime-performance harness with direct-load and shell-entry Distro disclosure profiles, including a delayed lazy-module first-click check and ready-controller timing milestones; verify the focused harness source contracts and type checks pass.
- [ ] 3.2 Use Browser Use against production output at desktop and 390px to verify one-click disclosure, keyboard activation, reduced motion, direct and shell navigation, cached return, search, format selection, focus, overflow, and console cleanliness.
  - Desktop Browser Use passed. The available Browser Use surfaces do not expose exact viewport or reduced-motion emulation; exact 390px mobile stress and reduced motion passed through the automated runtime and unit coverage.

## 4. Validation

- [x] 4.1 Run strict OpenSpec validation plus `pnpm test:unit`, `pnpm check`, `pnpm build`, and the extended `pnpm performance:runtime`; record any environment-only limitation without marking a failing acceptance task complete.
