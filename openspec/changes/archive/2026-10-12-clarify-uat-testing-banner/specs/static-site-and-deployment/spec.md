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

The system MUST compile the Review Site Marker through explicit UAT-only build flags with absence as the safe default: `SHOW_REVIEW_SITE_MARKER=true` for the public UAT build and `PUBLIC_STAFF_ENVIRONMENT=uat` for Staff.

#### Scenario: Cloudflare Pages UAT artifact is built

- **WHEN** the public and Staff UAT builds run
- **THEN** the public build sets `SHOW_REVIEW_SITE_MARKER=true` and Staff uses `PUBLIC_STAFF_ENVIRONMENT=uat`
- **AND** generated shopper-facing and Staff documents contain the exact header words `UAT · TESTING ONLY`, a link to the corresponding production home and the `[UAT] ` HTML-title prefix
- **AND** generated checkout documents contain `Test checkout. No real payment will be taken.` beside the final payment action.

#### Scenario: Local or PRD artifact is built

- **WHEN** Local, the full Cloudflare Pages PRD target, the PRD Holding Page, or a diagnostic target builds without the exact UAT flag
- **THEN** all three cues are absent
- **AND** missing, blank, `false`, or any value other than the exact string `true` cannot enable it.

#### Scenario: Build configuration drifts

- **WHEN** repository environment-model verification runs
- **THEN** it verifies the source-level marker contract: the flag and exact value are read only in the UAT-capable build and layouts, never unconditional, public at runtime or hostname-derived
- **AND** release verification of the deployed home page requires the cues on UAT and rejects them on PRD, before and after PRD deployment.
