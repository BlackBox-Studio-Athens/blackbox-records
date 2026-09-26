Complete sections in order. Commit each section after focused checks pass. Run full validation on the exact final tree before completion or push.

## 1. Measure and revise validation policy
- [x] Fix CI run/job collection pagination and attempt identity; keep only complete successful runs in successful timing percentiles.
- [x] Report local first-failure/total time and hosted queue, setup, transfer, runner cost, UAT quick feedback, and promotion readiness where evidence exists.
- [x] Cover success, failure, cancellation, rerun, incompletion, and missing timestamps; capture existing baselines without dispatching workflows.
- [x] Allow targeted checks between implementation milestones while retaining full final local validation and all applicable CI/browser/publication gates.

## 2. Scope local iteration
- [ ] Keep `validate` and `validate:checks` complete; single-package fast runs only that package's tests/types, `all` also runs contracts.
- [ ] Overlap the two fast lanes within the existing bounded cancellation behavior.
- [ ] Add `test:watch --scope` for one required package using every package Vitest config.
- [ ] Cover scopes, contract selection, bad input, cancellation, partial evidence, and watch rerun.

## 3. Add opt-in validation phase reuse
- [ ] Add `--resume` and `--no-cache`, with fresh default runs.
- [ ] Reuse only eligible successful phases using conservative file/config/toolchain/environment fingerprints; never cache builds, editor/browser/hosted work, unknown phases, or build outputs.
- [ ] Require completed, stable provenance; malformed/missing/canceled/changed evidence is a cache miss.
- [ ] Cover source/config/lockfile/toolchain/file-set changes, failed retry, corruption, no-cache, and source mutation.

## 4. Move advisory unused-code audit
- [ ] Remove `audit:unused` from candidate preparation.
- [ ] Run the existing audit weekly and manually, publish its report, and fail visibly on tool errors.
- [ ] Update required-gate docs and workflow tests.

## 5. Split target preparation
- [ ] Build UAT and PRD in independent workspaces from their own published snapshots, preserving each target's build checks.
- [ ] Add verified `pack-target uat|prd` and `assemble` commands with full candidate identity and file digests.
- [ ] Reject missing, tampered, wrong-target, mixed-candidate, or migration-conflicting bundles.
- [ ] Preserve schema-2 final promotion artifacts; assembly verifies and combines bytes only.
- [ ] Permit UAT deployment after UAT preparation without waiting for PRD; candidate success still requires both bundles, assembly, and complete UAT acceptance.
- [ ] Test artifacts and workflow dependencies.

## 6. Reduce setup and expose quick UAT result
- [ ] Reduce redundant checkout/install/download inside current credential boundaries; keep Pages and Worker jobs separate.
- [ ] Run read-only readiness and static smoke after Pages deploy, before sequential provider smoke; quick success remains informational.
- [ ] Preserve all provider scenarios and evidence upload; install only needed browser engines while retaining both staff preview browsers.
- [ ] Test workflow identity, transfer targets, order, credential scope, and failures.

## 7. Cancel obsolete preparation, protect mutation
- [ ] Use cancellable branch/role-scoped preparation concurrency and a shared non-cancelling lock for every deploy/catalog mutation sequence through acceptance.
- [ ] Avoid duplicate caller/child concurrency groups; retain immediate monotonic ordering checks.
- [ ] Test cancellation, lock coverage, late candidates, and promotion eligibility; update CI measurement job names and recovery docs.

## 8. Final acceptance and handoff
- [ ] Run `pnpm validate --no-cache` on exact final source and applicable editor/publication checks.
- [ ] Strictly validate OpenSpec and verify schema-2 promotion consumes retained bytes without weakening confirmations or launch gates.
- [ ] Record commits, evidence, measured outcomes, unobserved hosted behavior, and remaining work.
