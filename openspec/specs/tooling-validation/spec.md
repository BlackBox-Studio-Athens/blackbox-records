## Purpose

Specify repository validation gates, local tooling, dependency-audit posture, and OpenSpec workflow ownership.
## Requirements
### Requirement: Standard repository gates

The system SHALL run the standard repository gates after behavior-changing implementation.

#### Scenario: Behavior changes

- **GIVEN** code changes affect runtime behavior, tests, build output, scripts, or workflows
- **WHEN** implementation is complete
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` must pass before completion is claimed.

### Requirement: Asset QA is read-only

The system SHALL keep Sharp-backed asset QA as a read-only validation command.

#### Scenario: Asset check runs

- **GIVEN** `pnpm assets:check` runs
- **WHEN** it inspects public assets and content-referenced images
- **THEN** it reports metadata diagnostics without mutating image files, content paths, public URLs, or Astro image handling.

### Requirement: Slug tooling preserves public identities

The system MUST centralize repo-authored slug generation and validation while preserving existing public identities unless explicitly approved.

#### Scenario: Store item slug fallback is needed

- **GIVEN** an invalid draft or file identifier needs a fallback slug
- **WHEN** the slug helper generates the fallback
- **THEN** it uses the repo-owned slug wrapper and does not silently rewrite existing public slugs, aliases, D1 mappings, Stripe mappings, or `StoreItem` identities.

### Requirement: Runtime validation standard

The system SHALL use Zod for repo-authored runtime input validation and OpenAPI contract schemas. The system SHALL use `@t3-oss/env-core` only for local/process environment contracts in Node scripts, launchers, and preflight checks where values come from `process.env`, `.env`, `.dev.vars`, or equivalent ignored local files. When a Zod schema owns a runtime contract, exported TypeScript types SHALL be inferred from the validated schema output unless an explicit external interface requires a hand-written type.

#### Scenario: New validation code is added

- **GIVEN** repo-authored runtime input or contract validation is needed
- **WHEN** a schema is introduced
- **THEN** it uses Zod unless an explicit OpenSpec change approves another validation library
- **AND** any `@t3-oss/env-core` usage remains backed by Zod-compatible schemas and does not store, sync, print, or rotate secrets.

#### Scenario: Runtime config type is exposed

- **GIVEN** a runtime config reader validates data with a Zod schema
- **WHEN** downstream code needs the config type
- **THEN** the type is inferred from the schema output
- **AND** duplicated hand-maintained type aliases are avoided unless they model an external boundary.

### Requirement: Environment matrix validation

The system SHALL provide validation that detects drift from the canonical Local, UAT, and PRD product environment model, including raw platform/provider aliases used outside approved boundaries.

#### Scenario: Deployment workflows are checked

- **WHEN** environment validation runs
- **THEN** it verifies GitHub Pages is the UAT static deployment path
- **AND** Cloudflare Pages is the PRD static deployment path
- **AND** no workflow introduces an additional shopper-facing static environment
- **AND** any branch, preview, or diagnostic deployment is reported as non-product and excluded from UAT/PRD evidence.

#### Scenario: Frontend and Worker origins are checked

- **WHEN** environment validation runs
- **THEN** it verifies UAT static builds call the UAT Worker/API
- **AND** PRD static builds call the PRD Worker/API
- **AND** `CHECKOUT_RETURN_ORIGINS` and browser CORS origins do not contain broad cross-environment or preview allowlists.

#### Scenario: Catalog public asset URLs are checked

- **WHEN** environment validation runs against catalog contracts, Desired Catalog State, Product Projections, or Promotion Evidence
- **THEN** it verifies UAT Product image URLs use the GitHub Pages UAT asset base
- **AND** PRD Product image URLs use the Cloudflare Pages PRD asset base or an approved PRD custom domain asset base
- **AND** PRD readiness/live evidence cannot be produced from GitHub Pages UAT Product image URLs unless a later approved change defines GitHub Pages as a shared canonical asset CDN.

#### Scenario: PRD disabled state is checked

- **WHEN** environment validation runs before production readiness is opened
- **THEN** it verifies PRD checkout and live provider mutation fail closed
- **AND** it reports any workflow, script, or feature gate that could enable live checkout or live provider mutation without the explicit PRD-open gate.

#### Scenario: Baseline OpenSpec wording is checked

- **WHEN** environment validation or closeout review runs
- **THEN** affected baseline OpenSpec specs do not retain stale Purpose, requirement, or scenario wording that describes GitHub Pages as rollback/legacy production or Cloudflare Pages as canonical production without PRD-disabled state
- **AND** archive readiness is blocked until baseline source-of-truth prose matches the Local/UAT/PRD model.

#### Scenario: Raw platform aliases are checked

- **WHEN** environment validation or closeout review inspects code, scripts, workflows, docs, or specs
- **THEN** raw platform/provider aliases such as `sandbox`, `production`, `test`, and `live` are allowed only at approved boundary locations
- **AND** any product-policy use outside those locations fails validation or is reported as an explicit reviewed exception.

### Requirement: Shared smoke harness and evidence contract

The system SHALL keep smoke runners on the shared `.codex-artifacts/smoke/<environment>/<suite>/<run-id>/` contract with per-scenario `evidence.json` files and a run `summary.json`.

#### Scenario: Smoke runner evidence is standardized

- **WHEN** smoke scripts or workflows are updated
- **THEN** shared redaction, secret scanning, route probing, screenshot policy, and evidence-writing helpers are reused where practical
- **AND** static smoke and provider smoke remain separate suite boundaries
- **AND** focused unit tests cover the shared harness and runner contracts.

### Requirement: Post-merge UAT provider smoke workflow

The system SHALL validate the deployed GitHub Pages UAT site with Stripe test-mode smoke after the shared static deployment workflow completes successfully on `main`.

#### Scenario: Shared static deployment completes successfully

- **GIVEN** the `Deploy UAT and PRD static sites` workflow completes successfully on `main`
- **WHEN** the downstream `workflow_run` smoke workflow starts
- **THEN** it runs `pnpm smoke:stripe-uat -- --scenario happy_path_paid --screenshots on-failure` against the deployed GitHub Pages UAT site
- **AND** it uses the `catalog-promotion-uat` GitHub Actions environment for the same UAT Cloudflare and sandbox Stripe credentials already used by UAT promotion
- **AND** it uploads the standard smoke summary and evidence artifacts
- **AND** the catalog promotion workflow does not run smoke steps itself.

#### Scenario: Stale smoke runs are cancelled

- **GIVEN** a newer `main` push triggers a later GitHub Pages deploy before an older smoke run finishes
- **WHEN** the downstream smoke workflow starts for the newer deploy
- **THEN** concurrency cancels the stale smoke run so only the latest deployed UAT commit remains under evaluation.

### Requirement: Knip audit is report-first

The system SHALL keep unused dependency/export/file auditing report-first until findings are owner-reviewed.

#### Scenario: Unused audit reports a finding

- **GIVEN** `pnpm audit:unused` reports a route, content entry, generated file, migration, workflow, package export, or public asset
- **WHEN** cleanup is considered
- **THEN** deletion waits for owner review and does not become an automatic `pnpm check` failure by default.

### Requirement: OpenSpec workflow is exclusive

The system MUST use OpenSpec as the only spec and context workflow in this repository.

#### Scenario: New work is planned

- **GIVEN** a future feature, refactor, or workflow change needs planning
- **WHEN** it is captured as source of truth
- **THEN** it is written as an OpenSpec baseline spec update or active change under `openspec/`
- **AND** legacy planning commands, directories, and phase artifacts are not reintroduced.

### Requirement: Prepared work stays in main worktree commits

The system MUST require OpenSpec artifact changes, OpenSpec archiving, OpenSpec-backed implementation work, and non-OpenSpec prepared changes to happen in the main worktree on the `main` branch unless the user explicitly requests a separate branch or worktree.

#### Scenario: Prepared work starts

- **GIVEN** an agent will create or update OpenSpec artifacts, archive an OpenSpec change, implement OpenSpec-backed work, or prepare a non-OpenSpec change
- **WHEN** the agent starts that work
- **THEN** it runs the repository main-worktree guard when OpenSpec commands are involved
- **AND** the work proceeds from the main worktree at `C:\Users\SVall\WebstormProjects\blackbox-records` on branch `main`
- **AND** the agent does not create a new branch or git worktree unless the user explicitly asks.

#### Scenario: OpenSpec commands run from the main worktree

- **GIVEN** the current checkout is the main worktree on branch `main`
- **WHEN** OpenSpec commands run for artifact changes, archiving, implementation, review, inspection, or CI-equivalent validation
- **THEN** the guarded `pnpm openspec -- <args>` command allows the work to continue.

#### Scenario: Work is separated

- **GIVEN** a prepared change is ready to save
- **WHEN** the agent records it in git
- **THEN** the work is separated with small, meaningful commits on `main` instead of a new branch or worktree.

### Requirement: Execa adoption is narrow

The system SHALL adopt Execa where it removes meaningful process orchestration complexity from repo-owned development scripts without changing documented commands.

#### Scenario: Script process handling is refactored

- **GIVEN** a script manages subprocess execution, readiness, ports, signals, or stdio
- **WHEN** Execa is introduced
- **THEN** documented command behavior, Windows compatibility, and tests remain stable.

### Requirement: Shared local process helper is introduced first

The system SHALL introduce a shared local process helper before refactoring multiple local process orchestration scripts.

#### Scenario: Local stack execution is refactored

- **GIVEN** the local stack launcher manages finite preparation commands and long-running service commands
- **WHEN** the launcher is refactored to Execa
- **THEN** shared process lifecycle behavior is moved into a repo-local helper while local-stack-specific command planning remains in the launcher.

### Requirement: Launcher and secret behavior are preserved

The system MUST preserve WebStorm launcher targets, package script names, port-failure behavior, long-running process lifecycle, and secret redaction.

#### Scenario: Local stack script changes

- **GIVEN** a refactor touches local stack or stripe-mock orchestration
- **WHEN** validation runs
- **THEN** command planning, failure handling, and redacted output remain equivalent for users.

#### Scenario: Long-running script changes

- **GIVEN** a refactor changes a long-running local script
- **WHEN** the automated checks pass
- **THEN** manual launcher validation is still required before the change is considered complete.

### Requirement: Local stack remains the first high-value target

The system SHALL refactor `scripts/start-local-stack.ts` before lower-complexity process scripts unless implementation evidence shows the helper cannot preserve current local-stack behavior.

#### Scenario: First Execa-backed script is selected

- **GIVEN** multiple scripts use hand-rolled child-process orchestration
- **WHEN** this change starts implementation
- **THEN** the first target is the local stack launcher because it contains the highest-value mix of finite commands, long-running processes, ports, readiness, signals, and WebStorm launcher behavior.

### Requirement: Renovate owns routine dependency update PRs

The system SHALL use repository-owned Renovate configuration for routine dependency update detection and pull request creation.

#### Scenario: Renovate runs for the repository

- **GIVEN** the hosted Renovate GitHub App is installed for the repository owner
- **WHEN** Renovate evaluates the repository
- **THEN** it reads dependency update policy from `renovate.json`.

#### Scenario: Renovate config changes

- **GIVEN** Renovate configuration or package-manager metadata changes
- **WHEN** CI validates the change
- **THEN** the Renovate config validator runs before the change reaches `main`.

### Requirement: Dependency updates preserve compatibility groups

The system MUST keep dependency updates grouped by compatibility-sensitive ecosystem boundaries.

#### Scenario: Routine frontend and tooling packages update

- **GIVEN** Astro, React, Tailwind, TypeScript, lint, format, test, browser automation, or script-runner packages have compatible updates
- **WHEN** Renovate opens update PRs
- **THEN** related packages are grouped by ecosystem so peer and runtime mismatches can be reviewed together.

#### Scenario: Runtime-sensitive packages update

- **GIVEN** Cloudflare Worker, Prisma D1 persistence, backend API, commerce contract, GitHub Actions, or major-version packages have updates
- **WHEN** Renovate proposes the update
- **THEN** the update requires dashboard approval and is not automerged.

### Requirement: First update pass reaches latest compatible direct dependencies

The system SHALL verify the first Renovate adoption pass by updating direct dependency ranges to the latest compatible published versions available to pnpm.

#### Scenario: First local update pass completes

- **GIVEN** direct npm dependencies can be updated without breaking repository gates
- **WHEN** the first update pass finishes
- **THEN** `pnpm outdated --recursive --format json` reports no outdated direct dependencies except documented compatibility deferrals.

#### Scenario: Latest published versions have peer mismatches

- **GIVEN** a latest published package version creates a peer dependency mismatch with repo-owned tooling
- **WHEN** the first update pass is completed
- **THEN** the repo stays on the latest compatible version and documents the deferral.

#### Scenario: Package manager major is not compatible yet

- **GIVEN** the latest package-manager major cannot consume the current lockfile because of its supply-chain or compatibility policy
- **WHEN** the first update pass is completed
- **THEN** the repo stays on the latest compatible current major and documents the deferral.

### Requirement: Stripe sandbox smoke verifies hosted Checkout surface

The system SHALL include a pre-payment Stripe sandbox smoke scenario that verifies the hosted Checkout amount and payment-method surface.

#### Scenario: UAT sandbox dynamic payment surface is verified

- **GIVEN** the deployed UAT sandbox storefront and Worker use the intended Stripe Payment Method Configuration
- **AND** the expected payment labels are configured for the documented browser, checkout country, amount, and currency context
- **WHEN** `pnpm smoke:stripe-uat -- --scenario checkout_surface` runs against that deployment
- **THEN** it reaches Stripe-hosted Checkout without submitting payment
- **AND** it asserts the expected Store Offer amount, currency, and configured dynamic payment method labels.

#### Scenario: Payment Method Configuration verifier runs before browser smoke

- **GIVEN** a sandbox `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is configured for the Worker
- **WHEN** `pnpm stripe:payment-methods:verify` runs for the UAT sandbox environment
- **THEN** it reports whether the configuration exists, is active, and includes the expected candidate payment methods before hosted Checkout smoke evidence is accepted.

