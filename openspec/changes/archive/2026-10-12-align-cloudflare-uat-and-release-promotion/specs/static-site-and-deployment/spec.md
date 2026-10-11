## MODIFIED Requirements

### Requirement: URL and environment contract

The system SHALL keep frontend site/base URL behavior explicit and stable across Local, UAT, and PRD targets.

#### Scenario: Deployment target changes

- **GIVEN** a workflow builds for Cloudflare Pages UAT or Cloudflare Pages PRD
- **WHEN** `ASTRO_SITE_URL`, `ASTRO_BASE_PATH`, or `PUBLIC_BACKEND_BASE_URL` is supplied
- **THEN** only non-secret static build target values and browser-safe public variables are exposed to the frontend
- **AND** the values map to the canonical Product Environment matrix
- **AND** UAT builds point to the UAT Worker/API
- **AND** PRD builds point to the PRD Worker/API.

#### Scenario: Backend base URL variable is scoped

- **WHEN** Cloudflare Pages UAT and Cloudflare Pages PRD workflows resolve `PUBLIC_BACKEND_BASE_URL`
- **THEN** the value comes from a target-specific variable or explicit workflow value
- **AND** one shared repository variable cannot make UAT and PRD static builds call the same Worker by accident.

#### Scenario: Static host ownership is checked

- **WHEN** deployment docs, workflows, or validation output describe frontend hosting
- **THEN** the dedicated UAT Cloudflare Pages project is identified as UAT
- **AND** the distinct PRD Pages project is identified as PRD
- **AND** retired GitHub Pages hosting is not an active UAT or PRD rollback target.

#### Scenario: PRD deploy disabled-state is checked

- **WHEN** Cloudflare Pages deploys PRD before go-live
- **THEN** the deployed full static frontend is treated as a disabled PRD readiness surface
- **AND** disabling live commerce is enforced through checkout capability and provider mutation gates rather than by relying only on the workflow being paused.

#### Scenario: Cloudflare Pages preview deploy is present

- **WHEN** a Cloudflare Pages branch, preview, or diagnostic deployment exists
- **THEN** it is not treated as UAT or the full PRD readiness site unless it is the explicitly approved `holding` branch
- **AND** the `holding` exception serves only the PRD Holding Page within PRD
- **AND** every branch, preview, and diagnostic deployment remains excluded from Catalog Promotion Evidence, full-site launch readiness evidence, and shopper-facing commerce acceptance.

#### Scenario: Hosted and local base paths are resolved

- **WHEN** frontend target configuration is validated
- **THEN** UAT and PRD use their own origins with base `/`
- **AND** canonical Local remains `http://127.0.0.1:4321/blackbox-records/`
- **AND** CMS authentication, checkout return origins, assets, sitemap, and smoke defaults resolve from the matching target profile.

### Requirement: Astro Upgrades Preserve Static Deployment Boundaries

The system MUST preserve the static frontend and separate Worker backend architecture during Astro upgrades.

#### Scenario: Astro build configuration is reviewed

- **GIVEN** an Astro upgrade changes dependencies
- **WHEN** the frontend build configuration is reviewed
- **THEN** `apps/web/astro.config.mjs` keeps static output
- **AND** Cloudflare Pages remains the UAT static host
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

### Requirement: Cloudflare Pages cache headers

The system SHALL emit repo-owned cache headers for UAT and PRD static assets served by Cloudflare Pages when explicit headers are safer than dashboard-only configuration.

#### Scenario: PRD static artifact is built

- **GIVEN** the shared static frontend workflow builds the PRD `apps/web/dist`
- **WHEN** the artifact includes fingerprinted Astro assets
- **THEN** the artifact includes cache header policy for those fingerprinted assets
- **AND** the policy stays within Cloudflare Pages Free-tier `_headers` rule and line limits.

#### Scenario: PRD deploy uploads static frontend

- **GIVEN** the shared static frontend workflow deploys the PRD static artifact
- **WHEN** it uploads `apps/web/dist`
- **THEN** it deploys the cache header artifact with the same commit as the static files
- **AND** it does not require Pages Functions, Astro SSR, or a paid Cloudflare product.

### Requirement: UAT static smoke stays read-only

The system SHALL provide a manual UAT static smoke path that verifies Cloudflare Pages static routes, the Sveltia admin document and assets, public pages, sitemap/robots, and the checkout shell without mutating provider state or becoming a default deploy gate.

#### Scenario: UAT static smoke runs

- **WHEN** a maintainer or workflow runs `pnpm smoke:uat-static -- --site-url <configured-cloudflare-uat-origin>`
- **THEN** it inspects the deployed Cloudflare Pages UAT frontend
- **AND** it writes evidence under `.codex-artifacts/smoke/uat/uat-static/<run-id>/`
- **AND** it does not authenticate to Sveltia, publish content, create Stripe Checkout Sessions, modify D1, or touch webhooks
- **AND** its evidence remains separate from provider smoke evidence.

### Requirement: Static deploy automation exposes measurable stages

The system SHALL keep UAT and PRD static deploy automation split into measurable verification, build, and deploy stages while preserving the existing deployment targets.

