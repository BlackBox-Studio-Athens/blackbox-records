# Backend validation — 2026-10-13

Tasks **1.1–1.3 are complete**. Task **2.1 remains incomplete** under the owner's decision recorded in [owner-setup.md](owner-setup.md). Staff implementation and final UI/release acceptance remain in sections 3 and 4. This work does not edit `apps/staff`, push or release.

## Source and repository gates

The implementation started from clean, synchronized `main` at `34c4e05809b49c86583f904d4f9a8ce1d3477216`, after Prompt A's completed UAT 568 / PRD promotion 18 for `eeed383c799217b371545783558185e5e329720e`.

`pnpm validate` passed all **61 selected local tasks** for 47 affected projects and their dependencies. Its [implementation summary](../../../.codex-artifacts/validation/2026-10-13T13-47-48-951Z-45952-73636a/summary.json) records `mode: local`, `status: passed`, and identical before/after source identity:

- Source SHA: `34c4e05809b49c86583f904d4f9a8ce1d3477216` with the implementation working tree.
- Fingerprint: `f744d366ea4460ed8fda42afd75d034056ef4dc8dc57921df938d11f47bc9d9e`.
- Changed files: 23 at that checkpoint, before this handoff note and task checkboxes.

The final [completion receipt](../../../.codex-artifacts/store-search-setup/completion.json) records the subsequent final-tree validation summary, matching source fingerprints and local commit. It is the authoritative pointer after documentation and task-state updates. Successful code checks are reused only while their declared inputs remain unchanged.

- `pnpm test public-commerce-http`: **309 tests passed**, including 11 Store and 32 Search tests, plus the existing analytics and protected API coverage. [Focused output](../../../.codex-artifacts/store-search-setup/http-tests.log).
- `pnpm test apps/backend/test/scripts/runtime-config-verify.test.ts`: passed its affected backend tooling and workspace contract tasks. [Focused output](../../../.codex-artifacts/store-search-setup/runtime-config-tests.log).
- `pnpm generate:api`: passed; the internal OpenAPI document and generated client expose both schemas and operations.
- `pnpm openspec -- validate add-store-and-search-stats --type change --strict`: passed.
- Architecture and boundary checks passed through `pnpm validate`. Graphify was refreshed with local AST extraction after the code batch and import correction. Existing SQL-parser and `pages-workflow-contract.test.ts` parser limitations remain; actual D1 query plans are verified by workerd tests.

The first test iteration exposed a fixture's duplicate variant IDs and retained test rows, plus the expected internal path-list update. These were corrected without changing product definitions. Validation then caught a circular import introduced by the root orders export; direct internal imports removed it. The final passing summary above supersedes the failed iterations.

An optional `prisma:generate` attempt failed because the existing local Prisma CLI cannot resolve `@prisma/engines` (its installed package directory is empty). No dependency or lockfile was changed. The additive index introduces no generated client fields; the migration applies in workerd, query plans use it, and backend type checks pass. Required API generation succeeded.

## Observable acceptance

**Store:** both ranges use analytics' UTC start and exclusive `generatedAt` upper bound; the previous window spans the preceding 7 or 30 calendar days. Tests cover exact lower/upper boundaries, payments from older checkouts, all four statuses regardless of a later status change, null amounts, multiple lines and quantity sums, empty data, required/invalid ranges, discovery and rejected Access identities. The repository query plan uses the creation-date, `paidAt` and order-line indexes without a historical order-table scan. Reads make two parameterized aggregate queries through the orders module; no order, stock, checkout or provider mutation occurs.

**Search:** generated test keys establish JWT header/claims and verify the RS256 signature with WebCrypto. Native workerd Requests exercise OAuth and all three Search Analytics POSTs with manual redirects. Tests cover totals independent of top queries, click/impression ordering, newest returned data date, empty results, null position without impressions, missing/blank configuration before cache reads, one-hour snapshot caching without request identity, token reuse/expiry/credential rotation, cache failures, invalid ranges and Access rejection. Auth, HTTP, redirects, network failures, malformed/oversized bodies, invalid keys and streaming timeouts return the stable safe problem with a request ID. Responses and warning logs are checked for private-key, JSON, assertion, token and provider-body leakage.

**Configuration:** the two optional Google bindings are registered in runtime verification and forwarded through the existing commerce config. The runtime A → B → A regression verifies removed Google bindings do not remain in the object. PRD's committed site var survives future deployments; other environments remain blank. No real Google request or hosted write was made.