#### Scenario: Hosted Checkout surface drifts from storefront authority

- **GIVEN** the deployed sandbox storefront can redirect to Stripe-hosted Checkout
- **WHEN** `pnpm smoke:stripe-uat -- --scenario checkout_surface` runs
- **THEN** it records the hosted amount texts and visible payment method labels
- **AND** it fails before payment submission if the hosted amount or dynamic payment surface does not match expectations.

#### Scenario: Paid smoke scenarios run

- **GIVEN** paid smoke scenarios are selected
- **WHEN** the smoke runner starts
- **THEN** webhook listener and paid order reconciliation requirements remain separate from the pre-payment surface scenario.

### Requirement: Catalog projection verification is dry-run by default

The system SHALL verify catalog field ownership, Product projection, Price authority, D1 readiness, and Store Offer snapshot state without mutating provider or database state by default.

#### Scenario: Operator runs catalog verification

- **GIVEN** an operator runs `pnpm stripe:catalog:verify --env uat` without `--apply`
- **WHEN** the command inspects repo projection, UAT D1, and Stripe catalog state
- **THEN** it reports Product projection drift, Price authority drift, Store Offer snapshot drift, missing D1 readiness, and redacted provider diagnostics
- **AND** it does not mutate Stripe Products, Stripe Prices, D1 mappings, Store Offer snapshots, repo content, or committed evidence.

