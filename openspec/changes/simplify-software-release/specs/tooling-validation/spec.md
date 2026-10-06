## MODIFIED Requirements

### Requirement: Standard repository gates

The system SHALL run targeted local checks after behavior-changing implementation and retain complete repository gates in CI before deployment.

#### Scenario: Behavior changes

- **GIVEN** code changes affect runtime behavior, tests, build output, scripts, or workflows
- **WHEN** implementation is complete
- **THEN** targeted `pnpm validate` must pass for the final source fingerprint before local completion or push
- **AND** CI must pass every test/check leaf and the checked target builds before deployment
- **AND** `pnpm validate:full` and the three standalone unit/check/build commands remain available without catalog generation
- **AND** local evidence and partial `pnpm validate:fast`, `pnpm validate:checks`, and `pnpm validate:editor` results never establish full CI or release acceptance.

#### Scenario: Local validation evidence is produced

- **WHEN** validation runs
- **THEN** compact phase results point to full local logs and a JSON summary
- **AND** the summary records source SHA, tracked/untracked source fingerprint, tool versions, durations, and phase exit status
- **AND** targeted local summaries declare `mode: local`, distinct from `mode: full`
- **AND** source changes, cancellation, and incomplete phases prevent full success
- **AND** task-specific rendered, asset, CMS, and hosted checks retain their existing scope.

#### Scenario: A separate worktree is explicitly authorized

- **GIVEN** the user explicitly requested a separate worktree
- **WHEN** the OpenSpec guard or wrapper receives `--allow-worktree`
- **THEN** it permits that repository checkout and does not forward the opt-in to OpenSpec
- **AND** omitting the flag preserves the default main-worktree and main-branch restriction.

#### Scenario: CI runs complete checks alongside target builds

- **WHEN** `pnpm validate:checks` succeeds
- **THEN** all current unit-test and workspace-check leaves have succeeded for its recorded source identity
- **AND** its evidence is explicitly partial because target builds have not run
- **AND** CI still requires both target builds, combined artifacts, the whole end-to-end suite and staff previews before UAT deployment; the unused-code audit runs separately
- **AND** checks and target builds may run concurrently, but failed checks prevent deployment and final candidate assembly.

### Requirement: Local end-to-end harness is deterministic and opt-in

The repository SHALL provide `pnpm test:e2e`, which runs Playwright specs against this checkout's Local site URL and is the required check for shell navigation, overlay, player, mobile-navigation and cart continuity. It SHALL reuse a site already serving that URL or run the foreground static-site launcher for the run. It SHALL NOT start the Local stack, run inside `pnpm validate`, or depend on external network or Worker responses. A local run SHALL name a spec path or title filter; the whole suite runs in CI on every push before UAT deployment or locally under a maintainer grant.

#### Scenario: A site already serves the canonical port

- **GIVEN** background Astro or the full Local stack owned by this checkout serves the checkout's canonical Local site URL
- **WHEN** an agent runs `pnpm test:e2e` with a spec path
- **THEN** the harness reuses that server and leaves it running afterwards.

#### Scenario: Nothing serves the canonical port

- **WHEN** an agent runs `pnpm test:e2e` with a spec path and the checkout's canonical site port is free
- **THEN** the harness starts `pnpm site:dev` for the run
- **AND** the port is free again after the run.

#### Scenario: Another checkout serves port 4321

- **GIVEN** the primary checkout serves port 4321
- **WHEN** a linked worktree runs `pnpm test:e2e` with a spec path
- **THEN** the harness uses the linked worktree's own port and does not test the primary checkout's site.

#### Scenario: An agent verifies the feature under work

- **WHEN** an agent runs `pnpm test:e2e` with a spec path or title filter
- **THEN** only the selected specs run.

#### Scenario: An agent runs the whole suite locally

- **WHEN** `pnpm test:e2e` runs locally without a spec path, title filter or maintainer grant
- **THEN** it exits non-zero without starting a browser or server
- **AND** it tells the agent to name a spec.

#### Scenario: A page logs an error

- **WHEN** a page under test logs a console error or throws an uncaught error
- **THEN** that test fails and names the message
- **AND** a trace, screenshot and error context are retained under `.codex-artifacts/e2e/test-results/`.

### Requirement: Promotion evidence and smoke remain environment-safe

The system SHALL verify UAT behavior and record PRD closure without inventing live proof.

