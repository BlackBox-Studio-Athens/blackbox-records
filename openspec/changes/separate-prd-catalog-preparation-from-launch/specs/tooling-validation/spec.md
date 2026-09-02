## MODIFIED Requirements

### Requirement: Environment matrix validation

The system SHALL provide validation that detects drift from the canonical Local, UAT, and PRD Product Environment model, including raw platform/provider aliases and retired production controls used outside approved boundaries.

#### Scenario: Deployment workflows are checked

- **WHEN** environment validation runs
- **THEN** it verifies GitHub Pages is the UAT static deployment path
- **AND** Cloudflare Pages is the PRD static deployment path
- **AND** Cloudflare Worker runtime targets are named `local`, `uat`, or `prd`
- **AND** no workflow introduces an additional shopper-facing static environment
- **AND** any branch, preview, or diagnostic deployment is reported as non-product and excluded from UAT/PRD evidence.

#### Scenario: Frontend and Worker origins are checked

- **WHEN** environment validation runs
- **THEN** it verifies UAT static builds call the UAT Worker/API
- **AND** PRD static builds call the PRD Worker/API
- **AND** `CHECKOUT_RETURN_ORIGINS` and browser CORS origins do not contain broad cross-environment or preview allowlists.

#### Scenario: Catalog public asset URLs are checked

- **WHEN** environment validation runs against catalog contracts, Desired Catalog State, Product Projections, or Promotion Evidence
- **THEN** it verifies UAT Product image URLs use the GitHub Pages UAT asset base
- **AND** PRD Product image URLs use the Cloudflare Pages PRD asset base or an approved PRD custom domain asset base
- **AND** PRD readiness/live evidence cannot be produced from GitHub Pages UAT Product image URLs unless a later approved change defines GitHub Pages as a shared canonical asset CDN.

#### Scenario: PRD disabled state is checked

- **WHEN** environment validation runs before production launch
- **THEN** it verifies unconfirmed PRD provider mutation and unapproved or runtime-disabled PRD checkout fail closed independently
- **AND** it rejects the retired `PRD_OPEN_GATE` name in active workflow, runtime, documentation, and test contracts
- **AND** it reports any path where live catalog confirmation could enable shopper checkout.

#### Scenario: Baseline OpenSpec wording is checked

- **WHEN** environment validation or closeout review runs
- **THEN** affected baseline OpenSpec specs do not retain stale Purpose, requirement, or scenario wording that describes GitHub Pages as rollback/legacy production, Cloudflare Pages as canonical production without PRD-disabled state, or Cloudflare/Wrangler `sandbox` / `production` targets
- **AND** archive readiness is blocked until baseline source-of-truth prose matches the Local/UAT/PRD model.

#### Scenario: Raw platform aliases are checked

- **WHEN** environment validation scans app policy, workflows, tests, docs, and current OpenSpec artifacts
- **THEN** raw `sandbox`, `production`, provider mode, platform environment, and deprecated production-control values outside approved boundaries are reported
- **AND** Local/UAT/PRD remain the only Product Environment values.

### Requirement: PRD validation separates preparation from launch

The system MUST validate live PRD catalog preparation, shopper launch approval, and runtime checkout enablement as independent controls.

#### Scenario: PRD is not open

- **GIVEN** explicit live catalog confirmation is absent
- **WHEN** PRD price or catalog apply tooling runs
- **THEN** it reports disabled, not configured, or readiness-only status
- **AND** it does not mutate Stripe live mode or PRD D1.

#### Scenario: PRD catalog preparation is confirmed

- **GIVEN** one exact-commit workflow run or direct command carries explicit live catalog confirmation
- **WHEN** PRD price or catalog apply tooling runs
- **THEN** it may mutate only the bounded PRD provider and D1 catalog state
- **AND** the confirmation does not alter Worker launch approval or runtime checkout state.

#### Scenario: PRD catalog webhook arrives before open gate

- **GIVEN** `PRD_LAUNCH_APPROVED` is absent or is not `true`
- **WHEN** the PRD Worker receives a signed Stripe catalog webhook
- **THEN** the runtime path may verify the signature and process catalog state according to its deployed PRD policy
- **AND** shopper checkout remains unavailable until launch approval and runtime enablement both pass.

#### Scenario: PRD opens later

- **GIVEN** `PRD_LAUNCH_APPROVED=true`
- **WHEN** PRD checkout validation runs
- **THEN** it still requires `native_checkout_enabled` to resolve true
- **AND** UAT evidence cannot be reused as PRD acceptance.

## RENAMED Requirements

- FROM: `### Requirement: PRD validation remains gated`
- TO: `### Requirement: PRD validation separates preparation from launch`