#### Scenario: Output includes provider identifiers

- **GIVEN** verification needs to mention Stripe Products, Prices, webhook endpoint IDs, API errors, or secrets
- **WHEN** output is printed or evidence is written
- **THEN** full provider IDs, secret values, account-private values, and API error payloads are redacted.

### Requirement: Catalog apply is environment-scoped and UAT-first

The system MUST require explicit environment and apply flags before mutating Stripe Products, Stripe Prices, D1 mappings, or Store Offer snapshots.

#### Scenario: UAT apply is requested

- **GIVEN** an operator runs `pnpm stripe:catalog:verify --env uat --apply`
- **WHEN** the dry-run plan has actionable Product projection or sandbox Price/D1 drift
- **THEN** the command applies only sandbox-scoped changes
- **AND** prints a redacted post-apply verification report.

#### Scenario: Production apply is requested before go-live approval

- **GIVEN** an operator requests catalog apply for production
- **WHEN** production catalog mutation has not been explicitly approved by the production go-live readiness workflow
- **THEN** the command refuses to mutate provider or D1 state
- **AND** reports the required approval gate.

### Requirement: Field ownership has layered tests

The system SHALL test catalog field ownership through deterministic unit tests, script tests, and sandbox operator checks.

#### Scenario: Unit tests run

