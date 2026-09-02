## Why

Store Coverflow currently requires horizontal or `Shift` + wheel intent and caps a continuous wheel gesture at one item. This feels unresponsive for mouse-wheel browsing, while Distro Coverflows also lack the clear hover cue visible on All and the All preview repeats an unnecessary `Available` badge over its artwork. Flat Store categories also need one eligibility rule so category growth does not create per-category Coverflow behavior.

## What Changes

- Apply one eligibility rule to every flat Store collection rendered through `StoreCollectionPage`: All, BlackBox Releases, populated Merch, and future non-Distro flat categories use the shared Coverflow above six canonical items and remain a complete ordinary grid at six or fewer; Distro stays grouped and enhances each eligible group above six.
- Hide Store Item availability labels and badges in every Coverflow preview so preview presentation is artwork-first; keep availability unchanged in expanded catalogs, unsupported or no-JavaScript fallbacks, and Store Item detail paths.
- Let unmodified vertical wheel input navigate a Coverflow while the pointer is over its preview stage, while retaining horizontal wheel and `Shift` + wheel compatibility.
- Replace the one-move-per-gesture lock with accumulated, rate-limited steps so sustained wheel input can traverse multiple items without uncontrolled momentum.
- Handle Left Arrow and Right Arrow only when keyboard focus is already inside an enhanced Coverflow, using repeated keydown events for continued traversal without a global listener, roving tabindex, or new focus stop.
- Apply one shared hover and focus-visible artwork cue to every flat Store Coverflow and every Distro Coverflow, with reduced-motion behavior remaining static and fully perceivable.
- Generalize category eligibility and app-shell mounting without per-category branches or Distro double-mounting. Preserve the existing shared controller, canonical card nodes, native links and buttons, touch behavior, disclosure modes, Distro search ownership, app-shell lifecycle, and Store request budgets.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `store-coverflow-interactions`: Change the shared wheel contract from horizontal-intent, one-step gestures to hover-scoped vertical and horizontal stepped traversal; add focus-scoped arrow-key navigation and one shared hover/focus cue for every eligible Store Coverflow.
- `store-catalog-categories`: Give every flat Store collection one shared greater-than-six eligibility rule and hide Store Item availability labels and badges only in preview while keeping expanded catalog and detail presentation unchanged.
- `distro-coverflow-catalog-disclosure`: Keep Distro grouped, give every eligible group the same shared controller and interaction contract as flat Store categories, and keep Distro search as the sole lifecycle owner.

## Impact

- Shared Store Coverflow eligibility, mounting, gesture state, wheel normalization, group-local keyboard handling, controller cleanup, and focused unit tests.
- Flat-category and Distro preview markup or scoped styling, shared Coverflow hover/focus CSS, reduced-motion rules, and style/markup regression tests.
- Browser Use verification for All, BlackBox Releases, populated Merch, and Distro direct/app-shell routes; mouse wheel, precision-trackpad-like deltas, held and repeated arrow keys, hover/focus parity, disclosure modes, reduced motion, and page-scroll boundaries.
- No backend API, D1, Stripe, checkout, stock, StoreCart, content schema, runtime dependency, new card graph, or new request.
