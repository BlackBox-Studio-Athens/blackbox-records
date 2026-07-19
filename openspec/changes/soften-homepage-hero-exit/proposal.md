## Why

The Static Plate keeps the Home hero image present, but once the hero-scoped shade leaves, the full-strength image looks brighter behind later content and provides no visual handoff. The selected Persistent Ghost Crossfade keeps the image in the background while lowering it to a quiet, readable presence through one bounded opacity transition.

## What Changes

- Keep the existing responsive Home hero image fixed and visible for as long as the Home route owns it.
- Crossfade only the media layer from opacity `1` to `0.18` over 240 milliseconds when the existing coarse scrolled class changes state; never hide or remove it while Home remains active.
- Reverse the same native opacity transition when the shopper returns above the threshold, including from an interrupted in-flight value.
- Keep the existing hero shade scoped to the hero viewport and transition-free so the first viewport retains its approved darkness without leaving a second fixed layer behind later content.
- Tune the static News, Artists, and Newsletter veils to `76%`, `78%`, and `74%` opacity so the quieter ghost remains consistently visible through every Home section while opaque cards and footer keep content stable.
- Preserve route-scoped cleanup, same-side no-mutation behavior, reduced-motion endpoints, and responsive high-priority image delivery.
- Accept the ghost only if wide and mobile profiles show no application-work regression, attributable long task, repeated settled hero paint or raster work, or extra image request or decode.
- Add no markup, per-scroll property, transform, keyframe, parallax, filter, blur, blend mode, `will-change`, dependency, asset, or JavaScript state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Replace the transition-free Home hero opacity requirement with one route-scoped Persistent Ghost Crossfade while preserving bounded render work, coarse scroll state, reduced motion, and no-churn performance contracts.

## Impact

- Frontend styling: existing Home hero and section-surface rules in `apps/web/src/styles/global.css`.
- Regression coverage: existing Home hero CSS and scroll-helper tests.
- Validation: Browser Use at mobile and desktop widths, existing Home settled and first/repeat scroll profiles, and standard repository gates.
- No content, markup, route, player, loading indicator, API, commerce, schema, dependency, asset, or deployment change.
