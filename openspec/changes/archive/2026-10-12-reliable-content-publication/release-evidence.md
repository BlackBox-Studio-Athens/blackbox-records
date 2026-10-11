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
- Unit, check and build passed again on final merged commit `7cbc58d8a2ccc0620dcb65eaa82318237a4422c0`, including the first-cutover previous-media preservation regression. The implementation was rebased onto local main, fast-forward merged and pushed; its temporary worktree and branch were removed.

## Hosted UAT verification

- Candidate [35121520697](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35121520697) deployed code `7cbc58d8a2ccc0620dcb65eaa82318237a4422c0` with the previous accepted content identity intact.
- The native Chrome editor republished the already accepted Ouranopithecus revision without saving an edit. Publication `46dc8145-3195-4855-8fb1-3f731db4e3af` reached verified `live` in **7,252 ms**, with zero retry attempts and no GitHub build. This is one measured sample, not a p95 measurement.
- The public content identity matched journal snapshot `25ab812533cda8642d38876fbeb8c5f17bfad43954da52f87d47a937edc67563`; the editor displayed “Latest publication live.” Deep comparison confirmed all 129 records, media and store identities equal to the previous accepted snapshot. The checksum changed because runtime serialization normalized object key order.
- Homepage and artist page returned 200 with the new snapshot header and `Cache-Control: no-store`; `/content/` and `/__publication/validate` returned 404 on the public origin.
- The pilot used one publication, no new media, no catalog mutation and fewer than twenty explicit public verification requests. Supporting read-only D1 checks read five rows and wrote zero. No quota warning, retry loop or plan change occurred.
- The complete UAT candidate passed unit, workspace, unused-code, both browser suites, provider and static-site smoke checks.

## PRD promotion

- Promotion [35123820958](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35123820958) succeeded using retained candidate `35121520697`, without rebuilding. Both environments serve code `7cbc58d8a2ccc0620dcb65eaa82318237a4422c0` in runtime publication mode.
- The first Pages job stopped before upload because Cloudflare's immediate post-PATCH GET omitted the service binding. A subsequent authenticated GET confirmed the correct binding; rerunning only the failed job succeeded. This was initial control-plane propagation, not a content-publication retry or public outage.
- PRD retained publication `95590ed9-e653-45d6-a9bc-105307cd6ee7` and snapshot `04bc1bcac35c1a9ae34b63d4ed1257a5ee3d13aedf4f07b471531f9b6a372a2b`. Homepage and artist page, release identity and runtime image delivery passed. Private namespaces returned 404. The native staff editor displayed Add to publication and Publish changes.
- PRD capabilities still reported `nativeCheckout.enabled=false`. No PRD editorial publication, live catalog mutation, checkout launch, DNS change or paid-plan upgrade was performed.

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
