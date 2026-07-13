## RENAMED Requirements

### Requirement: Homepage hero scroll motion is threshold-bounded

FROM: Homepage hero scroll opacity is transition-free
TO: Homepage hero scroll motion is threshold-bounded

## MODIFIED Requirements

### Requirement: Homepage hero scroll motion is threshold-bounded

The app shell SHALL coordinate one synchronized, bounded fade cycle on each homepage hero media and shade layer per existing coarse scroll-state change, without per-scroll custom-property writes or independently mutable animation state. The scroll indicator SHALL retain its immediate, transition-free opacity state.

#### Scenario: Shopper crosses the Home hero threshold

- **GIVEN** the homepage hero is rendered in the persistent app shell
- **AND** the browser does not request reduced motion
- **WHEN** the existing coarse hero state changes to scrolled
- **THEN** the media layer and shade layer fade together from their current opacity to 0 over 180 milliseconds using `cubic-bezier(0.22, 1, 0.36, 1)`
- **AND** both layers remain visible until that bounded fade completes
- **AND** both layers become hidden after completion
- **AND** the scroll indicator changes state without an opacity transition
- **AND** no transform, keyframe, `will-change` hint, scroll-progress property, or removed grain layer participates in the effect.

#### Scenario: Shopper returns above the threshold

- **GIVEN** the Home media and shade are fading out or settled hidden
- **WHEN** the existing coarse hero state changes to not scrolled
- **THEN** both layers become visible immediately
- **AND** each layer uses the same declared 180-millisecond duration and curve to return from its current opacity to 1
- **AND** an interrupted native CSS reversal remains bounded and completes without a separate application animation state or a required 180 milliseconds of wall time.

#### Scenario: Scroll events remain on one threshold side

- **GIVEN** the homepage hero scroll sync is connected
- **WHEN** repeated scroll events stay on the same side of the hero scrolled threshold
- **THEN** the app shell does not mutate the hero class repeatedly
- **AND** no Home hero opacity transition restarts or cancels because of those same-side events
- **AND** the app shell does not write `--homepage-hero-scroll-progress` on every scroll frame.

#### Scenario: Scrolled state settles

- **WHEN** the bounded exit fade completes while the hero remains scrolled
- **THEN** the media and shade remain at opacity 0 and hidden
- **AND** no transition or decorative animation continues running behind later content
- **AND** the existing hidden scroll-cue child animation remains stopped.

#### Scenario: Reduced motion remains respected

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the media and shade reach the endpoint required by the existing coarse state immediately with no transition
- **AND** a specificity-safe scrolled override removes both opacity-transition duration and delayed visibility timing
- **AND** nonessential Home animation remains disabled
- **AND** visible content and status text remain available.
