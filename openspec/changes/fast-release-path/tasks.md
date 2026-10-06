# Tasks

## 1. Worker identity from the entry, Pages before the checks

- [x] 1.1 `apps/backend/src/cms-worker.ts`: answer `OPTIONS /api/*` (excluding `/api/internal/*`) at the entry with the preflight-only HTTP app, and cover it with a worker test.
- [x] 1.2 `scripts/release-candidate.mjs`: set the poll budget to 24 x 5 s, correct the identity comment, and read `/` with a cache-bypassing query in `verify-hosted`. Update `scripts/release-candidate.test.mjs`.
- [x] 1.3 `pages.yml` and `promote-prd.yml`: deploy the Workers, then the gateway and Pages, then run `verify-worker`, listing readiness and `verify-hosted`.
- [x] 1.4 Delete the `deploy:prd` script from `apps/backend/package.json` and the root `deploy:backend:prd` and `deploy:backend:production` scripts that call it.
- [ ] 1.5 Push and promote once. Record the job timings and how long the entry and the commerce Durable Object take to serve the new SHA.

## 2. UAT waits for the checks and the build; promotion needs every suite

- [x] 2.1 `scripts/validate.mjs`: add check part `typecheck` (`tests` runs only `test`) and `--browser` for `--editor`, with tests.
- [x] 2.2 `pages.yml`: check parts `[lint, typecheck, tests]`, end-to-end shards 1-4, staff previews per browser, and `deploy-uat` needs only the checks and the build.
- [x] 2.3 `scripts/release-candidate.mjs` `validateSuites` and its test: the new job names.
- [x] 2.4 Docs and wording: `docs/validation-feedback.md`, `docs/catalog-promotion.md`, `docs/environment-model.md`, `README.md`, `docs/agent-workflow.md`, `feedback-policy.json`. Run `pnpm agent:check`.
- [ ] 2.5 Push and promote once. Record push → UAT live, push → green and dispatch → PRD done against the targets (UAT at most 5 to 7 minutes, PRD at most 3 to 5 minutes).

## 3. Close-out

- [ ] 3.1 Write `validation.md`, validate strictly and archive the change.
