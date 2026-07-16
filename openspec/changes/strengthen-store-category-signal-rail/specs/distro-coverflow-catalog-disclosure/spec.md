## MODIFIED Requirements

### Requirement: Eligible Distro groups provide a bounded six-position 3D Coverflow across the complete group

The Store Distro category SHALL enhance a populated classified group into a responsive BlackBox 3D Coverflow when the group contains more than six Store Items and the required client platform support is available.

#### Scenario: Large group is eligible

- **WHEN** `/store/distro/` has JavaScript and `transform-style: preserve-3d` support, no search query is active, and a populated group contains more than six classified Store Items
- **THEN** the group enters `preview` mode with every Store Item available to the existing Coverflow controller in canonical Distro order
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

- **WHEN** the visitor activates Previous or Next or focuses a preview card
- **THEN** the selected Store Item becomes the front-facing active cover without reordering the group
- **AND** the visible status exposes its title and artist or label
- **AND** Previous wraps from the first record to the final record and Next wraps from the final record to the first without reordering the records or disabling either control.

#### Scenario: Visitor activates a preview record

- **WHEN** the visitor uses the keyboard to activate a preview card or uses a pointer to activate the already-active front cover
- **THEN** the canonical Store Item detail link opens with ordinary link semantics
- **AND** Coverflow does not substitute a modal, quick view, or alternate product route.

#### Scenario: Visitor selects a side cover or scrolls through the stage

- **WHEN** the visitor uses a pointer on a side cover that was not active at pointer-down
- **THEN** the Store Item becomes active without opening its detail route on that first click
- **AND WHEN** pointer movement exceeds 10px before click activation
- **THEN** route activation is suppressed without moving the Coverflow, capturing the pointer, or implementing drag physics.

#### Scenario: Preview exposes artwork without losing record identity

- **WHEN** an eligible group is in `preview` mode
- **THEN** each positioned card presents artwork without its catalog copy while retaining one static, server-authored accessible link name `{title} — {artist_or_label}` across all modes
- **AND** exactly six cards receive relative stage positions while every offstage card and empty wrapper gap uses `display: none` after enhancement is ready
- **AND** preview does not use opacity, offscreen positioning, or `aria-hidden` to conceal focusable offstage records or wrappers
- **AND** catalog, search-results, unsupported, and no-JavaScript presentations retain the same complete canonical Store Item nodes.

## ADDED Requirements

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
