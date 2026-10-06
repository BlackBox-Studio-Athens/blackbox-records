# Validation

## Source and local validation

- Source SHA: `abba4b586213bf8391c666abf677d689709eb23f` (`abba4b58`). The final commit adds only the 2026-10-07 close-out documents and the assertion-only `scripts/configure-public-gateway.mjs`; every other change in this proposal is already committed and was exercised by the hosted runs below.
- `pnpm validate` (`NX_PLUGIN_NO_TIMEOUTS=true`) on that tree: status `passed`, exit code 0, `mode: local`, scope all, 65.1 s. The source fingerprint matched before and after (`e1b81588ed93fb9c119d77eb31a184445028fd0c857c2c9a86311780ec808373`, 13 changed files). Summary: `.codex-artifacts/validation/2026-10-06T21-53-22-994Z-57392-390808/summary.json`. It proves repository gates only.
- `pnpm openspec -- validate simplify-software-release --type change --strict` passed before archiving, and `pnpm agent:check` passed.
- The final `pnpm validate` after archiving repeats the gates on the same code sources. Its summary pointer stays in the ignored `.codex-artifacts/validation/` folder.

## Product Environments and acceptance rows

- Product Environments: UAT and PRD for the hosted release evidence; Local for repository gates. Neither environment's shopper checkout or catalog data changed beyond the UAT Stripe image re-sync below.
- Acceptance rows used: Release/environment, and Boundaries/tooling/instructions. The Shell/player and Staff/editor browser suites ran in CI as the push runs' `e2e` and `staff-previews` jobs, not locally. CMS/schema/publication and Commerce/checkout/stock rows do not apply: the change removes unreachable publication write paths and the `/assets/catalog/*` alias and adds no shopper, staff or commerce behavior. The manual provider smoke was not run, because it is no longer a release gate.

## Hosted evidence

All measured in 2026-10 on the real UAT and PRD environments.

- Phase 0, backups: `cms-backup.yml` run `37505027251` succeeded after the repository variable `CMS_BACKUP_MAX_BYTES` became `2147483648`: UAT 589 objects (435,185,794 bytes) and PRD 1,191 objects (565,083,844 bytes), after one rerun of a transient R2 500.
- Phases 1 and 2: push run `37513822310` was green in 12.9 min (`e2e` 4.0 and 6.4 min, `staff-previews` 6.8 min, `deploy-uat` 1.9 min, `uat-static-smoke` 1.4 min). PRD promotion `37515574849` failed on attempt 1 at Worker propagation and passed on attempt 2; PRD served `bd1f08ce`.
- Phase 3, first release: push run `37520704917` (`9d340dfc`); `deploy-uat` failed once on Durable Object identity lag (task 3.9) and passed on rerun in about 2.4 min. `promote-prd.yml` run `37522954116` failed once the same way and passed on rerun in 2.2 min (build 33 s, migrations 23 s, Workers 23 s, Pages 10 s). PRD served `9d340dfc`.
- Push run `37531332465` passed on its first try in 9.2 min (`deploy-uat` 2.5 min; `e2e` shards 4.9 and 6.5 min, `staff-previews` 6.2 min). PRD promotion `37532534786` passed on rerun in 2.1 min of job time after a 3 to 6 minute Worker propagation lag; PRD served `106205d6`. The Worker wait is now about 10 minutes.
- Fail-closed: push run `37534311548` (`abba4b58`) failed `deploy-uat` attempt 1 because the Cloudflare API rejected `fail_open` in a project PATCH (HTTP 400). The user then set Fail closed in the dashboard on `blackbox-records-web-uat` and `blackbox-records-web`; a Pages API read-back shows `fail_open: false` on production and preview of both. `deploy-uat` passed on rerun and logged `UAT Pages renderer binding and fail-closed mode verified.`; promotion `37536031988` passed on its first try in 2.0 min of job time (build 25 s, migrations 23 s, Workers 21 s, Pages 8 s), logged `PRD Pages renderer binding and fail-closed mode verified.`, and PRD serves `abba4b58`.
- Renderer snapshot pointers (measured 2026-10-06): UAT generation 121 and PRD generation 216, so builds need no bundled bootstrap.
- Cleanup (task 4.1): the unused export secrets and variables, 17 build caches (about 1.6 GB) and the `github-pages` environment are deleted, and `CMS_PUBLICATION_GITHUB_TOKEN` is deleted on both `blackbox-records-backend-uat` and `blackbox-records-backend-prd`. The UAT Stripe re-sync updated 101 products from the D1 runtime projection with post-apply drift 0; all 101 published UAT products use `/media/` images (HTTP 200).
- No request IDs are recorded: the evidence is workflow run ids, job timings, the logged verification lines and the release identity each environment serves.

## Unverified and left open

- PRD live Stripe product images were not read (no local live credential). This is launch-blocking in `production-go-live-readiness` task 4.3a; `migrate-stripe-to-blackboxrecords` tasks 2.1 and 4.2 carry the tooling fix (`createContentAssetUrl` and `backfill-runtime-catalog.ts` still emit `/assets/catalog/` URLs) and the PRD apply, which needs the launch one-run workflow.
- The assertion-only gateway script has not run in a hosted run. The runs above used the committed script, which found the dashboard setting already in place. Its first UAT deploy and PRD promotion happen on the next push.
- 129 other active UAT sandbox products (not published D1 items, unused by checkout) still carry old image URLs and are left as sandbox leftovers.
- User-owned, not done: deleting the R2 bucket and D1 database `blackbox-cms-recovery-uat-20260915`, because it permanently deletes data. Task 4.2's optional environment protections were declined.
- Browser and visual acceptance were not repeated for this change; local validation alone does not establish them. `decouple-release-gates-from-content` stays open for its task 2.1.
