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

- Workers deploy before Pages; a short window remains where new renderer HTML references `/_astro` chunks the previous Pages deployment lacks (unchanged from before).
- D1 and EmDash migrations run before the deploy that needs them.
- Every hosted mutation holds a non-cancelling lock: `release-uat` for the UAT deploy, `release-prd` for promotion, and `blackbox-release` for the holding page alone, so none can cancel another's pending run. `uat-smoke.yml` keeps its own group.
- PRD credentials exist only in the promotion workflow (`catalog-promotion-prd`), and only on the steps that use them. `release-candidate.mjs resolve` runs from trusted `main` and proves immutable-main ancestry, the push run and its suites before any candidate code is checked out or installed.
- The holding page deployment is untouched.
- The checkout-disabled assertion stays in `verify prd`, which runs once before any PRD mutation, until launch, which belongs to `production-go-live-readiness`.
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
| Promotion (`promote-prd.yml`)      | 10 to 27 m, 2.6 dispatches per success | about 3.5 to 4.5 m |
| Clean push through PRD             | median 22 m; failure loops 1 to 2 h    | about 15 to 17 m   |

## Phase 3 decisions

- **One deploy job per environment.** The environment `CLOUDFLARE_API_TOKEN` (D1 write, Workers Scripts write, and Pages write added by the operator) deploys Workers and then Pages in one job, so the reusable `uat-release-sequence.yml` and the repository Pages credential leave the release. The repository-level token remains only for `prd-holding-page.yml`. A read-only Pages check is the deploy job's first step, so a credential with no Pages access fails before any migration; it does not prove Pages write, which stays an operator precondition (task 3.6).
- **Content-free builds, PRD rebuilt.** The renderer reads each environment's accepted snapshot from the R2 pointer at runtime (UAT generation 121 and PRD 216 exist), so no build restores CMS content, media or secrets and no bundle or content identity is retained. PRD is rebuilt from the SHA UAT serves, because the retained candidate never held tested bytes. The 7-day rebuild path, compact transport, `pack`/`assemble`/`materialize` and `release-tools` are deleted.
- **Promotion proves, then builds.** `promote-prd.yml` takes no inputs. `resolve` reads `release.json` from UAT, requires a successful push run of `pages.yml` on `main` for that SHA with `e2e (1)`, `e2e (2)`, `staff-previews` and `deploy-uat` passed, and checks ancestry, before checkout. The build is stamped with the candidate's run id and number so PRD reports UAT's identity and the monotonic order checks keep working. UAT is read once, so a later UAT push cannot fail promotion mid-flight.
- **Fail-closed without HTML.** The Pages upload is the renderer client assets, the gateway and a prerendered `robots.txt`; no route HTML ships. `configure-public-gateway.mjs` sets Pages `fail_open: false` on the project's production configuration and asserts it on every UAT deploy and PRD promotion, so no operator toggle exists.
- **`/assets/catalog/*` is deleted, not served from R2.** D1 projections hold no such URLs on UAT or PRD, so serving them from R2 would have been dead code. The three mockup images are bundled `/_astro` assets and the email preview uses a static Pages asset. Stripe products created in the cutover era may still carry the old URL; their images were not read and no scheduled path was found that repairs them (task 3.8).
- **Kept on purpose.** The Worker export routes and `CMS_PUBLICATION_EXPORT_TOKEN` (the GET catalog route and the manual export tool still have callers); `prd-holding-page.yml` and its `blackbox-release` lock; `release-uat` artifact retention of three days, so a failed push run can be rerun within that window.
- **Dropped checks.** `verify-environment-model.ts` no longer checks workflow shape, and the push-trigger narrowness assertion is gone; the contract test keeps only shape-free invariants. A brand-new empty Pages project needs one manual first deploy, because the `522/523` bootstrap branch is removed.
