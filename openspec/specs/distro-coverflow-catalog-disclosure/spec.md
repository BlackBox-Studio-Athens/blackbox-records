# distro-coverflow-catalog-disclosure Specification

## Purpose

TBD - created by archiving change add-distro-coverflow-catalog-disclosure. Update Purpose after archive.

## Requirements

### Requirement: Eligible Distro groups provide a bounded 3D Coverflow preview

Distro SHALL render one complete Grid by default and offer explicit-choice shared Coverflow for the complete unfiltered collection when it contains more than six items and platform support is available. Format, artist or text filtering SHALL force Grid. Both views SHALL reuse the same ordered canonical card nodes.

#### Scenario: Large group is eligible

- **WHEN** the unfiltered mixed catalog has more than six items and required platform support
- **THEN** it starts in Grid and offers Grid/Coverflow controls
- **AND** explicit Coverflow activation uses the existing six-position stage, source-derived totals, title/artist status and full catalog access in promotion/band order.

#### Scenario: Focused small group is eligible

- **WHEN** a format is explicitly selected
- **THEN** matching cards appear in Grid and selection does not create a separate or small-format Coverflow.

#### Scenario: Group is ineligible

- **WHEN** the complete collection contains six or fewer items or enhancement is unsupported
- **THEN** it remains complete Grid without nonfunctional Coverflow controls.

#### Scenario: Preview adapts to the viewport

- **WHEN** Coverflow is activated on a supported phone or desktop
- **THEN** existing responsive stage spacing and at most six positioned cards remain available without changing canonical order.

#### Scenario: Visitor navigates the preview

- **WHEN** existing Previous/Next, focus, swipe, wheel or keyboard interactions are used
- **THEN** the shared interaction contract selects and wraps through the complete collection without reordering cards, retaining title/artist status.

#### Scenario: Visitor activates a preview record

- **WHEN** a positioned active card is activated
- **THEN** its ordinary canonical Store Item link opens without an alternate product route or quick view.

#### Scenario: Visitor selects a side cover or scrolls through the stage

- **WHEN** an inactive side cover is selected or a qualifying gesture occurs
- **THEN** existing focus-before-navigation, gesture suppression and native vertical-scroll behavior remain intact.

#### Scenario: Preview exposes artwork without losing record identity

- **WHEN** Coverflow is active
- **THEN** positioned/offstage accessibility, artwork, purchase facts, independent Listen actions and named links retain the existing shared Store behavior
- **AND** returning to Grid exposes the complete same card list.

#### Scenario: Distro search starts

- **WHEN** any format, artist or text filter becomes active
- **THEN** Coverflow ends, matching cards remain in Grid, and Coverflow cannot reactivate while filtering.

#### Scenario: Distro search clears or disconnects

- **WHEN** every filter clears or route cleanup runs
- **THEN** the complete canonical list returns in Grid without replaying Coverflow intent.

#### Scenario: Store Distro route enters through the app shell

- **WHEN** the route activates directly or through shell restoration
- **THEN** one route-owned shared controller connects to the same canonical list and starts in Grid without stale selection, visibility or preview state.

### Requirement: Coverflow, catalog, and search-results modes are exclusive

The complete mixed Distro collection MUST occupy one shared `preview`, `catalog`, or `search-results` mode. Initial rendering uses catalog mode; any format, artist or text filter forces search-results Grid.

#### Scenario: Visitor requests the full group

- **WHEN** Grid is selected from Coverflow
- **THEN** the same complete ordered cards appear in Grid, with the active item focused and shared disclosure behavior preserved.

#### Scenario: Disclosure activation repeats while a transition is active

- **WHEN** a disclosure transition is active
- **THEN** shared controls ignore repeated activation and remove temporary state after completion, interruption or cleanup.

#### Scenario: Visitor returns to the preview

- **WHEN** Coverflow is explicitly selected without active filters
- **THEN** the shared controller positions its selected item or the first item without reordering the catalog.

#### Scenario: Distro search becomes active

- **WHEN** any format, artist or text filter is active
- **THEN** the collection enters search-results Grid before result visibility updates, and Coverflow cannot activate.

#### Scenario: Distro search clears

