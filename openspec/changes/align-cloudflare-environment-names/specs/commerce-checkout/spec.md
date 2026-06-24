## MODIFIED Requirements

### Requirement: Environment-scoped checkout readiness

The system MUST evaluate checkout readiness against the canonical Local, UAT, and PRD product environment model.

#### Scenario: Checkout policy resolves Product Environment

- **WHEN** the Worker evaluates checkout capability, checkout start, or provider mutation policy
- **THEN** it resolves the Product Environment as `LOCAL`, `UAT`, or `PRD`
- **AND** it derives Stripe mode, feature-gate defaults, Worker runtime target, and provider mutation policy from that Product Environment profile.

#### Scenario: Local mock checkout starts

- **GIVEN** Local runs in `mock` mode
- **WHEN** checkout readiness is evaluated
- **THEN** the system uses local Worker state, local D1, and stripe-mock behavior
- **AND** it does not require Stripe live/test secrets or deployed provider writes.

#### Scenario: Local UAT-connected checkout is inspected

- **GIVEN** Local runs in `uat-connected` mode
- **WHEN** checkout readiness is inspected from the local static frontend
- **THEN** browser calls target the deployed UAT Worker/API
- **AND** local config does not receive UAT Stripe secrets or UAT Worker secrets.

#### Scenario: Local UAT-connected checkout write is requested

- **GIVEN** Local runs in `uat-connected` mode
- **WHEN** a maintainer triggers checkout behavior that creates provider state
- **THEN** the write is performed only by the deployed UAT Worker under UAT rules
- **AND** the command or UI path is explicitly labeled as a UAT checkout/smoke action.

#### Scenario: UAT checkout starts

- **GIVEN** UAT checkout is enabled
- **WHEN** checkout readiness is evaluated
- **THEN** the request is handled by the `uat` Worker against UAT D1 and Stripe test mode.

#### Scenario: PRD checkout is disabled

- **GIVEN** PRD has not been opened by a production-readiness gate
- **WHEN** checkout readiness is evaluated
- **THEN** the `prd` Worker reports checkout unavailable without creating live Stripe state.
