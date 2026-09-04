## MODIFIED Requirements

### Requirement: UAT static smoke stays read-only

The system SHALL provide a manual UAT static smoke path that verifies GitHub Pages static routes, the Sveltia admin document and assets, public pages, sitemap/robots, and the checkout shell without mutating provider state or becoming a default deploy gate.

#### Scenario: UAT static smoke runs

- **WHEN** a maintainer or workflow runs `pnpm smoke:uat-static -- --site-url https://blackbox-studio-athens.github.io/blackbox-records`
- **THEN** it inspects the deployed GitHub Pages UAT frontend
- **AND** it writes evidence under `.codex-artifacts/smoke/uat/uat-static/<run-id>/`
- **AND** it does not authenticate to Sveltia, publish content, create Stripe Checkout Sessions, modify D1, or touch webhooks
- **AND** its evidence remains separate from provider smoke evidence.
