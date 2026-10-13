## MODIFIED Requirements

### Requirement: Releases orders featured records and the remaining catalog editorially

The system SHALL select up to two native physical editions for the featured rows in accepted editorial priority order, retaining catalog source order for ties. Remaining records SHALL share one remaining catalog in source order. Featured placement and record order MUST be identical in initial SSR, hydration, shell navigation and fresh offer resolution. Offer state SHALL determine truthful physical badges, prices and actions independently of these editorial roles.

#### Scenario: All three roles are available

- **GIVEN** Sidus and Afterwise have the first two accepted editorial priorities, Chronoboros has stocked vinyl, and Ouranopithecus has only a future physical edition
- **WHEN** Releases renders
- **THEN** the featured rows present Sidus then Afterwise
- **AND** Chronoboros remains in the remaining catalog with its confirmed buying path
- **AND** Ouranopithecus retains its catalog source position with separate digital and future-vinyl messages

#### Scenario: Visitor reads the page in source order

- **WHEN** a visitor reads or tabs through Releases
- **THEN** accepted editorial priority precedes the remaining catalog in source order
- **AND** headings and truthful physical states expose that sequence without visible section labels

#### Scenario: Wide viewport stacks the featured records

- **WHEN** two native physical editions occupy the featured rows at a wide viewport
- **THEN** they render as two identical stacked rows with equal covers and complete identity and actions
- **AND** the first editorial priority comes first and alone receives first-viewport image priority
- **AND** the remaining catalog begins after both rows without duplicate releases

#### Scenario: Visitor waits for current offers

- **GIVEN** the rendered open pre-order projection lists a featured edition
- **WHEN** Releases first paints
- **THEN** that edition already shows its Pre-order badge, Pre-order action, price, shipping estimate and terms link from the HTML
- **AND** editions the projection does not list show their neutral edition links until the live offer read confirms another state
- **AND** featured roles and the remaining catalog order stay fixed while the live read is pending, ready or failed
- **AND** every release appears once

#### Scenario: An offer changes availability

- **WHEN** a featured edition opens or closes ordering, sells out, or gains stock
- **THEN** its current physical badge, price and action reflect the authoritative offer
- **AND** its artwork, heading role and placement remain stable
- **AND** digital availability remains independently derived from accepted timing

#### Scenario: The live offer read fails

- **WHEN** the browser's offer read fails after a projected pre-order rendered
- **THEN** the rendered pre-order presentation remains
- **AND** buying still reaches the Store Item page and its authoritative offer check
