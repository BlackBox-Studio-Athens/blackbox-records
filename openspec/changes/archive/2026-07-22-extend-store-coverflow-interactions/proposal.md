## Why

The Store Distro Coverflow exposes large catalogs through buttons and side-cover selection, but it does not support direct touch swipes or intentional wheel navigation. The All Store route also presents every canonical Store Item only as a long flat catalog, missing the same compact artwork-led overview while the catalog grows. On mobile, Distro `Browse formats` hides most choices inside a scrollbar-free horizontal strip, so the cutoff reads like missing content instead of an intentional control.

Main commit `2f7b6c01` archives `reduce-store-first-activation-latency` as accepted. Its evidence attributes the scheduling improvement through a same-runtime control because unchanged hosted code produced 2.17× to 54.36× network-p75 variation. Coverflow must stay outside the Store activation critical path and preserve the accepted one-request flow, but this unrelated interaction change does not need another full Store-latency acceptance program.

## What Changes

- Add one All Store Coverflow that traverses every canonical All Store Item in existing order while positioning at most six cards at once.
- Keep the complete All catalog as the authoritative server-rendered disclosure and progressive fallback; do not create another item projection, duplicate card graph, or curated subset.
- Generalize the existing Distro Coverflow controller into one Store-level enhancement reused by All and Distro.
- Mount the All controller through an existing `AppShellRoot` route effect after Store content is applied; do not add another React portal component or make shell activation, veil closure, or listing-price settlement await Coverflow.
- Add discrete horizontal touch swipe navigation while preserving vertical page panning and pinch zoom.
- Add intentional horizontal wheel and `Shift` + wheel navigation with normalized thresholds; ordinary vertical wheel continues scrolling the page.
- Keep native Previous/Next buttons as the keyboard and simple-pointer contract. Add no custom arrow-key mode, autoplay, continuous drag physics, or carousel dependency.
- Replace the narrow-width `Browse formats` strip with a compact native disclosure that exposes every populated format in a one- or two-column panel without horizontal scrolling, while retaining the current desktop row and persistent `Top` action.
- Preserve Distro search ownership, disclosure modes, canonical links, reduced-motion behavior, shell snapshot restoration, no-JavaScript access, one listing-price projection request per Store activation, zero per-card Store Offer reads, and existing performance budgets.
- Use bounded desktop/mobile activation samples and one focused interaction trace as practical regression checks; run the full five-plus-three latency matrix only if those checks identify an attributable Store activation regression.

## Capabilities

### New Capabilities

- `store-coverflow-interactions`: Shared Store Coverflow enhancement, input behavior, lifecycle, accessibility, and progressive-fallback contract.

### Modified Capabilities

- `distro-coverflow-catalog-disclosure`: Distro Coverflows adopt the shared Store interaction controller and replace the current movement-suppression-only pointer contract with discrete swipe and intentional wheel navigation.
- `distro-format-jump-navigation`: Narrow widths replace the hidden horizontal format-link overflow with a discoverable native disclosure while preserving server-derived groups, native fragment links, search safety, and desktop behavior.
- `store-catalog-categories`: The All Store route gains one optional Coverflow over its complete canonical collection while retaining the same full catalog and category authority.

## Impact

- Frontend Store collection markup, Distro format navigation, Coverflow controller ownership, app-shell route lifecycle, snapshot sanitization, and Store-scoped CSS/data hooks.
- Focused Astro, controller, shell snapshot, accessibility, responsive, and performance tests.
- Reuse the archived Store activation evidence and existing runtime runner without reopening or duplicating its accepted latency program.
- No backend API, D1, Stripe, stock, checkout, content-schema, StoreCart, or provider-authority changes.
- No new runtime dependency, duplicated Store Item node, Store data/API request, asset, or authored Coverflow collection.
