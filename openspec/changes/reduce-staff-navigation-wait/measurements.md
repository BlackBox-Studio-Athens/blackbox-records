# Staff latency: second measurement round

Measured 2026-09-22. Planning and measurement only; application code and hosted data were not changed.

## Environment and method

- Target: authenticated **PRD**, `https://staff.blackboxrecordsathens.com/`, as confirmed by the user. Local and UAT were not timed.
- Deployed source: `53abbbbc81c80f3385693e1c30752928e172dfa4`, candidate `35577713515`, [PRD promotion 35578999896](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35578999896). Cloudflare's active deployment showed version `935204d4` at 100%, tag `35578999896-1`; retained release output resolves it to `935204d4-cb5f-4208-8dee-56f65cecb01c`.
- Browser: existing authenticated Chrome 153 on Windows, foreground viewport 2134 × 983. Normal browser caching; no cache clearing, network throttling, or CPU throttling was configured. These are existing-cache first visits and subsequent warm visits, **not controlled cold-cache measurements**.
- Browser `/cdn-cgi/trace`: `loc=CH`, `colo=LHR`, HTTP/3, TLS 1.3, WARP off. Navigation response Rays were LHR through `overview-warm-3`, then AMS for the final Website/Stock visits. ISP, physical location, and other VPN status were not established. Location is measurement context, not an acceptance gate.
- Native browser bootstrap succeeded. Its CDP interface supplied Navigation/Resource Timing and response metadata. Startup-script installation was unsupported; an immediate CDP call during one navigation was also rejected while Browser Use resolved a paused document response. The DevTools fallback opened an unauthenticated profile at Google sign-in, so it was not used for staff traces or given copied credentials.
- Fourteen staff activations: initial Overview, Website and Stock; one Releases and one Distro visit; three warm Overview/Website/Stock cycles. Nine additional sequential same-origin GET controls compared document, workspace and publications reads without navigation. One location GET was separate. No retries replaced slow/failed samples.
- For the nine warm visits and Distro, temporary MutationObserver callbacks sampled rendered main content on the next animation frame. Readiness was the first successful destination state: settled Recent drafts, Pages links, 25 enabled Stock items, or 25 Distro rows. All observers were removed afterward. Initial visits without observers retain API completion bounds, not invented readiness values.
- Resource timing includes browser/automation effects and network latency. Exact entry Worker, Access, Durable Object and D1 wall times were not available. The only response `Server-Timing` field was `cfExtPri`, without useful application durations. This is a diagnostic baseline, not a field Core Web Vitals assessment or proof of a provider-side root cause.

Capture timestamps below are UTC **collection times**. Timings are milliseconds from each document's navigation start, rounded to one decimal. FCP is not usable-content time. Request counts include the document and observed resources, including occasional favicon/font requests, but exclude the separate location/control GETs.

## Individual navigation samples

| Sample           | Collected UTC | Edge | HTML TTFB |  FCP | First API starts |                                  Usable content | Requests |
| ---------------- | ------------- | ---- | --------: | ---: | ---------------: | ----------------------------------------------: | -------: |
| Overview initial | 16:40:45      | LHR  |    1508.5 | 2768 |           2863.5 |    Not captured; drafts response ends at 5235.8 |       31 |
| Website initial  | 16:41:07      | LHR  |    1479.1 | 3132 |           3330.4 |                                    Not captured |       40 |
| Stock initial    | 16:42:07      | LHR  |     153.6 |  576 |           2507.5 | Not captured; inventory response ends at 2841.7 |       56 |
| Releases initial | 16:42:48      | LHR  |     108.8 |  376 |            691.6 |      Not captured; list response ends at 1278.7 |       44 |
| Distro initial   | 16:43:30      | LHR  |     180.2 | 2168 |           2361.5 |                                          3434.8 |       64 |
| Overview warm 1  | 16:43:52      | LHR  |     105.0 |  640 |            864.2 |                                          1837.8 |       30 |
| Website warm 1   | 16:44:11      | LHR  |      98.0 |  432 |            675.1 |                                           676.8 |       42 |
| Stock warm 1     | 16:44:36      | LHR  |      96.6 |  380 |            895.3 |                                          1243.1 |       56 |
| Overview warm 2  | 16:45:01      | LHR  |      96.9 |  412 |            633.4 |                                          1577.9 |       30 |
| Website warm 2   | 16:45:29      | LHR  |     105.2 |  388 |            900.3 |                                           908.4 |       44 |
| Stock warm 2     | 16:45:54      | LHR  |      96.0 |  404 |            918.9 |                                          1262.9 |       56 |
| Overview warm 3  | 16:46:28      | LHR  |     101.5 |  372 |            539.3 |                                          1360.8 |       30 |
| Website warm 3   | 16:47:01      | AMS  |    1311.4 | 2756 |           2939.2 |                                          2941.2 |       42 |
| Stock warm 3     | 16:47:27      | AMS  |    1135.8 | 1444 |           2711.1 |                                          3061.0 |       56 |

