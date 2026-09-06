## MODIFIED Requirements

### Requirement: Eligible Distro groups provide a bounded 3D Coverflow preview

The Store Distro category SHALL enhance a populated classified group into a responsive BlackBox 3D Coverflow when the group contains more than six Store Items, or when a group containing two or more Store Items is explicitly selected through enhanced format navigation, and the required client platform support is available.

#### Scenario: Large group is eligible

- **WHEN** `/store/distro/` has JavaScript and `transform-style: preserve-3d` support, no search query is active, and a populated group contains more than six classified Store Items
- **THEN** the group enters `preview` mode with every Store Item available to the shared Store Coverflow controller in canonical Distro order
- **AND** canonical order follows the existing authored Distro catalog `order` rather than random selection or a second featured-item model
- **AND** at most six Store Items are positioned in the stage at once, with one front-facing cover and neighboring covers using mirrored 3D depth, rotation, scale, and opacity
- **AND** every other offstage Store Item leaves presentation, focus order, and the accessibility tree until it receives a stage position or the visitor opens the catalog
- **AND** the group identifies the source-derived total, active position, source-derived count after the active record, and availability of the complete flat catalog
- **AND** one prominent shared status identifies the active Store Item by title and artist or label without a numeric position prefix that could be mistaken for a date.
- **AND** the group uses the same shared Store Coverflow controller and lifecycle as eligible flat Store categories without a second Distro mount.

#### Scenario: Focused small group is eligible

- **WHEN** `/store/distro/` has JavaScript and `transform-style: preserve-3d` support, no search query is active, and enhanced format navigation explicitly selects a group containing two to six Store Items
- **THEN** that selected group enters `preview` mode using the same server-rendered cards, controls, status, and shared Store Coverflow controller
- **AND** every item in the selected group is available in canonical order
- **AND** each card receives one stage position, with exactly one active front-facing cover after initialization and after each navigation step, including when the group contains exactly two items
- **AND** returning to `All formats` returns that small group to its complete grid without changing membership or order.

#### Scenario: Group is ineligible

- **WHEN** `All formats` is current and a populated group contains six or fewer Store Items, or an explicitly selected group contains only one Store Item
- **THEN** the group remains in its existing catalog layout
- **AND** no Coverflow control or alternative catalog order is exposed.

#### Scenario: Preview adapts to the viewport

- **WHEN** an eligible group is in `preview` mode below `40rem`
- **THEN** it uses a compact stage and side-cover spacing suited to the narrow viewport
- **AND WHEN** the same group is viewed at `40rem` or wider
- **THEN** it uses a wider but compact stage with restrained cover size and enough lateral and depth spacing to keep neighboring records apparent without dominating the viewport
- **AND** both presentations use the same canonical card nodes, up to six relative positions, controls, state, and order.

#### Scenario: Visitor navigates the preview

- **WHEN** the visitor activates Previous or Next, focuses a preview card, completes a qualifying touch swipe, supplies handled wheel input, or presses a focus-scoped Left Arrow or Right Arrow
- **THEN** the selected Store Item becomes the front-facing active cover without reordering the group
- **AND** the visible status exposes its title and artist or label
- **AND** movement wraps from the first record to the final record and from the final record to the first without reordering the records or disabling Previous or Next
- **AND** touch, wheel, arrow-key, focus, and repeat behavior follows the shared Store Coverflow interaction contract.

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
- **AND** up to six cards receive relative stage positions while every offstage card and empty wrapper gap uses `display: none` after enhancement is ready
- **AND** preview does not use opacity, offscreen positioning, or `aria-hidden` to conceal focusable offstage records or wrappers
- **AND** Store Item availability labels and badges are absent from positioned preview covers while catalog, search-results, unsupported, and no-JavaScript presentations retain their existing availability presentation
- **AND** actionable positioned covers use the same hover and focus-visible cue as All Store Coverflow
- **AND** catalog, search-results, unsupported, and no-JavaScript presentations retain the same complete canonical Store Item nodes.
