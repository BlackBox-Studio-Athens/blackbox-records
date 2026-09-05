## MODIFIED Requirements

### Requirement: Post-merge UAT provider smoke workflow

The system SHALL validate the deployed GitHub Pages UAT site with observation-only UAT provider smoke after the shared static deployment workflow completes successfully on `main`.

#### Scenario: Shared static deployment completes successfully

- **GIVEN** the `Deploy UAT and PRD static sites` workflow completes successfully on `main`
- **WHEN** the downstream `workflow_run` smoke workflow starts
- **THEN** it runs paid Stripe sandbox and Resend smoke against the deployed GitHub Pages UAT site and UAT Worker
- **AND** it uses the `catalog-promotion-uat` GitHub Actions environment for existing UAT diagnostic credentials
- **AND** it does not apply D1 migrations or deploy the UAT Worker
- **AND** it uploads the standard smoke summary and evidence artifacts
- **AND** the catalog promotion workflow does not run smoke steps itself.

#### Scenario: Stale smoke runs are cancelled

- **GIVEN** a newer `main` push triggers a later GitHub Pages deploy before an older smoke run finishes
- **WHEN** the downstream smoke workflow starts for the newer deploy
- **THEN** concurrency cancels the stale smoke run so only the latest deployed UAT commit remains under evaluation.

#### Scenario: Deployment ownership is validated

- **WHEN** environment-model and workflow contract validation run
- **THEN** they reject Worker deployment or D1 migration commands in provider smoke
- **AND** they reject a standalone UAT Worker deployment workflow
- **AND** they require catalog promotion to retain the UAT Worker deployment step.
