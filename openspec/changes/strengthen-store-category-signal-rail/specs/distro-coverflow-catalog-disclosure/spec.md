## MODIFIED Requirements

### Requirement: Eligible Distro groups provide a bounded 3D Coverflow preview

The Store Distro category SHALL enhance a populated classified group into a responsive BlackBox 3D Coverflow when the group contains more than six Store Items and the required client platform support is available.

#### Scenario: Large group is eligible

- **WHEN** `/store/distro/` has JavaScript and `transform-style: preserve-3d` support, no search query is active, and a populated group contains more than six classified Store Items
- **THEN** the group enters `preview` mode with exactly the first six Store Items in canonical Distro order
- **AND** canonical order follows the existing authored Distro catalog `order` rather than random selection or a second featured-item model
- **AND** one cover is front-facing while neighboring covers use mirrored 3D depth, rotation, scale, and opacity
- **AND** the group identifies the source-derived total, fixed six-item preview, source-derived remaining count, and availability of the complete catalog
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

#### Scenario: Preview exposes artwork without losing record identity

- **WHEN** an eligible group is in `preview` mode
- **THEN** each of the first six cards presents artwork without its catalog copy while retaining one static, server-authored accessible link name `{title} — {artist_or_label}` across all modes
- **AND** every wrapper after the first uses `display: none` from preview presentation so later Store Items and empty wrapper gaps leave rendering, focus order, and the accessibility tree
- **AND** preview does not use opacity, offscreen positioning, or `aria-hidden` to conceal focusable later records or wrappers.

## ADDED Requirements

### Requirement: Coverflow preview makes remaining catalog depth explicit

Each eligible Coverflow preview SHALL expose the relationship between its bounded preview and complete source-derived catalog without creating another catalog, request, or interaction mode.

#### Scenario: Eligible preview communicates catalog depth

- **WHEN** an eligible group enters `preview` mode
- **THEN** it presents the source-derived total, the fixed six-item preview count, and the source-derived remaining count
- **AND** it states `You're viewing {preview} of {total} · {remaining} more to explore`
- **AND** a decorative continuation rail represents the preview-to-total ratio while the adjacent text carries the same meaning without relying on colour or geometry.

#### Scenario: Preview controls express distinct tasks

- **WHEN** Coverflow controls render in `preview` mode
- **THEN** Previous and Next remain secondary controls for navigating the bounded preview
- **AND** `View all {total}` is the visually primary disclosure control with an accessible name and a target at least 44 CSS pixels high
- **AND** the preview adds no per-item pagination dots, thumbnails, drag affordance, autoplay, or looping animation.

#### Scenario: Catalog or search-results mode replaces preview disclosure

- **WHEN** an eligible group enters `catalog` or `search-results` mode
- **THEN** preview-only totals, remaining count, continuation rail, Previous, Next, and active preview status leave presentation and focus order according to the existing exclusive-mode contract
- **AND** catalog mode retains the existing `Show Coverflow` control while search-results mode retains search ownership.

#### Scenario: Disclosure motion runs

- **WHEN** motion is permitted and an eligible preview first enhances
- **THEN** the Store-accent rail draws once from zero to the source-derived preview ratio using transform-only motion
- **AND** the remaining label appears once with restrained opacity and no more than 4 CSS pixels of movement
- **AND WHEN** the visitor activates `View all {total}`
- **THEN** the preview band and rail remain visible while the rail reaches 100% during the first 180ms and the catalog remains concealed
- **AND** the hard-edged catalog reveal begins only after the rail fill completes, removes the preview-only band from presentation, and reaches its final state within the established 480ms authored-animation budget
- **AND** no timer loop, animation-frame loop, document View Transition, layout animation, or new controller mode is introduced.

#### Scenario: Reduced motion or unsupported enhancement remains complete

- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** preview totals, remaining count, static continuation ratio, and controls remain perceivable while all new transitions reach their final state immediately
- **AND WHEN** JavaScript or required 3D support is unavailable
- **THEN** the complete server-rendered catalog remains available without nonfunctional preview disclosure.

#### Scenario: Catalog depth disclosure reflows

- **WHEN** the eligible group renders at 320 CSS pixels, 200% text size, or the 400% zoom equivalent
- **THEN** its title, three labelled values, summary, rail, and controls reflow in document order without clipped labels or two-dimensional page scrolling
- **AND** the primary full-catalog action remains distinguishable from Previous and Next without relying on colour alone.
