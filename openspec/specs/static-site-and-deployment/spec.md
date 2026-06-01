## Purpose

Specify the static Astro frontend, GitHub Pages UAT deployment, disabled Cloudflare Pages PRD deployment, and separate Worker backend deployment boundaries.

## Requirements

### Requirement: Static frontend hosting

The system SHALL serve the Astro frontend as a prebuilt static artifact with GitHub Pages as the only UAT static host and Cloudflare Pages as the only PRD static host.

#### Scenario: GitHub Pages deploys the UAT frontend

- **GIVEN** the GitHub Pages workflow runs
- **WHEN** CI builds the site
- **THEN** it runs `pnpm test:unit`, `pnpm check`, and `pnpm build`
- **AND** it uploads only the prebuilt `apps/web/dist` artifact with browser-safe UAT build variables
- **AND** the deployed static site calls the UAT Worker/API.

#### Scenario: Cloudflare Pages deploys the PRD frontend

- **GIVEN** the Cloudflare Pages workflow runs
- **WHEN** CI builds the site
- **THEN** it runs `pnpm test:unit`, `pnpm check`, and `pnpm build`
- **AND** it uploads only the prebuilt `apps/web/dist` artifact with browser-safe PRD build variables
- **AND** the static PRD storefront may deploy as a readiness surface
- **AND** PRD checkout and live provider mutation remain disabled until an explicit production-readiness gate opens them.

### Requirement: Worker backend separation

The system MUST keep dynamic commerce behavior in the separate Cloudflare Worker backend.

#### Scenario: Frontend needs commerce data

- **GIVEN** the static frontend needs checkout, store capability, order, stock, or webhook behavior
- **WHEN** it communicates with the backend
- **THEN** it uses the Worker API boundary rather than Pages Functions, Astro SSR, or public frontend secrets.

### Requirement: URL and environment contract

The system SHALL keep frontend site/base URL behavior explicit and stable across Local, UAT, and PRD targets.

#### Scenario: Deployment target changes

- **GIVEN** a workflow builds for GitHub Pages UAT or Cloudflare Pages PRD
- **WHEN** `ASTRO_SITE_URL`, `ASTRO_BASE_PATH`, or `PUBLIC_BACKEND_BASE_URL` is supplied
- **THEN** only non-secret static build target values and browser-safe public variables are exposed to the frontend
- **AND** the values map to the canonical Product Environment matrix
- **AND** UAT builds point to the UAT Worker/API
- **AND** PRD builds point to the PRD Worker/API.

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

### Requirement: Astro Upgrades Preserve Static Deployment Boundaries

The system MUST preserve the static frontend and separate Worker backend architecture during Astro upgrades.

#### Scenario: Astro build configuration is reviewed

- **GIVEN** an Astro upgrade changes dependencies
- **WHEN** the frontend build configuration is reviewed
- **THEN** `apps/web/astro.config.mjs` keeps static output
- **AND** GitHub Pages remains the UAT static host
- **AND** Cloudflare Pages remains the PRD static host
- **AND** dynamic commerce behavior remains owned by the separate Worker backend.

#### Scenario: Cloudflare routing helpers are considered

- **GIVEN** an Astro release includes Cloudflare helpers, SSR adapters, advanced routing, Actions, Sessions, or other server-side routing features
- **WHEN** the repo performs a dependency-only Astro upgrade
- **THEN** those features are not adopted unless a separate approved OpenSpec change changes the hosting/runtime architecture
- **AND** the upgrade does not add `@astrojs/cloudflare`, Astro SSR output, Pages Functions, or experimental advanced routing.

#### Scenario: Browser smoke checks static routes

- **GIVEN** an Astro upgrade passes build and repository gates
- **WHEN** local Browser Use smoke validation runs
- **THEN** the static app renders the configured base path, a shell-managed section route, and the checkout shell route without console errors caused by the upgrade.
