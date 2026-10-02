# Spec Delta

## ADDED Requirements

### Requirement: Releases carry partner store links

A Release SHALL carry an optional ordered list of partner store links, each a label and a full HTTPS URL, edited beside the release's listening links and published like other release fields. The list SHALL be editorial only and SHALL NOT carry price, stock or provider data.

#### Scenario: Member adds partner links

- **WHEN** a member adds, reorders or removes partner store rows on a Release and saves
- **THEN** the rows persist in order, appear in publication review, and publish with the Release.

#### Scenario: Invalid row

- **WHEN** a row has an empty label or a URL that is not a full HTTPS URL
- **THEN** the affected field shows its error and publication is blocked until it is fixed, while the draft can still be saved.

#### Scenario: Shopper outside Greece opens the Store Item

- **WHEN** the Store Item page of a release with partner links is shown
- **THEN** it names those partners as places to order from outside Greece, as external links that open safely
- **AND** a release without partner links shows nothing.

#### Scenario: Existing content

- **WHEN** existing Releases without the field are read, validated or published
- **THEN** they remain valid and unchanged.