| Warm route, n=3 | HTML median (range) |  Usable median (range) | Interpretation                                                                       |
| --------------- | ------------------: | ---------------------: | ------------------------------------------------------------------------------------ |
| Overview        |  101.5 (96.9–105.0) | 1577.9 (1360.8–1837.8) | Exceeds the previous 1500-ms usable-content target even with consistently quick HTML |
| Website         | 105.2 (98.0–1311.4) |   908.4 (676.8–2941.2) | Median hides a slow final visit; mixed ingress colos                                 |
| Stock           |  96.6 (96.0–1135.8) | 1262.9 (1243.1–3061.0) | Median hides a slow final visit; mixed ingress colos                                 |

These are descriptive three-sample medians, not p95 estimates or geographic acceptance. The edge change coincides with two slow visits; it does not prove cold starts, object placement, or an Amsterdam defect.

## Where the time goes

### 1. Startup can dominate otherwise quick data reads

- Website's final warm visit spent 1311.4 ms before HTML response start and did not show Pages until 2941.2 ms. Its publications request took only 113.0 ms and was not required to show the Pages links.
- Stock's final warm inventory request started at 2711.1 ms and took 340.4 ms. The corresponding fast visit started that request at 895.3 ms and took 336.7 ms. The large change is before the API request.
- Distro's API took 394.2 ms, but its 25 rows became usable at 3434.8 ms. `ContentBodyEditor.DqB7ZrKh.css` was requested before any editor opened and took 1689.2 ms; it represents 36,529 encoded body bytes. Website and Releases also requested that stylesheet and `EditorialPicker.D1hR7ib0.css` (2020 bytes). The latter took 1262.0 ms in the final Website visit.
- Every measured Website/Catalog document requested 32 JavaScript resources, compared with 20 on Overview and 22 on Stock. Many cached modules still incurred network waits with only header-sized transfers. These counts identify the graph to investigate, not permission to weaken private cache authorization.
- Website displayed **Artists / 0 / No matching content** before Pages on each observed warm visit. Distro likewise displayed Artists before its requested collection. Observed post-startup layout-shift sums were about 0.111 for Website and 0.112 for Distro. These are observer sums, not a claimed field CLS score.
- Buffered long-task observation reported one 71-ms task on Website warm 2 and none in the other instrumented samples. This does not establish a complete CPU trace or INP result.

### 2. Overview has a distinct expensive read

| Request                                                   | Initial duration | Warm 1 | Warm 2 | Warm 3 | Encoded response bytes |
| --------------------------------------------------------- | ---------------: | -----: | -----: | -----: | ---------------------: |
| `/_emdash/api/blackbox/workspace`                         |           2372.3 |  920.3 |  938.8 |  815.7 |                     36 |
| `/_emdash/api/blackbox/publications`                      |           1282.9 |  141.7 |  139.8 |  114.9 |                    296 |
| `/api/internal/orders/search?limit=1&status=needs_review` |            736.9 |  526.0 |  461.6 |  637.0 |                     30 |

