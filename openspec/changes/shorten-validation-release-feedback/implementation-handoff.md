# Implementation handoff

## Milestone 1 — measurements and validation policy

- **Changes:** Added attempt-aware, paginated GitHub Actions measurement; separated UAT quick feedback, promotion readiness, queue, setup, artifact transfer, elapsed time, and runner seconds. Updated validation policy and captured the existing historical baseline.
- **Checks:** CI measurement tests passed for attempt pagination, reruns, failed/cancelled/incomplete runs, missing timestamps, job-set compatibility, and low-confidence summaries. Existing local validation did not finish within the IDE's 120-second wait; its first-failure and total durations remain unavailable.
- **Evidence:** `.codex-artifacts/ci-speed-baseline/{raw.json,summary.json,report.md}` (ignored); `docs/validation-feedback.md`.
- **Measured effect:** Baseline only. UAT median 981s end-to-end, 3s queue, 600s setup elapsed, 12s artifact transfer elapsed, 998s promotion-ready; 24,273 runner-seconds across successful attempts. No post-change hosted comparison exists.
- **Next milestone:** Scope local package iteration and add a single-package test watcher.

## Milestone 2 — scoped iteration

- **Changes:** Pending.
- **Checks:** Pending.
- **Evidence:** Pending.
- **Measured effect:** Not measured.
- **Next milestone:** Add opt-in reuse of eligible successful phases.
