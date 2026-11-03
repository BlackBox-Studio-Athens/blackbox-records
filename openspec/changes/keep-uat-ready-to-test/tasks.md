## 1. Staging step

- [x] 1.1 Add `stageUatPublishRequiredDetails` (catalog numbers via the existing backfill with `skipUnknown`, condition New for records that require it, shared revision-reading helper) and its tests: stages for physical release and distro item, leaves digital-only alone, never replaces an existing value, idempotent, skips and reports an unknown slug, plan-only writes nothing. Verify with `pnpm test cms-runtime`.
- [x] 1.2 Add `--stage-publish-required` (UAT only, with `--apply`) to the catalog-schema script and run it in the `deploy-uat` migration step. Verify with the workflow contract test and `pnpm validate`.

## 2. Publication confirmation

- [ ] 2.1 Confirm UAT (and Local) publications through the renderer binding, keep PRD on the public origin, and bound confirmation retries to six attempts so a failing activated publication ends as failed and never blocks the queue. Verify with the new UAT and PRD cases in `runtime-publication.worker.test.ts` and `pnpm test cms-runtime`.

## 3. Documentation and release

- [x] 3.1 Update `apps/backend/cms-migrations/README.md` and `docs/catalog-promotion.md` with the UAT-only drafts exception and the Store-binding limitation. Verify with `pnpm agent:check`.
- [ ] 3.2 Release to UAT and read the deploy-uat log: the first run stages the missing details, a later run stages nothing, and the stuck UAT publications clear, and staff can publish Afterwise. Record the evidence in `validation.md`. Verify from the run log and the UAT Home page.
