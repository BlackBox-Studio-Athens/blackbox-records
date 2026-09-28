## MODIFIED Requirements

### Requirement: Hosted UAT verifies Review Site Marker presence

The system SHALL verify the current English Review Site Marker in hosted public UAT acceptance.

#### Scenario: UAT public-route smoke runs

- **WHEN** the public route smoke probes a shopper page
- **THEN** missing banner wording, `Open production site`, or `[UAT] ` title prefix fails acceptance
- **AND** checkout probes also require the existing final-action payment warning.

#### Scenario: UAT interface is manually accepted

- **WHEN** the deployed artifact is checked at mobile and desktop sizes
- **THEN** checks cover banner visibility, wrapping, production link, navigation persistence, and coexistence with player and overlay controls on public and Staff surfaces.

### Requirement: UAT-only builds own Review Site Marker visibility

The system MUST use `SHOW_REVIEW_SITE_MARKER=true` for the public UAT build and `PUBLIC_STAFF_ENVIRONMENT=uat` for Staff, with non-UAT builds omitting the banner and title prefix.

#### Scenario: Cloudflare Pages UAT artifact is built

- **WHEN** public and Staff UAT artifacts build
- **THEN** they render the English UAT testing banner, the corresponding production-home link, and `[UAT] ` browser-title prefix
- **AND** public checkout retains the final-action payment warning.

#### Scenario: Local or PRD artifact is built

- **WHEN** Local or PRD artifacts build with their normal environment configuration
- **THEN** neither UAT banner nor `[UAT] ` title prefix is present.

#### Scenario: Build configuration drifts

- **WHEN** repository environment-model verification runs
- **THEN** it rejects public markers that are unconditional, hostname-derived, or enabled without the exact private UAT build flag.
