# Tasks

## 0. Restore PRD CMS backups (no code)

- [ ] 0.1 With the user's approval, read the PRD R2 backup usage and confirm headroom under the 10 GB Free tier.
- [ ] 0.2 Set the repository variable `CMS_BACKUP_MAX_BYTES` to `1073741824` and dispatch `cms-backup.yml` with `kind=daily`; confirm both environments are green.
- [ ] 0.3 Update `docs/cms-backup.md` (capture ceiling, 1 GiB and its review date).

## 1. Suites to push, deploy-only promotion

- [x] 1.1 OpenSpec bookkeeping: archive `shorten-validation-release-feedback` and `enforce-scoped-feedback-loop`, retarget tasks 2.1 and 3.2 of `decouple-release-gates-from-content`, and strictly validate this change.
- [x] 1.2 `pages.yml`: `accept-e2e` becomes `e2e` (push and `target=uat`, no `needs`, `pnpm build:web`, 2 shards) and `accept-staff-previews` becomes `staff-previews` (same `if`, `validate:editor` or `build:staff` plus browsers); `uat-release` needs both.
- [x] 1.3 `pages.yml`: `accept-uat-static` becomes `uat-static-smoke` (`needs: uat-release`, push); delete `accept-uat-providers`; keep `accept-uat-identity`; `deploy-prd` needs only it and checks out `inputs.artifact_commit_sha`.
- [x] 1.4 `uat-smoke.yml`: move to its own concurrency group; report insufficient online stock as a precondition. Update the `uat-release-sequence.yml` header comment.
- [x] 1.5 `scripts/release-candidate.mjs`: run the UAT re-check only for `verify`; keep the checkout-disabled assert for every PRD command; extend its test.
- [x] 1.6 Replace `scripts/pages-workflow-contract.test.ts` with about 20 lines of shape-free invariants; fix or delete only the assertions about removed jobs in `apps/backend/test/scripts/{catalog-promotion-workflows,uat-sandbox-smoke-workflow}.test.ts` and `scripts/verify-environment-model.ts`.
- [x] 1.7 Docs: `agent-workflow` (Shell/player, Staff/editor, Release rows), `agent-reference`, `environment-model`, `catalog-promotion`, `validation-feedback`, `stripe-sandbox-uat` (manual, at least 2 online stock), `cloudflare-free-tier` (static smoke budget), `feedback-policy.json`, `README.md`; run `pnpm agent:check`.
- [ ] 1.8 With the user's approval, push; record the push-run timings (`e2e` x2, `staff-previews`, `uat-release`, `uat-static-smoke` green) and one `target=prd` dispatch of about 4 minutes with no `accept-*` suites.

## 2. Delete dead machinery (no build-shape change)

- [ ] 2.1 Content publication path: `content-publication.yml`, prepare/acknowledge/report/build-snapshot/stage scripts, `publication-dispatch.ts`, journal workflow functions, write branches of `publication-routes.ts`, `CONTENT_PUBLICATION_MODE` guards; keep GET routes and `processRuntimePublication`.
- [ ] 2.2 Catalog and cutover: `catalog-prd-plan` and `catalog-prd` jobs, cutover inputs and their scripts and test; keep `backfill-runtime-catalog.ts`; record the live-confirmation requirement in `migrate-stripe-to-blackboxrecords` tasks 4.2 and 4.3.
- [ ] 2.3 Smoke and duplicates: `uat-static-smoke.yml`, `smoke-stripe-promotion.ts` and its test, the `smoke:stripe-sandbox` alias, `release-candidate.mjs pack` and its helpers.
- [ ] 2.4 Measurement tooling: `ci-speed-measurement.mjs`, `benchmark-validation.mjs`, their scripts and docs; retarget the guard test fixtures.
- [ ] 2.5 Add spec deltas (static-site-and-deployment timed jobs and `audit:unused` gate, content-publishing, catalog-promotion-automation) and strictly validate.

## 3. HOST-11: fail-closed, content-free builds, simple promotion

- [ ] 3.1 With the user's approval, read R2 `snapshots/{uat,prd}/current.json` and the D1 and Stripe `/assets/catalog/` image URLs.
- [ ] 3.2 Product prerequisites: prerender `robots.txt`, import the 3 mockup images, fix the email preview URL, serve `/assets/catalog/*` from R2 through the gateway.
- [ ] 3.3 One content-free `build-uat` job; delete `prepare-prd`, `assemble-candidate`, `inspect-uat-pages`, content restore, media and Astro caches, the 6 CMS secrets, 7-day retention, `release-tools` and the `target=uat` path; add the read-only Pages credential check and `migrate-cms.mjs --apply`.
- [ ] 3.4 New `promote-prd.yml` (no inputs, `main` guard, UAT identity, PRD build, checks, deploy, `verify-hosted prd`); shrink `release-candidate.mjs` to about 150 lines; delete restore and capture scripts and export routes.
- [ ] 3.5 Add spec deltas (software-release-promotion bundle and rollback scenario, static-site-and-deployment fail-closed, content-publishing, cloudflare-free-tier-cache-policy, tooling-validation fixture snapshot) and update `docs/environment-model.md`.
- [ ] 3.6 Operator step: set Pages "Fail closed" on both projects and read it back; verify the push run, asset URLs and a `promote-prd.yml` run of about 4 minutes.
- [ ] 3.7 Re-check UAT only in the first PRD `verify` once locks split, so a UAT push cannot fail promotion between the Worker deploy and the Pages deploy.

## 4. Hosted cleanup and close-out

- [ ] 4.1 With the user's approval, delete the unused export secrets and variables, the `publication-media-v1` and `astro-assets-v1` caches, the unused `github-pages` environment and the Worker `CMS_PUBLICATION_GITHUB_TOKEN`; keep the repo `CLOUDFLARE_API_TOKEN`.
- [ ] 4.2 Optional native settings: deployment-branch policy `main` on `catalog-promotion-{uat,prd}`; a required reviewer on `catalog-promotion-prd` if a human gate is wanted.
- [ ] 4.3 Write `validation.md` (SHA, fingerprint, summary path, push and promotion run ids), run strict validation, then archive this change and `decouple-release-gates-from-content`.
- [ ] 4.4 Replace the `docs/validation-feedback.md` targets with the measured timings.
