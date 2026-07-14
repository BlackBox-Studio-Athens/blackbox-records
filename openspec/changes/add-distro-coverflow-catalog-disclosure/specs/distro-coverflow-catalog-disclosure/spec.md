## ADDED Requirements

### Requirement: Eligible Distro groups provide a bounded 3D Coverflow preview

The Distro route SHALL enhance a populated group into a BlackBox 3D Coverflow only on mobile when the group contains more than six records and the required client platform support is available.

#### Scenario: Large group is eligible on mobile

- **WHEN** a successfully mounted Distro client runs below `40rem`, native same-document View Transitions are available, no search query is active, and a populated group contains more than six records
- **THEN** the group enters `preview` mode with exactly the first six records in canonical order
- **AND** one cover is front-facing while neighboring covers use mirrored 3D depth, rotation, scale, and opacity
- **AND** the group identifies the preview as `Showing 6 of {source-derived total}` without featured-item language
- **AND** one shared status identifies the active record as `{position} of 6 preview`, title, and artist or label rather than using the full catalog count as the active-position total

#### Scenario: Group or viewport is ineligible

- **WHEN** a populated group contains six or fewer records or the viewport is at least `40rem`
- **THEN** the group remains in its existing catalog layout
- **AND** no Coverflow control or alternative catalog order is exposed

#### Scenario: Visitor navigates the preview

- **WHEN** the visitor activates Previous or Next or focuses a preview card
- **THEN** the selected record becomes the front-facing active cover without reordering the six records
- **AND** the visible status exposes its position, title, and artist or label
- **AND** Previous has `aria-disabled="true"` on the first record and Next has `aria-disabled="true"` on the sixth record while each remains focusable and activation is a no-op

#### Scenario: Visitor activates a preview record

- **WHEN** the visitor activates any preview card link
- **THEN** the existing Store link opens with ordinary link semantics
- **AND** Coverflow does not substitute a modal, quick view, or alternate product route

#### Scenario: Preview exposes artwork without losing record identity

- **WHEN** an eligible group is in `preview` mode
- **THEN** each of the first six cards presents artwork without its catalog copy while retaining one static, server-authored accessible link name `{title} — {artist_or_label}` across all modes
- **AND** every wrapper after the first uses `display: none` from preview presentation so later records and empty wrapper gaps leave rendering, focus order, and the accessibility tree
- **AND** preview does not use opacity, offscreen positioning, or `aria-hidden` to conceal focusable later records or wrappers

### Requirement: Coverflow, catalog, and search-results modes are exclusive

Each eligible Distro group MUST occupy exactly one of `preview`, `catalog`, or `search-results` mode, and active search MUST NOT coexist with a collapsed preview.

#### Scenario: Visitor requests the full group

- **WHEN** the visitor activates `View all {total}` from `preview` mode
- **THEN** that group enters `catalog` mode and exposes every record exactly once in its existing vertical order and six-item wrappers
- **AND** the toggle keeps focus and becomes `Show Coverflow`
- **AND** revealed wrappers are inserted below the toggle's stable document position
- **AND** no programmatic scroll occurs

#### Scenario: Disclosure activation repeats while a transition is active

- **WHEN** a catalog disclosure or collapse transition is already active
- **THEN** its toggle remains focusable with `aria-disabled="true"` and repeated activation is ignored
- **AND** temporary transition state is removed after completion, interruption, search, viewport promotion, or route cleanup

#### Scenario: Visitor returns to the preview

- **WHEN** the visitor activates `Show Coverflow` while no query is active
- **THEN** the group returns to `preview` mode with the first record active
- **AND** the toggle keeps focus and returns to `View all {total}`

#### Scenario: Distro search becomes active

- **WHEN** the normalized Distro search query becomes non-empty
- **THEN** every eligible group enters `search-results` mode before search writes result visibility
- **AND** Coverflow controls and collapsed preview constraints are removed from presentation and keyboard focus
- **AND** the search predecessor remains the sole owner of matching, counts, empty state, and card/group filtering

#### Scenario: Distro search clears

- **WHEN** the normalized query becomes empty or the search control cleans up
- **THEN** eligible groups leave `search-results` mode in `catalog` mode
- **AND** the complete server-rendered group order is restored without automatically collapsing to Coverflow

#### Scenario: Viewport widens

- **WHEN** an enhanced Distro viewport reaches at least `40rem`
- **THEN** an eligible group enters `catalog` mode only when no search query is active
- **AND** an active query keeps the group in `search-results` until search clears
- **AND** narrowing the viewport again does not automatically collapse either state before route re-entry

