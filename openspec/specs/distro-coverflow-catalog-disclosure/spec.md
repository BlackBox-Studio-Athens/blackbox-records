# distro-coverflow-catalog-disclosure Specification

## Purpose

TBD - created by archiving change add-distro-coverflow-catalog-disclosure. Update Purpose after archive.

## Requirements

### Requirement: Eligible Distro groups provide a bounded 3D Coverflow preview

The Store Distro category SHALL enhance a populated classified group into a responsive BlackBox 3D Coverflow when the group contains more than six Store Items and the required client platform support is available.

#### Scenario: Large group is eligible

- **WHEN** `/store/distro/` has JavaScript and `transform-style: preserve-3d` support, no search query is active, and a populated group contains more than six classified Store Items
- **THEN** the group enters `preview` mode with every Store Item available to the shared Store Coverflow controller in canonical Distro order
- **AND** canonical order follows the existing authored Distro catalog `order` rather than random selection or a second featured-item model
- **AND** at most six Store Items are positioned in the stage at once, with one front-facing cover and neighboring covers using mirrored 3D depth, rotation, scale, and opacity
- **AND** every other offstage Store Item leaves presentation, focus order, and the accessibility tree until it receives a stage position or the visitor opens the catalog
- **AND** the group identifies the source-derived total, active position, source-derived count after the active record, and availability of the complete flat catalog
- **AND** one prominent shared status identifies the active Store Item by title and artist or label without a numeric position prefix that could be mistaken for a date.

#### Scenario: Group is ineligible

- **WHEN** a populated group contains six or fewer Store Items
- **THEN** the group remains in its existing catalog layout
- **AND** no Coverflow control or alternative catalog order is exposed.

#### Scenario: Preview adapts to the viewport

- **WHEN** an eligible group is in `preview` mode below `40rem`
- **THEN** it uses a compact stage and side-cover spacing suited to the narrow viewport
- **AND WHEN** the same group is viewed at `40rem` or wider
- **THEN** it uses a wider but compact stage with restrained cover size and enough lateral and depth spacing to keep neighboring records apparent without dominating the viewport
- **AND** both presentations use the same canonical card nodes, six relative positions, controls, state, and order.

#### Scenario: Visitor navigates the preview

- **WHEN** the visitor activates Previous or Next, focuses a preview card, completes a qualifying touch swipe, or supplies qualifying wheel input
- **THEN** the selected Store Item becomes the front-facing active cover without reordering the group
- **AND** the visible status exposes its title and artist or label
- **AND** movement wraps from the first record to the final record and from the final record to the first without reordering the records or disabling Previous or Next
- **AND** touch and wheel behavior follows the shared Store Coverflow interaction contract.

#### Scenario: Visitor activates a preview record

- **WHEN** the visitor uses the keyboard to activate a preview card or uses a pointer to activate the already-active front cover
- **THEN** the canonical Store Item detail link opens with ordinary link semantics
- **AND** Coverflow does not substitute a modal, quick view, or alternate product route.

#### Scenario: Visitor selects a side cover or scrolls through the stage

- **WHEN** the visitor uses a pointer on a side cover that was not active at pointer-down and does not complete a qualifying swipe
- **THEN** the Store Item becomes active without opening its detail route on that first activation
- **AND WHEN** the visitor completes a qualifying touch swipe
- **THEN** route activation is suppressed and the shared Store Coverflow controller moves exactly one item without continuous drag physics
- **AND WHEN** pointer movement is vertical-dominant, cancelled, or below the swipe threshold
- **THEN** Coverflow does not move and native page behavior remains available.

#### Scenario: Preview exposes artwork without losing record identity

- **WHEN** an eligible group is in `preview` mode
- **THEN** each positioned card presents artwork without its catalog copy while retaining one static, server-authored accessible link name `{title} — {artist_or_label}` across all modes
- **AND** exactly six cards receive relative stage positions while every offstage card and empty wrapper gap uses `display: none` after enhancement is ready
- **AND** preview does not use opacity, offscreen positioning, or `aria-hidden` to conceal focusable offstage records or wrappers
- **AND** catalog, search-results, unsupported, and no-JavaScript presentations retain the same complete canonical Store Item nodes.

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

#### Scenario: Distro route exits and re-enters

- **WHEN** the app shell leaves `/store/distro/`, caches its main content, and later restores or reloads the route
- **THEN** pre-cache snapshot sanitization restores the server-authored first-record preview mode, initial card positions, control contents, and active label while removing selected and temporary transition state
- **AND** the restored document paints directly in its capability-appropriate initial presentation.

### Requirement: Coverflow disclosure is progressive and accessible

The Store Distro Coverflow enhancement MUST preserve full catalog access, ordinary Store Item links, keyboard operation, visible focus, and reduced-motion behavior.

#### Scenario: JavaScript or platform support is unavailable

