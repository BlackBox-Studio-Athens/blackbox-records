## MODIFIED Requirements

### Requirement: Store Coverflow supports discrete touch swipe navigation

An enhanced Store Coverflow in `preview` mode MUST recognize deliberate horizontal touch swipes while retaining native vertical page panning, pinch zoom, taps, and ordinary Store Item link semantics. A completed swipe MUST block only the click that the swipe itself produces: the next pointerdown in the Coverflow, or 400 ms after the swipe's pointerup, MUST clear the block.

#### Scenario: Visitor swipes horizontally

- **WHEN** one primary touch pointer travels at least 40 CSS pixels horizontally, horizontal travel is at least 1.25 times vertical travel, and the pointer ends without cancellation
- **THEN** a leftward swipe advances exactly one canonical Store Item and a rightward swipe moves back exactly one canonical Store Item
- **AND** movement wraps at the beginning and end under the same rules as Previous and Next
- **AND** the completed swipe does not also activate a card link or side-cover click.

#### Scenario: Visitor pans vertically or pinches

- **WHEN** touch movement is vertical-dominant, shorter than the swipe threshold, cancelled, or part of a multi-touch gesture
- **THEN** Coverflow does not change its active Store Item
- **AND** the browser retains native vertical page panning and pinch zoom
- **AND** pointer capture does not begin before horizontal intent is established.

#### Scenario: Visitor taps a card

- **WHEN** the visitor taps the active front cover without completing a swipe
- **THEN** its canonical Store Item detail link opens with ordinary link semantics
- **AND WHEN** the visitor taps an inactive positioned side cover without completing a swipe
- **THEN** that Store Item becomes active without opening its route on the first tap.

#### Scenario: Visitor taps right after a swipe

- **GIVEN** the visitor completed a swipe
- **WHEN** they tap Previous, Next, Grid, Listen or the front cover
- **THEN** the first tap acts normally.

## ADDED Requirements

### Requirement: The Coverflow front card shows its price row

The enhanced Coverflow SHALL show the front card's price and status row inside the stage. Below 40rem with motion allowed, the front cover SHALL keep its full size and the stage SHALL leave room for the row beneath it; on desktop the front card's price and Buy control SHALL be visible and clickable.

#### Scenario: Phone shows the front card

- **WHEN** the Coverflow renders at 390 × 844 or 320 × 568
- **THEN** the front card's price row ends inside the stage.
