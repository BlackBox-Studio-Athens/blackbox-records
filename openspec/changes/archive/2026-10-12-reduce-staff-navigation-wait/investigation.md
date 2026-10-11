# Deep investigation — 2026-09-22

## Conclusion and confidence

Several removable causes of waiting are now demonstrated. The evidence does **not** establish that these changes alone will remove every hosted outlier. An absolute performance guarantee would be unsupported before implementation and a measured candidate. Acceptance combines deterministic checks for the proven causes with a separate hosted result.

| Finding                                                  | Evidence                                                                                   | Decision                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Stock waits 300 ms before its first inventory read       | Deployed source, three PRD timelines, local timer instrumentation and a timer-only control | Start initial/filter/page reads immediately; debounce only typing                |
| Closed editor CSS blocks browse startup                  | PRD captures, built HTML and local stylesheet-delay experiment                             | Defer feature CSS as well as JavaScript                                          |
| Overview pays for unused enrichment                      | Unchanged readers executed with synthetic I/O: 43 or 58 SQL calls for an empty result      | Use the existing exported content repository for an explicit Overview projection |
| Overview initial load and focus refresh overlap          | Delayed-response browser test produced six API calls instead of three                      | Coalesce at each resource read, retaining independent panels                     |
| A settled empty Overview becomes a first-load spinner    | Controlled empty-response/focus test                                                       | Track settled state separately from array length                                 |
| Fewer statements or binding calls are possible           | Local grouped-read equality and unchanged native coalescing-driver probe                   | Keep as conditional follow-up; 27 is not a minimum                               |
| Catalog/Stock sorting has index opportunities            | Read-only local schema inspection and actual query plans                                   | Benchmark only if SQL cost remains material                                      |
| Intermittent hosted HTML/asset waits remain unattributed | Slow PRD visits and fast controls; no application-stage timings                            | Keep attribution open; no speculative infrastructure change                      |

The user removed the country-specific acceptance requirement on 2026-09-22. Network conditions remain evidence; connection country is not a pass/fail gate. The main staff-workspace spec and this proposal reflect that decision. Archived reports remain historical records.

## Method and limits

The PRD baseline in [measurements.md](measurements.md) remains source `53abbbbc81c80f3385693e1c30752928e172dfa4`. Local inspection used source `be3c6b5c78ab04d8506616334f38b2de102af504` and already-built staff assets. The relevant workspace reader, layout and Stock timer are unchanged between these sources; Stock's later change adds a Selling link. Local asset hashes differ, so local timings are not another measurement of the deployed artifact.

The native browser repeatedly timed out during this deeper pass. The documented fallback used the DevTools MCP browser with the existing `scripts/test-content-workspace.mjs --serve` fixture on loopback. No production credentials were copied. Temporary instrumentation, a GET-only CSS-delay proxy and operation counters live under ignored `.codex-artifacts/staff-latency-round-two/`. No application source, deployed configuration, database schema, content or stock was changed. No additional hosted application probes were issued.

Local browser scheduling was variable, including a slow return control. These runs establish dependencies and races, not representative production latency. The 43/58-statement counts come from unchanged installed EmDash 0.38.0 code with synthetic query results. The later query-consolidation and batching comparisons use existing local SQLite data and a read-only binding shim. None measures PRD D1 round trips or latency. Local SQLite inspection does not prove hosted index parity.

## 1. Stock has an unconditional startup debounce

`StockOperationsApp.tsx:596` schedules `searchVariants(query)` after 300 ms whenever query, area, format or page cursor changes. Effects run on mount too. Initial entry, filter changes and pagination all wait even when no text is being typed.

Three PRD warm captures placed inventory start about 306–309 ms after the hydration-related DOM update. In the local baseline, the timer was scheduled at 367.4 ms, fired at 671.5 ms, and invoked fetch at 673.1 ms. A localhost-only control changed only that component's 300 ms timer to zero: scheduled 298.4 ms, fired 298.9 ms, fetch 300.8 ms. The controlled interval fell from 304.1 to 0.5 ms. Total navigation differences also include unrelated startup variation.

