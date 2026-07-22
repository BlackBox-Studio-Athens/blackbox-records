## 1. Main Baseline and Shared Store Coverflow Controller

- [x] 1.1 Treat archived `reduce-store-first-activation-latency` evidence from main commit `2f7b6c01` as the accepted scheduling baseline and preserve its one Store HTML request, one `no-store` listing projection, zero per-card reads, and delayed `Loading Store` behavior.
- [x] 1.2 Add characterization tests for the current Distro Coverflow reducer, canonical wrapping, side-card selection, disclosure states, active status, rail values, and cleanup before extraction.
- [x] 1.3 Extract the Coverflow state, generic DOM reader, renderer, disclosure flow, and controller API from `StoreDistroSearch.tsx` into `StoreCoverflowController.ts`, leaving Distro search matching and hidden-state ownership in `StoreDistroSearch`.
- [x] 1.4 Make navigation rendering retain the complete canonical card list while mutating no more than the previous six and next six positioned cards per active-item change.
- [x] 1.5 Add focused controller tests proving canonical order, end wrapping, six-position bounds, ordinary active-link activation, first-click side-cover selection, disclosure focus restoration, and listener/animation cleanup.

## 2. Generic Hooks and App-Shell Lifecycle

- [x] 2.1 Rename Coverflow-only markup, CSS custom properties, data attributes, types, and capability state from Distro-scoped names to `store-coverflow` names across `StoreDistroCatalog.astro`, `DistroCard.astro`, Store styles, and their tests; keep Distro search hooks Distro-scoped and add no compatibility facade.
- [x] 2.2 Replace the Distro capability marker in `SiteLayout.astro` with a Store Coverflow capability marker that preserves synchronous supported first paint and fail-open unsupported behavior.
- [x] 2.3 Generalize app-shell Coverflow readiness/failure handling in `AppShellRoot.tsx` so every Store Coverflow group must mount successfully or the capability marker is removed for that activation, then recheck capability on later Store activations; add no All Coverflow branch to `ShellPortalOutlets.tsx`.
- [x] 2.4 Generalize `sanitizeDistroCoverflowSnapshot` and its tests into Store Coverflow snapshot sanitation that restores the first item, initial positions, controls, labels, rail ratio, clean transition state, and closed mobile Distro format disclosure for cached restoration.
- [x] 2.5 Update `StoreDistroSearch` to instantiate the shared controller, pass search activation through its optional search boundary, and preserve the existing `preview`, `catalog`, and `search-results` ownership contract.

## 3. Touch and Wheel Interaction

- [x] 3.1 Add pure unit-tested gesture helpers for the 40px touch threshold, 1.25 horizontal-dominance rule, wheel delta-mode normalization, 48px accumulation threshold, direction reset, and 160ms gesture gap.
- [x] 3.2 Implement primary-touch pointer tracking on each preview stage with `touch-action: pan-y pinch-zoom`, delayed pointer capture after horizontal intent, one move on pointer release, and synthetic-click suppression only after a completed swipe.
- [x] 3.3 Preserve native vertical pan, pinch zoom, multi-touch, cancellation, sub-threshold taps, active-card links, and first-tap side-cover selection in the pointer path.
- [x] 3.4 Implement one group-local non-passive wheel listener that consumes horizontal-dominant or `Shift` + wheel input in preview mode, moves one item per gesture, and never prevents ordinary vertical page scrolling.
- [x] 3.5 Add controller tests for touch directions, wrap behavior, vertical and multi-touch rejection, click suppression, pixel/line/page wheel normalization, trackpad momentum gating, direction reversal, catalog/search mode bypass, and cleanup.
- [x] 3.6 Keep Previous and Next as native 44px-minimum buttons, retain normal Tab and Enter/Space behavior, and add tests proving Left Arrow and Right Arrow are not intercepted.

## 4. All Store Coverflow

