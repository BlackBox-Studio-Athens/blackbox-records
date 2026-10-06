## ADDED Requirements

### Requirement: Pages fails closed and ships no route HTML

The hosted release SHALL upload to each Cloudflare Pages project only the renderer's client assets, the public gateway and a prerendered `robots.txt`. It SHALL NOT upload route HTML, so no static copy of a page can be served when the Pages Function is unavailable. Both Pages projects SHALL be configured to fail closed on Function quota exhaustion, a UAT deploy or PRD promotion SHALL set and verify that mode on its project before it uploads, and a release builds with no CMS credential and restores no CMS content or media.

#### Scenario: A release is uploaded to Pages

- **WHEN** the UAT or PRD public build is assembled
- **THEN** the upload contains the renderer client assets, the gateway, its routes file and `robots.txt`
- **AND** the renderer serves `/release.json` through the gateway, so the release identity is not an uploaded file
- **AND** it contains no route HTML, no restored CMS snapshot or media and no `/assets/catalog/*` alias.

#### Scenario: The Function allowance is exhausted

- **WHEN** a Pages Function quota is exhausted and the project is set to fail closed
- **THEN** document requests receive the platform's error until the allowance resets
- **AND** no stale editorial HTML is served, because none exists on Pages
- **AND** static assets such as `/_astro/*` and `robots.txt` remain available.

#### Scenario: Every deploy enforces fail-closed

- **WHEN** a UAT deploy or a PRD promotion reaches its Pages step
- **THEN** it sets fail-closed on its Pages project (`blackbox-records-web-uat` or `blackbox-records-web`) and reads the setting back, failing the run when it is not set, before uploading anything
- **AND** no operator toggle is needed, because the deploy script owns the setting.

#### Scenario: The renderer has a published pointer

- **WHEN** a content-free build is deployed to an environment
- **THEN** the renderer serves the accepted snapshot named by that environment's R2 pointer
- **AND** a missing pointer is an environment fault, not covered by a bundled bootstrap.

## MODIFIED Requirements

### Requirement: Static deploy workflows use explicit artifact handoff

The system SHALL hand build output from build jobs to deploy jobs through an explicit GitHub Actions artifact with the shortest practical retention, and SHALL NOT retain a release bundle beyond the run that uses it.

#### Scenario: UAT build artifact is handed to deploy

- **WHEN** the push workflow builds the UAT CMS Worker and renderer
- **THEN** its build job, which holds no Cloudflare or CMS credential, uploads only the deployable release directory
- **AND** the single deploy job consumes that artifact within the same run for the same commit
- **AND** artifact retention is three days, so a failed run can be rerun within that window.

#### Scenario: PRD build artifact is handed to deploy

- **WHEN** PRD promotion runs
- **THEN** it builds PRD from the proven source SHA in its own job, with no handoff artifact and no retained bundle
- **AND** the PRD Cloudflare credential is available only to the steps that check Pages, migrate and deploy, never to install or build.

#### Scenario: Holding build artifact is handed to deploy

- **WHEN** the separate manual holding workflow builds and verifies the static frontend
- **THEN** its build job uploads only `apps/web/dist-holding` with bounded retention
- **AND** its protected deploy job consumes that artifact for the same commit
- **AND** Cloudflare credentials are unavailable to the build job.

### Requirement: Static deployment triggers follow artifact relevance

The system MUST omit the release workflow for a `main` push only when every changed path belongs to an explicit, audited set of repository-only documentation paths. Trigger decisions MUST use changed paths rather than commit-message semantics, and any unrecognized or deploy-relevant path MUST fail open by running the workflow.

#### Scenario: Repository-only documentation is pushed

- **GIVEN** every changed path in a `main` push matches the audited repository-only documentation set
- **WHEN** GitHub evaluates the release workflow trigger
- **THEN** no release run is created for that push
- **AND** neither UAT nor PRD is redeployed.

#### Scenario: Push contains a deploy-relevant or unknown path

- **GIVEN** at least one changed path does not match the audited repository-only documentation set
- **WHEN** the push reaches `main`
- **THEN** the release workflow runs with its existing verification, build and deploy gates
- **AND** mixed documentation/code pushes are not skipped.

#### Scenario: Deployable Markdown changes

- **WHEN** Markdown under an Astro content collection or another build input changes
- **THEN** the path does not match a broad Markdown exclusion
- **AND** the release workflow runs.

#### Scenario: Commit type disagrees with changed paths

- **WHEN** a `docs(...)` commit changes a deploy-relevant path, or another commit type changes only audited repository documentation
- **THEN** changed paths alone determine whether the workflow runs
- **AND** the workflow does not inspect the Conventional Commit type or a commit-message skip token for this policy.

#### Scenario: Operator forces a static deployment

- **WHEN** an operator needs UAT redeployed
- **THEN** they rerun the failed push run within three days, while its build artifact exists, or otherwise push a new commit
- **AND** the release workflow has no manual dispatch or input path, and PRD changes only through the input-free promotion workflow.

#### Scenario: Trigger policy validation runs

- **WHEN** repository contract validation checks the release workflows
- **THEN** it requires that only the promotion workflow binds the PRD environment, that no push-triggered workflow reads a PRD secret, and that every environment-bound job and release lock is non-cancelling
- **AND** it requires the release workflow to trigger only on `main` pushes with the audited documentation path ignores, and to contain no commit-message coupling, manual dispatch or retired release input or string.

