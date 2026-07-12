# Site performance report log

This is the append-only program ledger. Report IDs, measurements, conclusions, and history are immutable. Artifact locations may be updated when OpenSpec archival moves a child directory.

| Report   | Date       | Type                                  | Round | Change ID                                    | Tested reference | Environment | Outcome                                                                                                    | Detail                                                                                                          |
| -------- | ---------- | ------------------------------------- | ----: | -------------------------------------------- | ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| PERF-001 | 2026-07-11 | Implementation closeout               |     1 | `improve-site-runtime-performance`           | `8469799f`       | Local       | Large initial costs reduced; declared round-one local gates accepted                                       | [Round-one implementation report](../archive/2026-07-12-improve-site-runtime-performance/performance-report.md) |
| PERF-002 | 2026-07-12 | Independent post-implementation audit |     1 | `improve-site-runtime-performance`           | `8469799f`       | PRD + Local | Partial success; realistic first traversal and several load costs remain                                   | [Fresh post-round-one audit](reports/PERF-002-round-one-post-implementation-audit.md)                           |
| PERF-003 | 2026-07-12 | Implementation closeout               |     2 | `improve-site-runtime-performance-round-two` | `2b96bbd7`       | PRD + Local | Load, font, image, JS, and animation gates pass; Store and literal first-scroll frame gates remain blocked | [Round-two implementation report](../improve-site-runtime-performance-round-two/performance-report.md)          |

## Next reserved entry

`PERF-004` is reserved for the next formal implementation or post-implementation performance report.

## Entry contract

Every future entry records:

- report ID, date, report type, implementation round, child change ID, and tested commit;
- Product Environment, URL, build mode, browser, viewport, DPR, CPU/network settings, cache state, and run count;
- comparison classification: like-for-like, directional, or incomparable;
- measured outcome, field-data confidence, detailed report path, and accepted follow-up;
- explicit unavailable data and excluded tooling or browser noise.
