## Context

The release pipeline accumulated gates that fail for reasons unrelated to the change being released (see the proposal). The goal is a pipeline where a green push run is the acceptance evidence and promotion only moves that candidate to PRD.

## Decisions

The user decided on 2026-10-06:

1. **PRD:** keep a separate `workflow_dispatch`, but make it deploy-only, about 3 to 4 minutes.
2. **Browser suites:** the whole e2e suite and the staff previews run on push, in parallel, and block the UAT deploy.
3. **Provider smoke:** it leaves the release; one manual workflow stays.
4. **HOST-11:** Pages goes fail-closed. Builds stop restoring CMS content, media and secrets. (Phase 3.)

Defaults chosen unless the user says otherwise:

- **Routine rollback:** revert and push forward.
- **Emergency rollback:** a paired rollback of the renderer Worker version and the Pages deployment from the same run. The CMS Worker rolls back only when no migration ran in between, and never across a migration. Rolling back only Pages or only a Worker mismatches renderer HTML and `/_astro/*` chunks.
- **The 7-day rebuild path** (`target=uat` rebuild, `RELEASE_TOOLS_DIR`) is deleted in Phase 3.

## Phase ordering

0. **Backups first.** Independent of the pipeline, and PRD has no recovery point after `2026-10-01-daily`.
1. **Move suites and make promotion deploy-only.** The largest measured gain for the least change, and it keeps the existing build shape. Rollback is a revert.
2. **Delete dead machinery.** Done before Phase 3 so the HOST-11 rewrite touches less YAML. No build-shape change.
3. **HOST-11 and the simple promotion workflow.** Riskiest, so it comes after the suites are on push and the pipeline is smaller.
4. **Hosted cleanup.** Last, because deleting secrets and caches is not reversible by a revert.

## Invariants kept

- The Worker deploys before Pages, so renderer HTML never references chunks Pages lacks.
- D1 and EmDash migrations run before the deploy that needs them.
- The shared non-cancelling release lock covers every hosted mutation. `uat-smoke.yml` moves to its own concurrency group so a manual dispatch cannot cancel a pending push deploy.
- PRD credentials exist only in the promotion jobs (`catalog-promotion-prd`). `accept-uat-identity` stays in Phase 1 because it holds `immutable-main` before any candidate code runs with them.
- The holding page deployment is untouched.
- The checkout-disabled assertion stays for every PRD command until launch, which belongs to `production-go-live-readiness`.
- `validateRun` still requires the push run to have succeeded, so e2e, staff previews and static smoke on push gate promotion implicitly.

## Risks and ceilings

- **Push is about 2 to 3 minutes slower** because UAT now waits for e2e, which becomes the long pole. The measured shards ran 4.7 and 8.0 minutes because Firefox lands in shard 2. First lever: measure, then rebalance the shards (one per engine) before adding a third.
- **A red static smoke turns the run red after UAT deployed.** UAT keeps serving that candidate, and `validateRun` refuses the run for promotion.
- **The static smoke spends Free-tier requests on every push**, about 55 Worker requests and about 28 Durable Object requests per run, about 940 a day at the observed maximum of 17 pushes. `docs/cloudflare-free-tier.md` budgets it.
- **HOST-12 chunk drift** between the SSR and static builds stops being gated before deploy in Phase 3. The push-run static smoke catches it before PRD.
- **Staff previews now build staff in CI on push** from repository content. If the feedback guard does not admit `validate:editor` in CI, the job falls back to `build:staff` plus the existing browser run.
- **The provider smoke needs at least 2 online stock** of its items. A drained UAT stock is a precondition failure of the manual workflow, not a release failure.

## Expected timings

Estimates from job medians; each phase records the observed values with `gh run view --json jobs`.

| Flow                               | Today                                  | After              |
| ---------------------------------- | -------------------------------------- | ------------------ |
| Push, UAT live                     | about 8.6 m median                     | about 10 to 12 m   |
| Push, green including static smoke | about 8.6 m                            | about 11.5 to 13 m |
| Promotion (`target=prd`)           | 10 to 27 m, 2.6 dispatches per success | about 3.5 to 4.5 m |
| Clean push through PRD             | median 22 m; failure loops 1 to 2 h    | about 15 to 17 m   |
