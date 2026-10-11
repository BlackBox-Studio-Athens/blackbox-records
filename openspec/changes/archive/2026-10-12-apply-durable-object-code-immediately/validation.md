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

## Hosted result

- UAT release run 557 (`38162355126`, source `047c3ae4`): the Workers deployed by 18:11:15Z. `verify-worker uat`, which also requires the store object to report the candidate, started at 18:11:23Z and passed at 18:11:27Z, on its first attempt (the poll pauses 5 s between attempts).
- PRD promotion `38162915833`: the Worker deploy step finished at 18:15:49Z; `verify-worker prd` started at 18:15:58Z and passed at 18:16:09Z, on its first or second attempt.
- Before this change the store object switched about 5 minutes after the entry.

## Unverified

- At the moment of a deploy, a request in flight in the CMS or renderer object can fail if it touches Durable Object storage.
