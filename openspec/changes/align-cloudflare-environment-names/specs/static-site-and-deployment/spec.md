## MODIFIED Requirements

### Requirement: URL and environment contract

The system SHALL keep frontend site/base URL behavior explicit and stable across Local, UAT, and PRD targets.

#### Scenario: Deployment target changes

- **GIVEN** a workflow builds for GitHub Pages UAT or Cloudflare Pages PRD
- **WHEN** `ASTRO_SITE_URL`, `ASTRO_BASE_PATH`, or `PUBLIC_BACKEND_BASE_URL` is supplied
- **THEN** only non-secret static build target values and browser-safe public variables are exposed to the frontend
- **AND** the values map to the canonical Product Environment matrix
- **AND** UAT builds point to the UAT Worker/API at the `blackbox-records-backend-uat` Worker target
- **AND** PRD builds point to the PRD Worker/API at the `blackbox-records-backend-prd` Worker target.

#### Scenario: Backend base URL variable is scoped

- **WHEN** GitHub Pages UAT and Cloudflare Pages PRD workflows resolve `PUBLIC_BACKEND_BASE_URL`
- **THEN** the value comes from a target-specific variable or explicit workflow value
- **AND** one shared repository variable cannot make UAT and PRD static builds call the same Worker by accident.

#### Scenario: Static host ownership is checked

- **WHEN** deployment docs, workflows, or validation output describe frontend hosting
- **THEN** GitHub Pages is identified as UAT
- **AND** Cloudflare Pages is identified as PRD
- **AND** GitHub Pages is not described as PRD rollback or legacy production hosting.

#### Scenario: PRD deploy disabled-state is checked

- **WHEN** Cloudflare Pages deploys PRD before go-live
- **THEN** the deployed static frontend is treated as a disabled PRD readiness surface
- **AND** disabling live commerce is enforced through checkout capability and provider mutation gates rather than by relying only on the workflow being paused.

#### Scenario: Cloudflare Pages preview deploy is present

- **WHEN** a Cloudflare Pages branch, preview, or diagnostic deployment exists
- **THEN** it is not treated as UAT or PRD
- **AND** it is excluded from Catalog Promotion Evidence, launch readiness evidence, and shopper-facing commerce acceptance.
