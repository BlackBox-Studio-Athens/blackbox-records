## ADDED Requirements

### Requirement: Vinyl Pressing is the canonical service term

Current Services content, visible UI, public inquiry contracts, email output, provider tags, tests, current requirement language, and operational documentation MUST use `Vinyl Pressing` as the service label. The stable non-display content section id MAY remain `vinyl-printing`. Completed and archived implementation records MAY retain their historical wording.

#### Scenario: Services page renders the vinyl offering

- **WHEN** the Services page or Sveltia Services editor presents the vinyl service
- **THEN** the visible title is `Vinyl Pressing`
- **AND** the stored service id remains the stable section anchor `vinyl-printing`
- **AND** supporting copy uses pressing and production language rather than vinyl printing.

#### Scenario: Visitor submits a vinyl inquiry

- **WHEN** a visitor selects and submits the vinyl service
- **THEN** the browser and Worker contract use the exact value `Vinyl Pressing`
- **AND** the inquiry is still routed to `vinyl@blackboxrecordsathens.com`
- **AND** email subjects, message fields, and fallback copy use the canonical pressing term.

#### Scenario: Public contract artifacts are generated

- **WHEN** the public OpenAPI document and API client are generated from current source
- **THEN** their Services inquiry enum contains `Vinyl Pressing`
- **AND** it does not expose `Vinyl Printing` as a current accepted value.

#### Scenario: Stable section anchor and provider tag are used

- **WHEN** the Services section anchor and Worker provider-safe tag are generated
- **THEN** the section anchor may remain `vinyl-printing`
- **AND** the provider-safe tag is `vinyl-pressing`
- **AND** neither internal value is rendered as the service label or exposed as the public inquiry enum value.