#### Scenario: UAT smoke runs

- **WHEN** an operator dispatches the manual UAT smoke
- **THEN** configured UAT checkout-surface and paid-path checks run
- **AND** their evidence contains no provider secrets, full IDs, or payment/customer details.

#### Scenario: PRD live policy is absent

- **WHEN** the PRD-open gate or required live configuration is absent
- **THEN** validation reports not_configured
- **AND** does not claim live provider, deploy, or Checkout proof.

### Requirement: Hosting parity and code promotion are validated

Validation SHALL prove target isolation, matching Cloudflare hosting, immutable candidate selection, and absence of automatic PRD deployment on a main push.

#### Scenario: Workflow contract tests run

- **WHEN** a workflow omits promotion authorization, uses latest main instead of the selected candidate, mixes environment resources, or deploys before required checks
- **THEN** validation fails before deployment.

#### Scenario: Hosted UAT is accepted

- **WHEN** UAT's stable Cloudflare site serves the candidate
- **THEN** hosted release identity is verified for that SHA and the push run's read-only static smoke verifies static routes, Review Site Marker and cache headers
- **AND** the manual UAT smoke verifies checkout return paths and signed test-provider processing
- **AND** evidence identifies the new UAT origin rather than the retired GitHub Pages site.

## REMOVED Requirements

### Requirement: Post-merge UAT provider smoke workflow

**Reason**: Provider smoke drains finite UAT stock and is not a release gate. Only the manual workflow runs it.

**Migration**: See the requirement "Manual UAT provider smoke".

### Requirement: CI performance measurement is repeatable

**Reason**: `pnpm ci:speed` and `scripts/ci-speed-measurement.mjs` are removed. Timing comes from the GitHub Actions API, so no repository tool or artifact path is required.

**Migration**: Record timings with `gh run view --json jobs`; see `docs/validation-feedback.md`.

## ADDED Requirements

### Requirement: Manual UAT provider smoke

The system SHALL validate the deployed Cloudflare Pages UAT site with the canonical Stripe test-mode paid scenarios and newsletter Contact smoke only when an operator dispatches the UAT smoke workflow, without requiring operator presence during the run or Resend receipt credentials. A push to `main` and PRD promotion SHALL NOT run provider smoke, and its result SHALL NOT gate any release.

#### Scenario: An operator dispatches the UAT smoke

- **GIVEN** UAT serves the candidate under test
- **WHEN** the operator dispatches the UAT smoke workflow
- **THEN** it runs `pnpm smoke:stripe-uat -- --scenario happy_path_paid,pay_what_you_want_paid --screenshots on-failure` against the deployed Cloudflare Pages UAT site
- **AND** it runs `pnpm smoke:resend-uat` against the deployed UAT Worker
- **AND** it uses the `catalog-promotion-uat` GitHub Actions environment for the same UAT Cloudflare and sandbox Stripe credentials already used by UAT promotion
- **AND** its concurrency group differs from the release groups, so it cannot cancel a pending push deployment
- **AND** resulting application email routes to the managed UAT sink
- **AND** it uploads the standard smoke summary and evidence artifacts.

#### Scenario: UAT has too little online stock

- **WHEN** the selected UAT items lack the online stock the paid scenarios consume
- **THEN** the run reports insufficient stock as a precondition, not as a product defect
- **AND** it reports which item and quantity are missing.

#### Scenario: Receipt mode is omitted from manual smoke

- **WHEN** the manual workflow runs `pnpm smoke:stripe-uat`
- **THEN** it does not enable receipt mode, require a local Resend profile, add a Resend GitHub secret, or wait for an operator
- **AND** checkout, webhook, order, D1, screenshot, trace, and existing Smoke Evidence behavior remains unchanged
- **AND** the result does not claim that inbox receipt was verified.

#### Scenario: A push or promotion runs

- **WHEN** a push to `main` completes its UAT deployment or PRD promotion runs
- **THEN** no provider smoke runs
- **AND** the run's success does not claim provider acceptance.

#### Scenario: Deployment ownership is validated

- **WHEN** environment-model and workflow contract validation run
- **THEN** they reject Worker deployment or D1 migration commands in provider smoke
- **AND** they reject a standalone UAT Worker deployment workflow
- **AND** they require the canonical release workflow to retain the UAT Worker deployment step.
