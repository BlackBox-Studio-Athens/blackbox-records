## ADDED Requirements

### Requirement: Environment-scoped checkout readiness

The system MUST evaluate checkout readiness against the canonical Local, UAT, and PRD product environment model.

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
- **THEN** the request is handled by the UAT Worker against sandbox D1 and Stripe test mode.

#### Scenario: PRD checkout is disabled

- **GIVEN** PRD has not been opened by a production-readiness gate
- **WHEN** the browser reads checkout capability or attempts checkout from Cloudflare Pages
- **THEN** checkout remains disabled without exposing provider internals
- **AND** no live Stripe Checkout Session is created.

### Requirement: Environment-scoped provider mutation

The system MUST prevent provider catalog mutation unless the target product environment and gate allow it.

#### Scenario: UAT catalog apply runs

- **GIVEN** a generated Desired Catalog State targets UAT
- **WHEN** the promotion workflow applies provider catalog changes
- **THEN** it uses the sandbox Worker/D1/Stripe test mapping
- **AND** Product Projection image URLs resolve from the GitHub Pages UAT asset base
- **AND** records UAT Promotion Evidence.

#### Scenario: PRD catalog apply is requested while PRD is disabled

- **GIVEN** a generated Desired Catalog State targets PRD
- **WHEN** the promotion workflow reaches the PRD apply step before the PRD-open gate exists
- **THEN** the apply step fails closed or records `not_configured` evidence
- **AND** it does not mutate Stripe live mode, production D1, or production Worker checkout availability
- **AND** it does not record successful PRD Promotion Evidence.

#### Scenario: PRD catalog readiness checks product image URLs

- **GIVEN** a generated Desired Catalog State targets PRD
- **WHEN** catalog readiness or dry-run verification evaluates Product Projection image URLs
- **THEN** the URLs resolve from the Cloudflare Pages PRD asset base or an approved PRD custom domain asset base
- **AND** GitHub Pages UAT asset URLs are rejected for PRD readiness/live provider mutation unless a later approved change defines GitHub Pages as a shared canonical asset CDN.

### Requirement: Environment-scoped checkout origins

The system MUST keep checkout return origins, browser CORS origins, and Worker API targets aligned with the Local, UAT, and PRD product environment matrix.

#### Scenario: UAT checkout origin is evaluated

- **GIVEN** checkout runs through the UAT Worker
- **WHEN** return origins or browser origins are evaluated
- **THEN** GitHub Pages UAT is allowed
- **AND** local `uat-connected` origins are allowed only as an explicitly named diagnostic path
- **AND** Cloudflare Pages PRD and Cloudflare Pages preview origins are not accepted as UAT checkout evidence origins.

#### Scenario: PRD checkout origin is evaluated

- **GIVEN** checkout runs through the PRD Worker
- **WHEN** return origins or browser origins are evaluated
- **THEN** Cloudflare Pages PRD and approved PRD custom domains are the only PRD shopper-facing origins
- **AND** GitHub Pages UAT, local origins, and Cloudflare Pages preview origins are not accepted as PRD checkout evidence origins.

#### Scenario: Local mock checkout origin is evaluated

- **GIVEN** checkout runs through the Local `mock` Worker
- **WHEN** return origins or browser origins are evaluated
- **THEN** only local static origins are accepted
- **AND** deployed UAT, PRD, and preview origins are not needed for Local mock checkout.