The selected acceptance rows are commerce reads, boundaries/tooling and runtime configuration, established locally with the real workerd/D1 test runtime and generated contracts. Shopper checkout/payment mutations, staff browser/design acceptance, CMS publication, provider acceptance and release acceptance are excluded from this backend scope. Local tests do not establish hosted Google authentication, live Orders/Stats parity or UAT/PRD behavior.

## Generated handoff

`@blackbox/api-client/internal` exports:

- `InternalApiComponents['schemas']['StoreStats']` and `InternalApiOperations['readStoreStats']`, for `GET /api/internal/store-stats` with required `range: '7d' | '30d'`.
- `InternalApiComponents['schemas']['SearchStats']` and `InternalApiOperations['readSearchStats']`, for `GET /api/internal/search-stats` with the same required range.

The response shapes match [design.md](design.md). Both return `no-store` with a per-request `X-Request-Id`; failures use the existing problem schema. Google setup is pending, so the real environment will return `not_configured` until an owner-approved setup supplies both bindings. The additive paid-date index must be applied by the ordinary migration step before a later authorized release.

## Staff Stats sections — 2026-10-13

The owner chose Option 2, Visits first, from `.codex-artifacts/design/staff-stats-store-search/index.html`.

**What changed:**

- `apps/staff/src/lib/backend/internal-analytics-api.ts` adds `readStoreStats` and `readSearchStats`. They share one read path with source-specific failure messages, and each rejects a 200 that is not its figures, such as an Access sign-in page.
- `createStatsWorkspace` is now generic over a reader. Stats keeps one instance each for visits, store and search, so each loads, keeps stale figures and retries on its own. A 401 or 403 from any of them shows Access required.
- The summary adds the store clause and the per-100-visits rate. Store opens the rail; Google search sits under the visits chart.
- The Store heading reuses the inlined shopping-bag icon, so Stock's shared chunks stay unchanged. The Stats eager budget rose 2 KiB to 128 KiB (129,971 Brotli bytes).

**Checks:**

- `pnpm test apps/staff/src/components/stats` and `pnpm test apps/staff/src/lib/backend/internal-analytics-api.test.ts` passed all seven affected staff projects. New cases cover:
  - the store clause and rate
  - the store comparison, including the new, same, none and no-order cases
  - search figures, the provisional latest day, and its not-set-up and empty states
  - a failing source next to working ones
  - visits failing while store and search still show
  - denial from any source
  - both client paths and their 200 rejection
- `pnpm build:staff` passed route isolation and the bundle budgets.

**Browser check.** playwright-cli (isolated headless Chromium) against the built staff output, with all three internal reads stubbed to contract-shaped responses:

- At 390 and 1280 px, the document height equals the viewport (only `main` scrolls) and there is no horizontal overflow.
- With store returning 503 and search `not_configured`, Store shows its message, `Reference: req_store_1` and Retry; search reads "Search figures aren't available here yet."; visits stay intact.
- The only console 404 is the shell's `/_emdash/api/blackbox/workspace` change count, which a static preview cannot serve.

Screenshots: `.codex-artifacts/design/staff-stats-store-search/final/stats-ok-1280.png`, `stats-ok-390.png`, `stats-degraded-1280.png`.

## UAT and PRD release acceptance — 2026-10-13

Task **4.2 is complete for the current PRD data**. The owner authorized this main push, UAT release, PRD promotion and evidence push only. This was a software release, with no launch script, DNS, Holding Page, catalog, checkout-switch, content publication or Stripe changes. Google access remains pending owner task **2.1**; its absent credentials secret is expected.

### Source and release gates

- Released source: `60447078b2f58364926eade31d1cb87475973f80`, containing backend commit `6dbc883648c88aa0e569c290b1a474f71e4ed76a` and the Staff Stats commit. The working tree was clean before the push. `pnpm build:web` passed before pushing, including route isolation and bundle budgets.
- [Release BlackBox run 569](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38419976034), ID `38419976034`, attempt 1: **all 12 jobs passed**. This includes lint, typecheck, tests, the content-free UAT build, four public e2e shards, WebKit, both Chromium/Firefox staff previews, and `deploy-uat` with identity verification and static smoke. No gate was weakened or waived; no repair or rerun was needed.
- After that run succeeded, `gh workflow run promote-prd.yml` dispatched [PRD promotion 19](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38421260379), ID `38421260379`, attempt 1: **passed**. It rebuilt the successful UAT source and verified both Worker and hosted PRD identities.
- A subsequent read of PRD `release.json` returned SHA `60447078b2f58364926eade31d1cb87475973f80`, `runId: 38419976034`, `runNumber: 569`, and runtime publication mode. The promotion log records matching `verify-worker` and `verify-hosted` results at 15:22:48 and 15:22:51 UTC.

### Migration and binding evidence

