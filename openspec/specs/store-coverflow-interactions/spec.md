# store-coverflow-interactions Specification

## Purpose

TBD - created by archiving change extend-store-coverflow-interactions. Update Purpose after archive.

## Requirements

### Requirement: Store Coverflow uses one shared progressive enhancement contract

Eligible Store collection presentations SHALL use one Store-level Coverflow controller and lifecycle contract while preserving their route-owned canonical Store Item nodes and complete server-rendered catalogs.

#### Scenario: Shared enhancement mounts

- **WHEN** an eligible All or Distro Coverflow has JavaScript, required 3D CSS support, and a functioning shell-mounted controller caller
- **THEN** the shared Store Coverflow controller reads the route-owned cards in their existing canonical order and enters `preview` mode
- **AND** at most six existing cards receive relative stage positions
- **AND** no card, Store Item projection, Store data request, authored collection, or commerce identity is duplicated.

#### Scenario: Enhancement is unavailable

- **WHEN** JavaScript is disabled, required 3D CSS support is unavailable, or a direct-load or app-shell controller stalls or rejects mounting
- **THEN** the complete server-rendered catalog remains visible and operable in canonical order
- **AND** no nonfunctional Coverflow controls or pre-hydration hidden catalog state remain.

#### Scenario: Store route exits and re-enters

- **WHEN** the app shell caches, leaves, restores, or reloads a Store route containing Coverflow
- **THEN** generic Store Coverflow snapshot sanitation restores the first canonical item, initial positions, labels, controls, and rail ratio
- **AND** selected, ready, reveal, visited, and temporary transition state is removed before caching
- **AND** the route-specific controller remounts once for the active shell pathname and removes its listeners and in-flight animation state during cleanup
- **AND** a prior mount failure does not prevent a later Store activation from rechecking capability and mounting successfully.

### Requirement: Store Coverflow supports discrete touch swipe navigation

An enhanced Store Coverflow in `preview` mode MUST recognize deliberate horizontal touch swipes while retaining native vertical page panning, pinch zoom, taps, and ordinary Store Item link semantics.

#### Scenario: Visitor swipes horizontally

- **WHEN** one primary touch pointer travels at least 40 CSS pixels horizontally, horizontal travel is at least 1.25 times vertical travel, and the pointer ends without cancellation
- **THEN** a leftward swipe advances exactly one canonical Store Item and a rightward swipe moves back exactly one canonical Store Item
- **AND** movement wraps at the beginning and end under the same rules as Previous and Next
- **AND** the completed swipe does not also activate a card link or side-cover click.

#### Scenario: Visitor pans vertically or pinches

- **WHEN** touch movement is vertical-dominant, shorter than the swipe threshold, cancelled, or part of a multi-touch gesture
- **THEN** Coverflow does not change its active Store Item
- **AND** the browser retains native vertical page panning and pinch zoom
- **AND** pointer capture does not begin before horizontal intent is established.

#### Scenario: Visitor taps a card

- **WHEN** the visitor taps the active front cover without completing a swipe
- **THEN** its canonical Store Item detail link opens with ordinary link semantics
- **AND WHEN** the visitor taps an inactive positioned side cover without completing a swipe
- **THEN** that Store Item becomes active without opening its route on the first tap.

### Requirement: Store Coverflow supports intentional wheel navigation

An enhanced Store Coverflow in `preview` mode MUST consume only wheel input that expresses horizontal Coverflow intent and MUST leave ordinary vertical wheel scrolling to the page.

#### Scenario: Visitor uses horizontal wheel input

- **WHEN** the pointer is over the Coverflow stage and normalized horizontal wheel magnitude exceeds vertical magnitude
- **THEN** same-direction input accumulates until 48 normalized pixels and moves exactly one Store Item in that direction
- **AND** continuing momentum does not move another item until a 160ms event gap begins a new gesture
- **AND** the qualifying input is prevented from producing a competing native horizontal scroll.

#### Scenario: Visitor uses Shift plus wheel

- **WHEN** the pointer is over the Coverflow stage and the visitor holds `Shift` while producing vertical wheel input
- **THEN** that input is normalized and handled as horizontal Coverflow intent under the same threshold, direction, and one-move-per-gesture rules.

#### Scenario: Visitor uses ordinary vertical wheel input

