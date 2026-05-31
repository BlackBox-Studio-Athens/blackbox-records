## ADDED Requirements

### Requirement: Cloudflare Pages cache headers
The system SHALL emit repo-owned cache headers for PRD static assets served by Cloudflare Pages when explicit headers are safer than dashboard-only configuration.

#### Scenario: PRD static artifact is built
- **GIVEN** the Cloudflare Pages PRD workflow builds `apps/web/dist`
- **WHEN** the artifact includes fingerprinted Astro assets
- **THEN** the artifact includes cache header policy for those fingerprinted assets
- **AND** the policy stays within Cloudflare Pages Free-tier `_headers` rule and line limits.

#### Scenario: PRD deploy uploads static frontend
- **GIVEN** the Cloudflare Pages workflow deploys the PRD static artifact
- **WHEN** it uploads `apps/web/dist`
- **THEN** it deploys the cache header artifact with the same commit as the static files
- **AND** it does not require Pages Functions, Astro SSR, or a paid Cloudflare product.

### Requirement: Static route documents avoid long-lived caching
The system MUST avoid long-lived immutable caching for static route documents that can change on deploy.

#### Scenario: Shopper loads a route document
- **WHEN** a shopper opens a static route such as `/`, `/store/`, `/stock/`, `/artists/`, `/releases/`, or an overlay partial route
- **THEN** the route document is not served with year-long immutable caching
- **AND** any explicit policy allows revalidation after deployment.

#### Scenario: Deployment cache policy is reviewed
- **WHEN** a maintainer reviews the PRD cache policy
- **THEN** broad Cloudflare "cache everything" rules are not required for HTML or app routes
- **AND** any dashboard Cache Rule use is documented as optional provider configuration, not the repo source of truth.

### Requirement: UAT and PRD cache parity boundaries
The system SHALL distinguish what can be validated on GitHub Pages UAT from what must be validated on Cloudflare Pages PRD.

#### Scenario: UAT is deployed to GitHub Pages
- **WHEN** UAT static deployment runs
- **THEN** it remains functionally compatible with the cache policy
- **AND** it is not required to prove Cloudflare-specific response headers.

#### Scenario: PRD header behavior is accepted
- **WHEN** cache header behavior is accepted for Cloudflare Pages
- **THEN** validation includes Cloudflare Pages PRD or a Cloudflare Pages-equivalent local/static artifact check
- **AND** UAT success alone is not treated as proof of Cloudflare CDN behavior.
