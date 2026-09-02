## MODIFIED Requirements

### Requirement: Environment-scoped checkout readiness

The system MUST evaluate checkout readiness against the canonical Local, UAT, and PRD product environment model.

#### Scenario: Checkout policy resolves Product Environment

- **WHEN** the Worker evaluates checkout capability or checkout start
- **THEN** it resolves the Product Environment as `LOCAL`, `UAT`, or `PRD`
- **AND** it derives Stripe mode and feature-gate defaults from that Product Environment profile.

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
- **WHEN** the shopper starts checkout from GitHub Pages
- **THEN** the request is handled by the UAT Worker against UAT D1 and Stripe test mode.

#### Scenario: PRD checkout is disabled

- **GIVEN** `PRD_LAUNCH_APPROVED` is absent or is not `true`
- **WHEN** the browser reads checkout capability or attempts checkout from a PRD origin
- **THEN** checkout remains disabled without exposing provider internals
- **AND** no live Stripe Checkout Session is created even when the runtime checkout switch is enabled.

#### Scenario: PRD runtime checkout is disabled

- **GIVEN** `PRD_LAUNCH_APPROVED=true`
- **WHEN** `native_checkout_enabled` resolves false
- **THEN** checkout remains disabled
- **AND** no live Stripe Checkout Session is created.

#### Scenario: PRD checkout is enabled

- **GIVEN** `PRD_LAUNCH_APPROVED=true`
- **AND** `native_checkout_enabled` resolves true
- **WHEN** the shopper starts checkout from an approved PRD origin
- **THEN** the request may proceed through normal Worker price, stock, order, and provider validation.

### Requirement: Environment-scoped provider mutation

The system MUST prevent provider catalog mutation unless the target Product Environment and an operation-specific confirmation allow it. Shopper launch approval and runtime checkout enablement MUST NOT authorize provider mutation.

#### Scenario: UAT catalog apply runs

- **GIVEN** a generated Desired Catalog State targets UAT
- **WHEN** the promotion workflow applies provider catalog changes
- **THEN** it uses the UAT Worker/D1/Stripe test mapping
- **AND** Product Projection image URLs resolve from the GitHub Pages UAT asset base
- **AND** records UAT Promotion Evidence.

#### Scenario: PRD catalog apply is requested while PRD is disabled

- **GIVEN** a generated Desired Catalog State targets PRD
- **WHEN** the promotion workflow or direct command reaches apply without explicit live catalog confirmation
- **THEN** the apply fails closed or records `not_configured` evidence
- **AND** it does not mutate Stripe live mode, PRD D1, or PRD Worker checkout availability
- **AND** it does not record successful PRD Promotion Evidence.

#### Scenario: PRD catalog apply is confirmed

- **GIVEN** a generated Desired Catalog State targets PRD and repository gates passed for its exact artifact commit
- **WHEN** the operator explicitly confirms live catalog changes for that run
- **THEN** the bounded PRD provider and D1 catalog apply may proceed
- **AND** shopper checkout remains governed only by PRD launch approval plus runtime checkout enablement.

#### Scenario: PRD catalog readiness checks product image URLs

- **GIVEN** a generated Desired Catalog State targets PRD
- **WHEN** catalog readiness or dry-run verification evaluates Product Projection image URLs
- **THEN** the URLs resolve from the Cloudflare Pages PRD asset base or an approved PRD custom domain asset base
- **AND** GitHub Pages UAT asset URLs are rejected for PRD readiness/live provider mutation unless a later approved change defines GitHub Pages as a shared canonical asset CDN.