- **WHEN** unmodified vertical wheel magnitude is greater than or equal to horizontal magnitude, or the Coverflow is not in `preview` mode
- **THEN** Coverflow does not change its active Store Item
- **AND** it does not prevent the browser's native page scrolling.

#### Scenario: Wheel delta units vary

- **WHEN** a qualifying wheel event reports pixel, line, or page delta units
- **THEN** pixel units remain unchanged, line units use a 16px line, and page units use the current stage width before threshold comparison
- **AND** reversing direction resets the prior accumulated delta.

### Requirement: Store Coverflow keeps native keyboard and link behavior

Store Coverflow SHALL provide keyboard and simple-pointer operation through native controls and links without creating a composite carousel keyboard mode.

#### Scenario: Visitor uses the keyboard

- **WHEN** the visitor tabs through an enhanced Coverflow
- **THEN** Previous, Next, full-catalog disclosure, and every positioned card follow document order with visible focus and accessible names
- **AND** Enter or Space activates native buttons while Enter activates an ordinary positioned Store Item link
- **AND** focusing a positioned card makes it active before ordinary link activation.

#### Scenario: Visitor presses arrow keys

- **WHEN** a positioned card, link, or Coverflow control has focus and the visitor presses Left Arrow or Right Arrow
- **THEN** Store Coverflow does not intercept the key
- **AND** no roving tabindex, application role, or custom composite-widget focus model is introduced.

#### Scenario: Visitor uses simple pointer controls

- **WHEN** the visitor activates Previous or Next with a mouse, stylus, touch tap, keyboard, switch control, or assistive technology
- **THEN** the active item moves exactly one position and wraps at both ends
- **AND** the native button target remains at least 44 CSS pixels high.

### Requirement: Store Coverflow interaction work remains bounded

Store Coverflow MUST keep initial parsing linear in the canonical card count and each navigation gesture bounded to the positioned stage, without continuous rendering or global input listeners.

#### Scenario: Active Store Item changes

- **WHEN** Previous, Next, side-cover selection, focus, touch, or wheel changes the active Store Item
- **THEN** the controller clears no more than the previously positioned six cards and assigns no more than the next six positions
- **AND** only fixed status, count, summary, and rail fields update alongside those cards
- **AND** no clone, virtualized window, request, full-card rebuild, layout animation, or image preload is introduced.

#### Scenario: Interaction listeners run

- **WHEN** Store Coverflow is enhanced
- **THEN** pointer and non-passive wheel listeners are scoped to each enhanced group and removed during cleanup
- **AND** no document-level wheel or scroll listener, autoplay, timer loop, animation-frame loop, continuous drag rendering, fling physics, or card-by-card catalog stagger runs
- **AND** the enhancement adds no carousel, gesture, animation, or state-management dependency.

#### Scenario: All controller joins Store shell activation

- **WHEN** `/store/` enters through uncached navigation, a cached or prefetched snapshot, or history restoration
- **THEN** Store HTML application, transition-veil closure, and listing-price presentation do not await the Coverflow controller import or mount
- **AND** the activation retains exactly one Store HTML request, one listing-price projection request, zero per-card Store Offer reads, and the existing `Cache-Control: no-store` listing response
- **AND** Coverflow does not start, clear, replace, or otherwise change Store route loading feedback.

#### Scenario: Practical performance regression checks run

- **WHEN** the exact final tree runs one cache-cleared desktop Store activation sample, one mobile-stress Store activation sample, and one focused 4× CPU Coverflow interaction sample
- **THEN** both activation samples retain the complete Store card graph, one Store HTML request, at most one listing-price projection request, and zero per-card Store Offer reads
- **AND** frontend-only local API unavailability or development-server compilation delay is classified separately from Coverflow behavior and compared with the archived hosted evidence rather than treated as a new p75 gate
- **AND** the focused interaction sample keeps card-position mutation bounded to the prior and next six positions and shows no visible layout instability, blocked vertical scroll, or repeatable interaction stall outside the authored animation
- **AND** existing project LCP, CLS, and INP budgets remain applicable without requiring a new five-plus-three p75 comparison for this interaction change
- **AND** the full Store activation matrix is required only when the bounded samples or trace identify a repeatable regression attributable to Coverflow.
