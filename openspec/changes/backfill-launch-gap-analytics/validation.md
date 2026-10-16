# Launch-gap analytics evidence

## Capture and bounds

Captured read-only source evidence before derivation under `.codex-artifacts/analytics-backfill/2026-10-16T16-08-19-246Z/`. Every `*-query.json` is the exact submitted query/variables, each `*-response.json` preserves aggregate results, and `*-capture.json` records UTC request/capture times and HTTP status. Failed-provider envelopes omit actor/correlation identifiers. No client IPs, Ray IDs, full referrer URLs or credentials are retained in the evidence files.

- `launch-state/`: downloaded artifact 12039983335 from cutover run [38888410766](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38888410766). `snapshot.json` records TLS-complete `cutoverAt: 2026-10-16T10:38:08.022Z`. The timestamped run log (`cutover-log-excerpts.json`) places successful DNS switching at **10:38:02.2692619 UTC** and TLS/Home at 10:38:08.0222298. Use the earlier switch timestamp (rounded down to milliseconds), not dispatch at 10:37:06 or snapshot preparation at 10:37:58. The later browser image fallback check failed after the site was live.
- Beacon promotion [38899422065](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38899422065) succeeded and completed at 12:18:54 UTC.
- `rum-all-*`: apex RUM groups by `datetimeMinute`, from cutover through 13:00 UTC, all bot values. First minute: **12:19 UTC**, 2 page loads / 1 visit. `rum-*` uses `bot: 0`; its first minute is 12:27 UTC. Use the earlier all-bot minute for the conservative boundary.
- Final gap is **[2026-10-16T10:38:02.269Z, 2026-10-16T12:19:00Z)**. The complete 12:19 minute and everything later belong exclusively to normal RUM. The holding-page period is excluded; exact DNS propagation is not observable from aggregate logs.
- `access-*`: the existing `.env.launch` token is denied zone analytics permission. No new token, scope or setting was requested. Chrome BlackBox dashboard required sign-in with terms acceptance; no sign-in submission was made. The documented GraphQL Explorer redirected to the public analytics product page.
- `schema-*`: schema field names only, no traffic identifiers. Account HTTP aggregates support the required dimensions except referrer host, whose query returned an explicit field-access denial (`edge-account-*`).
- `edge-available-*`: initial successful account HTTP aggregate capture ending 12:27 UTC, preserved without being used for final totals.
- `edge-gap-*`: initial gap capture from the artifact's later TLS-complete timestamp, preserved for comparison.
- `edge-switch-*`: final account `httpRequestsAdaptiveGroups` query constrained by configured `zoneTag`, `clientRequestHTTPHost: blackboxrecordsathens.com`, the corrected gap bounds and limit 10000; group by minute, method, status, content type, path, country, device, user agent and request source, with `count`, `sum.visits` and `avg.sampleInterval`. Returned 3311 aggregate rows, below the cap. Cache hits are included. Source SHA-256: `6f1a6d377e2995837a293d9bb95a15520420cf5a81d5fa6000a203b921d6cbdd`. Compared with the TLS-complete capture, this adds exactly two Node launch-check GETs, both excluded; visitor totals remain identical.

## Derivation and exclusions

`derive.cjs` preserves the initial derivation; `derive-final.cjs` reuses that exact algorithm with the corrected DNS-switch capture and timestamp. It asserts request accounting, all supported breakdown totals and equality with the committed aggregate. Repeat with `node .codex-artifacts/analytics-backfill/2026-10-16T16-08-19-246Z/derive-final.cjs`; timestamped `derivation-final-*.json` files preserve the results. No source artifact is overwritten by derivation.

