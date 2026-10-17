## MODIFIED Requirements

### Requirement: Neighbouring cards fade without script

Home swipe cards SHALL remain fully opaque without scroll-driven animations when the primary input matches `(hover: none) and (pointer: coarse)`. For other input, where the browser supports scroll-driven animations and the visitor has not asked for reduced motion, cards beside the current card SHALL fade toward 45% opacity in proportion to their distance from the gutter, driven by CSS rather than script. Browsers without scroll-driven animations SHALL show every card at full opacity.

#### Scenario: Visitor scrolls Home on a touch device

- **GIVEN** the primary input matches `(hover: none) and (pointer: coarse)`
- **WHEN** Home renders in portrait or landscape
- **THEN** every News and Artists card remains fully opaque without a scroll-driven animation
- **AND** the existing native horizontal scrolling, snapping, dot controls and shell-navigation continuity remain available.

#### Scenario: Visitor with reduced motion

- **GIVEN** the visitor's device asks for reduced motion
- **WHEN** Home renders its swipe rows
- **THEN** every card renders at full opacity

#### Scenario: Browser without scroll timelines

- **GIVEN** a browser that does not support `animation-timeline`
- **WHEN** Home renders its swipe rows
- **THEN** every card renders at full opacity
