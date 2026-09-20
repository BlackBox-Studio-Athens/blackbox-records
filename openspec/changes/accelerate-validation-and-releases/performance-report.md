# Performance report

Status: local implementation evidence is complete; one hosted UAT pilot passed, while five-sample performance acceptance remains pending.

## Accepted local changes

| Area                                                 | Evidence                                                                                                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Benchmark capture/compare and read-only CI collector | `scripts/benchmark-validation.mjs`, `scripts/ci-speed-measurement.mjs`, `scripts/ci-speed-measurement.test.mjs`                                                                                               |
| Backend selection                                    | `apps/backend/test/scripts/backend-test-selection.test.ts`; exact explicit Node set of 21 files and bounded Worker cap                                                                                        |
| Web test split                                       | `apps/web/src/test/network-rejection.test.ts`; lightweight and request invocations retain separate reporter names                                                                                             |
| Prettier cache                                       | `scripts/format-check.mjs`, `scripts/format-check.test.mjs`; cached and uncached commands both pass                                                                                                           |
| CI preparation                                       | `scripts/validate.mjs`, `scripts/run-release-preparation.mjs`, `.github/workflows/pages.yml`; checks-only prerequisites, paired builds, paired browsers, cache timing, and separate failure diagnostics       |
| Media restore                                        | `scripts/restore-published-content.mjs`, `scripts/capture-cms-snapshot.test.mjs`; four-wide settled batches with no later batch after failure                                                                 |
| Paid polling                                         | `scripts/smoke-stripe-sandbox.ts`, `apps/backend/test/scripts/stripe-sandbox-smoke.test.ts`; ready, delayed, never-paid, non-paid, and final projection rejection coverage                                    |
| Compact release transport                            | `scripts/release-candidate.mjs`, `scripts/release-candidate.test.mjs`; schema-2 manifest round-trip, legacy compatibility, tamper/missing/extra/path/duplicate rejection, and low-compression artifact upload |

The compact fixture has 12 logical files containing one repeated 1,300-byte payload: 15,600 logical bytes become 1,300 stored object bytes (91.7% fewer payload bytes). This is a local component result, not an end-to-end hosted latency claim.

## Warm full measurements

All three runs used source SHA `a66f6755b3f5ca804cc59ae557c4e8b60087d2af`, fingerprint `3555a8255d5ac2a33b434ddc4536a8e8bbe9da9b82a9ebdffab47de54a651cc7`, 2,156 source files, Node `v24.21.0`, pnpm `12.0.0`, and the complete seven-phase `pnpm validate` gate:

| Run                              |                  Elapsed |
| -------------------------------- | -----------------------: |
| `2026-09-20T01-26-06-960Z-48124` |                   184.5s |
| `2026-09-20T01-29-38-511Z-16392` |                   177.5s |
| `2026-09-20T01-32-53-215Z-16860` |                   188.8s |
| Median / p75 / p90               | 184.5s / 188.8s / 188.8s |

These are three comparable warm candidate runs, not a matched baseline/candidate campaign. The retained pilot controls use different source and test inventories, so the required 20% warm-median improvement is not claimed and task 5.1 remains open. The final ordinary validation is rerun after this report is finalized; its summary records the final source identity.

## Hosted UAT pilot

The first activated run failed in the parallel Chromium editor check while Firefox passed. Rerunning the failed candidate on the same source revision passed both browsers and the full UAT path. This is one successful post-change attempt, not the required five-sample cohort.

| Run                                                                                                           | Source                                     |  Result |     Execution |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------: | ------------: |
| [35500652918, attempt 2](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35500652918) | `d11a79c7e6c772b587b82537e20eab8f31321cf8` | success | 914s / 15m14s |

The historical UAT median was 1,310.5s / 21m50.5s. This pilot was 396.5s / 6m36.5s lower, or 30.3% below that historical median. It clears the 20% threshold as a single observation, but does not establish the required five-run claim. The successful attempt's major jobs were candidate 590s, inspection 32s, Worker deploy 95s, Pages deploy 54s, and smoke 128s. PRD deployment, catalog mutation, and payment flows were skipped.

## Final local run record

Final source identity and validation summary paths are recorded by the final `pnpm validate` run under `.codex-artifacts/validation/`. Final uncached formatting, editor acceptance, affected release-candidate tests, and strict OpenSpec validation are required before completion is claimed.

## Evidence gaps

Only one successful post-change UAT attempt is recorded, so the five-sample hosted acceptance cohort is still missing. There is no measured cross-run image-cache net saving or compact upload/download end-to-end improvement yet. No PRD promotion, catalog mutation, or payment flow was dispatched; the UAT run used the normal authorized release path. The pilot result is recorded here, while the historical observations in `research.md` remain supporting context rather than a controlled baseline campaign.

## Rollback

Disable or revert each optimization independently: use `format:check:uncached`, remove the Astro cache restore/save steps, set `BLACKBOX_BACKEND_WORKERS=2`, run the release-preparation helper with `--serial`, restore the serial media loop, or return candidate packaging to the legacy directory layout while retaining compact-reader compatibility until retained candidates expire. Existing release authority checks and PRD no-rebuild promotion remain required.