Use only eyeball GET/200/HTML public documents, excluding API, CDN/internal assets, media, file extensions and `/app-shell-overlay/`. Classify automation by user agent in the order below. Provider `sum.visits` uses the [documented direct/external-referrer definition](https://developers.cloudflare.com/analytics/graphql-api/migration-guides/graphql-api-analytics/). It therefore excludes same-site navigation/prefetch from visits without needing forbidden full referrer URLs. Preserve 50 page views as a conservative minimum alongside those 50 visits; do not invent RUM shell page views from the other 129 document requests.

Disjoint request exclusions, in processing order (counts are sampled estimates):

| Exclusion                                                | Requests |
| -------------------------------------------------------- | -------: |
| Non-eyeball (early hints / Worker fetch)                 |      201 |
| Non-GET                                                  |      105 |
| Non-200                                                  |      114 |
| Non-HTML                                                 |     2795 |
| Internal/asset paths                                     |       33 |
| Googlebot / InspectionTool / Read-Aloud                  |       20 |
| facebookexternalhit                                      |        8 |
| HeadlessChrome (includes headless launch/browser checks) |        6 |
| curl                                                     |        5 |
| node / undici (includes Node launch checks)              |        6 |
| Playwright-labelled UA                                   |        0 |
| GitHub Actions-labelled UA                               |        0 |
| Other bots (bingbot, BuiltWith, SkypeUriPreview)         |       62 |
| Same-site or unconfirmed page views                      |      129 |
| **Total excluded**                                       | **3484** |
| **Retained visits / conservative page views**            |   **50** |
| **Captured requests**                                    | **3534** |

UA exclusions apply after transport/path exclusions; labelled zeroes do not mean no such requests existed outside eligible documents. No additional deduction is made for browser-shaped owner traffic because it is indistinguishable from visitors. Automation disguising itself as ordinary browsers can remain.

Breakdowns (visits and conservative page views use the same values):

- Pages: `/` 42; `/store/` 2; `/artists/`, `/releases/`, `/services/`, `/artists/sidus/`, `/terms/`, `/news/disintegration/` 1 each.
- Countries: GR 32, US 8, GB 6, DE 2, IE 1, KR 1.
- Devices: mobile 36, desktop 14.
- Referrers: unavailable (`clientRefererHost` denied); add no referrer rows, including no fabricated direct/unknown row.

Adaptive sample intervals across the raw groups range from 1 to 10. Totals are estimates, not unique people or a recovered exact beacon history. Page views are deliberately a minimum; the missing interval's internal navigation cannot be reconstructed reliably.

## Verification and delivery

The focused analytics selection passed after fixing cache isolation in the new boundary tests. A subsequent invocation hit the existing Nx plugin startup timeout under concurrent load; retrying with `NX_PLUGIN_NO_TIMEOUTS=true` passed. All existing tests remain intact. The web build passed, including route/bundle/image checks. Strict OpenSpec validation passed. Graphify refreshed successfully (29270 nodes), with existing SQL-parser absence and one partial script extraction reported; CodeGraph verified the route/callers before edits.

Affected validation passed **35 tasks, 20 cached**, with matching source fingerprints in `.codex-artifacts/validation/2026-10-16T16-26-59-075Z-21096-dc7020/summary.json`, before the final bound/source-metadata correction. Final-tree validation is recorded separately below. Validation uses the same exported `pnpm validate` runner with only its formatting callback restricted to task-owned files; the default callback would format unrelated dirty files, forbidden by the brief. Checks, source identity, machine slots and guards are unchanged. The wrapper asserts byte-for-byte preservation of unrelated dirty files and saves a `validation-receipt-*.json`. An initial direct invocation failed at slot creation; the package-manager invocation succeeded. `pnpm validate --plan` also passed (selection only).

Changes are limited to the existing HTTP module, aggregate/test, Stats source documentation and this OpenSpec change. There is no staff UI, schema, D1, collection setting or provider-data mutation. Acceptance covers backend response/Access/cache behavior through Worker tests and release checks; player continuity, commerce/provider mutations and content publication are inapplicable. Manual live Stats remains unverified until browser access and the conditional release permit it.

Production promotion is blocked by the authoritative brief: pre-existing newsletter acceptance commit `59eb5884` lies in `ed2657c2..main`. This task did not author it. Do not dispatch promotion or change `LAUNCH_ACCEPT_RELEASE`. Capture final release/variable identities read-only before handoff. Live PRD Stats will not include this task's aggregate until a separately authorized release.

Final implementation-tree validation: **PASS, 35 tasks / 20 cached**, `mode: local`, source HEAD `59eb58849a595d36b742c2beead53524f04020e8` plus task changes and preserved concurrent work. Before/after fingerprint: `1ccdab81f5f69dcc41c4b09830e319808bc2f066cd9ee96c524bffc92e4250f9`. Summary: `.codex-artifacts/validation/2026-10-16T16-32-37-155Z-24756-f7adac/summary.json`. Byte-preservation receipt: `validation-receipt-1792168481944.json` in the capture directory. Final source reconciliation passed with 3534 requests, 3484 excluded and 50 retained; all supported breakdowns sum to 50. Documentation-only updates reuse unchanged code evidence and receive a final runner check before commit.

Read-only release checks at approximately 16:29 UTC: PRD `/release.json` reports full SHA `ed2657c209f95411eb43458e25d251ce82541d82` (release 605); GitHub `prd-launch` variable `LAUNCH_ACCEPT_RELEASE` matches that full SHA. Chrome BlackBox's saved owner account opened production Staff Stats through the existing Access sign-in without a new permission grant; the seven-day page loaded successfully. This is existing-release availability, not acceptance of an undeployed estimate.

## Committed source and hosted outcome

- Implementation commit **`6f0b1e77179b19778cf057d39a9f26f150c3df30`**, pushed to `main` after fetching and proving `origin/main` ancestry. The ten committed task files match their validated source; 18 unrelated dirty files were preserved byte-for-byte (`commit-source.json`).
- Final pre-commit documentation-tree runner check: **PASS, 35 tasks / 33 cached**, `mode: local`, summary `.codex-artifacts/validation/2026-10-16T16-35-23-195Z-45168-bffa24/summary.json`; matching before/after fingerprint `ab7db34b52d3aae538b8bb8cbdfc5d2e5637ad6f38c90ccf0168eeef0e4498cf`.
- Push workflow **[38933270852](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38933270852), attempt 2, SUCCESS**: lint, typecheck, tests, all four Chromium/Firefox shards, both staff previews, WebKit, UAT deployment, hosted identities and static smoke all passed.
- Attempt 1 failed because the Store Durable Object still identified `ed2657c2` while Pages served the candidate. A bounded manual OPTIONS/GET capabilities recheck at 16:46:16 UTC found both on the candidate, release 606 (`uat-capabilities-1792169176287.json`). Only the failed deployment job was rerun; no gate, source, setting or timeout was weakened.
- UAT `/release.json` independently confirms **release 606**, source `6f0b1e77179b19778cf057d39a9f26f150c3df30`, run `38933270852`. `release-acceptance.json` preserves final job/identity evidence and capture time.
- A fresh `rum-boundary-*` query from the corrected DNS-switch start confirms the first apex RUM minute remains 12:19 UTC. Final source reconciliation still passes with 50 visits and 50 conservative page views.
- Production promotion was **not dispatched**. Condition 1 (successful push and matching UAT) holds; condition 2 fails because foreign newsletter evidence commit `59eb58849a595d36b742c2beead53524f04020e8` is between baseline `ed2657c2` and `origin/main`. The 17 October 06:00 UTC cutoff has not elapsed, but cannot override that failed condition.
- Final PRD `/release.json`, apex `X-Release-SHA` and `prd-launch.LAUNCH_ACCEPT_RELEASE` all remain **`ed2657c209f95411eb43458e25d251ce82541d82`**. No finalize, rollback, DNS, Stripe, token or analytics setting operation occurred.
- The signed-in BlackBox Chrome successfully loaded both production Stats ranges. At their reads, each showed 68 visits on 16 October (7d total 68; 30d total 78). These existing-release figures preserve the earlier history, including ten older visits; the backfill is intentionally absent until separately authorized production release. Live acceptance of the added estimate remains unverified.

The following evidence-only commit records this completed outcome without changing the UAT candidate. It receives the same scoped-formatting validation runner and strict OpenSpec check before push; its final receipt stays in the ignored capture directory to avoid self-referential evidence changes.

## PRD release — 2026-10-16

The owner authorized the release after the docs-only blocker `59eb5884` was reviewed. [Promotion 38941551219](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38941551219) succeeded; the apex Home, `/releases/`, `/releases/lotus/` and `/store/` return 200 with `X-Release-SHA` `6f0b1e77179b19778cf057d39a9f26f150c3df30`. `prd-launch.LAUNCH_ACCEPT_RELEASE` is that SHA. Production Staff Stats at 17:44 UTC report 123 visits on 16 October for both 7d and 30d, against 68 before the release: the 50-visit estimate plus later live visits. No other source or day changed.
