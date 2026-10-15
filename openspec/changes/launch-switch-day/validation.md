# GitHub Actions launch preparation — 2026-10-15

Workflow source: `8dfb638aba0d6fd2d762308e69d7edf1f43370c7`, `.github/workflows/launch-switch.yml`. Published main YAML matched the checked local source, including cron `0 7 16 10 *` and the exact `2026-10-16` UTC date guard. The schedule requests real cutover at 10:00 Athens time; GitHub scheduling delays remain possible.

The `prd-launch` environment permits only branch `main`. Its secret names are `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID` and `STRIPE_LAUNCH_KEY`; its variable is `STRIPE_DASHBOARD_REVIEW`. Values were copied from the authorized ignored local sources without printing or committing them.

[Dry-run 38791442409](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38791442409) succeeded on that source. The request gate, dependency/Chromium setup, launch command, phone summary and artifact upload passed. The command summary is `planned`: Cloudflare credential and target, Stripe webhook and browser-reviewed policies, Accepted PRD release, and Read rollback snapshot all passed. It made 12 requests, including two public reads, matching the local rehearsal. Snapshot restoration was correctly skipped for cutover; dry-run created no rollback snapshot.

The downloaded `launch-state` artifact contains the redacted JSON summary, command log, review and Markdown summary with all four manual follow-up links. It expires on 2027-01-13 after 90 days. Local evidence: `.codex-artifacts/launch-actions/dry-run-38791442409/`. Future real cutover snapshots are preserved even on failure; rollback/finalize restoration from failed cutovers was verified with isolated contract tests.

Focused validation passed: both `pages-workflow-contract.test.ts` and `launch-workflow-contract.test.ts` (12 tests), Prettier on the changed files, and `pnpm openspec -- validate launch-switch-day --type change --strict`. Actionlint was not installed. Whole-tree validation and product browser/provider suites were excluded by the task's focused-check instruction; this tooling change does not establish shopper or release acceptance.

No real cutover, rollback, finalize, PRD promotion or provider configuration change was performed. Switch-day tasks remain open. Finalize needs a refreshed live Stripe review: the saved review expires at `2026-10-16T16:13:10Z`. The schedule's removal is recorded in task 2.1.