- **WHEN** JavaScript is disabled, a direct-load or app-shell-entry Store Distro controller stalls or rejects mounting, or required 3D CSS support is unavailable
- **THEN** the complete server-rendered Distro-category catalog remains visible in canonical order
- **AND** no nonfunctional Coverflow controls or pre-hydration hidden catalog state remain.

#### Scenario: Supported Distro route paints its initial state

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
- **AND** no autoplay, timer loop, animation-frame loop, continuous drag physics, document-level wheel or scroll listener, or card-by-card catalog stagger runs
- **AND** group-local pointer observation and qualifying wheel handling remain limited to the shared Store Coverflow interaction contract.

#### Scenario: Initial mount and disclosure performance are measured

- **WHEN** `/store/distro/` runs direct loads, app-shell entries, 320px and 390px mobile checks, and the focused 4× CPU interaction sample
- **THEN** the complete canonical catalog remains available, movement stays bounded to the positioned stage, and the mobile disclosure introduces no horizontal page overflow or visible layout instability
- **AND** any local development-server or unavailable-API delay is classified separately from Coverflow interaction behavior rather than used as a strict new latency gate
- **AND** the supported server-authored preview produces no preceding full-catalog frame while unsupported clients retain the full catalog
- **AND** existing project Core Web Vitals budgets remain policy while the archived Store activation evidence remains the scheduling baseline.

### Requirement: Coverflow preview makes active position and complete catalog depth explicit

Each eligible Coverflow preview SHALL expose the relationship between its bounded preview and complete source-derived catalog without creating another catalog, request, or interaction mode.

#### Scenario: Eligible preview communicates catalog depth

- **WHEN** an eligible group enters `preview` mode
- **THEN** it presents the source-derived total, one-based active position, and source-derived count after the active record in three aligned labelled fields
- **AND** it states `You're viewing {current} of {total}`
- **AND** a decorative continuation rail represents the active-to-total ratio while the adjacent text carries the same meaning without relying on colour or geometry
- **AND WHEN** the active record changes
- **THEN** current, remaining, summary, and ratio update from the same canonical index without a second counter or catalog.

#### Scenario: Preview controls express distinct tasks

- **WHEN** Coverflow controls render in `preview` mode
- **THEN** Previous and Next remain secondary controls for navigating every record in the canonical group through the bounded six-position stage
- **AND** `View all {total}` is the visually primary disclosure control with an accessible name and a target at least 44 CSS pixels high
- **AND** the preview adds no per-item pagination dots, thumbnails, drag affordance, autoplay, or looping animation.

#### Scenario: Preview reads as one BlackBox artwork rack

- **WHEN** an eligible Coverflow renders in preview mode
- **THEN** its overview, live record identity, and artwork stage form one coherent square-edged group using straight rules and flat BlackBox surfaces
- **AND** the active cover remains dominant while up to five neighboring covers visibly communicate additional records
- **AND** Previous, Next, and full-catalog disclosure retain native button semantics with the existing primary/secondary hierarchy and visible focus
- **AND** the composition reuses the current Coverflow controller and canonical Store Item nodes, adding no registry carousel, Embla dependency, second state engine, runtime image, duplicated six-card window, or duplicate Store Item node.

#### Scenario: Catalog or search-results mode replaces preview disclosure

- **WHEN** an eligible group enters `catalog` or `search-results` mode
- **THEN** preview-only totals, remaining count, continuation rail, Previous, Next, and active preview status leave presentation and focus order according to the existing exclusive-mode contract
- **AND** catalog mode retains the existing `Show Coverflow` control while search-results mode retains search ownership.

#### Scenario: Disclosure motion runs

- **WHEN** motion is permitted and an eligible preview first enhances
- **THEN** the Store-accent rail draws once from zero to the source-derived initial ratio using transform-only motion
- **AND WHEN** Previous, Next, or a positioned side cover changes the active record
- **THEN** the rail glides to `current / total` with restrained transform-only motion and no looping or ambient animation
- **AND WHEN** the visitor activates `View all {total}`
- **THEN** the preview band and rail remain visible while the rail reaches 100% during the first 180ms and the catalog remains concealed
- **AND** the hard-edged catalog reveal begins only after the rail fill completes, removes the preview-only band from presentation, and reaches its final state within the established 480ms authored-animation budget
- **AND** no timer loop, animation-frame loop, document View Transition, layout animation, or new controller mode is introduced.

#### Scenario: Reduced motion or unsupported enhancement remains complete

- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** preview total, current, remaining count, static active ratio, and controls remain perceivable while all new transitions reach their final state immediately
- **AND WHEN** JavaScript or required 3D support is unavailable
- **THEN** the complete server-rendered catalog remains available without nonfunctional preview disclosure.

#### Scenario: Catalog depth disclosure reflows

- **WHEN** the eligible group renders at 320 CSS pixels, 200% text size, or the 400% zoom equivalent
- **THEN** its title, three aligned labelled values, summary, rail, and controls reflow in document order without clipped labels or two-dimensional page scrolling
- **AND** the primary full-catalog action remains distinguishable from Previous and Next without relying on colour alone.
