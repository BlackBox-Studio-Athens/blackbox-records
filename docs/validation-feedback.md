# Validation and release feedback

## Baseline — 2026-09-19 through 2026-09-26

Historical GitHub Actions data contains 26 UAT candidate attempts: 21 successful and 5 failed. Successful UAT runs had 981 seconds median end-to-end workflow time (p75 1092s, p90 1163s), 3 seconds median queue time, and 998 seconds median from run creation to promotion readiness. A separate early UAT quick-check stage did not exist, so its timing is unavailable. PRD promotion had 12 successful, 2 failed, and 1 cancelled attempt, with 183 seconds median successful duration. The diagnostics group had 30 successful and 7 failed attempts, with 37 seconds median successful duration.

Across successful attempts, workflow jobs accumulated 24,273 runner-seconds for UAT candidates and 3,878 for PRD promotion. Median per-job dependency setup elapsed time was 600 seconds for UAT candidates and 88 seconds for promotion; median runner time in setup steps was 4,222 and 1,018 seconds. Median artifact transfer elapsed time was 12 seconds for UAT candidates and 9 seconds for promotion; transfer runner time was 1,283 and 311 seconds. Elapsed setup/transfer are critical-path estimates by phase, while runner seconds sum parallel jobs. The diagnostic group had 37 attempts (30 successful, 7 failed), 37 seconds median, 29 seconds setup elapsed, and 5,215 runner-seconds.

The initial local full-validation run did not produce a completed summary within WebStorm's 120-second wait. Its output showed `environment:model:verify` in 1.8 seconds and `check:boundaries` in 36.9 seconds. Treat the local total and first-failure time as unavailable; do not compare this partial run with a completed candidate.

The machine-readable CI sample is retained in ignored `.codex-artifacts/ci-speed-baseline/`. It was refreshed with the attempt-aware collector from existing runs; no workflows were dispatched. Refresh with:

```sh
pnpm ci:speed --repository BlackBox-Studio-Athens/blackbox-records --from 2026-09-19T00:00:00Z --to 2026-09-26T23:59:59Z
```

The report excludes failed, canceled, incomplete, and missing-timing attempts from successful duration percentiles while retaining their counts. At least five successful attempts are labeled high confidence. The pre-change local full-validation attempt timed out before completion, so local total and first-failure time remain unavailable. No updated hosted sample exists yet; speed improvement is not measured.

## Measurements after the feedback changes

Keep local time to first failed phase and full duration separate from hosted queue time, dependency setup, bundle transfer, total runner seconds, UAT quick-check time, and promotion-ready time. Compare at least five successful attempts on each side where available. Label smaller samples and missing timing as low confidence or unavailable. Do not infer speed gains from the workflow graph alone.
