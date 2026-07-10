## Purpose

Specify the static Astro frontend, GitHub Pages UAT deployment, disabled Cloudflare Pages PRD deployment, and separate Worker backend deployment boundaries.

## Requirements

### Requirement: Static frontend hosting

The system SHALL serve the Astro frontend as a prebuilt static artifact with GitHub Pages as the only UAT static host and Cloudflare Pages as the only PRD static host.

#### Scenario: Shared workflow deploys the UAT frontend to GitHub Pages

- **GIVEN** the shared static frontend workflow runs the UAT target
- **WHEN** CI builds the site
- **THEN** it runs `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and `pnpm build:web`
- **AND** it uploads only the prebuilt `apps/web/dist` artifact with browser-safe UAT build variables
- **AND** the deployed static site calls the UAT Worker/API.

#### Scenario: Shared workflow deploys the PRD frontend to Cloudflare Pages

- **GIVEN** the shared static frontend workflow runs the PRD target
- **WHEN** CI builds the site
- **THEN** it runs `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and `pnpm build`
- **AND** it uploads only the prebuilt `apps/web/dist` artifact with browser-safe PRD build variables
- **AND** the static PRD storefront may deploy as a readiness surface
- **AND** PRD checkout and live provider mutation remain disabled until an explicit production-readiness gate opens them.

#### Scenario: Manual workflow deploys the PRD Holding Page

- **GIVEN** the separate holding workflow is started manually with its deploy input enabled
- **WHEN** its repository gates and PRD-shaped static build succeed
- **THEN** it derives and uploads only `apps/web/dist-holding` for the protected Pages `holding` branch deploy job
- **AND** it does not invoke the shared UAT/PRD deploy workflow or mutate either existing deployment.

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
- **THEN** it is not treated as UAT or the full PRD readiness site unless it is the explicitly approved `holding` branch
- **AND** the `holding` exception serves only the PRD Holding Page within PRD
- **AND** every branch, preview, and diagnostic deployment remains excluded from Catalog Promotion Evidence, full-site launch readiness evidence, and shopper-facing commerce acceptance.

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

### Requirement: Cloudflare Pages cache headers

The system SHALL emit repo-owned cache headers for PRD static assets served by Cloudflare Pages when explicit headers are safer than dashboard-only configuration.

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

### Requirement: UAT static smoke stays read-only

The system SHALL provide a manual UAT static smoke path that verifies GitHub Pages static routes, Decap/admin, public pages, sitemap/robots, and the checkout shell without mutating provider state or becoming a default deploy gate.

#### Scenario: UAT static smoke runs

- **WHEN** a maintainer or workflow runs `pnpm smoke:uat-static -- --site-url https://blackbox-studio-athens.github.io/blackbox-records`
- **THEN** it inspects the deployed GitHub Pages UAT frontend
- **AND** it writes evidence under `.codex-artifacts/smoke/uat/uat-static/<run-id>/`
- **AND** it does not create Stripe Checkout Sessions, modify D1, or touch webhooks
- **AND** its evidence remains separate from provider smoke evidence.

### Requirement: Static deploy automation exposes measurable stages

The system SHALL keep UAT and PRD static deploy automation split into measurable verification, build, and deploy stages while preserving the existing deployment targets.

#### Scenario: UAT Pages workflow reports verification and deploy timing separately

- **WHEN** the shared static deployment workflow runs the GitHub Pages UAT target
- **THEN** unit tests, workspace checks, unused audit, UAT static build, artifact upload, and GitHub Pages deploy appear as separately timed workflow jobs or steps
- **AND** the deployed target remains GitHub Pages UAT.

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

- **WHEN** the GitHub Pages UAT workflow builds the static frontend
- **THEN** it uploads only the deployable static artifact needed by GitHub Pages
- **AND** the deploy job consumes that artifact for the same commit
- **AND** artifact retention is bounded to the shortest practical period for deployment diagnostics.

#### Scenario: PRD build artifact is handed to deploy

- **WHEN** the Cloudflare Pages PRD workflow builds the static frontend
- **THEN** it uploads only the deployable `apps/web/dist` artifact needed by Cloudflare Pages
- **AND** the deploy job consumes that artifact for the same commit
- **AND** Cloudflare credentials are available only to the deploy job.

#### Scenario: Holding build artifact is handed to deploy

- **WHEN** the separate manual holding workflow builds and verifies the static frontend
- **THEN** its build job uploads only `apps/web/dist-holding` with bounded retention
- **AND** its protected deploy job consumes that artifact for the same commit
- **AND** Cloudflare credentials are unavailable to the build job.

### Requirement: PRD Holding Page deployment is isolated from UAT and PRD readiness

The system SHALL deploy the PRD Holding Page as a named branch artifact in the existing `blackbox-records-web` Pages project while preserving the existing UAT and production-branch deployments.

#### Scenario: Shared static workflow runs on main

- **WHEN** repository gates and the normal PRD build succeed
- **THEN** the workflow continues deploying the full UAT artifact to GitHub Pages
- **AND** it continues deploying the full disabled PRD readiness artifact to the Pages production `main` target
- **AND** it does not prepare or deploy the PRD Holding Page artifact.

#### Scenario: Operator requests a holding deployment

