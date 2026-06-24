## MODIFIED Requirements

### Requirement: Environment matrix validation

The system SHALL provide validation that detects drift from the canonical Local, UAT, and PRD product environment model.

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

- **WHEN** environment validation runs before production readiness is opened
- **THEN** it verifies PRD checkout and live provider mutation fail closed
- **AND** it reports any workflow, script, or feature gate that could enable live checkout or live provider mutation without the explicit PRD-open gate.

#### Scenario: Baseline OpenSpec wording is checked

- **WHEN** environment validation or closeout review runs
- **THEN** affected baseline OpenSpec specs do not retain stale Purpose, requirement, or scenario wording that describes GitHub Pages as rollback/legacy production, Cloudflare Pages as canonical production without PRD-disabled state, or Cloudflare/Wrangler `sandbox` / `production` targets
- **AND** archive readiness is blocked until baseline source-of-truth prose matches the Local/UAT/PRD model.

## RENAMED Requirements

### Requirement: Post-merge UAT provider smoke workflow

FROM: Post-merge UAT provider smoke workflow
TO: Post-merge UAT provider smoke workflow

## MODIFIED Requirements

### Requirement: Post-merge UAT provider smoke workflow

The system SHALL validate the deployed GitHub Pages UAT site with UAT provider smoke after the Pages deploy completes successfully on `main`.

#### Scenario: UAT Pages deploy completes successfully

- **GIVEN** the `Deploy UAT static site to GitHub Pages` workflow completes successfully on `main`
- **WHEN** the downstream `workflow_run` smoke workflow starts
- **THEN** it runs `pnpm smoke:stripe-uat -- --scenario happy_path_paid --screenshots on-failure` against the deployed GitHub Pages UAT site
- **AND** it uses the `catalog-promotion-uat` GitHub Actions environment for the same UAT Cloudflare and Stripe test-mode credentials already used by UAT promotion
- **AND** it uploads the standard smoke summary and evidence artifacts
- **AND** the catalog promotion workflow does not run smoke steps itself.

#### Scenario: Stale smoke runs are cancelled

- **WHEN** multiple UAT provider smoke runs overlap for the same branch
- **THEN** concurrency cancels the stale smoke run so only the latest deployed UAT commit remains under evaluation.
