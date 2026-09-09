## MODIFIED Requirements

### Requirement: Coverflow disclosure preserves catalog ownership and performance budgets

The enhancement MUST reuse the same server-rendered Store Distro card nodes and six-item wrappers, MUST NOT create a second catalog or commerce projection, and MUST remain within the fixed Store Distro performance budgets.

#### Scenario: Preview and catalog share content

- **WHEN** an eligible group moves between `preview`, `catalog`, and `search-results`
- **THEN** the same server-rendered Store Item card nodes and wrapper nodes change presentation in place
- **AND** Store Items are neither duplicated, recreated, reordered, paginated, nor virtualized
- **AND** search remains the sole writer of card, wrapper, and group `hidden` state while Coverflow writes only its own group-mode, bounded card-position, selected-card, control-state, status, pending-disclosure, and temporary transition attributes
- **AND** Store Offer availability and price remain tied to the canonical Store Item rather than a Distro-only commerce model
- **AND** no carousel, animation, gesture, or state-management dependency is added.

#### Scenario: Preview renders genuine bounded 3D depth

- **WHEN** an eligible group is in animated `preview` mode
- **THEN** an outer shell owns perspective and clipping while an inner stage owns `transform-style: preserve-3d`
- **AND** opacity is applied per cover and the inner stage has no grouping property that flattens its children
- **AND** only the front and visibly exposed side covers are promised as pointer targets while all six links remain keyboard-operable.

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

- **WHEN** `/store/distro/` runs direct loads, app-shell entries, 320px and 390px mobile checks, focused wheel, keyboard, hover, reduced-motion checks, and delayed-controller first-activation checks
- **THEN** the complete canonical catalog remains available, movement stays bounded to the positioned stage, and the mobile disclosure introduces no horizontal page overflow or visible layout instability
- **AND** native page wheel behavior resumes outside the hovered preview stage and whenever `catalog` or `search-results` mode owns the presentation
- **AND** a disclosure activation received before controller readiness reaches catalog mode exactly once after readiness without a second activation
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
- **THEN** catalog mode and its accessible toggle state apply immediately without waiting for the continuation rail
- **AND** one hard-edged catalog reveal removes the preview-only band from presentation and reaches its final state within 180ms of authored animation time
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