The empty Recent drafts response is tiny. Its warm median duration is 920.3 ms; the panel is still waiting after the faster publication and order reads finish. The already-open tab also contained older 2276.4-ms and focus-triggered 3476.0-ms workspace reads; those were opportunistic observations, excluded from the controlled sample table.

Nine serial GET controls after the navigation sample, all through AMS, returned 200:

| Request                              | Total duration samples | Median | Decoded bytes |
| ------------------------------------ | ---------------------- | -----: | ------------: |
| `/`                                  | 84.7, 89.5, 81.9       |   84.7 |        17,253 |
| `/_emdash/api/blackbox/workspace`    | 817.1, 624.1, 580.7    |  624.1 |            36 |
| `/_emdash/api/blackbox/publications` | 100.8, 106.5, 93.7     |  100.8 |           701 |

These controls separate an expensive aggregate read from navigation startup. They are not a controlled LHR/AMS comparison. Example response Rays: `a3f2caa6a9214c90-AMS` (817.1-ms workspace) and `a3f2caad09634c90-AMS` (624.1-ms workspace).

Source evidence: `StaffOverview.tsx` requests the unscoped workspace projection. `staff-workspace.ts` reads the accepted pointer/snapshot, asks each collection for a page, performs another artist lookup when releases are present, and reads pending publication and commerce enrichment before filtering the result down to recent unpublished entries. The Overview output does not need the selling fields or artist-name enrichment. These are concrete avoidable operations; their individual hosted cost remains unmeasured.

### 3. The large-image fix still holds, with incomplete catalog coverage

- All four Stock visits requested 25 thumbnails, loaded all 25, transferred **357,824 encoded image-body bytes** per visit, and requested zero original images. This matches the archived final Stock sample exactly. It is below the existing 1-MiB limit.
- Releases requested three thumbnails; one returned 404. Distro requested 23; five returned 404, and missing artwork settled to placeholders. Its encoded thumbnail response bodies totaled 265,103 bytes. Do not equate a Stock-page pass with complete catalog derivative preparation.
- The six missing keys were observed without retries or original-image fallback. Repair would require its own bounded preparation dry run and hosted authorization; it was not performed here. Exact keys are in the ignored sample evidence.
- No workspace API failures were observed. Missing thumbnails are retained as failures, not dropped from the report.

## Free-tier budget and operation boundary

The prior local built-hosting/workspace evidence was reused because this was a measurement-only task against the already-deployed static bypass and thumbnail paths. No new local fixtures or application changes were needed. The source/generated no-KV and authenticated no-session checks remain required implementation gates.

Current dashboard preflight on 2026-09-22:

| Resource        | Observed usage                                                                                       | Pilot allowance and headroom                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workers         | 4669 / 100,000 requests today; 80.62k requests and 214,138 ms CPU in current billing period          | Budget at most 1200 browser requests, reserve 50,000 daily requests; no CPU/quota-warning retry                                                                                                |
| Durable Objects | 48.26k requests and 2.15k GB-sec in current billing period; SQL rows read/written 0; KV operations 0 | Period total is a conservative upper bound on today's displayed usage, not an exact daily remainder. Budget at most 100 application API calls and 300 GB-sec; reserve half the daily allowance |
| D1              | 309.93k rows read, 1.07k written for September 22; 14.97 MB storage                                  | Reserve half the daily allowance; conservative read budget 100,000 rows, expected zero application writes                                                                                      |
| R2              | 1.96k Class A, 47.74k Class B, 1.45 GB storage in current period; $0 billable usage                  | Budget at most 250 Class B reads including thumbnails/pointer overhead; zero preparation writes or storage growth                                                                              |

Actual browser accounting: 621 document/resource requests across the 14 activations, plus nine control GETs and one location GET; 126 thumbnail requests and 34 application API GETs including controls. This is browser evidence, **not exact D1/R2/DO operation accounting**. Background account traffic and analytics lag prevent attributing dashboard deltas solely to this pilot. No polling loop, save, publication, catalog apply, image repair, deployment, or paid setting was invoked. Stop after the fixed sample; do not infer authorization for another batch.

## Comparison and disposition