- **GIVEN** field ownership, Product projection, Price reconciliation, or webhook replay behavior changes
- **WHEN** targeted unit tests run
- **THEN** they cover ownership matrix completeness, Product projection planning, Price replacement reconciliation, ambiguity failures, stale snapshot updates, webhook duplicate handling, and redaction.

#### Scenario: Script tests run

- **GIVEN** catalog verification or apply command behavior changes
- **WHEN** script-level tests run
- **THEN** they cover argument parsing, dry-run immutability, sandbox-only apply enforcement, redacted reports, all-current-catalog coverage, and missing credential classification.

#### Scenario: Sandbox live checks run

- **GIVEN** sandbox Stripe and Cloudflare credentials are available
- **WHEN** live/operator checks run
- **THEN** `pnpm stripe:webhooks:verify --env uat`, `pnpm stripe:catalog:verify --env uat`, UAT apply when needed, and Stripe sandbox smoke prove persistent webhook delivery and hosted Checkout catalog alignment without exposing secrets.

### Requirement: Commerce validation MUST cover generated UAT catalog artifacts

The validation workflow SHALL include a deterministic check that the backend Product Projection manifest and sandbox UAT D1 seed match the current Astro Store Item catalog.

#### Scenario: Generated artifacts drift

- **GIVEN** Astro Store Item content changes
- **WHEN** `pnpm stripe:catalog:artifacts:check` runs before regenerating artifacts
- **THEN** the command fails and identifies generated artifact drift.

### Requirement: Sandbox UAT proof MUST follow reset, seed, apply, and smoke sequence

The sandbox UAT proof sequence SHALL verify webhook readiness, catalog readiness, reset/apply behavior, UAT D1 seed application, backend deployment, and GitHub Pages hosted checkout smoke without committing secrets or full provider IDs. A pushed repo commit alone SHALL NOT be accepted as proof that Stripe sandbox catalog objects, D1 checkout readiness, or Store Offer snapshots have been updated.