### Requirement: Catalog deployments use the gated source revision

Software deployment SHALL use the reviewed code revision. Content Publication SHALL use the already-deployed approved code revision without deploying the backend or performing general provider synchronization, and no software build SHALL read or restore a content snapshot.

#### Scenario: Source affects catalog or code

- **WHEN** repository and compatibility gates pass
- **THEN** UAT backend and public artifacts deploy with revision-bound evidence before explicit PRD promotion.

#### Scenario: Editorial content changes

- **WHEN** content publication validates a complete target snapshot
- **THEN** the runtime activates it through the R2 pointer without rebuilding or redeploying any static artifact
- **AND** its backend and Stripe catalog are not redeployed or synchronized as a prerequisite.

#### Scenario: PRD launch is disabled

- **WHEN** software or content is published
- **THEN** existing shopper launch controls remain unchanged.

### Requirement: Public frontend hosting uses separate Cloudflare Pages projects

The system SHALL serve the renderer's client assets and public gateway with separate Cloudflare Pages projects as the UAT and PRD hosts.

#### Scenario: Shared workflow deploys the UAT frontend to Cloudflare Pages

- **GIVEN** a push whose checks, end-to-end suite and staff previews passed
- **WHEN** the UAT deploy job runs
- **THEN** the repository checks have already run `pnpm validate:checks` and the end-to-end build has run the bundle budgets
- **AND** it uploads only the prebuilt renderer client directory with its gateway and browser-safe UAT build variables
- **AND** the deployed site calls the UAT Worker/API.

#### Scenario: Shared workflow deploys the PRD frontend to Cloudflare Pages

- **GIVEN** an explicit Software Release promotion proved the source UAT serves
- **WHEN** the promotion job builds PRD from that SHA
- **THEN** it uploads only the prebuilt renderer client directory with its gateway and browser-safe PRD build variables for the Pages production `main` target
- **AND** the PRD site may deploy as a readiness surface
- **AND** PRD checkout and live provider mutation remain disabled until an explicit production-readiness gate opens them.

#### Scenario: Manual workflow deploys the PRD Holding Page

- **GIVEN** the separate holding workflow is started manually with its deploy input enabled
- **WHEN** its repository gates and PRD-shaped static build succeed
- **THEN** it derives and uploads only `apps/web/dist-holding` for the protected Pages `holding` branch deploy job
- **AND** it does not invoke the release or promotion workflows or mutate either existing deployment.

### Requirement: UAT-only builds own Review Site Marker visibility

The system MUST compile the Review Site Marker through an explicit UAT-only build flag with absence as the safe default.

#### Scenario: Cloudflare Pages UAT artifact is built

- **WHEN** the UAT public build runs
- **THEN** it sets `SHOW_REVIEW_SITE_MARKER=true`
- **AND** generated shopper-facing documents contain the exact header words `UAT · TESTING ONLY` plus the `[UAT] ` HTML-title prefix
- **AND** generated checkout documents contain `Test checkout. No real payment will be taken.` beside the final payment action.

#### Scenario: Local or PRD artifact is built

- **WHEN** Local, the full Cloudflare Pages PRD target, the PRD Holding Page, or a diagnostic target builds without the exact UAT flag
- **THEN** all three cues are absent
- **AND** missing, blank, `false`, or any value other than the exact string `true` cannot enable it.

#### Scenario: Build configuration drifts

- **WHEN** repository environment-model verification runs
- **THEN** it verifies the source-level marker contract: the flag and exact value are read only in the UAT-capable build and layouts, never unconditional, public at runtime or hostname-derived
- **AND** release verification of the deployed home page requires the cues on UAT and rejects them on PRD, before and after PRD deployment.

## REMOVED Requirements

### Requirement: Static deploy automation exposes measurable stages

**Reason**: Stage timing comes from the GitHub Actions API (`gh run view --json jobs`), so the workflow keeps no timer steps and the spec no longer prescribes separately timed jobs. The requirement also named the unused-code audit as a deploy stage, which now runs as its own weekly workflow.

**Migration**: Record timings with `gh run view --json jobs`; see `docs/validation-feedback.md`.

### Requirement: Static deploy workflows preserve gate-before-deploy correctness

**Reason**: The requirement gates deployment on `pnpm test:unit`, `pnpm check` and `pnpm audit:unused`. The unused-code audit is no longer a deployment gate, and the gate list is owned by the software-release-promotion and tooling-validation requirements (checks, the UAT build, the whole end-to-end suite and the staff previews before UAT deployment).

**Migration**: See "Main publishes a UAT candidate only" in software-release-promotion and "Standard repository gates" in tooling-validation.

### Requirement: UAT and PRD candidate artifacts are prepared independently

**Reason**: Candidate preparation from each environment's published snapshot, the schema-2 promotion bundle, per-file identity and assembly no longer exist. UAT builds content-free once and deploys it in the same run; PRD is rebuilt from the proven source SHA by the promotion job.

**Migration**: See "Main publishes a UAT candidate only", "PRD promotion selects verified artifacts" and "PRD promotion is deploy-only" in software-release-promotion.
