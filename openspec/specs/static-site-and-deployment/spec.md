## Purpose

Specify the static Astro frontend, Cloudflare Pages deployment, GitHub Pages rollback, and separate Worker backend deployment boundaries.

## Requirements

### Requirement: Static frontend hosting

The system SHALL serve the Astro frontend as a prebuilt static artifact, with Cloudflare Pages as the canonical target and GitHub Pages retained as rollback/legacy.

#### Scenario: Cloudflare Pages deploys the frontend

- **GIVEN** the Cloudflare Pages workflow runs
- **WHEN** CI builds the site
- **THEN** it runs `pnpm test:unit`, `pnpm check`, and `pnpm build`
- **AND** it uploads only the prebuilt `apps/web/dist` artifact with browser-safe build variables.

### Requirement: Worker backend separation

The system MUST keep dynamic commerce behavior in the separate Cloudflare Worker backend.

#### Scenario: Frontend needs commerce data

- **GIVEN** the static frontend needs checkout, store capability, order, stock, or webhook behavior
- **WHEN** it communicates with the backend
- **THEN** it uses the Worker API boundary rather than Pages Functions, Astro SSR, or public frontend secrets.

### Requirement: URL and environment contract

The system SHALL keep frontend site/base URL behavior explicit and stable across local, Cloudflare Pages, and GitHub Pages targets.

#### Scenario: Deployment target changes

- **GIVEN** a workflow builds for Cloudflare Pages or GitHub Pages
- **WHEN** `ASTRO_SITE_URL`, `ASTRO_BASE_PATH`, or `PUBLIC_BACKEND_BASE_URL` is supplied
- **THEN** only non-secret static build target values and browser-safe public variables are exposed to the frontend.