The archived sample used source `7a5f1c342bdcd85713e75c3877428bde729f245b` and Switzerland/AMS. It recorded Overview HTML response start 87.8 ms, workspace API 755 ms, and Stock HTML response start 1170.2 ms. The new PRD source and changing ingress route make this an uncontrolled comparison: it supports persistent variability, not a regression percentage.

Keep the archived implementation history. Prepare the new `reduce-staff-navigation-wait` change for the reproduced Stock startup, browse dependency/loading and Overview read/refresh fixes. Use additional attribution, batching or index benchmarks only if the candidate remains slow. Defer object relocation, a router migration, private-cache policy changes, and bulk derivative repair. The user retired the country-specific acceptance requirement on 2026-09-22; this does not turn diagnostic samples into proof that hosted latency is resolved. [investigation.md](investigation.md) adds causal tests and query-plan findings without changing this PRD baseline.

Evidence: this report preserves the measurements; [normalized samples](../../../.codex-artifacts/staff-latency-round-two/samples.json) and [PRD release log](../../../.codex-artifacts/staff-latency-round-two/prd-release.log) are ignored local artifacts. The capture used the native browser's documented CDP capability and [Chrome performance tooling](https://developer.chrome.com/docs/devtools/performance). Cloudflare documents that [location hints affect first creation and are best effort](https://developers.cloudflare.com/durable-objects/reference/data-location/); neither a Ray suffix nor this pilot proves object placement.

## Post-ticket PRD release sample

Captured 2026-09-22 UTC against source `020204e284a4f655ed2ea1f19c4e73143f59db0f`, candidate `35790151397`, and promotion [35793764756](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35793764756). The PRD Worker version was `94b887c5-b0cf-4202-ac52-c34fa6b4c846` at 100%; Pages hosted verification passed.

The browser was authenticated Chrome 153 on Windows, viewport 2134 × 983. At the final trace read, the connection was Switzerland (`loc=CH`), Cloudflare AMS, HTTP/3, TLS 1.3, WARP off, effective type 4g, estimated RTT 150 ms and downlink 7 Mbps. No CPU/network throttling or cache clearing was used. The trace reflects the final connection, not a per-navigation colo measurement. The previous warm baseline was primarily LHR, so this is not a controlled geographic comparison.

The 16 visits below consist of one initial-resource visit and three normal-cache visits per route. “Payload end” is the relevant route response-end proxy; static Website content uses DOMContentLoaded. The page text was checked in Chrome. Response end is not an exact pixel-paint time. FCP was absent from several warm entries. The exact MutationObserver/next-frame readiness capture used for the earlier baseline was unavailable through this Chrome session, so treat these as diagnostic bounds.

| Route    | Visit   | HTML TTFB |   FCP | DOMContentLoaded | First API start |             Payload end / readiness | Resource entries / zero-transfer |
| -------- | ------- | --------: | ----: | ---------------: | --------------: | ----------------------------------: | -------------------------------: |
| Overview | Initial |     753.5 |  1280 |           1079.2 |          2770.9 |                              3314.5 |                           31 / 1 |
| Website  | Initial |    1436.7 |     — |           2979.3 |               — |          2979.3, Pages list in HTML |                           40 / 2 |
| Stock    | Initial |     772.2 | 12588 |           1771.1 |         26737.6 |           27376, inventory response |                           56 / 2 |
| Distro   | Initial |    1406.5 |  1656 |           1601.1 |          3039.2 |            3581, workspace response |                           64 / 2 |
| Overview | Warm 1  |    1134.5 |     — |           1326.2 |          2865.5 |          3282.3, workspace response |                           30 / 4 |
| Website  | Warm 1  |      72.4 |     — |            193.8 |           534.4 |           193.8, Pages list in HTML |                           42 / 4 |
| Stock    | Warm 1  |      82.1 |     — |            193.6 |           559.1 |           878.2, inventory response |                           33 / 4 |
| Distro   | Warm 1  |      80.9 |     — |            208.5 |           669.1 |           917.6, workspace response |                           66 / 4 |
| Overview | Warm 2  |     817.4 |     — |           1727.4 |               — | Still loading at 1778.2; no API yet |                            6 / 4 |
| Website  | Warm 2  |      67.8 |     — |            178.4 |               — |           178.4, Pages list in HTML |                           41 / 4 |
| Stock    | Warm 2  |      69.0 |     — |            175.5 |          1160.7 |          1598.7, inventory response |                           33 / 4 |
| Distro   | Warm 2  |      68.0 |     — |            199.7 |           773.2 |          1196.8, workspace response |                           43 / 4 |
| Overview | Warm 3  |     144.7 |     — |            343.7 |          1787.0 |          2102.2, workspace response |                           30 / 4 |
| Website  | Warm 3  |      72.3 |     — |            185.2 |           500.9 |           185.2, Pages list in HTML |                           42 / 4 |
| Stock    | Warm 3  |      72.4 |     — |            196.4 |           704.4 |          1032.8, inventory response |                           37 / 4 |
| Distro   | Warm 3  |      79.7 |     — |            257.0 |          6199.6 |          6519.2, workspace response |                           43 / 4 |

