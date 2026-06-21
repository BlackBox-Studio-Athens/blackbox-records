## ADDED Requirements

### Requirement: Catalog promotion gates are automated for UAT and PRD

The system SHALL provide automated validation gates that prove generated catalog artifact promotion for each target environment.

#### Scenario: UAT catalog promotion gate runs

- **GIVEN** Desired Catalog State targets UAT
- **WHEN** the UAT promotion workflow runs
- **THEN** it runs artifact generation/checks, repository gates, UAT webhook/config verification, UAT D1 readiness, UAT catalog dry-run, UAT catalog apply, post-apply verify, UAT Worker/static deployment, and UAT smoke evidence
- **AND** all output redacts provider secrets and full account-private identifiers.

#### Scenario: PRD catalog promotion gate is requested before PRD opens

- **GIVEN** Desired Catalog State targets PRD and UAT proof passed for the same artifact commit
- **WHEN** the PRD promotion workflow runs before the PRD-open gate exists
- **THEN** it records disabled or `not_configured` readiness evidence
- **AND** it does not mutate Stripe live mode, production D1, production Worker checkout availability, or successful PRD Promotion Evidence.

#### Scenario: PRD catalog promotion gate runs after PRD opens

- **GIVEN** Desired Catalog State targets PRD, UAT proof passed for the same artifact commit, and the PRD-open gate exists
- **WHEN** the PRD promotion workflow runs
- **THEN** it runs PRD webhook/config verification, production D1 readiness, production catalog dry-run, production catalog apply, post-apply verify, production Worker/static deployment, and PRD smoke evidence
- **AND** it uses the same command implementation and report format as UAT with production Worker runtime target parameters.

#### Scenario: Standard repository gates fail

- **GIVEN** `pnpm test:unit`, `pnpm check`, or `pnpm build` fails on the artifact commit
- **WHEN** promotion automation evaluates gates
- **THEN** provider apply and deployment are skipped
- **AND** the run reports the repository gate failure as the blocking reason.

### Requirement: Catalog verify/apply supports production safely

The system MUST extend catalog verification/apply tooling so production mutation is explicit, idempotent, and guarded by Desired Catalog State.

#### Scenario: Dry-run executes for production

- **GIVEN** production credentials and D1 access are configured
- **WHEN** `pnpm stripe:catalog:verify --env prd` runs
- **THEN** it reports Product Projection drift, Desired Price versus active Stripe Price state, D1 readiness, Store Offer snapshot state, webhook readiness, and planned actions
- **AND** it does not mutate Stripe, D1, repo files, or deployment state.

#### Scenario: Apply executes for production

- **GIVEN** production dry-run has a valid action plan from Desired Catalog State
- **WHEN** `pnpm stripe:catalog:verify --env prd --apply` runs inside the promotion workflow
- **THEN** it mutates only app-owned production Stripe/D1 state needed to align the plan
- **AND** it prints a redacted post-apply summary suitable for Promotion Evidence.

#### Scenario: Production apply is invoked outside the promotion workflow

- **GIVEN** an operator manually runs production apply from a local shell or unapproved CI context
- **WHEN** required promotion context such as artifact commit, run identifier, or environment token is missing
- **THEN** the command refuses mutation
- **AND** explains how to rerun through the catalog promotion workflow.

### Requirement: Production smoke proves live Checkout surface

The system SHALL include production smoke checks that are safe for live mode and close to UAT evidence.

#### Scenario: Production Checkout surface smoke runs

- **GIVEN** production catalog apply, Worker deploy, and static deploy succeeded
- **WHEN** production smoke runs for a promoted Store Item variant
- **THEN** it reaches Stripe-hosted Checkout in live mode without submitting payment
- **AND** it verifies Product name, image availability, amount, currency, shipping/contact requirements, and visible payment-method surface against Worker Store Offer evidence.

#### Scenario: Production paid smoke policy is configured

- **GIVEN** a live paid smoke policy exists with an approved smoke item or instrument, stock isolation, refund/reconciliation handling, and evidence redaction
- **WHEN** production paid smoke runs
- **THEN** it completes the live payment path according to that policy
- **AND** it proves webhook order reconciliation without contaminating customer orders or stock evidence.

#### Scenario: Production paid smoke policy is absent

- **GIVEN** no approved live paid smoke policy exists
- **WHEN** production promotion completes Checkout surface smoke
- **THEN** the run passes without live payment submission when all other production gates pass
- **AND** Promotion Evidence explicitly records paid smoke as not configured rather than pretending paid production checkout was proven.

### Requirement: Promotion evidence is structured and retained

The system MUST retain redacted evidence for successful and failed Promotion Runs.

#### Scenario: Evidence artifact is generated

- **GIVEN** a UAT or production Promotion Run reaches any provider, D1, deploy, or smoke stage
- **WHEN** the run finishes
- **THEN** it writes a structured evidence artifact with run ID, environment, commit SHAs, affected variants, stage results, redacted provider action counts, smoke results, and final status
- **AND** the evidence can be inspected without access to raw secrets.

#### Scenario: Evidence is committed or documented

- **GIVEN** durable process documentation is updated
- **WHEN** Promotion Evidence is referenced in committed files
- **THEN** committed docs contain only redacted summaries, workflow names, and artifact locations
- **AND** they do not commit Stripe IDs, webhook secrets, account IDs, raw checkout payloads, or live payment details.

### Requirement: Tests cover automation boundaries

The system SHALL include deterministic tests for CMS-to-catalog promotion behavior before relying on live provider checks.

#### Scenario: Editorial field validation tests run

- **GIVEN** Decap editorial fields or Astro content schemas change
- **WHEN** unit tests run
- **THEN** they cover required editorial fields, generated policy assumptions, target environment generation, and absence of CMS commerce preview data.

#### Scenario: Artifact generation tests run

- **GIVEN** Desired Catalog State generation changes
- **WHEN** script tests run
- **THEN** they cover stable identities, Product Projection fields, Desired Price revisioning, environment targets, stock initialization policy, and generated artifact drift detection.

#### Scenario: Provider apply planner tests run

- **GIVEN** catalog verify/apply behavior changes
- **WHEN** backend/script tests run
- **THEN** they cover dry-run immutability, production mutation guard context, idempotency keys, ambiguous active Prices, stale Price retirement, Product Projection updates, D1 readiness updates, and redaction.

#### Scenario: Workflow tests or dry runs run

- **GIVEN** GitHub Actions workflows for catalog promotion change
- **WHEN** validation runs
- **THEN** it proves path filters, concurrency, artifact commit loop prevention, environment matrix behavior, and promotion-stage ordering.