#### Scenario: UAT Pages workflow reports verification and deploy timing separately

- **WHEN** the shared static deployment workflow runs the Cloudflare Pages UAT target
- **THEN** unit tests, workspace checks, unused audit, UAT static build, artifact upload, and Cloudflare Pages deploy appear as separately timed workflow jobs or steps
- **AND** the deployed target remains Cloudflare Pages UAT.

#### Scenario: PRD Pages workflow reports verification and deploy timing separately

- **WHEN** the shared static deployment workflow runs the Cloudflare Pages PRD target
- **THEN** unit tests, workspace checks, unused audit, PRD static build, artifact handoff, and Cloudflare Pages deploy appear as separately timed workflow jobs or steps
- **AND** the deployed target remains Cloudflare Pages PRD.

### Requirement: Static deploy workflows preserve gate-before-deploy correctness

The system MUST deploy UAT and PRD static artifacts only after the required repository gates and target-specific build artifact succeed for the same commit.

#### Scenario: UAT static deployment waits for required work

- **GIVEN** the shared static deployment workflow is triggered for a commit
- **WHEN** deployment starts
- **THEN** `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and the UAT `pnpm build:web` artifact build have succeeded for that commit
- **AND** the deployed artifact was built with the UAT site/base/backend environment values.

#### Scenario: PRD static deployment waits for required work

- **GIVEN** the shared static deployment workflow is triggered for a commit
- **WHEN** deployment starts
- **THEN** `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and the PRD `pnpm build` artifact build have succeeded for that commit
- **AND** the deployed artifact was built with the PRD site/base/backend environment values.

### Requirement: Static deploy workflows use explicit artifact handoff

The system SHALL hand static build output from build jobs to deploy jobs through explicit GitHub Actions artifacts with bounded retention.

#### Scenario: UAT build artifact is handed to deploy

- **WHEN** the Cloudflare Pages UAT workflow builds the static frontend
- **THEN** it uploads only the deployable static artifact needed by Cloudflare Pages
- **AND** the deploy job consumes that artifact for the same commit
- **AND** artifact retention is bounded to the shortest practical period for deployment diagnostics.

#### Scenario: PRD build artifact is handed to deploy

- **WHEN** the Cloudflare Pages PRD workflow builds the static frontend
- **THEN** it uploads only the deployable `apps/web/dist` artifact needed by the production `main` deploy job
- **AND** the deploy job consumes that artifact for the same commit
- **AND** artifact retention is bounded to the shortest practical period for deployment diagnostics
- **AND** Cloudflare credentials are available only to deploy jobs.

#### Scenario: Holding build artifact is handed to deploy

- **WHEN** the separate manual holding workflow builds and verifies the static frontend
- **THEN** its build job uploads only `apps/web/dist-holding` with bounded retention
- **AND** its protected deploy job consumes that artifact for the same commit
- **AND** Cloudflare credentials are unavailable to the build job.

### Requirement: PRD Holding Page deployment is isolated from UAT and PRD readiness

The system SHALL deploy the PRD Holding Page as a named branch artifact in the existing `blackbox-records-web` Pages project while preserving the existing UAT and production-branch deployments.

#### Scenario: Shared static workflow runs on main

- **WHEN** repository gates and the target builds succeed for a main push
- **THEN** the workflow deploys the full UAT artifact to its Cloudflare Pages project
- **AND** the existing PRD readiness artifact remains unchanged until explicit Software Release promotion
- **AND** it does not prepare or deploy the PRD Holding Page artifact.

#### Scenario: Operator requests a holding deployment

- **WHEN** an operator starts the separate PRD Holding Page workflow with its `workflow_dispatch` deploy input enabled
- **THEN** the holding deploy job uses the `prd-holding` GitHub Actions environment without a required-reviewer gate
- **AND** the environment accepts deployments only from `main`
- **AND** it deploys the same commit's verified `dist-holding` artifact to the Pages `holding` branch
- **AND** it does not invoke the shared static workflow, change DNS, redeploy UAT, or change the Pages production `main` deployment.

#### Scenario: Holding branch deployment fails

- **WHEN** the holding artifact cannot be built or deployed
- **THEN** no DNS or custom-domain mutation runs from the workflow
- **AND** the existing UAT and PRD readiness targets remain independently recoverable.

### Requirement: Edited deploy workflows follow modern GitHub Actions hygiene

The system MUST keep edited deploy workflows least-privilege, stale-run-safe, and bounded.

#### Scenario: Workflow permissions are reviewed

- **WHEN** a static deploy workflow is edited for CI speed
- **THEN** workflow and job `permissions` are explicit and limited to the actions each job performs
- **AND** secrets are scoped only to jobs that need them.

#### Scenario: Stale deploy work is superseded

- **WHEN** a newer commit starts a static deploy workflow for the same target
- **THEN** verification may cancel stale read-only work, but state-changing deployment stages use a non-cancelling target lock and recheck staleness before mutation
- **AND** environment or promotion jobs that must not overlap remain serialized.

