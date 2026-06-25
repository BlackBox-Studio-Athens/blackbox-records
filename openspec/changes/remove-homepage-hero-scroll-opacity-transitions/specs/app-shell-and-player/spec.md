## ADDED Requirements

### Requirement: Homepage hero scroll opacity is transition-free

The app shell SHALL keep homepage hero opacity state free of CSS opacity transitions and per-scroll custom-property writes.

#### Scenario: Shopper scrolls through the homepage hero

- **GIVEN** the homepage hero is rendered in the persistent app shell
- **WHEN** the shopper scrolls from the hero into the next homepage section
- **THEN** the media layer, shade layer, grain layer, and scroll indicator update their hero scrolled state without declaring opacity transitions
- **AND** scrolling does not repeatedly start and cancel opacity transitions for those scroll targets
- **AND** the app shell does not write `--homepage-hero-scroll-progress` on every scroll frame.

#### Scenario: Scroll state changes only at the coarse threshold

- **GIVEN** the homepage hero scroll sync is connected
- **WHEN** repeated scroll events stay on the same side of the hero scrolled threshold
- **THEN** the app shell does not mutate the hero class repeatedly
- **AND** the app shell toggles the scrolled class when the threshold state changes.

#### Scenario: Reduced motion remains respected

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the homepage hero keeps nonessential animation and transition behavior disabled by the existing reduced-motion rules
- **AND** the scroll-progress opacity fix does not remove visible content or status text.
