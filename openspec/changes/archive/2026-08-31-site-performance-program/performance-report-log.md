# Site performance report log

This is the append-only program ledger. Report IDs, measurements, conclusions, and history are immutable. Artifact locations may be updated when OpenSpec archival moves a child directory.

| Report   | Date       | Type                                  | Round | Change ID                                    | Tested reference | Environment | Outcome                                                                                     | Detail                                                                                                                    |
| -------- | ---------- | ------------------------------------- | ----: | -------------------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| PERF-001 | 2026-07-11 | Implementation closeout               |     1 | `improve-site-runtime-performance`           | `8469799f`       | Local       | Large initial costs reduced; declared round-one local gates accepted                        | [Round-one implementation report](../archive/2026-07-12-improve-site-runtime-performance/performance-report.md)           |
| PERF-002 | 2026-07-12 | Independent post-implementation audit |     1 | `improve-site-runtime-performance`           | `8469799f`       | PRD + Local | Partial success; realistic first traversal and several load costs remain                    | [Fresh post-round-one audit](reports/PERF-002-round-one-post-implementation-audit.md)                                     |
| PERF-003 | 2026-07-12 | Implementation closeout               |     2 | `improve-site-runtime-performance-round-two` | `2b96bbd7`       | PRD + Local | Round two closed after calibrated acceptance; Store remains for post-commerce remeasurement | [Round-two implementation report](../archive/2026-07-15-improve-site-runtime-performance-round-two/performance-report.md) |

## Next reserved entry

`PERF-004` is reserved only if post-commerce measurement justifies another formal implementation or audit report.

## Entry contract

Every future entry records:

- report ID, date, report type, implementation round, child change ID, and tested commit;
- Product Environment, URL, build mode, browser, viewport, DPR, CPU/network settings, cache state, and run count;
- comparison classification: like-for-like, directional, or incomparable;
- measured outcome, field-data confidence, detailed report path, and accepted follow-up;
- explicit unavailable data and excluded tooling or browser noise.

## Entries registered after recovery

| Report | Date | Type | Round | Change ID | Tested reference | Environment | Comparison and outcome | Detail |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| PERF-004 | 2026-10-02 | Independent post-commerce audit | 3 | `improve-site-performance-round-three` and `bound-hosted-delivery-cost` | `e818b709a2364aa29dfd54cadcd0433779a1f263` | Local production static | Historical Chromium141 audit justified both children; ignored raw traces were absent on remote recovery, so fresh browser comparisons are directional or incomparable | [Recovered review](../../improve-site-performance-round-three/reports/PERF-004-review-e818b70.md) |
| PERF-005 | 2026-10-03 | Local implementation and acceptance record | 3 | `improve-site-performance-round-three` | `fe099b01cea42266cdf21c2318851af361db1210` plus recorded uncommitted source fingerprints | Local production static | Linear data reads, smaller eager graphs, native scrolling and bounded images/surfaces; like-for-like Node/current-build A/B evidence, source-bound final checks; visual/history/predecessor gates remain open | [Round-three report](../../improve-site-performance-round-three/performance-report.md) |
| PERF-006 | 2026-10-03 | Local hosted-delivery implementation record | 3 | `bound-hosted-delivery-cost` | `fe099b01cea42266cdf21c2318851af361db1210` plus recorded uncommitted source fingerprints | Local UAT-shaped SSR emulation | Persisted byte LRU, activation invalidation, direct bounded Images URLs, gateway and actual local rendered-output gates; native purge, provider bytes/account cost, quota-failure crawler fallback and release/pilot acceptance remain open | [Hosted report](../../bound-hosted-delivery-cost/performance-report.md) |

PERF-005 records URL, production build, Chromium153 version, device/DPR, CPU/network, fresh-context state and run counts; individual artifacts retain source/build hashes. The Node and same-build feature comparisons are local lab evidence with shared-machine noise excluded from causal claims. PERF-006 records snapshot and renderer identities for local-only capture. Neither report claims field Core Web Vitals, hosted publication, provider acceptance or archival. Earlier entries and measurements above remain unchanged.

## Archive locations after local integration on 2026-10-03

The user requested local commit, rebase, merge and archival. Earlier ledger rows retain their source identities and paths as recorded; current report locations are below. The archives preserve seven performance and four hosted acceptance or conditional reconciliation tasks. Timed pre-integration profiles do not measure the rebased tree. Current checks and the retained artifact path mapping are recorded in the archived validation notes and the primary checkout's ignored integration evidence.

| Record | Archived report |
| --- | --- |
| PERF-004 | [Recovered review](../2026-10-03-improve-site-performance-round-three/reports/PERF-004-review-e818b70.md) |
| PERF-005 | [Round-three report](../2026-10-03-improve-site-performance-round-three/performance-report.md) |
| PERF-006 | [Hosted report](../2026-10-03-bound-hosted-delivery-cost/performance-report.md) |
