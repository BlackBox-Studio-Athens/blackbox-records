## Source and repository checks

- Prepared in the explicitly authorized worktree `.claude/worktrees/github-actions-smoke-tests-b255bb` on branch `claude/github-actions-smoke-tests-b255bb`, from source SHA `5556f2beb8c7776d3467c3e40f01b572ed0e0031`; implementation is an uncommitted working-tree change.
- `pnpm openspec:guard --allow-worktree`: passed.
- `pnpm test backend-tooling`: 35 files, 185 tests passed (smoke core, static smoke, Resend smoke, Stripe sandbox smoke and provider-smoke workflow tests).
- `pnpm test:tooling`: 32 Vitest contract tests passed, including the new workflow toolchain and checkout policy test; 54 Node tests passed. The acceptance test's intentional failing fixture prints `ASSERTION_SENTINEL`.
- `pnpm environment:model:verify`: 13 checks OK.
- `pnpm renovate:validate`: passed.
- `pnpm agent:check`: passed.
- `pnpm openspec -- --allow-worktree validate harden-ci-smoke-workflows --type change --strict`: passed.
- All nine workflows parse as YAML. No workflow names `12.6.0` or `24.21.0`; every checkout sets `persist-credentials: false`. actionlint is not installed locally, so workflow expression linting is unverified.
- The fresh worktree lacked the ignored `.codex-artifacts/` directory, which the format-identity tooling test requires; it was created before running tooling tests.
- These notes and task boxes are written before the final `pnpm validate` run. Its summary path, fingerprints, mode, status and exit code are retained in ignored `.codex-artifacts/harden-ci-smoke-workflows/final-validation.json` so recording it does not change the tested tree.

## Hosted evidence used for the change

- Run 34611386558 (UAT provider smoke): `happy_path_paid` failed with `locator.click: Timeout 2000ms exceeded` on the store checkout button while the page showed "Calculating delivery and current prices…"; the concurrent `pay_what_you_want_paid` passed. This motivated using the page timeout for that click.
- Run 36266176320 (Release, `deploy-uat-static`): static smoke failed on a real hosted `402` console error; the console-error assertion is retained.

## Read-only UAT static smoke

Product Environment: UAT, read-only. Acceptance rows: boundaries/tooling/instructions. Shell/player, CMS, commerce and release rows do not apply: no product route, content or commerce behavior changed.

- The committed runner passed `public_routes` against UAT for comparison.
- The updated runner discovered `/artists/afterwise/`, `/releases/lotus/`, `/news/disintegration/` and `/store/disintegration-black-vinyl-lp/`. The first run failed `public_routes` once on `Permissions policy violation: compute-pressure is not allowed in this document.`; two further runs passed. The Afterwise page embeds a YouTube player and site code never requests Compute Pressure, so the shared console filter now ignores that message. Attribution to the YouTube frame is inferred; two replays did not reproduce the message.
- Final run on the finished smoke code: `pnpm smoke:uat-static -- --site-url https://blackbox-records-web-uat.pages.dev --scenario all` passed all three scenarios. Evidence: `.codex-artifacts/smoke/uat/uat-static/20260930132555/`. With `GITHUB_STEP_SUMMARY` set to a scratch file, the runner wrote the suite status, three scenario lines and the evidence directory.
- Resend and Stripe provider smokes were not run locally because they create UAT provider state; their job-summary wiring is covered by the shared helper test and type checks only.

## Review fixes

A Brooks PR review simplified the finished change: static-smoke summaries list issues as written instead of guessing when to prefix a route; page discovery works on plain path lists; job-summary truncation uses the shared default; and the proposal marks the removed workflow inputs, not page discovery, as breaking. After these edits `pnpm test backend-tooling` passed again (35 files, 185 tests), and a live `public_assets` run discovered pages and passed. Evidence: `.codex-artifacts/smoke/uat/uat-static/20260930134051/`.

## Remaining after merge

- The next Release run should show smoke summaries in `deploy-uat-static` and `smoke-uat`. Dispatch **UAT static smoke** once to confirm the reduced inputs.
- Digest pinning needs the pending "pin dependencies (actions/checkout, …)" Renovate branch approved from the Dependency Dashboard.
- UAT still shows the `About` label; publishing the `Who we are` label to UAT is a separate Content Publication.
