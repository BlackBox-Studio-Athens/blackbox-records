## ADDED Requirements

### Requirement: Checkout policy uses canonical Product Environment

Checkout capability, checkout start, provider mutation, and catalog readiness policy MUST resolve Product Environment as `LOCAL`, `UAT`, or `PRD` before deriving provider behavior.

#### Scenario: Checkout capability is evaluated

- **WHEN** the Worker evaluates native checkout availability
- **THEN** it evaluates the canonical Product Environment value
- **AND** it derives Stripe mode, feature-gate default, secret requirement, and checkout-disabled policy from the Product Environment profile.

#### Scenario: UAT checkout uses Stripe test mode

- **WHEN** checkout starts in `UAT`
- **THEN** the Worker uses the `UAT` Product Environment profile
- **AND** Stripe test mode and sandbox D1 behavior are derived provider/platform traits, not Product Environment values.

#### Scenario: PRD checkout remains disabled

- **WHEN** checkout capability or provider mutation is evaluated in `PRD` before the PRD-open gate exists
- **THEN** checkout and live provider mutation remain disabled
- **AND** Stripe live mode is treated as a provider trait that cannot bypass the `PRD` Product Environment gate.

### Requirement: Catalog and smoke evidence reports Product Environment first

Catalog verification, catalog promotion, and checkout smoke evidence SHALL report the Product Environment before provider/platform details.

#### Scenario: Catalog verification runs

- **WHEN** catalog verification inspects Stripe, D1, or Store Offer state
- **THEN** evidence records the Product Environment as `LOCAL`, `UAT`, or `PRD`
- **AND** Stripe test/live mode and Worker deployment target are recorded only as mapped traits.

#### Scenario: Smoke evidence is written

- **WHEN** provider smoke or promotion smoke writes evidence
- **THEN** evidence paths and summaries identify the target Product Environment
- **AND** suite names that include provider words such as `stripe-sandbox` do not replace the Product Environment field.
