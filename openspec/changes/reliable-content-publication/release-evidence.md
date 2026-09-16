# Publication verification and release evidence

## Local

- Existing unit suite passed before the batch extension: backend 532 Worker tests and 285 Node tests; web 575; staff 53; API 6; content model 16; supporting Node script checks passed.
- Canonical static build and CMS mock build passed. The public renderer smoke passed 130 routes, homepage media and unpublished-media/private-route rejection.
- Native Chrome verified a saved artist edit through `/content/` and the new publication endpoint. Public identity and artist HTML matched; live status appeared about two seconds after acceptance.
- The repeatable Local API check measured 804 ms from acceptance to confirmed public HTML. Duplicate request IDs converged and an unrelated saved artist draft remained private. It restored the test drafts.
- Restarting the full Local stack preserved the exact accepted content identity.
- Batch Worker regression passed: stale selection rejects before mutation; interrupted validation leaves the old pointer; recovery activates both selected records together without repeated native publication.
- Real Local batch integration measured 858 ms for one record and 6,745 ms for a two-record atomic update; unrelated-draft privacy and duplicate-ID recovery passed. Both browser suites passed the cross-section selection/reload/publish workflow. The public bundle dry run was 490 KiB gzip.
- A newly uploaded PNG published in 814 ms through the real Local CMS/R2 path; the original image was restored.
- Unit, check and build passed on the implementation tree. Final rebased-tree checks and hosted release identities are recorded below when complete.

## Free-tier preflight, 2026-09-16

Read-only account dashboard inspection confirmed **Workers Free**, $0 incurred, and no plan change. Dashboard analytics may lag; the budget includes substantial headroom.

| Resource                    | Observed account usage        | Allowance/headroom used for this pilot                                           |
| --------------------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| Workers requests            | 36.53k, September 2–October 2 | Even treating the whole period as today's use leaves at least 63.47k of 100k/day |
| Observability events        | 14,209 today                  | 185,791 of 200k/day remain                                                       |
| Durable Objects requests    | 21.83k in current period      | At least 78.17k of 100k/day remain using the same conservative bound             |
| Durable Objects duration    | 1.09k GB-s in current period  | At least 11.91k of 13k GB-s/day remain                                           |
| DO SQLite rows read/written | 0 / 0; storage 0 B            | Existing DO application data remains in D1; new renderer stores no SQL data      |
| D1 rows read                | 322.9k today                  | 4.6771m of 5m/day remain                                                         |
| D1 rows written             | 1.78k today                   | 98.22k of 100k/day remain                                                        |
| D1 storage/databases        | 14.66 MB; 8 of 10             | No additional D1 database is required                                            |
| R2 Class A                  | 1.55k current period          | Approximately 998.45k of 1m/month remain                                         |
| R2 Class B                  | 19.7k current period          | Approximately 9.9803m of 10m/month remain                                        |
| R2 storage                  | 1.44 GB                       | 8.56 GB below the 10 GB storage level; billing uses GB-month                     |

Sources: authenticated Cloudflare Workers, plans, Durable Objects, D1 and R2 account dashboards; [R2 Free allowances](https://developers.cloudflare.com/r2/pricing/). No hosted writes were used for this inspection.

The bounded UAT pilot uses the ceilings and stop conditions in [the operating runbook](../../../docs/content-publication.md). It adds one UAT renderer and one PRD renderer only through the authorized release. Existing immutable snapshots bootstrap the rollout; no hosted bulk import or catalog mutation is needed. At least half of every affected Free allowance remains reserved for ordinary service under the observed usage and pilot ceilings.