#### Scenario: Full UAT catalog proof is run

- **GIVEN** Stripe sandbox credentials, the UAT Worker, and the GitHub Pages UAT storefront are available
- **WHEN** the operator follows the documented UAT sequence
- **THEN** catalog reset dry-run runs before confirmed mutation
- **AND** D1 seed runs before catalog apply
- **AND** catalog verification passes after apply
- **AND** checkout smoke covers `checkout_surface` and `happy_path_paid`
- **AND** evidence remains redacted and contains no secrets.

#### Scenario: Provider execution lessons are enforced

- **GIVEN** full sandbox catalog alignment is being accepted after an end-to-end provider run
- **WHEN** an operator reviews the proof
- **THEN** CLI catalog verification and smoke evidence are authoritative over Stripe Dashboard row counts
- **AND** legacy BlackBox sandbox Product cleanup is considered only through current ownership metadata, lookup keys, or documented catalog-derived legacy names
- **AND** webhook endpoint verification is treated as endpoint configuration proof, while paid smoke is treated as signing-secret and paid-order proof
- **AND** the UAT Worker is redeployed from the final pushed commit after any live-run script or runtime fixes
- **AND** low-stock smoke uses `afterglow-tape` only when low-stock behavior is the behavior under test.

### Requirement: Secret presence checks are redacted

The system MUST verify secret/config presence without printing secret values.

#### Scenario: Secret preflight fails

- **WHEN** a local, UAT, or PRD preflight detects missing sensitive configuration
- **THEN** output names the missing secret key or credential category
- **AND** it does not print existing secret values, derived credentials, webhook signing secrets, API tokens, or Stripe keys.

#### Scenario: Secret must be entered in another store

- **WHEN** a maintainer must add a value to GitHub Actions secrets, Cloudflare Worker secrets, Stripe Dashboard, or ignored local files
- **THEN** the preflight explains the destination store and why the value is not copied automatically from another store.

### Requirement: Loading feedback has focused automated coverage

The validation workflow SHALL include focused automated coverage for loading feedback state transitions introduced or changed by this work.

#### Scenario: Loading component behavior is tested

- **WHEN** a loading button, loading status block, checkout readiness state, checkout return pending state, shell overlay state, player loading state, or stock pending state is changed
- **THEN** focused tests assert the visible label, disabled or busy state, accessibility attributes, and resolved ready/error state
- **AND** tests use delayed or mocked async dependencies where needed to hold pending states deterministically.

### Requirement: Rendered loading feedback is browser-validated

The validation workflow SHALL use Browser Use for representative rendered loading states whose acceptance depends on layout, timing, focus, or motion.

#### Scenario: Loading UI changes are accepted

- **GIVEN** implementation changes visible loading feedback
- **WHEN** validation is run
- **THEN** Browser Use verifies representative local routes for store item purchase readiness, checkout start or return status, shell navigation or overlay loading, player loading, and stock operation pending states where local access permits
- **AND** validation notes distinguish unit-test proof from rendered Browser Use proof.

### Requirement: Standard repository gates still apply

The validation workflow SHALL run standard repository gates after behavior-changing loading feedback implementation.

#### Scenario: Loading feedback implementation is complete

- **WHEN** code changes alter loading feedback behavior
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass before completion is claimed
- **AND** `openspec validate standardize-loading-feedback --type change --strict` and `openspec validate --all --strict` pass before the change is treated as ready.

### Requirement: Astro Upgrade Compatibility Is Verified

The system SHALL verify Astro upgrade compatibility across the frontend build/runtime dependency graph before an Astro upgrade is accepted.

#### Scenario: Astro package versions are selected

- **GIVEN** an Astro upgrade is implemented
- **WHEN** package manifests and the lockfile are changed
- **THEN** the selected `astro` version matches the confirmed latest stable target for the change
- **AND** official Astro companion packages are updated only when they are part of the compatibility set
- **AND** unrelated dependencies remain unchanged unless validation exposes a direct compatibility issue.

#### Scenario: Peer and runtime compatibility are checked

- **GIVEN** an Astro upgrade changes dependency manifests or the pnpm lockfile
- **WHEN** compatibility validation runs
- **THEN** it verifies Astro, the official React integration, `@astrojs/check`, Astro lint/format tooling, Vite, Tailwind Vite integration, Node, and CI workflow runtime compatibility
- **AND** it verifies the lockfile does not introduce duplicate Astro or incompatible Vite lines.

#### Scenario: Repository gates prove the upgrade

- **GIVEN** an Astro upgrade is complete
- **WHEN** validation runs
- **THEN** `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm audit:unused` pass before completion is claimed.

### Requirement: Image Policy Validation Is Read-Only

