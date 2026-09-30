## ADDED Requirements

### Requirement: Closed-set editorial values are chosen, not typed

The staff editor SHALL offer a choice control for every editorial value whose legal set is closed, and the shared content schemas SHALL reject values outside that set. The closed sets are:

- About fact keys: `artists`, `releases`, `countries` and `year`.
- Social platforms that have a footer icon.
- Public page paths for Navigation and Home links.
- One recognized country for Settings.

The editor SHALL also:

- Accept only email addresses as About contact values.
- Hide a social link with an explicit switch, so staff never type `#`.
- Keep service link names in lowercase-hyphen form and unique.
- Reduce pasted Bandcamp embed code to the canonical player URL.
- Stop staff adding or removing repeatable rows beyond the schema bounds.

Open-set labels, such as genre, release formats and credit roles, SHALL remain free text.

#### Scenario: Staff edits an About fact

- **WHEN** staff edit a Label fact on the About page
- **THEN** they choose the fact from Number of artists, Number of releases, Number of artist countries or Years active
- **AND** a stored key outside those values fails validation.

#### Scenario: Staff hides a social link

- **WHEN** staff turn on Hide this link on the website
- **THEN** the entry stores the hidden sentinel without staff typing it
- **AND** turning the switch off shows an empty HTTPS profile address input.

#### Scenario: Staff pastes Bandcamp embed code

- **WHEN** staff paste the Share/Embed iframe code into the Bandcamp player field
- **THEN** the entry stores only the canonical `https://bandcamp.com/EmbeddedPlayer/…` URL
- **AND** an album page address is kept as entered and reported as invalid.

#### Scenario: Staff links a navigation entry

- **WHEN** staff set a Navigation or Home link
- **THEN** they choose a listed public page
- **AND** an arbitrary path cannot be saved.
