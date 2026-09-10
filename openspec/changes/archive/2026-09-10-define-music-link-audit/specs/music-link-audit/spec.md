## ADDED Requirements

### Requirement: Music-link audit scope is complete and exclusive

Each music-link audit MUST enumerate one Bandcamp and one Tidal slot for every current Artist profile and Release player source, with every slot classified exactly once.

#### Scenario: First audit scope is created

- **GIVEN** the 2026-07-13 catalog contains three Artists and three Releases
- **WHEN** the first audit report is prepared
- **THEN** one committed `music-link-audit.md` contains exactly twelve slots
- **AND** slots use stable Artist-then-Release order with Bandcamp before Tidal

#### Scenario: Audit slot is classified

- **WHEN** a slot is recorded
- **THEN** it appears in exactly one structural section: `Missing`, `Questionable`, or `Verified`
- **AND** it links to its source content path

### Requirement: Audit states have distinct evidence rules

The audit SHALL keep missing, uncertain, and verified outcomes distinct rather than inferring correctness from URL presence or HTTP success.

#### Scenario: Link is missing

- **WHEN** no authored URL and no credible candidate are found for a slot
- **THEN** the slot is `Missing`
- **AND** the absence is recorded as a catalog gap, not an automatic correction requirement

#### Scenario: Link is questionable

- **WHEN** an authored or candidate URL exists but identity, field role, redirect, load/access, playback, or editorial intent remains unresolved
- **THEN** the slot is `Questionable`

#### Scenario: Access is inconclusive

- **WHEN** login, consent, geography, or a transient provider failure prevents confirmation
- **THEN** the slot remains `Questionable`
- **AND** a successful HTTP response alone cannot make it `Verified`

#### Scenario: Artist link is verified

- **WHEN** manual review confirms provider, Artist identity, outbound-profile role, and final destination
- **THEN** the Artist slot is `Verified`
- **AND** it does not establish Release playback

#### Scenario: Release link is verified

- **WHEN** manual review confirms provider, intended Release identity, player-source role, final destination, and working embed playback
- **THEN** the Release slot is `Verified`

### Requirement: Audit runs are read-only

The audit MUST record evidence without mutating Artist or Release content.

#### Scenario: Audit finds a correction candidate

- **WHEN** a missing, questionable, or verified row suggests a content change
- **THEN** the audit records the evidence and proposed field
- **AND** content remains unchanged until a separate approved implementation change applies a correction backed by a `Verified` row

#### Scenario: Audit output is produced

- **WHEN** an audit run is committed
- **THEN** it uses one Markdown file with an audit date, source links, concise evidence, and the three result sections
- **AND** it adds no scraper, provider API, crawler, validator script, confidence score, screenshot archive, or machine-readable mirror
