## MODIFIED Requirements

### Requirement: Eligible Distro groups provide a bounded 3D Coverflow preview

The Store Distro category SHALL enhance a populated classified group into a responsive BlackBox 3D Coverflow when the group contains more than six Store Items and the required client platform support is available.

#### Scenario: Large group is eligible

- **WHEN** `/store/distro/` has JavaScript and `transform-style: preserve-3d` support, no search query is active, and a populated group contains more than six classified Store Items
- **THEN** the group enters `preview` mode with exactly the first six Store Items in canonical Distro order
- **AND** canonical order follows the existing authored Distro catalog `order` rather than random selection or a second featured-item model
- **AND** one cover is front-facing while neighboring covers use mirrored 3D depth, rotation, scale, and opacity
- **AND** the group identifies the curation as `Selected 6 of {source-derived total}`
- **AND** one prominent shared status identifies the active Store Item by title and artist or label without a numeric position prefix that could be mistaken for a date.

#### Scenario: Group is ineligible

- **WHEN** a populated group contains six or fewer Store Items
- **THEN** the group remains in its existing catalog layout
- **AND** no Coverflow control or alternative catalog order is exposed.

#### Scenario: Preview adapts to the viewport

- **WHEN** an eligible group is in `preview` mode below `40rem`
- **THEN** it uses a compact stage and side-cover spacing suited to the narrow viewport
- **AND WHEN** the same group is viewed at `40rem` or wider
- **THEN** it uses a wider stage with restrained cover size and larger lateral and depth spacing
- **AND** both presentations use the same six card nodes, positions, controls, state, and canonical order.

#### Scenario: Visitor navigates the preview

- **WHEN** the visitor activates Previous or Next or focuses a preview card
- **THEN** the selected Store Item becomes the front-facing active cover without reordering the six records
- **AND** the visible status exposes its title and artist or label
- **AND** Previous wraps from the first record to the sixth and Next wraps from the sixth record to the first without reordering the records or disabling either control.

#### Scenario: Visitor activates a preview record

- **WHEN** the visitor uses the keyboard to activate a preview card or uses a pointer to activate the already-active front cover
- **THEN** the canonical Store Item detail link opens with ordinary link semantics
- **AND** Coverflow does not substitute a modal, quick view, or alternate product route.

#### Scenario: Visitor selects a side cover or scrolls through the stage

- **WHEN** the visitor uses a pointer on a side cover that was not active at pointer-down
- **THEN** the Store Item becomes active without opening its detail route on that first click
- **AND WHEN** pointer movement exceeds 10px before click activation
- **THEN** route activation is suppressed without moving the Coverflow, capturing the pointer, or implementing drag physics.

#### Scenario: Preview exposes artwork without losing Store Item identity

- **WHEN** an eligible group is in `preview` mode
- **THEN** each of the first six cards presents artwork without its catalog copy while retaining one static, server-authored accessible link name `{title} — {artist_or_label}` across all modes
- **AND** every wrapper after the first uses `display: none` from preview presentation so later Store Items and empty wrapper gaps leave rendering, focus order, and the accessibility tree
- **AND** preview does not use opacity, offscreen positioning, or `aria-hidden` to conceal focusable later records or wrappers.

### Requirement: Coverflow, catalog, and search-results modes are exclusive

Each eligible Store Distro group MUST occupy exactly one of `preview`, `catalog`, or `search-results` mode, and active search MUST NOT coexist with a collapsed preview.

#### Scenario: Visitor requests the full group

- **WHEN** the visitor activates `View all {total}` from `preview` mode
- **THEN** that group enters `catalog` mode and exposes every classified Store Item exactly once in its existing vertical order and six-item wrappers
- **AND** the previously active Store Item receives focus, a subtle selected border and tonal surface, and an instant nearest-block scroll that makes it immediately recognizable below the sticky navigation
- **AND** the toggle becomes `Show Coverflow`
- **AND** a single hard-edged reveal exposes the catalog without a card-by-card stagger.

#### Scenario: Disclosure activation repeats while a transition is active

- **WHEN** a catalog disclosure or collapse transition is already active
- **THEN** its toggle remains focusable with `aria-disabled="true"` and repeated activation is ignored
- **AND** temporary transition state is removed after completion, interruption, search, or route cleanup.

#### Scenario: Visitor returns to the preview

- **WHEN** the visitor activates `Show Coverflow` while no query is active
- **THEN** the group returns to `preview` mode with the catalog's selected Store Item active, or the first item when no selection exists
- **AND** the toggle returns to `View all {total}`.

#### Scenario: Distro search becomes active

- **WHEN** the normalized Store Distro search query becomes non-empty
- **THEN** every eligible group enters `search-results` mode before search writes result visibility
- **AND** Coverflow controls and collapsed preview constraints are removed from presentation and keyboard focus
- **AND** Distro search remains the sole owner of matching, counts, empty state, and card/group filtering.

#### Scenario: Distro search clears

- **WHEN** the normalized query becomes empty or the Store Distro search control cleans up
- **THEN** eligible groups leave `search-results` mode in `catalog` mode
- **AND** the complete server-rendered group order is restored without automatically collapsing to Coverflow.

#### Scenario: Viewport changes

