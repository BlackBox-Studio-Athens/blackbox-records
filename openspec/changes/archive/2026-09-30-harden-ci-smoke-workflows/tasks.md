## 1. Workflow hygiene

- [x] 1.1 Remove dead event-name branches from `uat-smoke.yml`, read `UAT_WORKER_URL` from `vars.UAT_PUBLIC_BACKEND_BASE_URL`, add a 30-minute job timeout and 7-day evidence retention; verify with the provider-smoke workflow test and `pnpm environment:model:verify`.
- [x] 1.2 Reduce `uat-static-smoke.yml` inputs to site URL, scenario and screenshots with a ref-scoped concurrency group, one evidence path and 7-day retention; verify the YAML parses and every remaining input reaches the runner.
- [x] 1.3 Read pnpm from `packageManager` and Node from `.node-version` in all workflows, add `persist-credentials: false` to every checkout, and give `renovate-config.yml` a 10-minute timeout; verify no workflow still names `12.6.0` or `24.21.0` and the workflow contract tests pass.
- [x] 1.4 Align the Renovate GitHub Actions group with used actions and let workflow tests accept digest-pinned references; verify `pnpm renovate:validate` and the contract tests.

## 2. Smoke runners

- [x] 2.1 Use the page timeout for the store checkout button click in the Stripe sandbox smoke; verify its focused tests still pass and record failing run 34611386558 in validation.md.
- [x] 2.2 Add the shared job-summary helper and call it from the static, Resend and Stripe sandbox runners, including the Stripe blocker path; verify with smoke-core tests for summary and no-op behavior.
- [x] 2.3 Discover representative artist, release, news and Store Item pages from the deployed sitemap and Store listing, and remove fixed slugs, content titles and the CMS-owned About label from assertions; verify with discovery unit tests and a read-only run against UAT.

## 3. Documentation and acceptance

- [x] 3.1 Update the README static smoke section and the hosted feedback section of `docs/validation-feedback.md`; verify with `pnpm agent:check`.
- [x] 3.2 Run `pnpm validate` on the final tree and `pnpm openspec -- validate harden-ci-smoke-workflows --type change --strict`; record commands, source fingerprint and results in validation.md.
