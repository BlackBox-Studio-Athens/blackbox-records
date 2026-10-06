# Proposal

## Why

Releasing is the slowest and most fragile part of the work. Measurements from all 211 `pages.yml` runs since 2026-09-01, git history and agent sessions:

- **PRD promotion mostly fails.** Since 10-02, 18 dispatches needed 22 attempts for 7 PRD successes. Each attempt ran 10 to 27 minutes, and the 10-06 release took 2 h 11 m over 4 dispatches. In September, promotion succeeded 27 of 31 times in 3 to 5 minutes.
- **Cause: `657c7247` (10-01).** It put the whole e2e suite, the staff previews and the provider smoke inside the PRD dispatch. The e2e suite and the staff previews test code, not UAT: they rebuild locally and never touch UAT. Every regression or flake therefore surfaces hours after its push, and each fix costs a push (about 9 minutes) plus a re-dispatch.
- **The gates create churn.**

  | Gate           | Blocked attempts | Real defects caught                         | Cause of the rest               |
  | -------------- | ---------------- | ------------------------------------------- | ------------------------------- |
  | e2e            | 12               | 2, both deterministic and catchable on push | drift, flakes, pipeline issues  |
  | Provider smoke | 5                | 0                                           | drained finite UAT stock        |
  | Staff previews | 5                | 0                                           | 4 were selector or layout drift |

- **Push runs got slower and redder.** The median is 8.6 minutes with 32% red; the 4-job pipeline before 09-12 took 3.5 minutes with 0 of 13 red.
- **The machinery keeps growing.** `pages.yml` grew from 433 to 783 lines and `scripts/` from 14.6k to 32.5k lines in 3.5 weeks. `scripts/pages-workflow-contract.test.ts` (592 lines) pins the YAML shape, and 29 of 44 workflow commits had to edit it. Pipeline-fix commits rose from 5% to 32% of all commits.
- **Much of it is dead.** The catalog and CMS cutover jobs and inputs have not run since 09-15. `content-publication.yml` cannot be reached because runtime mode is hard-coded. `uat-smoke.yml` and `uat-static-smoke.yml` have been dormant since 09-11. The rebuild and rollback path has never been used, and the "retained candidate" never promoted tested bytes because the PRD and UAT builds are separate.
- **There is no real human gate.** The GitHub environments have no protection rules, and agents dispatch PRD within about a minute of UAT going green.
- **The PRD CMS has had no backup since 10-01.** `cms-backup` checks the total CMS size against `CMS_BACKUP_MAX_BYTES` (512 MiB), PRD outgrew it on 10-02, and the job has failed daily since.

## What Changes

- **Phase 0:** restore PRD CMS backups by raising `CMS_BACKUP_MAX_BYTES` to 2 GiB (`2147483648`), dispatching one daily backup and updating `docs/cms-backup.md`. No code.
- **Phase 1 (this change's first deltas):**
  - **BREAKING:** the whole e2e suite and the staff previews move from the PRD dispatch to every push and the legacy `target=uat` dispatch. They run in parallel with checks and builds and block the UAT deploy.
  - UAT static smoke runs on push after UAT deploys.
  - **BREAKING:** provider smoke leaves the release. `uat-smoke.yml` stays as the manual entry in its own concurrency group.
  - **BREAKING:** PRD promotion becomes deploy-only: identity check, deploy, static deploy, no test suites.
  - Phase 1 (interim): `release-candidate.mjs` re-checked UAT identity only in `verify prd`, and promotion held the shared release lock, so a push's UAT deploy waited until promotion ended. Phase 3 replaced this: promotion resolves UAT's SHA once, and the locks are split (`release-uat`, `release-prd`).
  - The 592-line workflow contract test becomes about 20 lines of shape-free invariants.
- **Phase 2:** delete dead machinery (publication workflow path, catalog and cutover jobs, duplicate smoke workflow and `pack`, measurement tooling) with no build-shape change. Its deltas are added with that phase, including the routine and emergency rollback rule.
- **Phase 3:** HOST-11. Pages fails closed and ships no route HTML. **BREAKING:** builds become content-free; one `deploy-uat` job replaces the reusable UAT sequence; `promote-prd.yml` (no inputs) replaces the `target=prd` dispatch and rebuilds PRD from the SHA UAT serves; the retained candidate bundle, compact transport and 7-day rebuild path are removed; the `/assets/catalog/*` alias is deleted.
- **Phase 4:** hosted cleanup (secrets, caches, unused environment) and close-out, with each deletion needing the user's approval.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `software-release-promotion`: the push runs the browser suites before UAT deploys and static smoke after; PRD promotion is an input-free, deploy-only rebuild of the SHA UAT serves; operator replaces reviewer; content-freshness wording leaves the promotion scenarios; the retained bundle, content restore, image cache and compact transport requirements are removed.
- `tooling-validation`: provider smoke becomes a manual workflow and never a gate; CI runs the whole e2e suite on every push; promotion evidence wording follows.
- `commerce-checkout`, `project-language`: wording that referred to promotion smoke.

Phases 2 and 3 add deltas for `static-site-and-deployment` (fail-closed, no route HTML, artifact handoff, triggers, Review Site Marker), `content-publishing`, `catalog-promotion-automation` and `cloudflare-free-tier-cache-policy`; Phase 3 also modifies the hosted performance gate in `tooling-validation`.

## Impact

Phase 1 touches `.github/workflows/pages.yml`, `uat-release-sequence.yml` (comment) and `uat-smoke.yml` (concurrency group), `scripts/release-candidate.mjs` and its test, `scripts/pages-workflow-contract.test.ts`, the workflow assertions in `apps/backend/test/scripts/` and `scripts/verify-environment-model.ts`, `feedback-policy.json`, `README.md` and the release docs (`agent-workflow`, `agent-reference`, `environment-model`, `catalog-promotion`, `validation-feedback`, `stripe-sandbox-uat`, `cloudflare-free-tier`). No runtime application code, dependency, secret or GitHub setting changes.

Phase 3 touches `.github/workflows/pages.yml` and the new `promote-prd.yml`, `scripts/release-candidate.mjs`, `build-public-release.mjs`, `configure-public-gateway.mjs`, `apps/backend/scripts/migrate-cms.mjs`, the renderer config, the catalog mockup imports and the email preview, and deletes `uat-release-sequence.yml`, the restore and capture scripts and the `/assets/catalog` route. The environment `CLOUDFLARE_API_TOKEN`s need Pages write.

Hosted steps needing the user, each asked first: a push to `main` (each phase; a push releases UAT), a `promote-prd.yml` dispatch to measure promotion, the Phase 0 variable change and backup dispatch, Pages token scope and read-only hosted checks, and the Phase 4 secret, cache and environment deletions.