- **WHEN** every filter clears or route cleanup runs
- **THEN** the complete canonical list returns in Grid without replaying Coverflow intent.

#### Scenario: Viewport changes

- **WHEN** the viewport crosses a responsive breakpoint
- **THEN** existing CSS adapts the scene without changing the selected mode or requiring resize state.

#### Scenario: Distro route exits and re-enters

- **WHEN** the shell caches and restores Distro
- **THEN** existing snapshot cleanup restores the complete server-authored Grid, canonical order and initial controls.

### Requirement: Coverflow disclosure is progressive and accessible

The shared mixed-catalog Coverflow MUST preserve complete server-rendered browsing, canonical links, keyboard focus and reduced-motion behavior.

#### Scenario: JavaScript or platform support is unavailable

- **WHEN** enhancement is disabled, unsupported or fails to mount
- **THEN** all canonical cards remain visible in order without nonfunctional controls.

#### Scenario: Supported Distro route paints its initial state

- **WHEN** enhancement is supported
- **THEN** the complete Grid remains visible before and after readiness; Coverflow requires explicit selection.

#### Scenario: Visitor prefers reduced motion

- **WHEN** reduced motion is requested
- **THEN** existing controls reach the same final states without movement or stagger and no catalog access is removed.

#### Scenario: Visitor uses the keyboard

- **WHEN** the visitor operates view and navigation controls
- **THEN** shared accessible names, 44px targets, visible focus and focus-before-link activation remain intact, including with the mobile mini-player open.

#### Scenario: Visitor enlarges the presentation

- **WHEN** text sizing or zoom increases
- **THEN** controls and status reflow without horizontal page overflow or obscured focus targets.

### Requirement: Coverflow disclosure preserves catalog ownership and performance budgets

The enhancement MUST reuse the same server-rendered Store Distro card nodes, without a fixed six-item grid row boundary, MUST NOT create a second catalog or commerce projection, and MUST remain within the fixed Store Distro performance budgets.

#### Scenario: Preview and catalog share content

- **WHEN** an eligible group moves between `preview`, `catalog`, and `search-results`
- **THEN** the same server-rendered Store Item card nodes change presentation in place
- **AND** Store Items are neither duplicated, recreated, reordered, paginated, nor virtualized
- **AND** search remains the sole writer of card, wrapper, and group `hidden` state while Coverflow writes only its own group-mode, bounded card-position, selected-card, control-state, status, and temporary transition attributes
- **AND** Store Offer availability and price remain tied to the canonical Store Item rather than a Distro-only commerce model
- **AND** no carousel, animation, gesture, or state-management dependency is added.

#### Scenario: Preview renders genuine bounded 3D depth

- **WHEN** an eligible group is in animated `preview` mode
- **THEN** an outer shell owns perspective and clipping while an inner stage owns `transform-style: preserve-3d`
- **AND** opacity is applied per cover and the inner stage has no grouping property that flattens its children
- **AND** only the front and visibly exposed side covers are promised as pointer targets while all positioned links, up to six, remain keyboard-operable.

#### Scenario: Motion is active

- **WHEN** the visitor changes the active preview record, hovers or focuses an actionable positioned cover, or toggles catalog disclosure
- **THEN** motion is event-driven, affects at most the six preview covers and one group reveal surface; cover navigation completes within 300ms and catalog disclosure uses at most 180ms of authored animation time
- **AND** catalog mode, toggle state, focus, and nearest-block scroll update before disclosure animation is awaited
- **AND** disclosure uses component-local CSS rather than a document View Transition, and `try/finally` cleanup removes in-flight state after completion or interruption
- **AND** hover or focus animates only the child artwork and inner surface under the shared Store Coverflow cue while outer 3D position transforms remain state-owned
- **AND** reduced-motion presentation removes the artwork transform while retaining a static surface and visible focus cue
- **AND** no autoplay, delayed navigation queue, timer loop, animation-frame loop, continuous drag physics, document-level wheel, keydown, or scroll listener, or card-by-card catalog stagger runs
- **AND** group-local pointer, wheel, and keyboard handling remains limited to the shared Store Coverflow interaction contract.

#### Scenario: Initial mount and disclosure performance are measured

