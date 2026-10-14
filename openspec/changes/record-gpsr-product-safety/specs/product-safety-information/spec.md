## ADDED Requirements

### Requirement: Verified product safety content

The content model SHALL support optional private product safety information on Releases and Distro, without inferring legal identities from pressing credits, artist labels or release dates. Verification SHALL require product type and identifier, manufacturer name and postal/electronic contact, establishment, the relevant EU responsible person, an explicit safety assessment, the operator role and evidence.

#### Scenario: Non-EU manufacturer

- **WHEN** a record claims verification for a manufacturer outside the EU
- **THEN** complete responsible-person contacts and an EU member-state location are required

#### Scenario: No safety instructions required

- **WHEN** verified evidence supports an explicit assessment that no warnings or instructions are required
- **THEN** the record may use `not_required`; an empty or missing assessment does not imply that outcome

### Requirement: Private evidence and verified offer projection

The accepted-snapshot collection mapping SHALL expose only verified offer data to the public renderer and SHALL omit evidence, internal review details, operator role and first-market date. Partial private work SHALL remain saveable with safe types and links.

#### Scenario: Unpublished safety edit

- **WHEN** a private draft adds safety information
- **THEN** accepted content remains unchanged until normal selected-record publication

#### Scenario: Public projection

- **WHEN** a verified record is mapped for rendering
- **THEN** the public projection includes product identification, manufacturer, required responsible person and safety information, and excludes internal evidence

### Requirement: Explicit staged adoption

The implementation SHALL report readiness issues without silently changing current commerce, catalogue visibility, checkout or launch controls. Unknown manufacturer SHALL remain unresolved. Transition evidence SHALL not be inferred from the album release date or automatically waive online-offer requirements.

#### Scenario: Legacy offer without safety information

- **WHEN** existing content has no product safety field or has a valid incomplete record
- **THEN** existing publication behavior remains compatible, no verified public claim is emitted, and the finding remains subject to recorded factual/display/enforcement acceptance blockers
