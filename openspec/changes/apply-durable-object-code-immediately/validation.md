# Validation

## Cause (observed)

- `wrangler-dist/cli.js` in wrangler 4.141.0 sets `DEFAULT_DURABLE_OBJECTS_CODE_UPDATE_STRATEGY = { mode: "deferred", max_delay: 300 }`.
  - `resolveDurableObjectsCodeUpdateStrategy` sends that default on every `wrangler deploy` and `wrangler versions deploy`, unless the flag or `durable_objects.code_update_strategy` sets a strategy.
- The wrangler 4.141.0 release notes say deferred updates wait for an active object to hibernate, and that `immediate` updates without waiting.
- The lag probe in `2026-10-07-fast-release-path/validation.md` measured the store object switching about 5 minutes after the entry, on both UAT and PRD.

## Local evidence

- **Local UAT builds** of the backend (`build:cms --env uat`) and the renderer (`build-public-release.mjs uat`). Both generated `server/wrangler.json` files contain `"code_update_strategy":{"mode":"immediate"}`.
- **Dry runs:** `wrangler deploy --dry-run --config <generated>` exits 0 for both, with no warning.
- **PRD path:** `wrangler versions deploy`, the PRD backend path, reads `config.durable_objects.code_update_strategy` from `--config` (wrangler source).
- **Tests:**
  - `node --test scripts/release-candidate.test.mjs`: 12/12, including the store-object identity rejection.
  - The new config test in `apps/backend/test/scripts/public-build-config.test.ts` passes.
- **Restart safety:**
  - The store object uses no Durable Object storage.
  - The CMS object arms its publication alarm before each pass (`cms-worker.ts`, `processPublications`), so a pass interrupted by the restart resumes on the next alarm.

## Unverified

- No hosted run has used this change yet; tasks 1.4 and 1.5 stay open until the next push and promotion.
- At the moment of a deploy, a request in flight in the CMS or renderer object can fail if it touches Durable Object storage.
