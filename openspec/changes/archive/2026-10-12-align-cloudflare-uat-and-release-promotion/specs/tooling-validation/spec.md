## MODIFIED Requirements

### Requirement: Post-merge UAT provider smoke workflow

The system SHALL validate the deployed Cloudflare Pages UAT site with the canonical Stripe test-mode paid scenarios and newsletter Contact smoke inside the canonical release workflow after its UAT deployment succeeds, without requiring operator presence or Resend receipt credentials.

#### Scenario: Shared static deployment completes successfully

- **GIVEN** the canonical release workflow reports a successful UAT deployment of the candidate source SHA
- **WHEN** the canonical release workflow starts its dependent UAT smoke job
- **THEN** it runs `pnpm smoke:stripe-uat -- --scenario happy_path_paid,pay_what_you_want_paid --screenshots on-failure` against the deployed Cloudflare Pages UAT site
- **AND** it runs `pnpm smoke:resend-uat` against the deployed UAT Worker
- **AND** it uses the `catalog-promotion-uat` GitHub Actions environment for the same UAT Cloudflare and sandbox Stripe credentials already used by UAT promotion
- **AND** resulting application email routes to the managed UAT sink
- **AND** it uploads the standard smoke summary and evidence artifacts
- **AND** one canonical invocation owns provider smoke for that candidate, with its result required before promotion eligibility.

#### Scenario: Receipt mode is omitted from post-merge smoke

- **WHEN** the canonical release workflow runs `pnpm smoke:stripe-uat`
- **THEN** it does not enable receipt mode, require a local Resend profile, add a Resend GitHub secret, or wait for an operator
- **AND** checkout, webhook, order, D1, screenshot, trace, and existing Smoke Evidence behavior remains unchanged
- **AND** the result does not claim that inbox receipt was verified.

#### Scenario: Stale smoke runs are cancelled

- **GIVEN** a newer `main` push arrives before an older candidate's smoke finishes
- **WHEN** the canonical release workflow schedules the newer candidate
- **THEN** the older state-changing run finishes under the non-cancelling target lock
- **AND** its result cannot authorize the newer candidate; manual diagnostic smoke does not substitute for candidate acceptance.

#### Scenario: Deployment ownership is validated

- **WHEN** environment-model and workflow contract validation run
- **THEN** they reject Worker deployment or D1 migration commands in provider smoke
- **AND** they reject a standalone UAT Worker deployment workflow
- **AND** they require the canonical release workflow to retain the UAT Worker deployment step.

## ADDED Requirements

### Requirement: Hosting parity and code promotion are validated

Validation SHALL prove target isolation, matching Cloudflare hosting, immutable candidate selection, and absence of automatic PRD deployment on a main push.

#### Scenario: Workflow contract tests run

- **WHEN** a workflow omits promotion authorization, uses latest main instead of the selected candidate, mixes environment resources, or deploys before required checks
- **THEN** validation fails before deployment.

#### Scenario: Hosted UAT is accepted

- **WHEN** UAT's stable Cloudflare site serves the candidate
- **THEN** static routes, Review Site Marker, cache headers, checkout return paths, and signed test-provider processing are verified for that SHA
- **AND** evidence identifies the new UAT origin rather than the retired GitHub Pages site.
