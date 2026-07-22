## Context

The Store currently has two collection presentations:

- `/store/` renders every canonical Store Item once as a flat `StoreItemCard` catalog.
- `/store/distro/` renders canonical distro-sourced Store Items in authored format groups. Groups with more than six items can enhance into a bounded six-position Coverflow, while Distro search owns filtering and the complete catalog remains server-rendered.

The Distro Coverflow DOM reader, state reducer, renderer, disclosure animation, pointer-intent handling, and cleanup currently live inside `StoreDistroSearch.tsx`. Its data hooks, CSS hooks, first-paint capability marker, shell snapshot sanitizer, and failure fallback are Distro-specific. The same component already owns Distro format-navigation visibility while search is active. The persistent app shell replaces and caches `<main>` content, so an All Store enhancement cannot depend on an Astro inline script rerunning after shell navigation.

The current Distro format navigation is one sticky flex row. Its format-link container uses horizontal overflow while hiding the scrollbar, and the fixed `Browse formats` label plus `Top` action leave only a clipped portion of the remaining choices at mobile widths. The supplied screenshot shows no visible affordance that more formats exist off-screen.

Main commit `2f7b6c01` archives `reduce-store-first-activation-latency` as accepted. Its paired same-runtime control improved click → prices settled p75 by 38.7% on desktop and 36.4% under mobile stress while content and veil stayed within 10%. Repeated hosted runs against unchanged code also moved network p75 by 2.17× to 54.36×, so absolute hosted latency was retained as operational evidence rather than treated as frontend attribution. The accepted shell starts one activation-scoped listing-price projection alongside Store HTML, keeps the response `no-store`, retains delayed `Loading Store` feedback, and consumes the prepared result once.

The requested change adds one complete-collection Coverflow to All, makes every Store Coverflow usable through touch and intentional wheel input, and replaces the ambiguous mobile format strip with an explicit disclosure. It must preserve ordinary page scrolling, native links and buttons, the existing Distro search state machine, no-JavaScript disclosure, reduced motion, Store activation request cardinality, and existing frontend performance budgets. Because this is an interaction change rather than a Store scheduling change, acceptance uses bounded attributable regression checks instead of repeating the archived latency study by default.

## Goals / Non-Goals

**Goals**

- Give `/store/` one artwork-led Coverflow over every canonical All Store Item in existing deterministic order.
- Reuse one Store-level Coverflow state, DOM, rendering, gesture, cleanup, and snapshot contract across All and Distro.
- Support discrete touch swipes without blocking vertical page pan or pinch zoom.
- Support deliberate horizontal wheel and `Shift` + wheel navigation without hijacking ordinary vertical wheel scrolling.
- Keep Previous and Next as native buttons and the complete catalog as the authoritative fallback.
- Keep movement work bounded even when All contains more than one hundred cards.
- Keep Coverflow module loading and mounting outside Store HTML application, transition-veil closure, and listing-price settlement ownership.
- Preserve exactly one listing-price projection request and zero per-card Store Offer reads per Store collection activation.
- Make every populated Distro format immediately discoverable on mobile without horizontal scrolling or a hidden-scrollbar affordance.
- Preserve the current desktop format row, native fragment targets, persistent `Top` access, and search-safe navigation ownership.

**Non-Goals**

- No Coverflow on BlackBox Releases, Merch, editorial Releases, or Store Item detail routes.
- No All search, filtering, pagination, virtualized catalog, curated subset, random order, or second Store Item projection.
- No mouse drag, continuous touch dragging, fling physics, autoplay, arrow-key mode, pagination dots, or ambient animation.
- No carousel, gesture, animation, or state-management dependency.
- No mobile format `<select>`, popover/menu dependency, active-section observer, scroll listener, pagination control, or authored format aliases/counts.
- No desktop Distro format-navigation redesign beyond the responsive markup needed to keep one visible presentation per breakpoint.
- No backend API, D1, Stripe, checkout, stock, StoreCart, content-schema, or commerce-authority change.
- No re-benchmarking or redesign of the archived Store first-activation scheduling, projection policy, or delayed loading status.

## Decisions

### 1. Extract a Store-level DOM controller and reuse existing lifecycle effects