The system SHALL validate image policy drift without mutating images or content.

#### Scenario: Asset QA checks image policy

- **GIVEN** `pnpm assets:check` runs after image-policy validation is extended
- **WHEN** it inspects public assets, content image references, and projected image URLs
- **THEN** it may report broken references, unreadable images, unsupported formats, obvious dimension or crop drift, missing alt-field coverage, and provider URL readiness
- **AND** it does not rewrite image files, content references, public URLs, or Astro image handling.

#### Scenario: Legacy image quality drift is subjective

- **GIVEN** validation finds crop, dimension, or quality drift that does not break runtime correctness or accessibility
- **WHEN** the drift is reported
- **THEN** it may be warning-first
- **AND** image replacement waits for explicit owner-approved content work.

### Requirement: Static cache header validation

The system SHALL validate repo-owned static cache header policy before cache behavior is accepted.

#### Scenario: Static build output is checked

- **WHEN** cache policy validation runs after `pnpm build`
- **THEN** it verifies that the Cloudflare Pages static artifact includes the expected cache header artifact
- **AND** fingerprinted Astro assets and document routes are classified according to the cache policy.

#### Scenario: Header policy drifts

- **GIVEN** a static header rule is added or changed
- **WHEN** validation detects immutable caching on a non-fingerprinted or unapproved asset pattern
- **THEN** validation fails with an actionable message naming the route pattern.

### Requirement: Worker cache header validation

The system SHALL test representative Worker API responses for explicit cache-control headers.

#### Scenario: Backend route tests run

- **WHEN** backend HTTP tests exercise public checkout, public Store Offer, checkout state, internal stock, internal order, and webhook routes
- **THEN** they assert the expected `Cache-Control` header for success and handled error responses
- **AND** they prove dynamic authoritative routes are not shared-cacheable.

#### Scenario: Generated API clients are updated

- **WHEN** route contracts or client fetch options change to support cache policy
- **THEN** generated API client changes are produced and checked through existing API generation and repository gates.

### Requirement: Hosted cache audit is bounded

The system SHALL provide a bounded hosted cache audit for PRD Cloudflare Pages and Worker responses.

#### Scenario: Hosted PRD audit runs

- **WHEN** a maintainer runs the hosted cache audit
- **THEN** it requests a small representative URL set
- **AND** it reports response URL, status, `Cache-Control`, `ETag`, and `CF-Cache-Status` when present
- **AND** it does not perform load testing, cache warming, provider mutation, checkout creation, or stock mutation.

#### Scenario: Hosted audit cannot reach provider

- **WHEN** Cloudflare credentials, PRD URL, or Worker URL are unavailable
- **THEN** the audit reports a blocked or skipped status
- **AND** local validation remains the minimum required implementation gate.

### Requirement: Free-tier regression checks

The system SHALL include validation guidance that protects the Cloudflare Free-tier budget.

#### Scenario: New cache validation is proposed

- **WHEN** a script or workflow adds repeated hosted requests
- **THEN** it documents the maximum number of Worker requests and D1-touching requests per run
- **AND** it stays materially below Workers Free daily request limits and D1 Free daily row limits.

#### Scenario: New cache dependency is proposed

- **WHEN** implementation adds KV, R2, Cache Rules, Worker Cache API, service worker, Pages Functions, or paid Cloudflare capabilities
- **THEN** the OpenSpec change identifies why headers and existing static delivery are insufficient
- **AND** it records Free-tier availability and failure behavior.

### Requirement: Image Source QA Stays Read-Only And Evidence-Based

The system SHALL keep source image QA read-only and add role-specific checks only for documented source problems.

#### Scenario: Asset QA runs

- **WHEN** `pnpm assets:check` runs
- **THEN** it inspects repo-owned content images and public image assets without mutating files
- **AND** it reports missing files, unsupported formats, unreadable image dimensions, missing alt coverage, provider URL readiness problems, and existing documented role-specific source warnings.

#### Scenario: Role-specific source warning is evaluated

- **WHEN** a source image check is added for preferred dimensions, ratio, or format expectations
- **THEN** the diagnostic is warning-level unless the image is unreadable, missing, or violates provider URL readiness
- **AND** the diagnostic names the source path, expected role standard, and observed dimensions or format.

#### Scenario: Source asset repair is performed

- **WHEN** ImageMagick or GIMP is used to replace a source image
- **THEN** the replacement is verified by `pnpm assets:check`
- **AND** the source change is reviewed separately from generated Astro output.

### Requirement: Built Image Markup Is Verified

The system SHALL verify generated image markup for representative routes after implementation.

#### Scenario: Static build completes

- **WHEN** `pnpm build` generates the static frontend artifact
- **THEN** representative route HTML is inspected for expected `srcset`, `sizes`, `loading`, `decoding`, and `fetchpriority` behavior on key image surfaces
- **AND** full-size image URLs are not the only candidate for responsive card and detail images.

