# Validation

Baseline: `e818b709a2364aa29dfd54cadcd0433779a1f263`, reviewed in [PERF-004](../improve-site-performance-round-three/reports/PERF-004-review-e818b70.md). Hosted costs at the baseline are inferred from code, Node 24 benchmarks of the real published reader, and Cloudflare documentation; UAT and PRD were not contacted.
Product Environment: Local, for every implementation slice. Worker tests run in the Workers pool; `pnpm --filter @blackbox/backend build:public` produces the hosted build locally. UAT and then PRD only after an owner-authorized release, under the Free-tier rule.
Final tree: not yet recorded.

## Acceptance rows

From the [acceptance matrix](../../../docs/agent-workflow.md#acceptance-matrix):

- **CMS/schema/publication:** groups 2, 3 and 5. Draft privacy for media, stable media URLs across a text-only publication, accepted-snapshot purchase information, and activation-driven cache invalidation, all through worker tests and a local hosted build. Local results do not prove hosted publication.
- **Boundaries/tooling/instructions:** groups 4 and 6. Gateway and release-build tests in `test:tooling`, the `dist-public` checks, and this change's strict OpenSpec validation.
- **Release/environment:** group 8. Hosted UAT and PRD verification after an authorized release, with the release identity, account usage before and after, and the bounded pilot's measured requests.
- **Shell/player/routing:** not applicable. No shell code changes.
- **Commerce/checkout/stock:** not applicable. The commerce API Worker and its authority are unchanged; the shared Worker-request allowance is protected, not altered.
- **Staff/editor:** not applicable. Staff previews keep using the public object's preview path, and tests cover that route.

## Free-plan availability

One line per Cloudflare feature used: feature, Free availability, documentation source and date checked. Not yet recorded.

## Baseline (e818b70)

| Measure                                         | Value                                                                             | Method                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------- |
| Worker requests per first-visit page view       | about 20-80                                                                       | code path count per resource type     |
| Daily page views before the 100k allowance      | about 1,500-5,000 first visits                                                    | arithmetic from the row above         |
| Image transformations at risk per publication   | all source × width pairs (1,105 at review time)                                   | snapshot media count × emitted widths |
| Valid `/_image` targets per historical snapshot | about 2,600                                                                       | media count × 17 widths               |
| Hosted HTML reuse                               | 30 s `s-maxage` + 30 s `stale-while-revalidate`; object cache lost on hibernation | headers and code                      |
| Snapshot parse after hibernation                | 153-180 ms cold on a 125-record snapshot                                          | Node 24 benchmark of the real reader  |

## Slice evidence

One entry per slice as it integrates: commit, `pnpm validate --since <base>` summary path, worker and tooling tests, and local hosted-build evidence.

## Hosted verification

Not yet run. Requires an owner-authorized release and the Free-tier preflight.

## Not verified

Not yet recorded. Expected to include real edge hit rates, the public object's location before and after, and Images dashboard counts until the UAT pilot runs.
