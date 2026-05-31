## ADDED Requirements

### Requirement: UAT static smoke coverage
The system SHALL provide a non-mutating UAT static smoke suite for deployed GitHub Pages static, CMS/admin, public route, and checkout shell coverage.

#### Scenario: UAT static smoke runs manually
- **GIVEN** the GitHub Pages UAT site is deployed
- **WHEN** a maintainer runs `pnpm smoke:uat-static -- --site-url https://blackbox-studio-athens.github.io/blackbox-records`
- **THEN** the suite checks Decap/admin boot, Decap config/assets, representative public routes, sitemap, robots, and checkout shell availability
- **AND** it captures browser console/page errors and writes redacted smoke evidence.

#### Scenario: UAT static smoke finds a static deployment failure
- **GIVEN** the UAT static site has a missing admin asset, broken representative route, malformed Decap config, high-risk public secret exposure, or browser console/page error
- **WHEN** UAT static smoke runs
- **THEN** the suite fails with evidence identifying the failing scenario and route
- **AND** it does not attempt provider mutation or payment submission.

#### Scenario: GitHub Pages deploys normally
- **WHEN** the standard GitHub Pages deployment workflow runs
- **THEN** UAT static smoke is not required as a default deployment gate in this change
- **AND** maintainers can run it manually or through catalog-promotion verification.

### Requirement: Static smoke workflow
The system SHALL expose UAT static smoke as a manual workflow and a promotion-integrated verification step.

#### Scenario: Manual workflow is dispatched
- **WHEN** the UAT static smoke workflow is dispatched
- **THEN** it accepts the UAT site URL and smoke options needed for targeted reruns
- **AND** it uploads smoke evidence artifacts even when the smoke fails.

#### Scenario: Catalog promotion reaches UAT smoke
- **WHEN** catalog promotion runs UAT verification
- **THEN** Stripe sandbox smoke and UAT static smoke run as separate steps
- **AND** their evidence artifacts are uploaded separately or under a shared smoke evidence root.
