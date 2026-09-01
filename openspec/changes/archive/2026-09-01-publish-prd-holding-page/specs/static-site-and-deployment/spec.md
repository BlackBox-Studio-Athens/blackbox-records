## MODIFIED Requirements

### Requirement: Static frontend hosting

The system SHALL serve Astro frontend artifacts with GitHub Pages as the only UAT static host and Cloudflare Pages as the only PRD static host.

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
- **AND** it uploads only the full prebuilt `apps/web/dist` artifact with browser-safe PRD build variables for the Pages production `main` target
- **AND** the static PRD storefront may deploy as a readiness surface
- **AND** PRD checkout and live provider mutation remain disabled until an explicit production-readiness gate opens them.

#### Scenario: Manual workflow deploys the PRD Holding Page

- **GIVEN** the separate holding workflow is started manually with its deploy input enabled
- **WHEN** its repository gates and PRD-shaped static build succeed
- **THEN** it derives and uploads only `apps/web/dist-holding` for the protected Pages `holding` branch deploy job
- **AND** it does not invoke the shared UAT/PRD deploy workflow or mutate either existing deployment.

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
- **THEN** the deployed full static frontend is treated as a disabled PRD readiness surface
- **AND** disabling live commerce is enforced through checkout capability and provider mutation gates rather than by relying only on the workflow being paused.

#### Scenario: Cloudflare Pages preview deploy is present

- **WHEN** a Cloudflare Pages branch, preview, or diagnostic deployment exists
- **THEN** it is not treated as UAT or the full PRD readiness site unless it is the explicitly approved `holding` branch
- **AND** the `holding` exception serves only the PRD Holding Page within PRD
- **AND** every branch, preview, and diagnostic deployment remains excluded from Catalog Promotion Evidence, full-site launch readiness evidence, and shopper-facing commerce acceptance.

### Requirement: Static deploy workflows use explicit artifact handoff

The system SHALL hand static build output from build jobs to deploy jobs through explicit GitHub Actions artifacts with bounded retention.

#### Scenario: UAT build artifact is handed to deploy

- **WHEN** the GitHub Pages UAT workflow builds the static frontend
- **THEN** it uploads only the deployable static artifact needed by GitHub Pages
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

## ADDED Requirements

### Requirement: PRD Holding Page deployment is isolated from UAT and PRD readiness

The system SHALL deploy the PRD Holding Page as a named branch artifact in the existing `blackbox-records-web` Pages project while preserving the existing UAT and production-branch deployments.

#### Scenario: Shared static workflow runs on main

- **WHEN** repository gates and the normal PRD build succeed
- **THEN** the workflow continues deploying the full UAT artifact to GitHub Pages
- **AND** it continues deploying the full disabled PRD readiness artifact to the Pages production `main` target
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

#### Scenario: Custom-domain association is staged

- **WHEN** the verified branch alias is ready and domain activation is approved
- **THEN** the existing parking DNS and redirect state is recorded before the custom domain is associated with the Pages project
- **AND** no redirect rule blocks Pages domain validation
- **AND** the Pages-created apex target is changed from production `main` to the verified `holding` branch alias as part of the same staged operation.

#### Scenario: Apex activation is prepared

- **WHEN** the custom domain is associated with `blackbox-records-web`
- **THEN** its proxied apex target is changed to the verified holding branch alias before activation is accepted
- **AND** activation waits for a valid Cloudflare certificate
- **AND** the target change is followed immediately by bounded apex checks
- **AND** any full-site response, certificate failure, or unexpected target restores the recorded parking state and stops activation.

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
