## ADDED Requirements

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
