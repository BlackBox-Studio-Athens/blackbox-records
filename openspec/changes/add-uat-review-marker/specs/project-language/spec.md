## ADDED Requirements

### Requirement: Review Site Marker is the canonical status-cue term

The system SHALL use `Review Site Marker` as the maintainer-facing term for the persistent UAT header cue and `Review site · test payments` as its exact public copy.

#### Scenario: Maintainer artifact names the cue

- **WHEN** specs, tasks, docs, tests, validation output, or handoff notes refer to the cue
- **THEN** they use `Review Site Marker`
- **AND** they do not call it a UAT banner, environment badge, test-mode switch, staging ribbon, or launch-status alert.

#### Scenario: Public marker is rendered

- **WHEN** the marker appears in the shopper-facing header
- **THEN** it uses the exact words `Review site · test payments`
- **AND** it does not expose `UAT`, Local, PRD, Cloudflare, GitHub Pages, Worker, Stripe, sandbox, production, or other platform vocabulary.

#### Scenario: Environment terminology is discussed

- **WHEN** maintainers describe why the marker appears
- **THEN** UAT remains the Product Environment and Review Site Marker remains a visible cue within it
- **AND** `Review site` is not treated as a fourth Product Environment or a substitute for UAT.
