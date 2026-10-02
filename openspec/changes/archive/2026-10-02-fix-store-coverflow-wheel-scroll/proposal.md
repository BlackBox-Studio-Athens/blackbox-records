# Keep Coverflow wheel navigation from scrolling the page

## Why

Wheel navigation advances the hovered Store Coverflow and also scrolls the page because the consumed event reaches the smooth-scroll listener. A Chrome reproduction on the starting revision advanced one item while moving the page about 207px.

## What Changes

- Stop propagation of every wheel event consumed by the shared Coverflow controller, including events below the movement threshold and during repeat throttling.
- Attach wheel handling and gesture resets to the enclosing Coverflow surface so empty space between visible covers is included.
- Preserve browser ownership outside the preview stage, in Grid and search modes, and for Ctrl-wheel zoom and zero-delta input.
- Extend controller tests and add real-wheel browser regressions for All Store and Distro.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-coverflow-interactions`: require consumed preview-stage wheel input to stay out of ancestor page-scroll handlers as well as native scrolling.

## Impact

The shared Store Coverflow controller, its existing unit tests, and the Store formats browser suite. No public interface, dependency, navigation cadence, touch behavior, or release process changes.
