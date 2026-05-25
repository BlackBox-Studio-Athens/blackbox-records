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
