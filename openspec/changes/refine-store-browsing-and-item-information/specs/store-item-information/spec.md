# Spec Delta

## Purpose

Help record buyers understand an item's music, physical format, and tracklist alongside its purchase information using existing editorial sources.

## ADDED Requirements

### Requirement: Item details present a compact source-backed information hierarchy

Store Item pages SHALL present artwork and purchase information prominently, with distinct Info, Tracklist, and existing More views sections when content exists.

#### Scenario: Shopper opens an item at desktop width

- **WHEN** a Store Item detail page renders on a desktop
- **THEN** complete, bounded artwork appears beside title, artist or label, selected option, authoritative price, purchase action, and existing purchase information
- **AND** existing supported Listen and editorial links remain accessible
- **AND** Info and Tracklist can occupy adjacent columns below the purchase summary so long prose does not force Tracklist beneath it.

#### Scenario: Shopper reads on a narrow screen

- **WHEN** an item page renders at 320 or 390 CSS pixels or with enlarged text
- **THEN** identity, artwork, purchase decisions, Info, Tracklist, and More views follow a readable single-column sequence
- **AND** titles, controls, and track names wrap without horizontal page scrolling or clipped focus.

#### Scenario: Item information comes from a Release

- **WHEN** the Store Item has a Release source
- **THEN** Info uses its existing summary, body, credits, and known facts, and Tracklist uses that Release's optional tracklist
- **AND** content is not copied into a parallel Store record
- **AND** a release's other editorial formats are not implied to be purchasable options.

#### Scenario: Item information comes from Distro

- **WHEN** the Store Item has a Distro source
- **THEN** Info uses its existing summary and known format/date, and Tracklist uses that Distro entry's optional tracklist
- **AND** existing gallery images remain available under More views
- **AND** no guessed artist relation or pressing details are introduced
- **AND** separately implemented supported Listen actions remain available; this change does not add provider fields or a player.

### Requirement: Tracklists remain readable editorial content

Tracklists SHALL use validated embedded Tracklist, Track, Side and Disc values associated with the item's physical format. Vinyl and cassette use ordered sides with controlled letter labels; CD uses ordered discs. Tracks contain titles and optional validated m:ss durations. Public positions derive from group and track order; no independent track identities, provider linkage or track database is introduced.

#### Scenario: Tracklist is populated

- **WHEN** staff has entered tracks for the item's physical format
- **THEN** each track appears once in its authored order within its labelled side or disc
- **AND** vinyl/cassette positions use side letters and track numbers while CD positions use track numbers, qualified by disc for multiple discs
- **AND** known durations appear without fabricated missing durations
- **AND** the heading and semantic ordered lists render without client JavaScript.

#### Scenario: Tracklist belongs to a different physical format

- **WHEN** the authored tracklist format does not match the Store Item's known physical format
- **THEN** it is not rendered as that item's tracklist
- **AND** no vinyl side assignment or CD track sequence is inferred from another edition.

#### Scenario: Optional content is absent

- **WHEN** no matching tracklist contains any tracks, or another optional section has no content
- **THEN** the empty section is omitted while valid remaining information and purchase controls remain available
- **AND** the page shows no invented tracks or editorial completion warning.

#### Scenario: Editorial updates are published

- **WHEN** the item's accepted content changes
- **THEN** its detail route displays the updated information through the existing content publication path
- **AND** price, stock, cart, checkout identities, and provider authority are unchanged.