The Distro-specific Coverflow code will move from `StoreDistroSearch.tsx` into a Store-level module with generic `StoreCoverflowState`, DOM parsing, rendering, disclosure, input handling, and cleanup. Store Coverflow markup and CSS hooks will use `data-store-coverflow-*` and `store-coverflow-*` names. The first-paint capability marker and shell snapshot sanitizer will become Store-scoped in the same slice; no temporary Distro compatibility facade will remain.

`StoreDistroSearch` will continue to own Distro query state and hidden-state writes. It will instantiate the shared controller for Distro groups and call its existing search-mode boundary.

For All, an existing `AppShellRoot` route effect keyed by `activeShellPathname` will dynamically import and mount the same controller after the swapped Store main is available. The effect is not awaited by `startShellSectionActivation`, Store snapshot application, transition-veil closure, or `connectStoreListingPricePresentation`. Import or mount failure removes the Store Coverflow capability marker so the complete catalog fails open for that route activation. Each later Store route activation rechecks 3D support and reasserts the marker before mounting, so one transient failure cannot disable Coverflow until a full reload. No null-rendering React component, portal target, or `ShellPortalOutlets` branch is added.

Route-specific Astro markup remains responsible for its canonical card graph:

- Distro keeps grouped `DistroCard` nodes, six-item wrappers, search hooks, and three exclusive modes.
- All keeps its ordered `StoreItemCard` nodes and gains one `preview` / `catalog` Coverflow group around those same nodes.

The controller accepts optional search-mode support rather than embedding Distro search rules into the shared state model.

### 2. All uses one complete canonical Coverflow, not a featured rail

When All contains more than six items and the platform supports the enhancement, its single group starts at the first canonical Store Item and makes every item reachable by Previous, Next, side-cover selection, touch, or wheel navigation. The active index wraps at both ends. At most six existing cards receive stage positions; all other cards leave presentation, focus order, and the accessibility tree until positioned or until the visitor selects `View all {total}`.

The All orientation panel remains category context. The Coverflow sits before the full catalog disclosure surface and reports total, current position, remaining count, active item identity, and the same continuation rail used by Distro. `View all {total}` reveals the complete existing All card sequence; `Show Coverflow` returns to the selected item. Unsupported, failed, reduced-capability, and no-JavaScript states expose the complete catalog immediately.

No count is hardcoded. All total and order come from `listStoreCollectionEntries()` after canonical Store Item deduplication and category classification.

### 3. Touch is a discrete horizontal swipe layered over native scrolling

The stage will declare `touch-action: pan-y pinch-zoom`. The controller observes primary touch pointers only. It records the initial position, waits for horizontal intent, and commits at most one Previous or Next move on pointer release when:

- horizontal travel reaches 40 CSS pixels; and
- absolute horizontal travel is at least 1.25 times absolute vertical travel.

Vertical-dominant movement, multi-touch, pointer cancellation, and sub-threshold movement do not navigate. Pointer capture may begin only after horizontal intent is established. A completed swipe suppresses the synthetic click so it cannot also open or select a card. The active cover still opens through an ordinary tap, and an inactive side cover still becomes active on its first ordinary tap.

The cards do not follow the finger. This is discrete swipe recognition, not a draggable carousel or momentum simulation.

### 4. Wheel navigation requires horizontal intent

The stage will register one non-passive, group-local `wheel` listener only while enhanced. It qualifies input when either:

- horizontal magnitude exceeds vertical magnitude; or
- `Shift` is held and vertical wheel input supplies the horizontal navigation delta.

Pixel deltas remain pixels, line deltas normalize against a 16px line, and page deltas normalize against the current stage width. The controller accumulates same-direction qualifying input until 48 normalized pixels, moves one item, then ignores continuing momentum until a 160ms event gap starts a new gesture. A direction reversal resets the accumulator.

`preventDefault()` runs only for qualifying Coverflow navigation input while the group is in `preview` mode. Unmodified vertical wheel input, catalog mode, search-results mode, and wheel input outside the stage retain native page behavior. No document-level wheel or scroll listener is added.

### 5. Keyboard behavior stays native and explicit