A separate unchanged local trace had FCP 100 ms and LCP 99 ms, but inventory did not start until 507 ms. Paint metrics describe the shell, not usable inventory.

**Fix boundary:** resolve initial URL state before an immediate first query; issue one request for that resolved state. Retain typing debounce, immediate filter/cursor reads, hidden/offline behavior, stale-response guards and recovery. Do not globally change timers or increase cache freshness.

## 2. Editor CSS is on the browse critical path

`ContentApp` statically imports `ContentFields`, media/picker, selling and publication-review features. The rich-text component is already lazy, but its `content-editor.css` import brings in EmDash admin styles. Astro still puts editor and picker stylesheets in the built content document's head. The installed CSS graph follows dynamic imports, so a lazy JavaScript import alone is insufficient.

The PRD editor stylesheet transferred 36,529 encoded bytes; one Distro request took 1689.2 ms. Local uncompressed CSS was 225,909 bytes. These different encodings must not be compared as a regression.

A local proxy delayed only the unopened editor CSS by 1000 ms. It changed no app bundle or response body:

| Run                       | Editor CSS response end | First island module request | First workspace API request |
| ------------------------- | ----------------------: | --------------------------: | --------------------------: |
| Baseline                  |                 56.9 ms |                     77.0 ms |                    217.4 ms |
| Add 1000 ms to editor CSS |               1061.9 ms |                   1084.1 ms |                   2512.2 ms |
| Remove fault              |                 61.8 ms |                     90.0 ms |                   5841.9 ms |

First-module discovery follows the CSS delay and returns when the fault is removed. The last run had a separate late discovery gap: subsequent modules began around 4409 ms. Retaining it prevents an unjustified total-page saving claim. The causal conclusion is narrower: **an unopened editor stylesheet can hold up browse startup**. Browser stylesheet/script ordering explains that dependency. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event)

