## ADDED Requirements

### Requirement: Image Policy Validation Is Read-Only

The system SHALL validate image policy drift without mutating images or content.

#### Scenario: Asset QA checks image policy

- **GIVEN** `pnpm assets:check` runs after image-policy validation is extended
- **WHEN** it inspects public assets, content image references, and projected image URLs
- **THEN** it may report broken references, unreadable images, unsupported formats, obvious dimension or crop drift, missing alt-field coverage, and provider URL readiness
- **AND** it does not rewrite image files, content references, public URLs, or Astro image handling.

#### Scenario: Legacy image quality drift is subjective

- **GIVEN** validation finds crop, dimension, or quality drift that does not break runtime correctness or accessibility
- **WHEN** the drift is reported
- **THEN** it may be warning-first
- **AND** image replacement waits for explicit owner-approved content work.
