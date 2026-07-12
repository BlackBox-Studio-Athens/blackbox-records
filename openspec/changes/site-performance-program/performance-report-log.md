# Site performance report log

This is the append-only program ledger. Report IDs, measurements, conclusions, and history are immutable. Artifact locations may be updated when OpenSpec archival moves a child directory.

| Report   | Date       | Type                                  | Round | Change ID                          | Tested reference | Environment | Outcome                                                                  | Detail                                                                                                          |
| -------- | ---------- | ------------------------------------- | ----: | ---------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| PERF-001 | 2026-07-11 | Implementation closeout               |     1 | `improve-site-runtime-performance` | `8469799f`       | Local       | Large initial costs reduced; declared round-one local gates accepted     | [Round-one implementation report](../archive/2026-07-12-improve-site-runtime-performance/performance-report.md) |
| PERF-002 | 2026-07-12 | Independent post-implementation audit |     1 | `improve-site-runtime-performance` | `8469799f`       | PRD + Local | Partial success; realistic first traversal and several load costs remain | [Fresh post-round-one audit](reports/PERF-002-round-one-post-implementation-audit.md)                           |

## Next reserved entry

`PERF-003` is reserved for the implementation closeout of `improve-site-runtime-performance-round-two`. It is not added to the ledger until the implementation and its before/after evidence exist.

## Entry contract

Every future entry records:

- report ID, date, report type, implementation round, child change ID, and tested commit;
- Product Environment, URL, build mode, browser, viewport, DPR, CPU/network settings, cache state, and run count;
- comparison classification: like-for-like, directional, or incomparable;
- measured outcome, field-data confidence, detailed report path, and accepted follow-up;
- explicit unavailable data and excluded tooling or browser noise.
