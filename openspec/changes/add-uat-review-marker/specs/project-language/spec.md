## ADDED Requirements

### Requirement: Review Site Marker is the canonical status-cue term

The system SHALL use `Review Site Marker` as the maintainer-facing term for the layered UAT status cues and `TEST SITE`, `Test payments only`, and `Test checkout. No real payment will be taken.` as their exact public copy.

#### Scenario: Maintainer artifact names the cue

- **WHEN** specs, tasks, docs, tests, validation output, or handoff notes refer to the cue
- **THEN** they use `Review Site Marker` for the combined header, browser-title, and checkout cues
- **AND** they do not call it a UAT banner, environment badge, test-mode switch, staging ribbon, or launch-status alert.

#### Scenario: Public marker is rendered

- **WHEN** the marker appears in the shopper-facing header
- **THEN** the header uses the exact words `TEST SITE` and `Test payments only`
- **AND** the final checkout cue uses `Test checkout. No real payment will be taken.`
- **AND** it does not expose `UAT`, Local, PRD, Cloudflare, GitHub Pages, Worker, Stripe, sandbox, production, or other platform vocabulary.

#### Scenario: Environment terminology is discussed

- **WHEN** maintainers describe why the marker appears
- **THEN** UAT remains the Product Environment and Review Site Marker remains a visible cue within it
- **AND** `Test site` is not treated as a fourth Product Environment or a substitute for UAT.
