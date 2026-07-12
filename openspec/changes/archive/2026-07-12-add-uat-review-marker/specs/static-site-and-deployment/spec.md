## ADDED Requirements

### Requirement: UAT build owns Review Site Marker visibility

The system MUST compile the Review Site Marker through an explicit UAT-only static build flag with absence as the safe default.

#### Scenario: GitHub Pages UAT artifact is built

- **WHEN** the shared workflow runs the `Build UAT static frontend` step
- **THEN** that step sets `SHOW_REVIEW_SITE_MARKER=true`
- **AND** generated shopper-facing documents contain the exact header words `TEST SITE` and `Test payments only` plus the `[TEST] ` HTML-title prefix
- **AND** generated checkout documents contain `Test checkout. No real payment will be taken.` beside the final payment action.

#### Scenario: Local or PRD artifact is built

- **WHEN** Local, the full Cloudflare Pages PRD target, the PRD Holding Page, or a diagnostic target builds without the exact UAT flag
- **THEN** all three cues are absent
- **AND** missing, blank, `false`, or any value other than the exact string `true` cannot enable it.

#### Scenario: Build configuration drifts

- **WHEN** repository environment-model verification runs
- **THEN** it verifies that the flag and exact value are scoped to the UAT build step
- **AND** it rejects a marker that is unconditional, public at runtime, hostname-derived, or enabled in a PRD build scope.

### Requirement: Hosted UAT verifies Review Site Marker presence

The system SHALL include marker presence in hosted UAT static acceptance rather than relying only on workflow source inspection.

#### Scenario: UAT public-route smoke runs

- **WHEN** the existing UAT Static Smoke `public_routes` scenario probes representative shopper routes
- **THEN** every probed HTML page must contain the exact header cue and `[TEST] ` title prefix
- **AND** probed checkout HTML must contain the exact final-action warning
- **AND** any missing cue fails the scenario and its recorded evidence.

#### Scenario: UAT interface is manually accepted

- **WHEN** Browser Use validates the deployed UAT artifact at mobile and desktop sizes
- **THEN** it checks direct loads, title prefix, checkout warning placement, shell navigation persistence, header control clearance, and coexistence with mobile navigation, cart, player, and overlay states
- **AND** it records no cue-caused overflow, layout shift, console error, or inaccessible text.
