# Spec Delta

## MODIFIED Requirements

### Requirement: Selected upcoming release has self-contained artwork and information

The system SHALL present announced physical editions with complete identifying editorial content and separate digital and physical messages, without requiring a duplicate card elsewhere.

#### Scenario: Upcoming release is rendered

- **WHEN** Ouranopithecus is digitally released but its vinyl cannot yet be ordered
- **THEN** its presentation includes linked artwork and title, artist, semantic digital date, optional summary and formats
- **AND** its messages distinguish Digital out now from Vinyl Coming Soon, followed by the offer's expected month when one is shown
- **AND** it retains View release and available Listen without asserting an open preorder
- **AND** artwork uses the existing responsive image handling and authored alt text or title fallback

#### Scenario: Upcoming artwork loads beside the feature

- **WHEN** campaign and supporting artwork render
- **THEN** only the lead campaign image receives first-viewport priority
- **AND** all other artwork uses responsive non-priority delivery

### Requirement: Digital and physical availability remain separate

The system SHALL describe digital availability independently from physical offer state. Physical buying copy, prices, expected months and shipping estimates MUST come from existing commerce authority. Release stage SHALL describe the music only and SHALL NOT decide physical copy. Unknown offers MUST use neutral editorial or edition-detail paths without invented stock, price, preorder or shipment claims.

#### Scenario: Digital album is out while vinyl is on preorder

- **WHEN** an album's digital date has passed and its confirmed vinyl offer is a preorder
- **THEN** the page can show Digital out now alongside Vinyl preorder and Pre-order vinyl
- **AND** its expected shipping comes from the preorder offer and remains an estimate

#### Scenario: Digital album is out while vinyl ordering has not opened

- **WHEN** a digital album is available and its vinyl either has no Store Item yet or its offer reads Coming Soon
- **THEN** the page shows Digital out now and Vinyl Coming Soon with editorial access
- **AND** it does not infer preorder eligibility from the album date, the format list or Release stage

#### Scenario: Release stage is Upcoming but the offer is stocked

- **WHEN** a release's stage is Upcoming and its native vinyl offer is stocked or on pre-order
- **THEN** the physical badge and action follow the offer, Vinyl available with Buy vinyl or the pre-order badges
- **AND** Release stage affects only the digital message

#### Scenario: Offer read fails

- **WHEN** the current physical offer cannot be read or classified
- **THEN** the page exposes useful neutral detail access with no physical badge
- **AND** it does not present a fabricated price or claim that the edition is stocked, coming soon or on preorder

## ADDED Requirements

### Requirement: Release badges reuse the Store availability vocabulary

Release cards and detail pages SHALL show one digital badge and at most one physical badge per edition. The digital badge SHALL be Digital out now once the digital date has passed, Out followed by the date when it is in the future, and absent without a date. The physical badge SHALL be the format name followed by the Store label for the offer's state: available, Coming Soon, Repressing or Sold Out. An unavailable offer SHALL show no physical badge. Pre-order SHALL keep its pre-order badges.

#### Scenario: Future digital date

- **WHEN** a release's digital date is 14 November 2026 and today is earlier
- **THEN** its digital badge reads Out 14 November 2026
- **AND** Album upcoming is not shown.

#### Scenario: Native edition is depleted

- **WHEN** a release's native vinyl offer reads Repressing with expected month 2027-01
- **THEN** the physical badge reads Vinyl Repressing followed by Expected January 2027
- **AND** the strings Out of Stock, Currently Unavailable, Unavailable, coming later and Physical availability unconfirmed never appear.

#### Scenario: Edition details are not buyable

- **WHEN** a release's physical edition reads Coming Soon, Repressing or Sold Out
- **THEN** its edition action is an underlined text link "View vinyl details" (or "View edition") with a trailing arrow, not an outlined box
- **AND** Buy vinyl and Pre-order vinyl keep their button treatment.

#### Scenario: Offer has not been read yet

- **WHEN** a release card renders before its offer read completes
- **THEN** it shows the digital badge and no physical badge, then adds the physical badge when the offer arrives without changing card geometry.