- **WHEN** representative direct-load, shell-entry, and narrow-viewport checks exercise the revised default and existing Coverflow interactions
- **THEN** the complete canonical catalog remains available, movement stays bounded to the positioned stage, and the mobile disclosure introduces no horizontal page overflow or visible layout instability
- **AND** native page wheel behavior resumes outside the hovered preview stage and whenever `catalog` or `search-results` mode owns the presentation
- **AND** the full Grid remains usable while controller readiness is delayed, with no pre-ready disclosure queue
- **AND** any local development-server or unavailable-API delay is classified separately from Coverflow interaction behavior rather than used as a strict new latency gate
- **AND** both supported and unsupported clients begin with the complete Grid
- **AND** existing project Core Web Vitals budgets remain policy, with no new exhaustive performance matrix unless the focused checks reveal a regression.

### Requirement: Coverflow preview makes active position and complete catalog depth explicit

Each eligible Coverflow preview SHALL expose the relationship between its bounded preview and complete source-derived catalog without creating another catalog, request, or interaction mode.

#### Scenario: Eligible preview communicates catalog depth

- **WHEN** an eligible group enters `preview` mode
- **THEN** it presents the source-derived total, one-based active position, and source-derived count after the active record in three aligned labelled fields
- **AND** it states `You're viewing {current} of {total}`
- **AND** no continuation rail or other decorative ratio repeats those values
- **AND WHEN** the active record changes
- **THEN** current, remaining, and summary update from the same canonical index without a second counter or catalog.

#### Scenario: Preview controls express distinct tasks

- **WHEN** Coverflow controls render in `preview` mode
- **THEN** Previous and Next remain secondary controls for navigating every record in the canonical group through the bounded six-position stage
- **AND** the Grid segment of the view switch is the full-catalog disclosure control, with an accessible name and a target at least 44 CSS pixels high
- **AND** the preview adds no per-item pagination dots, thumbnails, drag affordance, autoplay, or looping animation.

#### Scenario: Preview reads as one BlackBox artwork rack

- **WHEN** an eligible Coverflow renders in preview mode
- **THEN** its overview, live record identity, and artwork stage form one coherent square-edged group using straight rules and flat BlackBox surfaces
- **AND** the record identity plaque leads with a Listen end for the active record when that record has a listening source
- **AND** the active cover remains dominant while up to five neighboring covers visibly communicate additional records
- **AND** Previous, Next, and the view switch retain native button semantics with the existing hierarchy and visible focus
- **AND** the composition reuses the current Coverflow controller and canonical Store Item nodes, adding no registry carousel, Embla dependency, second state engine, runtime image, duplicated six-card window, or duplicate Store Item node.

#### Scenario: Catalog or search-results mode replaces preview disclosure

- **WHEN** an eligible group enters `catalog` or `search-results` mode
- **THEN** preview-only totals, remaining count, Previous, Next, and the active preview plaque with its Listen end leave presentation and focus order according to the existing exclusive-mode contract
- **AND** catalog mode retains the Coverflow segment of the view switch while search-results mode retains search ownership.

#### Scenario: Disclosure motion runs

- **WHEN** motion is permitted and the visitor activates the Grid segment
- **THEN** catalog mode and its accessible pressed state apply immediately
- **AND** one hard-edged catalog reveal removes the preview-only band from presentation and reaches its final state within 180ms of authored animation time
- **AND** no timer loop, animation-frame loop, document View Transition, layout animation, or new controller mode is introduced.

#### Scenario: Reduced motion or unsupported enhancement remains complete

- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** preview total, current, remaining count, and controls remain perceivable while all new transitions reach their final state immediately
- **AND** the flat preview keeps each card's own Listen in place of the plaque
- **AND WHEN** JavaScript or required 3D support is unavailable
- **THEN** the complete server-rendered catalog remains available without nonfunctional preview disclosure.

#### Scenario: Catalog depth disclosure reflows

- **WHEN** the eligible group renders at 320 CSS pixels, 200% text size, or the 400% zoom equivalent
- **THEN** its title, three aligned labelled values, summary, plaque, and controls reflow in document order without clipped labels or two-dimensional page scrolling
- **AND** the full-catalog action remains distinguishable from Previous and Next without relying on colour alone.