- **WHEN** an operator starts the separate PRD Holding Page workflow with its `workflow_dispatch` deploy input enabled
- **THEN** the holding deploy job waits for the protected `prd-holding` GitHub Actions environment approval
- **AND** it deploys the same commit's verified `dist-holding` artifact to the Pages `holding` branch
- **AND** it does not invoke the shared static workflow, change DNS, redeploy UAT, or change the Pages production `main` deployment.

#### Scenario: Holding branch deployment fails

- **WHEN** the holding artifact cannot be built or deployed
- **THEN** no DNS or custom-domain mutation runs from the workflow
- **AND** the existing UAT and PRD readiness targets remain independently recoverable.

### Requirement: PRD Holding Page artifact excludes final route documents

The system MUST prepare the holding deployment from an explicit file allowlist rather than deploying the full Astro route tree.

#### Scenario: Holding artifact is inspected

- **WHEN** artifact verification enumerates HTML documents
- **THEN** only `index.html` and the holding `404.html` are present
- **AND** no admin, stock, store, checkout, artist, release, service, shell-partial, sitemap, or other final route document is present
- **AND** every same-origin asset referenced by the two documents exists in the artifact.

#### Scenario: Visitor guesses a final route

- **WHEN** a visitor requests a non-asset path on the holding hostname
- **THEN** Cloudflare does not serve the final site route
- **AND** it returns the holding 404 experience or an explicit redirect to the holding root.

### Requirement: Future PRD hostname activates with canonical redirects

The system SHALL activate `blackboxrecordsathens.com` through the existing Pages project with working TLS before replacing registrar parking.

#### Scenario: Custom-domain association is guarded

- **WHEN** the verified branch alias is ready and domain activation is approved
- **THEN** an exact-host temporary Cloudflare Single Redirect sends apex requests to the verified HTTPS holding branch alias with status `302`, preserving path and query
- **AND** that guard is active before the custom domain is associated with the Pages project
- **AND** the guard remains active while the Pages-created apex target is changed from production `main` to the `holding` branch alias.

#### Scenario: Apex activation is prepared

- **WHEN** the guarded custom domain is associated with `blackbox-records-web`
- **THEN** its proxied apex target is changed to the verified holding branch alias before the temporary guard is removed
- **AND** activation waits for a valid Cloudflare certificate
- **AND** removing the guard is followed immediately by bounded apex checks
- **AND** any full-site response, certificate failure, or unexpected target re-enables the guard and stops activation.

#### Scenario: Visitor uses a non-canonical origin

- **WHEN** a visitor requests the apex over HTTP or requests `www.blackboxrecordsathens.com`
- **THEN** exact-host Cloudflare Single Redirect rules return status `308` to the equivalent `https://blackboxrecordsathens.com` path
- **AND** they preserve the original query string
- **AND** they do not match any other hostname in the zone
- **AND** the response does not expose registrar parking or a misspelled hostname.

#### Scenario: WWW redirect endpoint is provisioned

- **WHEN** `www.blackboxrecordsathens.com` canonicalization is enabled
- **THEN** a proxied `www` CNAME resolves to `blackboxrecordsathens.com`
- **AND** Cloudflare presents a valid edge certificate for the `www` hostname before redirect acceptance
- **AND** the `www` request reaches the exact-host `308` rule without contacting an unproxied or third-party origin.

### Requirement: Holding-to-launch cutover is reversible

The system MUST keep the verified holding branch available until the launched full PRD site and all dependent custom-domain origins pass production acceptance.

#### Scenario: Launch cutover begins

- **WHEN** the production-go-live change has updated and verified full-site canonical URLs, checkout return origins, email brand URLs, catalog asset origins, smoke defaults, Worker configuration, and live gates
- **THEN** the apex target may move from the holding branch alias to the Pages production `main` target
- **AND** the holding branch remains the immediate static rollback target.

#### Scenario: Full PRD site fails after cutover

- **WHEN** launch acceptance finds a critical static-site or custom-domain failure
- **THEN** the apex can be repointed to the already-verified holding branch alias
- **AND** rollback does not require a new Pages project, Pages Function, Worker route, or domain detach/reattach.

### Requirement: Edited deploy workflows follow modern GitHub Actions hygiene

The system MUST keep edited deploy workflows least-privilege, stale-run-safe, and bounded.

#### Scenario: Workflow permissions are reviewed

- **WHEN** a static deploy workflow is edited for CI speed
- **THEN** workflow and job `permissions` are explicit and limited to the actions each job performs
- **AND** secrets are scoped only to jobs that need them.

#### Scenario: Stale deploy work is superseded

- **WHEN** a newer commit starts a static deploy workflow for the same target
- **THEN** concurrency cancels stale in-progress work where deploying the older commit would not be useful
- **AND** environment or promotion jobs that must not overlap remain serialized.

#### Scenario: Workflow jobs are bounded

- **WHEN** a static deploy workflow job runs
- **THEN** the job has an explicit timeout suitable for its measured p90 duration and required provider operations.

### Requirement: CI speed work distinguishes build feedback from provider deploy latency

The system SHALL report static deployment speed in separate build-verification and provider-deploy latency categories.

#### Scenario: UAT Pages deploy tail remains slow

- **WHEN** GitHub Pages deploy latency has high p75 or p90 duration
- **THEN** the workflow report identifies it separately from repository verification and Astro build time
- **AND** repository build/check optimization is not credited with fixing provider deploy latency unless post-change data proves it.
