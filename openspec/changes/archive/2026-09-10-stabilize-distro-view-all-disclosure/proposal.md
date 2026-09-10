## Why

Store Distro renders `View all` before its route-lazy controller is ready, so a fast first activation can be dropped. Once ready, disclosure deliberately waits through two serial animations, making an otherwise light DOM state change feel slow.

## What Changes

- Retain one early Coverflow disclosure activation until the shared controller attaches, then consume it exactly once.
- Start loading the route-lazy Distro search/controller module on Distro navigation intent and shell activation without mounting it on unrelated routes.
- Connect the Distro portal as soon as its server-rendered target exists instead of waiting for `window.load`.
- Enter catalog state immediately and replace the serial rail-fill/reveal sequence with one short hard-edged reveal.
- Extend focused tests and the existing runtime-performance harness for first-click reliability and disclosure latency.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `distro-coverflow-catalog-disclosure`: Guarantee first-activation retention and replace the sequential 480ms disclosure contract with immediate catalog state and one short reveal.
- `store-coverflow-interactions`: Define the shared pre-ready disclosure handoff and cleanup contract.
- `distro-search`: Permit intent-based module preloading while preserving route-owned mounting and execution.
- `frontend-runtime-performance`: Add measured Store Distro disclosure reliability and latency acceptance.

## Impact

- App-shell Distro prefetch and portal connection lifecycle
- Shared Store Coverflow capability bootstrap, controller, snapshot sanitation, and disclosure CSS
- Focused unit/source-contract tests and the existing runtime-performance harness
- No public API, type, backend, commerce, content, image, dependency, or deployment changes