- [x] 4.1 Extend `StoreCollectionPage.astro` so only the populated All category with more than six canonical items renders one Store Coverflow contract around the existing ordered `StoreItemCard` nodes, with no duplicate card graph or alternate collection query.
- [x] 4.2 Add source-derived total, current, remaining, active identity, continuation rail, Previous, Next, `View all {total}`, and `Show Coverflow` markup while retaining the complete All catalog as the no-JavaScript and failure fallback.
- [x] 4.3 Add one `AppShellRoot` effect keyed by the active shell pathname that dynamically imports, mounts, and cleans up the shared All controller after Store main application without adding a React component, portal target, or second state engine.
- [x] 4.4 Add responsive Store Coverflow styles for All using the shared six-position visual contract, compact 320px/390px layouts, visible focus, 200% text/400% zoom reflow, reduced motion, native lazy images, and no all-card eager preload.
- [x] 4.5 Extend Store collection and style tests to prove All uses every canonical item exactly once in deterministic order, positions at most six, omits Coverflow at six or fewer items, adds no search mode, and leaves BlackBox Releases and Merch unchanged.
- [x] 4.6 Add shell tests proving Coverflow import and mount are not awaited by Store snapshot application, veil completion, or listing-price connection and preserve one Store HTML request, one listing projection request, zero per-card Store Offer reads, and existing loading-feedback ownership.

## 5. Mobile Browse Formats Disclosure

- [x] 5.1 Replace narrow-width horizontal format overflow in `StoreDistroCatalog.astro` with one native `<details>` / `<summary>` presentation inside the existing navigation landmark; show `Browse formats`, the populated-format count, a disclosure indicator, and keep `Top` outside the disclosure and always reachable.
- [x] 5.2 Preserve the existing desktop heading and inline link row at `48rem` and above; derive desktop and mobile links from the same `groupedDistroChunks` list, with no authored labels, counts, targets, or second navigation landmark.
- [x] 5.3 Add mobile styles for a closed compact sticky row and an open auto-fitting one- or two-column format panel with 44px targets, visible focus, single-column zoom reflow, and no horizontal scrolling, hidden scrollbar, page overflow, or panel animation.
- [x] 5.4 Extend `StoreDistroSearch` only enough to close the native disclosure before enhanced format-link scrolling, when search activates, and during cleanup; keep native disclosure and fragment-link behavior as the no-JavaScript fallback and add no second component or state engine.
- [x] 5.5 Extend format-navigation, Distro search, and shell snapshot tests to prove one presentation is visible/focusable per breakpoint, both presentations mirror the same populated groups and counts, search hides the whole landmark, and cached restoration cannot reopen stale disclosure state.

## 6. Verification

- [x] 6.1 Run focused Store Coverflow, Distro format-navigation, Distro search, Store collection, app-shell snapshot, capability marker, accessibility, and style tests; resolve every regression before broad validation.
- [x] 6.2 Use Browser Use on direct loads and app-shell entries for `/store/` and `/store/distro/` to verify Previous/Next, native keyboard activation, side-cover selection, active links, both disclosures, collapse, route exit/re-entry, and console cleanliness.
- [x] 6.3 At desktop width, verify horizontal wheel and `Shift` + wheel move one item per gesture while ordinary vertical wheel over the stage still scrolls the page; verify mouse movement does not create drag behavior and the existing inline format row remains visible.
- [x] 6.4 At 320px and 390px mobile viewports, verify left/right touch swipes, vertical page pan, pinch zoom, taps, side-cover selection, the closed/open `Browse formats` states, every format and count without horizontal scrolling, `Top`, 44px targets, focus visibility, and no two-dimensional page scrolling.
- [x] 6.5 Verify mobile format activation closes the disclosure before scrolling and leaves the target heading visible; verify Enter/Space, Tab order, 200% text, 400% zoom, Distro search activation/clear, and cached route restoration do not expose duplicate or stale format controls.
- [x] 6.6 Verify reduced motion, unsupported 3D support, JavaScript/controller failure fallback, Distro search activation/clear, and sanitized cached restoration all expose the complete canonical catalog without stale interaction state.
- [x] 6.7 Run `pnpm performance:runtime -- --profile=desktop-store-activation --runs=1` and `pnpm performance:runtime -- --profile=mobile-store-activation --runs=1` against the exact final tree as smoke samples; require the complete card graph, one Store HTML request, at most one listing projection request, zero per-card reads, and explicit classification of frontend-only local API unavailability without making a new p75 improvement claim.
- [x] 6.8 Record one focused 4× CPU interaction sample covering All Coverflow mount plus representative Previous, Next, touch, wheel, and disclosure actions; require bounded six-position mutation, no visible layout instability, no unintended vertical-scroll blocking, and no repeatable interaction stall outside the authored animation.
- [x] 6.9 Run the full five-desktop/three-mobile Store activation matrix only if the bounded samples or focused trace expose a repeatable regression attributable to Coverflow; otherwise retain the archived latency evidence without reopening it.
- [x] 6.10 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final tree.
