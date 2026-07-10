## ADDED Requirements

### Requirement: PRD Holding Page is the canonical temporary-surface term

The system SHALL use `PRD Holding Page` for the temporary public page served on the future PRD hostname before full-site cutover.

#### Scenario: Maintainer artifact names the page

- **WHEN** specs, tasks, docs, workflow labels, tests, or handoff notes refer to the temporary public page
- **THEN** they use `PRD Holding Page`
- **AND** they do not call it UAT, the launched PRD Site, a production preview, a private preview, or a new environment.

#### Scenario: Public page describes itself

- **WHEN** shopper-facing copy explains the temporary state
- **THEN** it uses ordinary brand language such as `site`, `full site`, `coming online`, or `being prepared`
- **AND** it does not expose the maintainer-facing term `PRD Holding Page` or other platform vocabulary.

### Requirement: PRD Holding Page remains distinct from PRD readiness

The system SHALL distinguish the branded public holding experience from the full disabled PRD readiness surface at `blackbox-records-web.pages.dev`.

#### Scenario: Deployment surfaces are compared

- **WHEN** maintainers document the holding branch and Pages production `main` deployment
- **THEN** they identify which surface is public-facing and temporary
- **AND** which surface carries the full disabled PRD artifact for readiness checks
- **AND** they do not treat either surface as successful live-commerce proof before the production-go-live gates pass.
