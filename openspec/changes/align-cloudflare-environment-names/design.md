## Context

The product environment model is Local, UAT, and PRD, but Cloudflare-facing handles still use `sandbox` and `production`. The mismatch affects Wrangler env keys, Worker script names, workers.dev URLs, D1 names, generated catalog targets, workflow names, docs, validation output, and log instructions.

Cloudflare Worker secrets cannot be read back and D1 has no simple in-place rename command in Wrangler. Full alignment therefore needs repo changes plus provider-side create/copy/cutover steps. Old Workers and old D1 databases stay available until the new UAT/PRD targets are proven.

## Goals / Non-Goals

**Goals:**

- Make repo-owned Cloudflare/Wrangler names use `local`, `uat`, and `prd`.
- Keep `PRODUCT_ENVIRONMENT` values as `LOCAL`, `UAT`, and `PRD`.
- Align app-owned `stripeMode` profile values to `local` / `uat` / `prd`; keep Stripe test/live vocabulary only where code is checking Stripe's provider `livemode` behavior.
- Retain cheap legacy package-script aliases that point to new UAT/PRD targets.
- Document the external Cloudflare, GitHub Actions, and Stripe cutover steps without committing secrets or exported D1 data.

**Non-Goals:**

- Delete old Workers, old D1 databases, or old webhook endpoints.
- Retrieve, print, commit, or automatically copy Worker secrets.
- Change checkout policy, PRD-open behavior, stock logic, or Stripe payment semantics.

## Decisions

- Use lowercase `uat` and `prd` for Wrangler env keys, Worker runtime targets, desired catalog target values, CLI output, and workflow labels.
- Use lowercase `local`, `uat`, and `prd` for the app-owned backend `stripeModeSchema`; do not rename Stripe API `livemode` checks or test/live provider docs that describe Stripe itself.
- Rename Worker script names to `blackbox-records-backend-uat` and `blackbox-records-backend-prd`; use `blackbox-records-backend-local` for the base local/dev target.
- Create new D1 resources named `blackbox-records-commerce-uat` and `blackbox-records-commerce-prd`, then bind by their new IDs. Do not reuse old D1 IDs under new labels.
- Keep package aliases such as `deploy:backend:sandbox`, `deploy:backend:production`, D1 `:sandbox`, and D1 `:production`, but make them call `uat` / `prd` commands.
- Accept old `sandbox` / `production` CLI values only in compatibility parsers where already public; parse them to UAT/PRD and label them legacy.

## Risks / Trade-offs

- D1 copy drift during cutover -> export/import during a quiet window and verify row/readiness checks before switching frontend variables.
- Missing Worker secrets on new script names -> deploy new Workers before traffic cutover, then enter secrets with `wrangler secret put --env uat|prd` and verify runtime config.
- Stripe webhook endpoint mismatch -> update endpoint URLs after new Workers exist, then write the new signing secrets to matching Workers.
- Existing docs/scripts may still mention sandbox as provider shorthand -> validation must distinguish allowed provider terms from disallowed Cloudflare environment names.

## Migration Plan

1. Update repo config, scripts, generated artifacts, workflows, docs, tests, and validation to use `uat` / `prd`.
2. Create new D1 databases and copy data from old D1 resources into ignored local SQL exports.
3. Update `wrangler.jsonc` with the new D1 IDs and deploy renamed Workers.
4. Re-enter Worker secrets for the new script names, update GitHub Actions backend URL variables, and update Stripe webhook endpoints.
5. Run UAT smoke, PRD readiness, and Wrangler tail checks against the new targets.
6. Keep old Cloudflare resources until a later cleanup change explicitly removes them.
