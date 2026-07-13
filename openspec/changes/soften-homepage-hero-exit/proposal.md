## Why

The Home hero media and shade disappear abruptly at the existing coarse scroll threshold. A short bounded fade can make that exit and return feel deliberate without restoring per-scroll writes, continuous effects, or hidden animation work.

## What Changes

- Fade the existing Home hero media and shade together over 180 milliseconds when the existing scrolled class changes state.
- Hide the two layers only after the exit fade completes; restore visibility immediately before the return fade.
- Keep reduced-motion behavior immediate and keep the hidden scroll-cue animation stopped.
- Preserve the current DOM, coarse threshold, route-scoped scroll helper, and same-side no-mutation behavior.
- Add no transform, keyframe, JavaScript state, dependency, `will-change`, or scroll-progress property.
- Sequence implementation after `improve-site-runtime-performance-round-two` archives; an earlier release requires its design and task 7.3 to remove transition-free Home ownership and pass strict validation first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Replace the transition-free Home hero opacity requirement with one bounded transition per coarse threshold change while retaining the no-churn, reduced-motion, route-scope, and settled-hidden performance contracts.

## Impact

- Frontend styling: the existing Home hero media and shade rules in `apps/web/src/styles/global.css`.
- Regression coverage: the existing Home hero CSS and scroll-helper tests.
- Validation: Browser Use at mobile and desktop widths, the existing Home scroll performance profiles, and standard repository gates.
- No content, markup, route, player, loading indicator, API, commerce, schema, dependency, or deployment change.
