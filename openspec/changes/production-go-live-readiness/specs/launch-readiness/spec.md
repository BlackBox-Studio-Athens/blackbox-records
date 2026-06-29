## ADDED Requirements

### Requirement: Production launch gates

The system MUST block PRD native-commerce launch until live payment, domain, webhook, Worker, D1, emergency-disable, and approval evidence exists.

#### Scenario: Launch is requested

- **GIVEN** UAT/test-mode evidence exists
- **WHEN** PRD launch is considered
- **THEN** live Stripe credentials, live Products/Prices, final domain, production webhook endpoint, production Worker/D1 configuration, and final approval are verified first
- **AND** the PRD-open gate remains absent until that evidence exists.

### Requirement: Launch evidence safety

The system SHALL record PRD evidence without committing secrets, full Stripe IDs, provider credentials, raw provider payloads, or account-specific private data.

#### Scenario: Evidence is recorded

- **GIVEN** a production readiness check produces account-specific output
- **WHEN** evidence is written to OpenSpec
- **THEN** it is redacted to safe identifiers and summary status only.

### Requirement: Release data promotion boundary

The system MUST use Decap-authored repo content and generated catalog artifacts as the launch data path for PRD, and MUST NOT copy UAT runtime/provider state into PRD.

#### Scenario: UAT-prepared content is selected for launch

- **GIVEN** colleagues have prepared release content in UAT through Decap
- **WHEN** that content is considered for PRD launch
- **THEN** the launch artifact commit is generated from the repo content and has UAT proof for the same commit
- **AND** approved launch Store Items have explicit PRD target policy, live price authority, first-publication stock readiness, PRD D1 readiness rows, and live provider ownership evidence
- **AND** UAT D1 rows, Stripe test-mode Products/Prices, synthetic stock quantities, and UAT smoke evidence are not copied or treated as PRD launch data
- **AND** PRD catalog assets use PRD asset URLs instead of UAT asset URLs.

### Requirement: Rollback and disable path

The system MUST have documented rollback and emergency-disable behavior before native commerce receives production traffic.

#### Scenario: Go-live review finds a critical issue

- **GIVEN** reviewers identify a launch blocker
- **WHEN** native checkout must be disabled or rolled back
- **THEN** the approved rollback or disable path is available without exposing runtime secrets to the frontend.