**Selected approach:** lazy-load closed editing components and import processed `?inline` CSS inside the lazy feature boundary, rendering it once with that feature. This avoids a side-effect stylesheet import being hoisted into the browse document. Preserve the `emdash` cascade layer and styled-editor readiness. Vite supports processed CSS without automatic injection; the final Astro build/network graph must verify the boundary. This is a design decision, not an implemented fix. [Vite CSS documentation](https://vite.dev/guide/features.html#disabling-css-injection-into-the-page)

Local Distro also showed `Artists / 0 / No matching content` at 174.7 ms, its intended destination at 796.0 ms, and loaded content at 825.8 ms. Replace unresolved route state with stable neutral loading.

Nested Astro islands wait for a parent still marked `ssr`, but module downloads already start concurrently. In the first local Stock run, shell/Stock hydration events were only 0.4 ms apart. This does not justify flattening the shell or introducing a router. External font CSS also blocks rendering, but no font-provider failure was established; do not add a font migration.

## 3. Overview's empty response hides a large read fan-out

Before filtering published entries out, the current workspace reader performs:

1. A current-pointer read and a verified manifest read on cache miss.
2. A recent page of up to five records from each of 13 collections.
3. Another artist list, up to 100 records, for release-name enrichment.
4. A pending-publication query.
5. A catalog/price/stock join for selected identities.
6. Publication-state derivation, recent ordering and a maximum 20 unpublished results.

A native list call performs page/count queries, SEO configuration lookup and byline hydration for nonempty pages. SEO-enabled or author-linked records can add queries. The five-item limit does not bound count-query rows read.

The ignored `overview-probe.mts` executes unchanged workspace/native readers and asserts:

| Synthetic fixture, warm verified manifest                | Native lists | Native SQL | Pending SQL | Commerce SQL | Returned drafts |
| -------------------------------------------------------- | -----------: | ---------: | ----------: | -----------: | --------------: |
| Empty database                                           |           14 |         42 |           1 |            0 |               0 |
| One accepted entry per collection, no SEO/byline authors |           14 |         56 |           1 |            1 |               0 |

The second fixture uses 58 queries for an empty summary. This does not claim PRD has exactly 58 queries or that each costs a separate network round trip.

The installed EmDash package publicly exports `ContentRepository`, already used with `runtime.db` in `inventory-artwork.ts`. Its existing `findMany` returned the same identity/title/data/update/revision fields for the same 13 recent pages with **26 SQL statements**. Retaining the pending check yields **27 statements with this installed reader**, plus one current-pointer read and at most one manifest read on cache miss. This is an expected comparison, not a minimum or permanent exact-count contract. The probe exercises an existing reader; it does not implement the projection.

Removing only artist and commerce enrichment saves five of the 58 fixture queries. Avoiding unused SEO/byline handler work through the existing repository provides the larger supported reduction. Query-count reduction does not imply a proportional latency improvement.

**Fix boundary:** add `view=overview` to the existing adapter; preserve other modes. Keep incomplete drafts, revision-based publication truth, pending state, pointer freshness, ordering and recent-page limits. Start independent pointer/manifest and collection reads together; pending lookup can start when entries are known. Review remains exhaustive. No direct SQL against EmDash content tables, dependency patch, alternate CMS or new cache is needed.

### 3.1 Can the 27 statements be reduced further?

Yes. The 27 comes from `13 × (page + count) + 1 pending lookup`, not from a fundamental need for 27 reads. Overview does not use the 13 counts. Installed `ContentRepository.findMany` exposes neither a count-free mode nor a narrow cross-collection recent reader. Its multi-ID API needs identities that Overview has not discovered yet. The native dashboard handler is also unsuitable: it adds other statistics, covers different recent-item scope, and omits the revision fields needed for BlackBox publication truth.

| Alternative                            |       Collection SQL |    Pending SQL | What is established                                                     |
| -------------------------------------- | -------------------: | -------------: | ----------------------------------------------------------------------- |
| Existing ContentRepository             |                   26 |              1 | Supported today; equality verified with unchanged readers               |
| Count-free recent-page API             |                   13 |              1 | Would remove unused counts; not exposed by installed EmDash 0.38.0      |
| Grouped narrow `UNION ALL`             |                    3 |              1 | Local read-only experiment matches selected summary fields and ordering |
| Existing reader with native coalescing | 26 in one batch call | 1 further call | Installed driver produced the same local results in two binding calls   |

**Larger queries:** these collections contain independent records. A join between Artists, Releases, Settings and the other collections would combine unrelated rows; `UNION ALL` is the appropriate way to append their recent candidates. Keep `WHERE deleted_at IS NULL ORDER BY updated_at DESC, id DESC LIMIT 5` inside each collection branch. A global limit before publication-state filtering would change which recent drafts appear. The installed Cloudflare adapter declares a compound-SELECT limit of five, so the simple flat form needs three groups of 5/5/3, not one 13-branch statement. See installed `@emdash-cms/cloudflare/src/db/d1-dialect.ts` and the upstream [workerd limit discussion](https://github.com/cloudflare/workerd/issues/795).

The ignored `overview-union-probe.mts` opened the current local CMS SQLite file read-only. Across 13 collections, the native reader returned 32 candidates using 26 statements. Three grouped narrow reads returned exactly the same collection/identity/slug/title/label/update/revision fields in the same order. One unchanged pending lookup produced the same result (empty pending set in this local database). Query plans used each collection's existing deletion/update/id index; the grouped outer ordering also introduced temporary sorts. No new index was needed for this comparison.

The four-statement count excludes 13 diagnostic `PRAGMA table_info` calls used to discover differing collection columns. A production version would need maintained schema knowledge or supported cached metadata; issuing those PRAGMAs per request would defeat part of the saving. This experiment proves a possible consolidation of candidate reads, not hosted speed, full publication-state parity or a production implementation. Four is not an absolute lower bound: additional nesting or joining the project-owned pending lookup could package work differently, but would still need the same indexed collection reads and R2 accepted-state checks. Pursuing one giant statement solely for its count is not justified here.

**Fewer round trips without custom SQL:** Cloudflare's `batch()` sends several statements in one database call; it still executes those statements sequentially and does not remove their work. [D1 batch documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)

The installed EmDash Cloudflare adapter already has an experimental coalescing driver. The local probe ran the unchanged ContentRepository through that driver and a read-only SQLite-backed D1 shim. It observed **one batch containing 26 statements plus one direct pending statement**, with identical repository results and pending output. This is two instrumented binding calls, not a measurement of two PRD network round trips. Auth, runtime initialization, R2 and other Overview panels remain outside this count.

Current configuration is `d1({ binding: 'CMS_DB' })`; coalescing defaults off. The documented switch also requires `session: 'auto'` or `'primary-first'`. `withEmDashRuntime` does create an event-scoped database when this option is enabled, so the workspace path can benefit, but enabling it changes the database path for other CMS work too. D1 sessions are distinct from the removed Astro/auth sessions. Native coalescing retains per-query errors by retrying failed SELECT batches individually, so the healthy two-call result is not an error-path guarantee. Reuse this dependency feature if justified; do not copy its driver or install a global singleton buffer.

**Decision for this site:** select the existing repository reduction and the other reproduced fixes now. If Overview remains slow and attribution identifies database round trips, benchmark the native coalescer first, including existing write/publication correctness. If count-query work dominates, seek a supported count-free reader before owning native CMS table SQL. Keep SQL statements, binding calls, rows read and elapsed time separate in evidence. Neither four statements nor two calls is automatically faster on hosted D1.

## 4. Overview refresh has two reproduced defects

The initial effect calls `read()` directly. Focus/reconnect calls it through a separate `useStaffRead` query. Panel reads themselves are not coalesced.

With local responses delayed by 700 ms, focus and visibility events 100 ms into loading produced two batches. Workspace/publications/orders started at 243.5/244.0/246.6 ms, then again at 359.1/359.4/359.6 ms before completion. Six requests occurred. The newer generation discarded the first results; recent drafts appeared at 1075.4 ms.

The wrapper already coalesces simultaneous focus and visibility events with each other. The uncoupled initial path is the defect; a new query framework/cache is unnecessary.

An empty-result test settled at 718.6 ms. Focus restored `Loading recent work…` from 1218.5 to 1829.8 ms. The condition `loading && !drafts.length` cannot distinguish an unloaded panel from successful emptiness.

**Fix boundary:** use existing `readStaffQuery` at each Overview resource read, sharing that resource identity across initial/retry/refresh callers. Keep outer refresh-wrapper keys distinct from resource reads they await; recursively using one key risks a self-wait. Preserve generation/request guards and panel independence. Track successful settlement separately from content length. Existing Content/Stock list readers already coalesce resource requests; do not rewrite the helper without a reproduced need.

## 5. Index findings within the measured paths

The ignored `index-probe.mts` opened existing local D1 SQLite files read-only, inspected schema and ran `EXPLAIN QUERY PLAN`. It invoked the native list reader and actual inventory SQL builder to verify query shapes. It made no index, migration, `ANALYZE`, optimization or hosted changes. Local catalog counts were 101–103 entries; inventory had 112 options. Two older CMS files lacked current `request_json` and were excluded from pending-query conclusions.

| Path                       | Local plan                                                                                       | Performance note                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Overview recent content    | Uses `idx_ec_distro_deleted_updated_id`                                                          | Expected deletion/update/id index already exists; do not duplicate                                                 |
| Recent-content count       | Uses covering `idx_ec_distro_loc_crt`                                                            | Still counts matching rows; reducing calls helps even with indexes                                                 |
| Pending publications       | Uses `_blackbox_publications_pending (environment, status, requested_at, id)` before JSON checks | Environment/status access already indexed                                                                          |
| Native Catalog title order | Deletion-filter index, then temporary B-tree sort                                                | Candidate: title indexing through existing SchemaRegistry; verify emitted ordering/index and cursor plans          |
| Stock all-items browse     | Catalog scan, indexed Stock join, temporary sort                                                 | Candidate: index matching format, normalized display-title expression and variant ID, if benchmarking justifies it |
| Stock Distro browse        | Existing source-kind index, indexed Stock join, temporary sort                                   | Compare all-items and filtered plans before selecting an index                                                     |
| Stock substring search     | Scan and temporary sort                                                                          | Plain title indexing does not optimize the existing `instr(lower(...), lower(?))` substring predicate              |

Native migration `033_optimize_content_indexes.ts` already creates recent-content indexing. The project CMS migration already creates pending-publication indexing. `prepareCatalogSchema` indexes Distro group and sets the title field, but does not enable title indexing. Stock joins already use `Stock_variantId_key`.

These are scoped candidates, not selected schema changes or an explanation for a 300 ms API duration. A temporary sort over roughly 100 rows does not itself justify an index. If SQL duration or rows read remain material after the selected fixes, compare deployed schema/plan and realistic first/cursor/filtered/substring cases before selecting an index; include write/storage cost. Use SchemaRegistry for CMS fields and existing migrations for any justified commerce index, never browsing side effects. Expression indexes must match query expressions. [Cloudflare D1 guidance](https://developers.cloudflare.com/d1/best-practices/use-indexes/), [SQLite expression indexes](https://www.sqlite.org/expridx.html)

## 6. What remains unresolved

PRD HTML response starts ranged from roughly 100 ms to 1.5 seconds. Later same-origin document controls took 81.9–89.5 ms while workspace controls took 580.7–817.1 ms. A uniformly slow connection is not a complete explanation. Individual outliers still lack attribution across tool/browser scheduling, transport, Worker startup, JWT key retrieval and asset delivery.

Static delivery already bypasses the CMS Durable Object. JWT key resolvers already have an issuer-keyed module cache. Removing another static object hop or adding another JWKS cache is not a demonstrated fix. Authentication, including private asset revalidation, remains mandatory.

No application-stage Server-Timing was available. If the candidate remains slow, correlate a slow request and a normal control using existing Worker observations before changing entry/auth/assets. Separate SQL duration/rows read, D1 binding calls and R2 timings from end-to-end API time. Add minimal authenticated stage timings only if existing evidence cannot locate a repeatable delay. This is conditional follow-up, not a prerequisite for the proven fixes, and this investigation does not deploy instrumentation.

## Evidence required to close the follow-up

Deterministic checks must show: no initial/filter/page Stock debounce; one in-flight read per Overview resource under concurrent triggers; settled empty refresh; no false Artists frame; no unopened editor/picker feature resources on browse startup; and bounded Overview reads without unused enrichment, preserving publication semantics. Record statement counts as diagnostic comparisons rather than requiring exactly 27 forever. Add these to existing suites when implementation is authorized.

Hosted acceptance then uses [design.md](design.md): UAT smoke followed by an authorized bounded PRD sample of the promoted revision, recorded network/cache conditions, per-route warm median HTML ≤500 ms and usable content ≤1500 ms. Retain every visit above 2500 ms with its cause or uncertainty; repeatable application slowness and functional regressions keep acceptance open. An isolated transport/tool outlier needs supporting evidence to be qualified. No country-specific run is required. This supports a claim about the measured candidate, not every future connection.

The final plan review removed mandatory pre-fix tracing/index work, optional preloading, a shared-query-helper rewrite, duplicated browser runs and a zero-layout-shift requirement. The combined staff/CMS deployment needs no version-handshake mechanism. Save/auth/publication correctness and separate PRD acceptance remain required.

Raw local evidence is ignored under `.codex-artifacts/staff-latency-round-two/`: `overview-operation-counts.json`, `overview-union-comparison.json`, `local-index-plans.json`, browser probe outputs and diagnostic scripts. This document preserves the findings needed to review the plan without those files.