#### Scenario: Above-fold route media is checked

- **WHEN** representative first-viewport media is inspected on `/`, `/distro/`, `/store/`, `/releases/`, release detail, artist detail, news detail, and `/services/`
- **THEN** each route has no more than the intended primary high-priority image
- **AND** leading visible card-set images avoid lazy loading where their section strategy requires eager loading.

#### Scenario: Tiny thumbnails are checked

- **WHEN** thumbnail-only image slots such as previous release lists, cart line images, checkout summary images, or badge-like images are inspected
- **THEN** they do not request large card/detail derivatives unless Astro metadata is unavailable and the raw runtime URL is the only available source.

### Requirement: Browser Image Validation Uses Browser Use

The system SHALL use Browser Use for rendered image validation when implementation changes image loading, layout, or framing.

#### Scenario: Local rendered validation runs

- **WHEN** image rendering implementation changes are complete
- **THEN** Browser Use validates representative routes at mobile and desktop widths
- **AND** the checks confirm stable frames, no blank media dead zones, no overlapping text, no horizontal scroll, and no console errors caused by the image changes.

#### Scenario: Catalog grid validation runs

- **WHEN** Distro, Store, Releases, Artists, or News grid image behavior changes
- **THEN** Browser Use checks the first viewport and a scrolled viewport
- **AND** the evidence confirms the leading card set is prioritized appropriately while below-fold images continue to load progressively.

#### Scenario: Hosted validation is needed

- **WHEN** the image change relies on hosted static asset behavior, CDN cache headers, GitHub Pages UAT behavior, or Cloudflare Pages PRD behavior
- **THEN** local Browser Use validation is not treated as hosted proof
- **AND** the appropriate hosted smoke or cache-policy check is run against the target Product Environment.

### Requirement: Repository Gates Remain Mandatory

The system SHALL run existing repository gates after image rendering implementation changes.

#### Scenario: Image behavior changes are complete

- **WHEN** implementation changes image behavior, generated markup, validation tooling, or source assets
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass on the final tree
- **AND** any new asset QA or markup check has focused tests that fail when the optimized behavior regresses.

### Requirement: CI performance measurement is repeatable

The system SHALL provide a repeatable CI performance measurement path that uses GitHub Actions run, job, and step timing data.

#### Scenario: Maintainer measures CI pipeline speed

- **WHEN** the CI speed measurement command runs against GitHub Actions history
- **THEN** it records workflow, job, and step durations for a declared time window
- **AND** it reports median, p75, p90, sample count, conclusion counts, and confidence labels
- **AND** it stores raw data and a human-readable report under `.codex-artifacts/ci-speed-analysis/` or a documented equivalent artifact path.

#### Scenario: Manual reruns are present

- **WHEN** a workflow run contains multiple attempts or manual rerun gaps
- **THEN** measurement uses latest-attempt job and step timing for execution duration
- **AND** raw run wall-clock gaps are not treated as CI execution time.

### Requirement: CI speed acceptance uses statistical thresholds

The system MUST accept CI speed improvements only from enough successful post-change runs to avoid single-run false positives.

#### Scenario: Static deploy workflow optimization is evaluated

- **WHEN** a CI speed optimization changes static deployment workflows
- **THEN** acceptance compares pre-change and post-change median, p75, and p90 timing for affected workflows
- **AND** each optimized workflow has at least 5 successful post-change runs before speed claims are made
- **AND** workflows with fewer than 5 successful runs are labeled low-confidence.

#### Scenario: Runner-minute trade-off is evaluated

- **WHEN** an optimization uses more parallel jobs to reduce wall-clock duration
- **THEN** the report includes total job-duration impact or an equivalent runner-minute estimate
- **AND** the change is accepted only when the wall-clock benefit is worth the runner-minute trade-off.

### Requirement: Dependency caching remains lockfile-driven and measured

The system SHALL use package-manager store caching for CI dependency installs and avoid custom caches unless measurement proves they are useful.

#### Scenario: Node dependencies are installed in GitHub Actions

- **WHEN** an edited workflow installs Node dependencies with pnpm
- **THEN** it uses `actions/setup-node` pnpm caching keyed by the repository lockfile
- **AND** it runs `pnpm install --frozen-lockfile`.

#### Scenario: Custom cache is proposed

- **WHEN** a workflow change proposes caching `node_modules`, build output, Playwright browsers, or other generated directories
- **THEN** the change includes pre-change timing evidence that the cached path is a material bottleneck
- **AND** the post-change report compares cache restore/save overhead against wall-clock improvement.

#### Scenario: Dependency install remains cheap