#### Scenario: Distro route exits and re-enters

- **WHEN** the app shell leaves Distro, caches its main content, and later restores or reloads the route
- **THEN** pre-cache snapshot sanitization removes client-authored browse mode, card positions, control contents, and temporary transition names before controller cleanup
- **AND** the restored server catalog may enhance again only after a fresh successful Distro mount

### Requirement: Coverflow disclosure is progressive and accessible

The Distro Coverflow enhancement MUST preserve full catalog access, ordinary card links, keyboard operation, visible focus, and reduced-motion behavior.

#### Scenario: JavaScript or platform support is unavailable

- **WHEN** JavaScript is disabled, the Distro controller fails to mount, or native same-document View Transitions are unavailable
- **THEN** the complete server-rendered catalog remains visible in canonical order
- **AND** no nonfunctional Coverflow controls or pre-hydration hidden catalog state remain

#### Scenario: Visitor prefers reduced motion

- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** Previous, Next, `View all`, and `Show Coverflow` reach the same final states without Coverflow movement, shared-element animation, or stagger
- **AND** reduced motion does not remove records or controls required for access

#### Scenario: Visitor uses the keyboard

- **WHEN** the visitor tabs through an eligible preview and activates its controls
- **THEN** focus follows document order, every visible control has an accessible name and at least a 44px target, and no focus ring is clipped
- **AND** focusing a preview card makes it active before ordinary link activation
- **AND** disclosure and collapse leave focus on their toggle without the open mobile mini-player obscuring it

#### Scenario: Visitor enlarges the mobile presentation

- **WHEN** the visitor uses 200% text sizing or 400% browser zoom at the 320px CSS viewport equivalent
- **THEN** Coverflow controls, active status, and the disclosure toggle reflow without two-dimensional page scrolling
- **AND** the front cover remains identifiable and visible focus does not overlap another target

### Requirement: Coverflow disclosure preserves catalog ownership and performance budgets

The enhancement MUST reuse existing Distro cards and six-item wrappers, MUST NOT create a second catalog representation, and MUST remain within the fixed Distro performance budgets.

#### Scenario: Preview and catalog share content

- **WHEN** an eligible group moves between `preview`, `catalog`, and `search-results`
- **THEN** the same server-rendered card nodes and wrapper nodes change presentation in place
- **AND** records are neither duplicated, recreated, reordered, paginated, nor virtualized
- **AND** search remains the sole writer of card, wrapper, and group `hidden` state while Coverflow writes only its own group-mode, bounded card-position, control-state, status, and temporary transition attributes
- **AND** no carousel, animation, gesture, or state-management dependency is added

#### Scenario: Preview renders genuine bounded 3D depth

- **WHEN** an eligible group is in animated `preview` mode
- **THEN** an outer shell owns perspective and clipping while an inner stage owns `transform-style: preserve-3d`
- **AND** opacity is applied per cover and the inner stage has no grouping property that flattens its children
- **AND** only the front and visibly exposed side covers are promised as pointer targets while all six links remain keyboard-operable

#### Scenario: Motion is active

- **WHEN** the visitor changes the active preview record or toggles catalog disclosure
- **THEN** motion is event-driven, affects at most the six preview covers and one active shared image, and completes within 300ms of authored animation time
- **AND** only the toggled group's active image receives a temporary unique transition name, root snapshot animation is disabled, and `try/finally` cleanup removes the name after completion or interruption
- **AND** the existing card-image hover or focus zoom does not run inside Coverflow
- **AND** no autoplay, timer, animation-frame loop, pointer tracking, custom drag, scroll listener, or card-by-card catalog stagger runs

#### Scenario: Initial mount and disclosure performance are measured

- **WHEN** the completed route runs fresh direct loads, app-shell entries, the fixed mobile-stress profile, and five normal-speed disclosure runs at 320px and 390px
- **THEN** LCP remains no more than 2.5 seconds, CLS remains no more than 0.1, and Coverflow-control and disclosure INP remain no more than 200ms
- **AND** the enhancement introduces no task of 50ms or longer
- **AND** if automatic full-catalog-to-preview mount misses a gate, the change fails acceptance until simplified or separately respecified; it MUST NOT silently add pre-hydration hiding or a catalog-first branch
- **AND** one diagnostic-only 4x CPU trace records remaining layout or reflow risk without applying the normal-speed thresholds to that trace
