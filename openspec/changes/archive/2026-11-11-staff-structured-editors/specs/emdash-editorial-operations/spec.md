## ADDED Requirements

### Requirement: Editorial prices are stored as integer euro cents

Editorial price fields SHALL store positive integer euro cents. This includes Show ticket prices. Draft saving and publication SHALL reject fractional or non-positive cents with a field-scoped message. Public projections SHALL retain cents and public rendering SHALL format them as euros.

#### Scenario: Show ticket prices

- **WHEN** a Show stores prices 1000, 1200 and 1500
- **THEN** publication accepts it and the public site shows €10 / €12 / €15.

Show prices are unreleased and use cents directly. They do not require a legacy euro read or migration.

### Requirement: Artist countries are stored as ISO codes

Artist countries SHALL be stored as an ordered list of unique ISO 3166-1 alpha-2 codes. Public projections SHALL show the same English country labels as before, joined as today.

#### Scenario: Two countries

- **WHEN** an Artist stores GR and CY
- **THEN** the public artist page shows "Greece / Cyprus" exactly as it did before migration.

### Requirement: Hidden social links use a visible flag

Each social link SHALL store a visible flag. A visible link SHALL have an HTTPS profile address. A hidden link MAY omit its address or leave it empty; if it has an address, hiding SHALL preserve it. The `#` placeholder SHALL NOT be stored in new values. During the transition, a stored `#` SHALL read as hidden with no address.

#### Scenario: Hide YouTube

- **WHEN** staff switch YouTube to hidden
- **THEN** the record keeps its YouTube address with visible false, and the public footer omits YouTube.

#### Scenario: Legacy hidden link without an address

- **WHEN** a stored social link has `#` as its address
- **THEN** migration stores it with visible false and no address, without inventing one.

### Requirement: Distro items store one format

A distro or merch item SHALL store one format from the known format groups, plus an optional display override for the public label. Separate format description and tracklist format values SHALL NOT be stored. The tracklist SHALL follow the item format.

#### Scenario: CD item

- **WHEN** a distro item is a CD with no override
- **THEN** its public format label, filter group and tracklist format all derive from the single CD format.

### Requirement: Editorial flags are booleans

Editorial yes or no fields SHALL be stored and projected as true or false only. Numeric or text flag values SHALL be converted by migration and rejected afterwards.

#### Scenario: Show on Home

- **WHEN** a Release stored `show_on_home` as 1 before migration
- **THEN** after migration it is true, and saving 1 is rejected.

### Requirement: Service ids are generated from titles

A new service's id SHALL be generated from its title as a lowercase hyphenated slug, unique within the page. Staff SHALL be able to change it only through an explicit Change action, which keeps the same slug rules.

#### Scenario: New service

- **WHEN** staff add a service titled "Vinyl Mastering"
- **THEN** its id becomes vinyl-mastering without being typed.

### Requirement: Stored values are migrated once and published by review

An idempotent content migration SHALL convert existing drafts and live content to the typed stored forms. A second run SHALL change nothing. Live content SHALL reach the public site only through the existing review and Content Publication. Records it cannot convert SHALL be reported with the record and field, and left unchanged.

#### Scenario: Repeat migration

- **WHEN** the migration runs twice on the same CMS store
- **THEN** the second run reports no changes.

#### Scenario: Unconvertible value

- **WHEN** an Artist country label matches no ISO country
- **THEN** the migration reports the artist and field, leaves the value unchanged, and the editor marks the Basics card as a problem.
