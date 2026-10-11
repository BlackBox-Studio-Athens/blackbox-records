## ADDED Requirements

### Requirement: Homepage hero offers Store entry points

The homepage hero SHALL show, under the motto, a Browse the Store link to `/store/` as its only action. The hero SHALL NOT render a See pre-orders link. The showcase SHALL hydrate at browser idle priority so the main page can load first. Browse the Store SHALL remain available in the initial HTML independently of the showcase. The hero SHALL show no Scroll label; its animated scroll line keeps its existing states.

#### Scenario: Visitor lands on Home with pre-orders open

- **GIVEN** the Worker reports at least one stocked pre-order
- **WHEN** the visitor opens Home
- **THEN** the hero shows only Browse the Store under the motto
- **AND** Browse the Store opens `/store/`
- **AND** the pre-orders showcase remains available further down Home

#### Scenario: Main page loads before the pre-order showcase is ready

- **WHEN** Home has rendered and its deferred pre-order check is still pending
- **THEN** the hero, motto and Browse the Store link remain available
- **AND** no additional hero action appears when the showcase renders
- **AND** the showcase loads automatically at browser idle priority without requiring scrolling or a click

#### Scenario: Visitor lands on Home with no pre-orders open

- **GIVEN** the Worker reports no stocked pre-orders
- **WHEN** the visitor opens Home
- **THEN** the hero shows Browse the Store
- **AND** no See pre-orders link is shown

#### Scenario: Visitor sees the hero without a Scroll label

- **WHEN** the homepage hero renders
- **THEN** no Scroll text is shown
- **AND** the animated scroll line still hides without a transition once the hero is scrolled

### Requirement: Compact hero Store action remains accessible

Browse the Store SHALL use the approved compact outlined treatment on mobile and desktop: a 28 px drawn height, approximately 100 px width at the default text scale, 12 px type and a translucent black face. Touch devices SHALL retain a target at least 44 px high independently of the drawn frame. Keyboard focus SHALL remain visible.

#### Scenario: Visitor opens Home on a phone

- **WHEN** Home is displayed at 390 px or narrower, down to 280 px
- **THEN** the motto and Store link share the logo's left edge
- **AND** nothing overflows horizontally
- **AND** the Store link keeps its 44 px touch target

#### Scenario: Visitor taps outside the compact frame

- **GIVEN** Home is displayed on a touch device
- **WHEN** the visitor taps within the Store link's invisible 44 px target, just above or below its drawn frame
- **THEN** the Store opens through the persistent shell

#### Scenario: Visitor uses a keyboard on desktop

- **WHEN** the visitor focuses Browse the Store with a keyboard
- **THEN** the link has a visible focus outline
- **AND** pressing Enter opens the Store through the persistent shell
