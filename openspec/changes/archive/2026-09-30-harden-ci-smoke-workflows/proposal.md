## Why

The September release-speed work left the manual smoke workflows with dead `workflow_run` branches and unusable inputs, repeated toolchain versions across nine workflows, and one smoke timeout that flakes under concurrency. The UAT static smoke also asserts hardcoded content slugs and copy, so an ordinary content publication can fail the next Software Release without any code change.

## What Changes

- **BREAKING:** remove dead trigger logic from the manual `UAT provider smoke` and `UAT static smoke` workflows and drop the static smoke `headed`, `timeout_ms` and `evidence_dir` inputs; bound their runtime and evidence retention; read the UAT Worker URL from the existing repository variable.
- Read pnpm and Node versions from `package.json#packageManager` and `.node-version` in every workflow, so Renovate updates one source.
- Stop persisting the checkout token in workflows that never push.
- Keep Renovate's GitHub Actions group aligned with the actions actually used, and let workflow contract tests accept digest-pinned action references.
- Wait for the store checkout button with the page timeout instead of the Stripe field-action timeout.
- Report each hosted smoke suite's status, scenario results and evidence directory in the GitHub job summary.
- UAT static smoke discovers representative artist, release, news and Store Item pages from the deployed sitemap and Store listing, and asserts structure and UI copy instead of content titles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tooling-validation`: the shared smoke harness also reports hosted results in the job summary.
- `static-site-and-deployment`: UAT static smoke follows published content instead of fixed entries.

## Impact

`.github/workflows/*.yml`, `renovate.json`, `scripts/smoke-core.ts`, `scripts/smoke-uat-static.ts`, `scripts/smoke-resend-uat.ts`, `scripts/smoke-stripe-sandbox.ts`, workflow and smoke tests, `README.md` and `docs/validation-feedback.md`. No runtime, API, schema, dependency or release-gate change. Branch or pull-request CI remains out of scope by user decision.
