## ADDED Requirements

### Requirement: UAT paid-email receipt proof is operator-started and non-interactive

The system SHALL provide an explicit Stripe UAT Smoke mode that an operator starts with the existing authenticated Resend CLI profile and that completes without further operator action.

#### Scenario: Receipt mode preflight runs

- **WHEN** an operator starts Stripe UAT Smoke with email receipt verification enabled
- **THEN** the runner verifies the Resend CLI is available, authenticated, and able to read Receiving before it creates paid provider state
- **AND** it fails with a redacted diagnostic instead of invoking login, prompting, waiting for manual inspection, or accepting an API key argument.

#### Scenario: Canonical paid scenarios complete

- **GIVEN** receipt mode selects `happy_path_paid` and `pay_what_you_want_paid`
- **WHEN** both scenarios reach webhook-authoritative paid order state
- **THEN** the runner waits for exactly four received emails at the managed UAT sink
- **AND** it proves one shopper and one ops email for each paid order using a clock-skew-tolerant received-time boundary, the order reference reproduced from authoritative UAT D1 state, exact subject, and sink recipient
- **AND** stale, duplicate, wrong-recipient, or wrong-audience messages do not satisfy the check.

#### Scenario: Receipt polling finishes

- **WHEN** all four expected messages arrive or the configured receipt deadline expires
- **THEN** the runner stops polling and exits with pass or failure status
- **AND** no operator action is required after command start.

#### Scenario: Receipt Smoke Evidence is written

- **WHEN** receipt verification completes
- **THEN** each affected paid scenario evidence records audience, safe order reference, received timestamp, match count, status, and safe issues
- **AND** the run summary reports aggregate receipt status
- **AND** evidence excludes Resend credentials, profile/account details, raw API responses, received-email IDs, signed URLs, headers, HTML, text bodies, postal addresses, phone numbers, and full shopper email addresses.

## MODIFIED Requirements

### Requirement: Post-merge UAT provider smoke workflow

The system SHALL validate the deployed GitHub Pages UAT site with the canonical Stripe test-mode paid scenarios and newsletter Contact smoke after the shared static deployment workflow completes successfully on `main`, without requiring operator presence or Resend receipt credentials.

#### Scenario: Shared static deployment completes successfully

- **GIVEN** the `Deploy UAT and PRD static sites` workflow completes successfully on `main`
- **WHEN** the downstream `workflow_run` smoke workflow starts
- **THEN** it runs `pnpm smoke:stripe-uat -- --scenario happy_path_paid,pay_what_you_want_paid --screenshots on-failure` against the deployed GitHub Pages UAT site
- **AND** it runs `pnpm smoke:resend-uat` against the deployed UAT Worker
- **AND** it uses the `catalog-promotion-uat` GitHub Actions environment for the same UAT Cloudflare and sandbox Stripe credentials already used by UAT promotion
- **AND** resulting application email routes to the managed UAT sink
- **AND** it uploads the standard smoke summary and evidence artifacts
- **AND** the catalog promotion workflow does not run smoke steps itself.

#### Scenario: Receipt mode is omitted from post-merge smoke

- **WHEN** the checked-in downstream workflow runs `pnpm smoke:stripe-uat`
- **THEN** it does not enable receipt mode, require a local Resend profile, add a Resend GitHub secret, or wait for an operator
- **AND** checkout, webhook, order, D1, screenshot, trace, and existing Smoke Evidence behavior remains unchanged
- **AND** the result does not claim that inbox receipt was verified.

#### Scenario: Stale smoke runs are cancelled

- **GIVEN** a newer `main` push triggers a later GitHub Pages deploy before an older smoke run finishes
- **WHEN** the downstream smoke workflow starts for the newer deploy
- **THEN** concurrency cancels the stale smoke run so only the latest deployed UAT commit remains under evaluation.