#### Scenario: Workflow jobs are bounded

- **WHEN** a static deploy workflow job runs
- **THEN** the job has an explicit timeout suitable for its measured p90 duration and required provider operations.

### Requirement: CI speed work distinguishes build feedback from provider deploy latency

The system SHALL report static deployment speed in separate build-verification and provider-deploy latency categories.

#### Scenario: UAT Pages deploy tail remains slow

- **WHEN** Cloudflare Pages deploy latency has high p75 or p90 duration
- **THEN** the workflow report identifies it separately from repository verification and Astro build time
- **AND** repository build/check optimization is not credited with fixing provider deploy latency unless post-change data proves it.

## ADDED Requirements

### Requirement: Public frontend hosting uses separate Cloudflare Pages projects

The system SHALL serve Astro frontend artifacts with separate Cloudflare Pages projects as the UAT and PRD static hosts.

#### Scenario: Shared workflow deploys the UAT frontend to Cloudflare Pages

- **GIVEN** the shared static frontend workflow runs the UAT target
- **WHEN** CI builds the site
- **THEN** it runs `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and `pnpm build:web`
- **AND** it uploads only the prebuilt `apps/web/dist` artifact with browser-safe UAT build variables
- **AND** the deployed static site calls the UAT Worker/API.

#### Scenario: Shared workflow deploys the PRD frontend to Cloudflare Pages

- **GIVEN** an explicit Software Release promotion selects a verified PRD-targeted artifact
- **WHEN** CI builds the site
- **THEN** it runs `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and `pnpm build`
- **AND** it uploads only the full prebuilt `apps/web/dist` artifact with browser-safe PRD build variables for the Pages production `main` target
- **AND** the static PRD storefront may deploy as a readiness surface
- **AND** PRD checkout and live provider mutation remain disabled until an explicit production-readiness gate opens them.

#### Scenario: Manual workflow deploys the PRD Holding Page

- **GIVEN** the separate holding workflow is started manually with its deploy input enabled
- **WHEN** its repository gates and PRD-shaped static build succeed
- **THEN** it derives and uploads only `apps/web/dist-holding` for the protected Pages `holding` branch deploy job
- **AND** it does not invoke the shared UAT/PRD deploy workflow or mutate either existing deployment.

### Requirement: UAT-only builds own Review Site Marker visibility

The system MUST compile the Review Site Marker through an explicit UAT-only static build flag with absence as the safe default.

#### Scenario: Cloudflare Pages UAT artifact is built

- **WHEN** the shared workflow runs the `Build UAT static frontend` step
- **THEN** that step sets `SHOW_REVIEW_SITE_MARKER=true`
- **AND** generated shopper-facing documents contain the exact header words `TEST SITE` and `Test payments only` plus the `[TEST] ` HTML-title prefix
- **AND** generated checkout documents contain `Test checkout. No real payment will be taken.` beside the final payment action.

#### Scenario: Local or PRD artifact is built

- **WHEN** Local, the full Cloudflare Pages PRD target, the PRD Holding Page, or a diagnostic target builds without the exact UAT flag
- **THEN** all three cues are absent
- **AND** missing, blank, `false`, or any value other than the exact string `true` cannot enable it.

#### Scenario: Build configuration drifts

- **WHEN** repository environment-model verification runs
- **THEN** it verifies that the flag and exact value are scoped to the UAT build step
- **AND** it rejects a marker that is unconditional, public at runtime, hostname-derived, or enabled in a PRD build scope.

### Requirement: Hosted cache policy is consistent across UAT and PRD

The system SHALL apply the same static cache policy on the separate Cloudflare Pages UAT and PRD projects and verify target-specific headers.

#### Scenario: UAT cache behavior is reviewed

- **WHEN** hosted UAT static smoke probes HTML, fingerprinted assets, redirects, and policy files
- **THEN** it validates the same cache rules intended for PRD, including document revalidation.

#### Scenario: PRD cache behavior is accepted

- **WHEN** the reviewed candidate is promoted
- **THEN** bounded PRD checks confirm actual target headers
- **AND** UAT evidence does not imply that separately configured PRD settings were verified.

## REMOVED Requirements

### Requirement: Static frontend hosting

**Reason**: The hosting/CMS ownership transition replaces this legacy contract, including its provider-specific scenarios.

**Migration**: Follow "Public frontend hosting uses separate Cloudflare Pages projects" in this capability. Preserve its replacement safety and compatibility scenarios before retiring the old path.

### Requirement: UAT build owns Review Site Marker visibility

**Reason**: The hosting/CMS ownership transition replaces this legacy contract, including its provider-specific scenarios.

**Migration**: Follow "UAT-only builds own Review Site Marker visibility" in this capability. Preserve its replacement safety and compatibility scenarios before retiring the old path.

### Requirement: UAT and PRD cache parity boundaries

**Reason**: The hosting/CMS ownership transition replaces this legacy contract, including its provider-specific scenarios.

**Migration**: Follow "Hosted cache policy is consistent across UAT and PRD" in this capability. Preserve its replacement safety and compatibility scenarios before retiring the old path.