`deploy-uat` applied `0034_checkout_order_paid_at_index.sql` successfully at **15:16:57 UTC**. The PRD promotion applied the same migration successfully at **15:21:57 UTC**. An independent read-only PRD migration-history list confirmed its `applied_at` as `2026-10-13 15:21:57`:

```sql
SELECT name, applied_at FROM d1_migrations ORDER BY id DESC LIMIT 3
```

The remote D1 result reported `success: true`, three rows read, zero rows written, zero changes and `changed_db: false`. No separate migration apply was run locally against a hosted environment.

The owner's signed-in BlackBox Chrome profile supplied a before/after PRD Worker settings comparison. All pre-existing variable values and encrypted-secret entries were preserved; no secret value was opened or printed. Names-only evidence confirms:

- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG` remain present as variables.
- `CLOUDFLARE_ANALYTICS_API_TOKEN` remains present as an encrypted secret.
- `GOOGLE_SEARCH_CONSOLE_SITE` is newly present and nonempty after this deployment.
- `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` remains absent, as expected pending owner task 2.1.
- The six resource bindings and their targets are unchanged: `CMS_DB`, `CMS_RUNTIME`, `COMMERCE_DB`, `COMMERCE_RUNTIME`, `MEDIA`, and `PUBLIC_SITE`. The pre-existing checkout and launch variable values were also preserved without edits.

### Signed-in browser acceptance

PRD `https://staff.blackboxrecordsathens.com/stats/` was checked in the owner's BlackBox Chrome profile with both range controls. Visits rendered **17 visits** in each range, with the daily chart and supporting sections intact. Search displayed **“Search figures aren't available here yet.”** without an error. The normal page requests for analytics, Store and Search returned HTTP 200; the inspected Search response was `not_configured`.

The Orders page showed a complete list of **four orders**, all **Not paid**. Its normal search response had `nextCursor: null` and every order's `paidAt` was null. Inspecting the page's own received responses established the exact Store windows without copying customer details:

| Range | UTC start, inclusive       | UTC end, exclusive (`generatedAt`) | Orders / Stats paid orders | Orders / Stats paid total | Orders / Stats items sold |
| ----- | -------------------------- | ---------------------------------- | -------------------------- | ------------------------- | ------------------------- |
| 7d    | `2026-10-07T00:00:00.000Z` | `2026-10-13T15:26:08.197Z`         | 0 / 0                      | €0 / €0                   | 0 / 0                     |
| 30d   | `2026-09-14T00:00:00.000Z` | `2026-10-13T15:25:25.978Z`         | 0 / 0                      | €0 / €0                   | 0 / 0                     |

Both comparisons passed; Stats also reported four checkouts started in each window. **Limitation:** PRD has no paid order, so nonzero paid-order totals and quantities remain unverified against live PRD orders. No fixture, payment or order mutation was made to manufacture acceptance. The prior workerd tests cover those nonzero cases; UAT's separate data rendered five paid orders, €828.01 and 36 items during this check.

Only the Stats workspace scrolled in both PRD ranges. At the owner's 983 px viewport height, document height stayed 983 px with document scroll position 0 and header top 0. The 867 px `main` had 1523 px of content and its scroll position changed under keyboard scrolling (to approximately 28 px during the 30d smooth scroll and 656 px at the end of the 7d scroll). Neither range had horizontal document overflow.

UAT `https://staff-uat.blackboxrecordsathens.com/stats/` opened through the existing Access session, with the UAT marker. Search displayed the same not-set-up message without an error. UAT Visits appropriately remained unconfigured; UAT Store read its own test data independently. This does not establish Google API/provider acceptance, which still requires owner task 2.1.

Evidence is retained under `.codex-artifacts/store-search-release-20261013/`: `push-run.json`, `uat-deploy.log`, `prd-run.json`, `prd-deploy.log`, `prd-release.json`, `prd-migrations.json`, `bindings.json`, `store-comparison.json`, `scroll.json`, PRD 7d/30d text and screenshots, and UAT text and screenshot. The browser check reused the owner's existing sign-in and ordinary page reads; additional infrastructure checks were one bounded read-only D1 history query and one PRD release-identity GET. Temporary acceptance tabs were closed, and the owner's PRD Stats tab was left open.

### Evidence-note validation

Strict change validation and `pnpm validate` passed for the evidence and task-state edits: **10 selected tasks**, `mode: local`, `status: passed`, with matching before/after source fingerprints. The final source-bound summary, fingerprint and documentation commit are recorded in `.codex-artifacts/store-search-release-20261013/completion.json`. The released application source remains the SHA above; the subsequent Markdown-only push is excluded from the deployment workflow by its existing path filters.
