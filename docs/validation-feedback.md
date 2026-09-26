# Validation and release feedback

## Baseline — 2026-09-19 through 2026-09-26

The corrected workflow-specific sample contains 28 UAT candidate attempts: 22 successful and 6 failed. Successful UAT attempts had 955 seconds median execution time (p75 1092s, p90 1163s), 3 seconds median queue time, and 984 seconds median from run creation to promotion readiness. Early UAT quick-check timing is unavailable because that stage did not exist. PRD promotion had 11 successful, 1 failed, and 1 cancelled attempt, with 183 seconds median successful duration. Run creation is the available proxy for push time. Unrelated workflows are excluded.

Across all recorded attempts, jobs accumulated 25,910 runner-seconds for UAT and 2,241 for PRD promotion. Setup used 4,539 and 651 runner-seconds; artifact transfers used 1,364 and 230. Successful-attempt median setup time was 60s for UAT and 28s for PRD; median transfer time was 12s and 9s. Setup/transfer elapsed measures the largest per-job sum of matching active step durations, excluding post-job cleanup and gaps between steps. Runner cost sums all jobs, including failed attempts. These are separate from total workflow wall time.

The initial local full-validation run did not produce a completed summary within WebStorm's 120-second wait. Its output showed `environment:model:verify` in 1.8 seconds and `check:boundaries` in 36.9 seconds. Treat the local total and first-failure time as unavailable; do not compare this partial run with a completed candidate.

The corrected machine-readable sample is retained in ignored `.codex-artifacts/ci-speed-baseline-corrected/`. It supersedes `.codex-artifacts/ci-speed-baseline/`, which included unrelated workflows and mislabeled some skipped PRD jobs. The refresh read existing GitHub runs only. Refresh with:

```sh
pnpm ci:speed --repository BlackBox-Studio-Athens/blackbox-records --workflow pages.yml --from 2026-09-19T00:00:00Z --to 2026-09-26T23:59:59Z --output .codex-artifacts/ci-speed-baseline-corrected
```

The report excludes failed, canceled, incomplete, and missing-timing attempts from successful duration percentiles while retaining their counts. At least five successful attempts are labeled high confidence. The pre-change local full-validation attempt timed out before completion, so local total and first-failure time remain unavailable. No updated hosted sample exists yet; speed improvement is not measured.

## Measurements after the feedback changes

Keep local time to first failed phase and full duration separate from hosted queue time, dependency setup, bundle transfer, total runner seconds, UAT quick-check time, and promotion-ready time. Compare at least five successful attempts on each side where available. Label smaller samples and missing timing as low confidence or unavailable. Do not infer speed gains from the workflow graph alone.

Fresh local implementation-tree runs completed in 176.6s and 247.9s on 2026-09-26. These are individual samples, not comparable before/after medians. The initial baseline run did not complete, so no local speed improvement is claimed. Final committed-tree evidence is recorded in `.codex-artifacts/validation/final-verification.json`, linking the full summary and its source fingerprint.

## Local iteration and completion

Use `pnpm validate:fast --scope web|staff|backend|api-client` for a package edit and `--scope all` for shared packages, configuration, content schemas, migrations, or tooling. Fast validation is partial; `all` also runs repository contracts. `pnpm test:watch --scope <package>` starts one package's Vitest configs. Full `pnpm validate` runs fresh by default. `--resume` opts into safe successful phase reuse and `--no-cache` forces a fresh run. A full pass can be reused only when the recorded source fingerprint and toolchain match the exact final tree. Browser, editor, publication, and hosted acceptance remain additional when applicable.

In WebStorm, use **BlackBox Validate Fresh** for `pnpm validate --no-cache` and **OpenSpec Strict** for this change's guarded validation. Both point to committed package scripts. The old temporary configuration named **OpenSpec change passes strict validation in the authorized worktree** referenced a deleted test fixture; remove that obsolete temporary entry if it remains in local IDE history. Do not recreate the fixture or run that entry. To avoid blocking on an IDE wait timeout, launch through WebStorm with `waitForExit: false` and inspect its output file and validation summary.

## Candidate stages and recovery

`pages.yml` runs `check-candidate`, then independent `prepare-uat` and `prepare-prd` jobs, followed by `assemble-candidate`. UAT can continue through `inspect-uat-pages` and the direct `deploy-uat`, `deploy-uat-static`, and `smoke-uat` jobs while PRD preparation is running. The Worker deploy and provider smoke jobs target `catalog-promotion-uat` directly; the Pages deploy stays outside that environment and uses its repository-scoped Pages token. PRD promotion uses the retained schema-2 `release-<sha>` artifact through direct `deploy-prd` and `deploy-prd-static` jobs; it does not rebuild.

Automatic check/build/assembly preparation uses cancellable branch-and-role groups. Manual preparation gets run-specific groups. The non-cancelling workflow-level `blackbox-release` lock serializes complete release workflow runs alongside content publication and PRD holding-page deployment. Within a run, UAT preparation and deployment do not depend on PRD artifacts. Immediate monotonic run-number checks reject older candidates that finish late.

For local recovery, inspect `.codex-artifacts/validation/<run>/summary.json` first, then only the named failure log. Use `pnpm validate --no-cache` when evidence is stale or the source changed. For hosted failures, inspect the run summary and uploaded UAT smoke evidence; prepare a fresh candidate after a rollback. Roll back by reverting the affected milestone and producing a new candidate. Never bypass release verification, reseed data, or reuse incompatible evidence. Hosted behavior remains unobserved until an authorized push runs the workflow.