- **WHEN** an enhanced Store Distro viewport crosses the `40rem` presentation boundary
- **THEN** responsive CSS adapts the scene without changing `preview`, `catalog`, or `search-results` state
- **AND** no resize listener or viewport-specific client state is required.

#### Scenario: Store Distro category exits and re-enters

- **WHEN** the app shell leaves `/store/distro/`, caches its main content, and later restores or reloads the route
- **THEN** pre-cache snapshot sanitization restores the server-authored first-record preview mode, initial card positions, control contents, and active label while removing selected and temporary transition state
- **AND** the restored document paints directly in its capability-appropriate initial presentation.

### Requirement: Coverflow disclosure is progressive and accessible

The Store Distro Coverflow enhancement MUST preserve full catalog access, ordinary Store Item links, keyboard operation, visible focus, and reduced-motion behavior.

#### Scenario: JavaScript or platform support is unavailable

- **WHEN** JavaScript is disabled, a direct-load or app-shell-entry Store Distro controller stalls or rejects mounting, or required 3D CSS support is unavailable
- **THEN** the complete server-rendered Distro-category catalog remains visible in canonical order
- **AND** no nonfunctional Coverflow controls or pre-hydration hidden catalog state remain.

#### Scenario: Supported Store Distro route paints its initial state

- **WHEN** JavaScript and required 3D CSS support are available on `/store/distro/`
- **THEN** a synchronous capability marker activates the server-authored preview mode before first paint
- **AND** the visitor does not see a full-catalog frame before Coverflow.

#### Scenario: Visitor prefers reduced motion

- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** Previous, Next, `View all`, and `Show Coverflow` reach the same final states without Coverflow movement, shared-element animation, or stagger
- **AND** reduced motion does not remove Store Items or controls required for access.

#### Scenario: Visitor uses the keyboard

- **WHEN** the visitor tabs through an eligible preview and activates its controls
- **THEN** focus follows document order, every visible control has an accessible name and at least a 44px target, and no focus ring is clipped
- **AND** focusing a preview card makes it active before ordinary link activation
- **AND** disclosure moves focus to the selected Store Item while collapse and all other controls retain visible focus without the open mobile mini-player obscuring it.

#### Scenario: Visitor enlarges the presentation

- **WHEN** the visitor uses 200% text sizing or 400% browser zoom at the 320px CSS viewport equivalent
- **THEN** Coverflow controls, active status, and the disclosure toggle reflow without two-dimensional page scrolling
- **AND** the front cover remains identifiable and visible focus does not overlap another target.

### Requirement: Coverflow disclosure preserves catalog ownership and performance budgets

The enhancement MUST reuse the same server-rendered Store Distro card nodes and six-item wrappers, MUST NOT create a second catalog or commerce projection, and MUST remain within the fixed Store Distro performance budgets.

#### Scenario: Preview and catalog share content

- **WHEN** an eligible group moves between `preview`, `catalog`, and `search-results`
- **THEN** the same server-rendered Store Item card nodes and wrapper nodes change presentation in place
- **AND** Store Items are neither duplicated, recreated, reordered, paginated, nor virtualized
- **AND** search remains the sole writer of card, wrapper, and group `hidden` state while Coverflow writes only its own group-mode, bounded card-position, selected-card, control-state, status, and temporary transition attributes
- **AND** Store Offer availability and price remain tied to the canonical Store Item rather than a Distro-only commerce model
- **AND** no carousel, animation, gesture, or state-management dependency is added.

#### Scenario: Preview renders genuine bounded 3D depth

- **WHEN** an eligible group is in animated `preview` mode
- **THEN** an outer shell owns perspective and clipping while an inner stage owns `transform-style: preserve-3d`
- **AND** opacity is applied per cover and the inner stage has no grouping property that flattens its children
- **AND** only the front and visibly exposed side covers are promised as pointer targets while all six links remain keyboard-operable.

#### Scenario: Motion is active

- **WHEN** the visitor changes the active preview record or toggles catalog disclosure
- **THEN** motion is event-driven, affects at most the six preview covers and one group reveal surface; cover navigation completes within 300ms and disclosure completes within 480ms of authored animation time
- **AND** disclosure uses component-local CSS rather than a document View Transition, and `try/finally` cleanup removes in-flight state after completion or interruption
- **AND** the existing card-image hover or focus zoom does not run inside Coverflow
- **AND** no autoplay, timer, animation-frame loop, custom drag, scroll listener, or card-by-card catalog stagger runs; pointer observation is limited to the down-to-click distance needed to reject accidental activation.

#### Scenario: Initial mount and disclosure performance are measured

- **WHEN** `/store/distro/` runs fresh direct loads, app-shell entries, the fixed mobile-stress profile, and five normal-speed disclosure runs at 320px, 390px, and desktop width
- **THEN** LCP remains no more than 2.5 seconds, CLS remains no more than 0.1, and Coverflow-control and disclosure INP remain no more than 200ms
- **AND** the enhancement introduces no task of 50ms or longer
- **AND** the supported server-authored preview produces no preceding full-catalog frame while unsupported clients retain the full catalog
- **AND** one diagnostic-only 4x CPU trace records remaining layout or reflow risk without applying the normal-speed thresholds to that trace.