Previous, Next, `View all`, and `Show Coverflow` remain native buttons reached through normal Tab order and activated with Enter or Space. Positioned cards remain ordinary links. Focusing a positioned card makes it active before link activation, matching the existing Distro behavior.

No Left Arrow or Right Arrow interception is added. Native buttons provide a discoverable keyboard contract without introducing a composite-widget focus model, roving tabindex, or conflict with browser and assistive-technology commands.

### 6. Rendering work stays bounded

The controller reads the complete card list once at mount. Initial enhancement may inspect every card, but each active-item move clears only the previously positioned set and assigns only the next six positions, producing at most twelve card-position mutations plus the fixed status and rail updates. It does not clone cards, maintain a second six-card window, fetch data, preload all images, or rebuild the catalog.

Disclosure remains event-driven and reuses the existing component-local CSS/WAAPI completion path. There is no autoplay, timer loop, animation-frame loop, document View Transition, card-by-card stagger, or continuous gesture rendering. Event listeners and in-flight animations are removed on route cleanup.

The All controller's dynamic import and mount are independent enhancement work. They do not prepare, consume, replace, or await the activation-scoped listing-price promise; start or clear `Loading Store`; or alter Store HTML request ownership. Store activation remains one Store HTML request, one listing-price projection request, and zero per-card Store Offer reads.

### 7. Shell snapshots reset both routes to deterministic server state

The snapshot sanitizer will target generic Store Coverflow hooks. Before a shell page is cached, it will restore the first canonical item, initial six positions, preview labels, rail ratio, button contents, and controls; remove selected, ready, reveal, visited, and transitioning state; close the mobile Distro format disclosure; and leave Distro search cleanup responsible for its own hidden attributes.

On direct load or shell restoration, the synchronous Store capability marker permits the server-authored preview presentation before first paint. If the dynamically imported controller cannot mount, the route effect removes that marker so the complete catalog fails open. App-shell readiness checks inspect all generic Store Coverflow groups rather than Distro-only groups, and each later Store activation re-evaluates support before remounting.

### 8. Coverflow uses practical attributable performance checks

The archived Store activation evidence is the accepted scheduling baseline. This change preserves its production structure and invariants rather than trying to reproduce statistically comparable hosted latency for an unrelated interaction feature.

The exact final tree will use the existing `scripts/measure-runtime-performance.ts` runner for one cache-cleared desktop Store activation and one mobile-stress Store activation. These are smoke samples, not a new improvement claim. They must render and settle the complete Store collection, retain one Store HTML request, one listing-price projection request, zero per-card Store Offer reads, `Cache-Control: no-store`, and no Store request or console error.

One focused 4× CPU interaction sample will cover All Coverflow mount plus representative Previous, Next, touch, wheel, and disclosure actions. Acceptance checks that movement stays bounded to the prior and next six positions, vertical scroll remains native, the page shows no visible layout instability, and no repeatable interaction stall appears outside the existing authored animation. Existing LCP, CLS, and INP budgets remain project policy, but this unrelated interaction change does not turn a single local sample or development-server delay into a strict new latency gate. The full five-plus-three matrix runs only if repeated evidence identifies a Coverflow-attributable regression.

Coverflow does not change the accepted 750ms `Loading Store` feedback decision.

### 9. Mobile Browse formats uses a native disclosure instead of hidden horizontal overflow

Below `48rem`, the single Distro format-navigation landmark will expose a native `<details>` / `<summary>` presentation. Its closed sticky row contains `Browse formats`, the source-derived number of populated formats, a clear disclosure indicator, and the existing `Top` link. Opening it reveals every populated format link and count in an auto-fitting one- or two-column panel. Links remain at least 44 CSS pixels high, reflow to one column when text or zoom needs the space, and never require horizontal scrolling.

At `48rem` and above, the existing visible heading, inline format-link row, and `Top` action remain unchanged. The desktop row and mobile disclosure are two responsive presentations inside one navigation landmark. Both render directly from the same `groupedDistroChunks` value; CSS ensures only one presentation is displayed, exposed to assistive technology, and keyboard-focusable at a time. No second data source, authored count, route, filter, or taxonomy is introduced.

