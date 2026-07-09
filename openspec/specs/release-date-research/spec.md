# release-date-research Specification

## Purpose
TBD - created by archiving change modularize-artwork-fetcher-add-release-date-research. Update Purpose after archive.
## Requirements
### Requirement: Release Date Research reads current catalog content

The system SHALL provide a local Release Date Research tool that reads current release and distro catalog content without requiring provider secrets or runtime services.

#### Scenario: Tool inventories current content

- **WHEN** Release Date Research runs in default mode
- **THEN** it reads `apps/web/src/content/releases/*.md`
- **AND** it reads `apps/web/src/content/distro/*.json`
- **AND** it reads `scripts/data/distro-inventory-source.json` when present for source-table aliases and current catalog membership
- **AND** it does not call Stripe, D1, Worker APIs, checkout APIs, or hosted provider mutation APIs

#### Scenario: Content row identity is normalized

- **GIVEN** a current content entry has spelling, punctuation, casing, diacritic, or alias differences from the Distro Inventory Source
- **WHEN** Release Date Research matches the entry
- **THEN** it uses the existing catalog identity and alias matching rules before treating the row as missing
- **AND** it records the matched source identity in the report evidence

### Requirement: Release Date Research is standalone

The system SHALL expose Release Date Research as a standalone local CLI.

#### Scenario: Release date command runs directly

- **WHEN** an operator runs `release-date-research`
- **THEN** the command runs without first running artwork fetch, mockup generation, or distro sync
- **AND** it accepts its own input, output, source-limit, override, dry-run, and apply flags

### Requirement: Candidate dates are classified by basis and precision

The tool SHALL classify every discovered date so platform upload dates, format release dates, and actual release dates cannot be silently conflated.

#### Scenario: Candidate date is recorded

- **WHEN** the tool discovers a date from any source
- **THEN** it records the date value
- **AND** it records precision as `day`, `month`, or `year`
- **AND** it records basis as `original_release`, `format_release`, `reissue`, `preorder`, `announcement`, `platform_upload`, `store_availability`, or `unknown`
- **AND** it records source tier, source name, source URL, matched artist, matched title, matched format, confidence, and notes

#### Scenario: Platform upload date is found

- **GIVEN** a source only proves that a release was uploaded or distributed to a platform
- **WHEN** the tool records that source date
- **THEN** it classifies the basis as `platform_upload`
- **AND** it does not treat that candidate as an Actual Release Date unless independent higher-tier evidence confirms the same day as the release date

### Requirement: Actual Release Date is chosen conservatively

The tool SHALL choose an Actual Release Date only when source evidence supports the public release event for the relevant release or catalog item.

#### Scenario: Official source gives exact release date

- **GIVEN** an official artist, label, or release page states an exact release date for the matched release
- **WHEN** no higher-priority conflict exists
- **THEN** Release Date Research may choose that date as the Actual Release Date
- **AND** it records source tier `official`
- **AND** it records day-level precision

#### Scenario: Format-specific catalog item has separate release evidence

- **GIVEN** a distro item represents a physical format
- **AND** credible evidence gives a format-specific release date that differs from the original digital or work-level date
- **WHEN** Release Date Research evaluates the item
- **THEN** it records both dates as candidates
- **AND** it chooses the format-specific date only when the source clearly identifies the stocked format or edition
- **AND** it marks the item for manual review when the desired basis remains ambiguous

#### Scenario: Only weak evidence exists

- **GIVEN** candidates come only from DSP pages, auto-generated video metadata, retailer stock pages, generic search snippets, or partial month/year records
- **WHEN** Release Date Research evaluates the item
- **THEN** it reports the best candidate
- **AND** it marks the item as `manual_review` or `unknown`
- **AND** it does not auto-apply a `release_date`

### Requirement: Source precedence and confidence are transparent

Release Date Research SHALL expose why one date outranks another.

#### Scenario: Multiple source tiers agree

- **GIVEN** official evidence and at least one catalog database or retailer source agree on the same day-level date
- **WHEN** artist, title, and relevant format match
- **THEN** the chosen date may be marked high confidence
- **AND** the report lists each agreeing source

#### Scenario: Sources conflict

- **GIVEN** two or more credible candidates disagree on date, precision, or basis
- **WHEN** Release Date Research evaluates the item
- **THEN** it includes the item in conflict output
- **AND** it lists each conflicting candidate with basis and source tier
- **AND** it does not change content without a verified override

#### Scenario: Existing content date disagrees with chosen evidence

- **GIVEN** an existing content `release_date` differs from a high-confidence chosen date
- **WHEN** Release Date Research reports the item
- **THEN** it marks the existing value as stale or suspicious
- **AND** it includes the proposed replacement date and supporting evidence

### Requirement: Reports are reviewable and cache-backed

The tool SHALL write deterministic local evidence files suitable for review, rerun, and later implementation handoff.

#### Scenario: Dry-run report is generated

- **WHEN** Release Date Research completes without `--apply`
- **THEN** it writes report artifacts under `.codex-artifacts/release-date-research/`
- **AND** the artifacts include a machine-readable summary
- **AND** the artifacts include candidate, missing, conflict, and proposed-update views
- **AND** the console output summarizes counts without dumping noisy source payloads

#### Scenario: Network sources are queried

- **WHEN** the tool calls public metadata sources
- **THEN** it uses cached HTTP/API responses where practical
- **AND** it respects per-host delays, `429`, `503`, and `Retry-After`
- **AND** it uses a contactable User-Agent
- **AND** it does not bypass authentication, bot challenges, paywalls, or platform protections

### Requirement: Applying dates is explicit and guarded

Release Date Research SHALL avoid changing content unless the caller explicitly opts into safe application.

#### Scenario: Apply mode updates high-confidence exact dates

- **GIVEN** a row has a day-precision high-confidence Actual Release Date
- **AND** no unresolved conflict exists
- **WHEN** the operator runs Release Date Research with `--apply`
- **THEN** the tool may update the matching `release_date` field
- **AND** it records the changed file, old value, new value, basis, confidence, and source URL in apply evidence

#### Scenario: Apply mode sees ambiguous evidence

- **GIVEN** a row has only weak, partial, upload-only, or conflicting evidence
- **WHEN** the operator runs Release Date Research with `--apply`
- **THEN** the tool leaves that content file unchanged
- **AND** it reports that manual review or a verified override is required

#### Scenario: Verified override authorizes a date

- **GIVEN** a verified override records a chosen date, basis, source URL, and reviewer note for a matched item
- **WHEN** Release Date Research applies changes
- **THEN** the tool may apply the override even when automated confidence would otherwise require review
- **AND** the apply evidence identifies the override as the authority

### Requirement: Release Date Research is testable without live network

The system SHALL include fixture-backed validation for date parsing, classification, scoring, and apply safety.

#### Scenario: Fixture tests run offline

- **WHEN** tool tests run in CI or locally
- **THEN** they use fixtures for Bandcamp, MusicBrainz, Discogs, retailer, and DSP-like source payloads
- **AND** they verify classification of Actual Release Date, Platform Upload Date, format release date, and conflict cases
- **AND** they do not require network access or provider secrets

#### Scenario: Apply safety is tested

- **WHEN** tests exercise apply mode
- **THEN** high-confidence exact dates update fixture content
- **AND** weak, partial, upload-only, or conflicting candidates leave fixture content unchanged