- **WHEN** dependency install median remains below 10 seconds for the affected workflow
- **THEN** custom dependency caching is not accepted as a CI speed optimization.

### Requirement: Low-reliability workflows are stabilized before speed tuning

The system SHALL prioritize failure classification for workflows whose success rate is too low for trustworthy speed baselines.

#### Scenario: Workflow has high failure rate

- **WHEN** a workflow has at least 5 runs in the measurement window and fewer than 70 percent succeed
- **THEN** the CI speed report identifies the workflow as reliability-first
- **AND** speed optimization for that workflow waits until failures are classified or the success rate improves.

### Requirement: Stripe-native catalog controls are validated

The system MUST validate Stripe-native catalog forensics, identity, orphan detection, and idempotency behavior with focused automated checks and operator docs.

#### Scenario: Catalog identity tests run

- **WHEN** catalog sync tests run
- **THEN** they cover lookup-key identity, metadata identity, missing identity, malformed identity, foreign Product Environment identity, and legacy sandbox identity.

#### Scenario: Orphan detection tests run

- **WHEN** catalog verification tests run
- **THEN** they cover active expected objects, active BlackBox-owned orphan objects, inactive historical objects, and objects whose ownership cannot be proven.

#### Scenario: Idempotency tests run

- **WHEN** catalog mutation tests run
- **THEN** they prove the same logical mutation reuses the same idempotency key
- **AND** changed amount, currency, Product Projection, repair target, or action purpose changes the key identity.

#### Scenario: Idempotency key safety tests run

- **WHEN** catalog idempotency helper tests run
- **THEN** they prove generated keys stay within Stripe's key length limit
- **AND** they cover request-shape fingerprints, child-key propagation, same-key same-parameter replay intent, and same-key different-parameter rejection intent.

#### Scenario: Report redaction tests run

- **WHEN** catalog reports or logs include Stripe correlation fields
- **THEN** tests prove secrets, raw provider payloads, full Product IDs, full Price IDs, full Event IDs, and full webhook endpoint IDs are redacted or omitted according to repository policy.

#### Scenario: Operator documentation is reviewed

- **WHEN** Stripe UAT catalog docs are updated
- **THEN** they include Stripe Workbench and Events investigation steps, fields to capture before cleanup, cleanup dry-run/apply order, and the limits of Stripe-native event retention.

#### Scenario: Stripe Search usage is reviewed

- **WHEN** Stripe Search is introduced or used in catalog tooling
- **THEN** tests or docs classify it as diagnostic, drift-discovery, or backfill tooling
- **AND** checkout authority remains covered by current-state reconciliation tests.

#### Scenario: Implementation is complete

- **WHEN** behavior-changing implementation finishes
- **THEN** targeted tests, `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm openspec -- validate --all --strict` pass before completion is claimed.

### Requirement: Artwork tool commands are standalone modules

The system SHALL keep the local artwork/distro tool package organized as standalone commands backed by separated command modules.

#### Scenario: Local tool commands resolve independently

- **WHEN** the local tool package is installed or executed in development
- **THEN** `artwork-fetcher`, `vinyl-mockup`, `cd-front-mockup`, `cassette-front-mockup`, `distro-sync`, and `release-date-research` resolve as standalone commands
- **AND** no command requires another command to run first

#### Scenario: Tool domains stay separated

- **WHEN** implementation organizes code under `tools/artwork-fetcher`
- **THEN** artwork fetching, mockup rendering, distro sync, and release-date research live behind separate module entrypoints
- **AND** CLI entrypoints call domain modules rather than other CLI runners
- **AND** distro sync does not own release-date candidate extraction or scoring
- **AND** Release Date Research does not import mockup rendering modules
- **AND** mockup rendering modules do not import Release Date Research modules

#### Scenario: Existing commands keep current behavior

- **WHEN** the module split lands
- **THEN** `artwork-fetcher`, `vinyl-mockup`, `cd-front-mockup`, `cassette-front-mockup`, and `distro-sync` keep their current behavior unless an implementation task explicitly changes it
- **AND** existing fixture-backed tests continue to cover dry-run and apply behavior where they already exist

### Requirement: Value-object refactoring standard

The system SHALL introduce value objects only for concepts that own validation, formatting, mapping, external contract limits, or cross-module identity semantics.

#### Scenario: Value-object candidate is evaluated

- **WHEN** a primitive value is considered for promotion to a value object
- **THEN** the implementation identifies the invariant owned by the value object
- **AND** the value object replaces duplicated primitive manipulation or protects an external contract.

#### Scenario: Value object is introduced

- **WHEN** a value object is added
- **THEN** focused tests cover valid input, invalid input, formatting, and boundary behavior
- **AND** the implementation does not add a wrapper that merely stores a primitive without behavior.

