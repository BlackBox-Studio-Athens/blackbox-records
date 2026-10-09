## ADDED Requirements

### Requirement: Homepage hero offers Store entry points

The homepage hero SHALL show, under the motto, a Browse the Store link to `/store/` and a See pre-orders link to the Home pre-orders showcase. See pre-orders SHALL be shown only while the pre-orders showcase is rendered on Home. The hero SHALL show no Scroll label; its animated scroll line keeps its existing states.

#### Scenario: Visitor lands on Home with pre-orders open

- **GIVEN** the Worker reports at least one stocked pre-order
- **WHEN** the visitor opens Home
- **THEN** the hero shows both links under the motto
- **AND** Browse the Store opens `/store/`
- **AND** choosing See pre-orders brings the pre-orders showcase into view below the header without leaving Home

#### Scenario: Visitor lands on Home with no pre-orders open

- **GIVEN** the Worker reports no stocked pre-orders
- **WHEN** the visitor opens Home
- **THEN** the hero shows Browse the Store
- **AND** no See pre-orders link is shown

#### Scenario: Visitor opens Home on a phone

- **WHEN** Home is displayed at 390 px or narrower, down to 280 px
- **THEN** the motto and links share the logo's left edge
- **AND** nothing overflows horizontally
- **AND** the links keep 44 px targets, sharing one row when they fit and wrapping to full-width rows when they do not

#### Scenario: Visitor sees the hero without a Scroll label

- **WHEN** the homepage hero renders
- **THEN** no Scroll text is shown
- **AND** the animated scroll line still hides without a transition once the hero is scrolled