`StoreDistroSearch` already receives the format-navigation element and owns its search visibility. It will add only the small lifecycle behavior the native element cannot provide: close the mobile disclosure before an enhanced format-link scroll, close it when search activates, and restore its closed server state during cleanup. Shell snapshot sanitation will also remove stale `open` state before caching. No second React component, state engine, document scroll listener, or active-group observer is added.

Without client JavaScript, `<details>` still opens with native pointer and keyboard behavior and every format remains an ordinary fragment link. The enhanced path adds no custom arrow-key behavior and does not animate the panel; Enter and Space toggle the summary, Tab reaches visible links, and the browser owns link activation.

## Risks / Trade-offs

- **Large All DOM remains present:** Progressive disclosure requires all canonical cards in the document. Bounded position mutations and native lazy images limit interaction cost, but initial DOM size is unchanged. Verification will retain the existing no-long-task and Core Web Vitals budgets.
- **Trackpad hardware produces varied deltas:** Delta-mode normalization, intent comparison, accumulation, direction reset, and one-move-per-gesture gating reduce accidental multi-step movement. Browser tests must cover mouse wheel, precision trackpad-equivalent events, and `Shift` + wheel.
- **Touch thresholds can feel too strict or too eager:** The fixed 40px and 1.25 dominance values favor page-scroll safety. Browser validation at 320px and 390px will confirm that deliberate swipes remain reachable before implementation is accepted.
- **Generic hook rename has broad CSS/test impact:** Markup, controller, capability marker, snapshot sanitation, CSS, and tests move together in one slice. No dual-hook transition is introduced, avoiding two competing contracts.
- **Two route compositions share one controller:** Distro search and All lifecycle mounting remain separate callers. Shared behavior belongs in the controller; route-specific mode ownership stays at the caller boundary and receives focused tests.
- **Hosted latency is too variable for an unrelated hard p75 gate:** Use the archived attributable-evidence result, verify structural request and completion invariants, and escalate to the full matrix only after a repeatable Coverflow-attributable regression appears.
- **The controller chunk could compete with Store activation work:** Start its dynamic import only from the post-apply route effect, never await it from activation or price presentation, and verify bounded desktop/mobile samples plus one focused trace.
- **Responsive markup repeats lightweight anchors:** Desktop and mobile presentations repeat only the server-derived format links inside one navigation landmark so native mobile disclosure works without another state engine. CSS must guarantee that exactly one presentation is visible and focusable at each breakpoint, and tests must prove both derive from the same group list.
- **An open sticky disclosure can cover content:** Enhanced format-link activation closes the disclosure before scrolling, search activation and shell snapshots reset it, and mobile browser checks must verify target headings remain visible below the fixed header and closed sticky row.

## Migration Plan

1. Treat archived `reduce-store-first-activation-latency` evidence as the accepted scheduling baseline and preserve its request, `no-store`, and loading-feedback invariants.
2. Extract and characterize the existing Distro reducer, DOM reader, renderer, disclosure, and cleanup under Store-level names.
3. Rename Distro Coverflow hooks, CSS, capability detection, app-shell readiness checks, and snapshot sanitation atomically; keep Distro search hooks unchanged.
4. Add touch and wheel input to the shared controller and extend unit tests before enabling All.
5. Add the All server-rendered Coverflow contract over existing `StoreItemCard` nodes and mount its controller from the existing non-blocking `AppShellRoot` route effect.
6. Replace mobile Distro format-link overflow with the native disclosure, preserve the desktop row, and reset disclosure state through Distro search and shell snapshot lifecycles.
7. Run focused tests, full repository gates, Browser Use checks, one desktop activation sample, one mobile-stress activation sample, and one focused 4× CPU Coverflow trace across the exact final tree; escalate only on attributable regression.

Rollback is a frontend-only revert: remove the All markup and `AppShellRoot` controller effect, restore the former Distro-specific controller and hooks, and restore the single horizontal Distro format row. No persisted data or external system requires migration or reversal.

## Open Questions

None. The interaction scope, thresholds, supported routes, mobile format disclosure, keyboard contract, and fallback behavior are fixed by this design.
