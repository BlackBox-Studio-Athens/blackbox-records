## MODIFIED Requirements

### Requirement: Runtime validation standard

The system SHALL use Zod for repo-authored runtime input validation and OpenAPI contract schemas. The system SHALL use `@t3-oss/env-core` only for local/process environment contracts in Node scripts, launchers, and preflight checks where values come from `process.env`, `.env`, `.dev.vars`, or equivalent ignored local files.

#### Scenario: New validation code is added

- **GIVEN** repo-authored runtime input or contract validation is needed
- **WHEN** a schema is introduced
- **THEN** it uses Zod unless an explicit OpenSpec change approves another validation library
- **AND** any `@t3-oss/env-core` usage remains backed by Zod-compatible schemas and does not store, sync, print, or rotate secrets.

## MODIFIED Requirements

### Requirement: Environment matrix validation

The system SHALL provide validation that detects drift from the canonical Local, UAT, and PRD product environment model.

#### Scenario: Deployment workflows are checked

- **WHEN** environment validation runs
- **THEN** it verifies GitHub Pages is the UAT static deployment path
- **AND** Cloudflare Pages is the PRD static deployment path
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
- **THEN** affected baseline OpenSpec specs do not retain stale Purpose, requirement, or scenario wording that describes GitHub Pages as rollback/legacy production or Cloudflare Pages as canonical production without PRD-disabled state
- **AND** archive readiness is blocked until baseline source-of-truth prose matches the Local/UAT/PRD model.

## ADDED Requirements

### Requirement: Secret presence checks are redacted

The system MUST verify secret/config presence without printing secret values.

#### Scenario: Secret preflight fails

- **WHEN** a local, UAT, or PRD preflight detects missing sensitive configuration
- **THEN** output names the missing secret key or credential category
- **AND** it does not print existing secret values, derived credentials, webhook signing secrets, API tokens, or Stripe keys.

#### Scenario: Secret must be entered in another store

- **WHEN** a maintainer must add a value to GitHub Actions secrets, Cloudflare Worker secrets, Stripe Dashboard, or ignored local files
- **THEN** the preflight explains the destination store and why the value is not copied automatically from another store.
