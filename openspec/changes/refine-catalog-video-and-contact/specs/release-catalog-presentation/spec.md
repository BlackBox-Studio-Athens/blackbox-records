## ADDED Requirements

### Requirement: Announced physical editions retain a separate lifecycle

The Releases catalog SHALL preserve an announced physical edition that cannot yet be ordered independently of the album's digital availability. An unavailable or missing offer SHALL NOT convert that announcement into a Sold out claim. Current confirmed buyable offers SHALL remain authoritative for purchasing.

#### Scenario: Digital album is released before vinyl ordering opens

- **GIVEN** Anarchotribal is Upcoming in the accepted release content, its digital date has passed and physical preorder is not enabled
- **WHEN** Releases renders with a non-buyable or missing physical offer
- **THEN** the record appears once with Digital out now and Vinyl coming later
- **AND** it retains release details and available Listen without a Sold out badge or asserted preorder action.

#### Scenario: Digital album is still unreleased before vinyl ordering opens

- **GIVEN** an announced physical edition has no confirmed buyable offer and its digital album is unreleased
- **WHEN** Releases renders
- **THEN** the record appears once with Vinyl coming later and truthful scheduled or unknown digital context
- **AND** it makes no Digital out now, Sold out or Pre-order claim from the physical announcement alone.

#### Scenario: Several records occupy different lifecycle combinations

- **GIVEN** records include announced vinyl, open preorders, regular buyable offers and genuinely unavailable editions
- **WHEN** the catalog is grouped and ordered
- **THEN** every record occupies one existing presentation role, with digital and physical facts kept distinct
- **AND** empty tiers are omitted and repeated records or per-combination storefront sections are not introduced.