The relevant API-end medians were 2,692 ms across the two completed Overview warm visits (one of three was still loading at 1,778 ms), 185 ms for the static Website DOM milestone, 1,033 ms for Stock inventory, and 1,197 ms for the Distro workspace response. These resource/DOM milestones do not establish exact visible-content medians. Overview clearly misses the 1,500 ms target; the data-end proxies for other routes are below it, but the Stock DOM observation was coarse and Distro had a 6,519 ms outlier. Keep visible-content acceptance open.

The Overview `view=overview` response durations were 543.6, 416.8 and 315.2 ms (median 416.8 ms), versus 920.3 ms in the prior workspace-read sample, about 55% shorter once the request began. Request start remained late: 1.787–2.866 s in completed warm visits. The accepted synthetic fixture also fell from 58 to 27 SQL statements (56 to 26 `executeQuery` calls); these are not billed D1 row counts or end-to-end latency guarantees.

The Stock initial-resource visit eventually loaded 25/25 thumbnails, with no failures and no original-image requests. The 25 thumbnails totaled 365,324 bytes (largest 20,045 bytes), within the existing 1 MiB contract. Stock inventory did not start until 26.738 s on that first-resource visit; the resource waterfall shows several delayed module groups before the request. Normal-cache inventory response-end values were 878, 1,599 and 1,033 ms. Distro’s 6.519 s outlier had an 80 ms HTML TTFB but did not start the workspace request until 6.200 s, so the delay was before that data response. One Distro DOM confirmation was delayed by the measurement poll; its 918 ms response-end is a proxy, not a precise first-visible timestamp. The Overview initial and warm samples above 2.5 s were also retained.

Three late refresh bursts appeared while the authenticated pages remained open: Overview refreshed workspace/publications/orders, Website requested publications, and Stock refreshed inventory/artwork. Their trigger was not isolated; they are separate from the 16 navigation medians and included in the budget accounting. No deliberate focus-return test or separate three-GET control was run. The control was unnecessary for identifying the pre-request delays. All browser activity was read-only; no content, inventory, catalog or checkout action was submitted.

### PRD Free-tier worksheet

The last pre-sample account snapshot was read at 22:31 UTC on September 22: Workers 7,473 / 100,000 requests today (83.43k requests and 217,380 ms CPU in the current period, $0); D1 425.95k rows read, 1.74k written and 14.97 MB; Durable Objects 49.83k requests and 2.2k GB-sec in the current period; R2 1.96k Class A, 49.38k Class B and 1.46 GB, $0. Period totals are not daily usage.

The fixed sample budget was at most 1,200 browser resource requests, 100 application calls and 300 GB-sec; at most 100,000 D1 rows read with no application data writes; and at most 250 R2 Class B reads with no storage growth. The 16 timing snapshots contain 637 resource entries plus the single `/cdn-cgi/trace` read. Browser timing does not provide exact D1, DO or R2 billing deltas; lazy image and incidental refresh traffic is recorded separately above. No quota warning or paid operation occurred.
