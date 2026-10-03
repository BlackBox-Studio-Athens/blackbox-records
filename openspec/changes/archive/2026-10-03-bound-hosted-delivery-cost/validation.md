# Validation

Baseline: `e818b709a2364aa29dfd54cadcd0433779a1f263`, reviewed in [PERF-004](../2026-10-03-improve-site-performance-round-three/reports/PERF-004-review-e818b70.md). Hosted costs at the baseline are inferred from code, Node 24 benchmarks of the real published reader, and Cloudflare documentation; UAT and PRD were not contacted.
Product Environment: Local, for every implementation slice. Worker tests run in the Workers pool; `pnpm --filter @blackbox/backend build:public` produces the hosted build locally. UAT and then PRD only after an owner-authorized release, under the Free-tier rule.
Measured implementation before Git integration: resumed work above `fe099b01cea42266cdf21c2318851af361db1210`. Accepted repository summary: `.codex-artifacts/validation/2026-10-03T06-10-39-963Z-58624-e99ed2/summary.json`, `mode: local`, PASSED, matching before/after fingerprint `b99b893b7b0ff73d59d32bd82e4fb5b94bf5c17d7619c3bf86125b6222b70823`. The last pre-integration rerun pointer and fingerprints remain in `.codex-artifacts/performance-resume/completion-evidence.json`; rebased checks have a separate integration record.

## Acceptance rows

From the [acceptance matrix](../../../../docs/agent-workflow.md#acceptance-matrix):

- **CMS/schema/publication:** groups 2, 3 and 5. Draft privacy for media, stable media URLs across a text-only publication, accepted-snapshot purchase information, and activation-driven cache invalidation, all through worker tests and a local hosted build. Local results do not prove hosted publication.
- **Boundaries/tooling/instructions:** groups 4 and 6. Gateway and release-build tests in `test:tooling`, the `dist-public` checks, and this change's strict OpenSpec validation.
- **Release/environment:** group 8. Hosted UAT and PRD verification after an authorized release, with the release identity, account usage before and after, and the bounded pilot's measured requests.
- **Shell/player/routing:** not applicable. No shell code changes.
- **Commerce/checkout/stock:** not applicable. The commerce API Worker and its authority are unchanged; the shared Worker-request allowance is protected, not altered.
- **Staff/editor:** not applicable. Staff previews keep using the public object's preview path, and tests cover that route.

## Free-plan availability

Checked 2026-10-03 from primary documentation: [SQLite Durable Objects on Free](https://developers.cloudflare.com/durable-objects/platform/pricing/), [best-effort location hints](https://developers.cloudflare.com/durable-objects/reference/data-location/), [Workers Cache and entrypoint scope](https://developers.cloudflare.com/workers/cache/), [Free-available tag purge](https://developers.cloudflare.com/workers/cache/purge/), and [Images source/options pricing](https://developers.cloudflare.com/images/pricing/). The Free-tier rule records unchanged allowances, monthly source/options accounting and pilot headroom. Activation wiring is complete; availability and controlled local tests do not establish account readiness or native purge propagation.

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

The resumed hosted/image/gate slice reports are in ignored `.codex-artifacts/performance-resume/`; [PERF-006](performance-report.md) reconciles their implementation with actual final tests and builds. Final local `build:public uat` and Wrangler capture use a validated synthetic snapshot of 126 records/120 media, SHA `fb5a04845d3907fe02e4aa0dc58f2c9b8ddc3fa8b1b6eed44c8596a295551b96`, including explicitly local purchase-information wording. Both bundle and image-markup checks pass against `hosted-documents` plus `apps/backend/dist-public/client`; client execution-order wrappers are absent. Capture hashes and release identities are retained in `hosted-documents/capture.json`. This is Local emulation, not a hosted accepted publication; Sharp image-byte models are not Cloudflare bytes.

Repository validation includes restarted actor/cache, media, image service, route allowlist, release gate and purchase override tests. Activation invalidation now also covers real D1/R2 transitions, DO RPC, warm selection races, persisted HTML tags and safe confirmation retries. The parent default-handler tests pass for Local and UAT; only the provider purge boundary is controlled. The installed emulator lacks native purge even with production cache configuration. UAT/PRD failures retain accepted content and pending confirmation; Local can proceed after exact accepted-pointer refresh if no edge cache exists. Native hosted purge and quota-failure crawler acceptance remain open; neither is waived by a local build pass. Raw cache tests and capability observation are under `.codex-artifacts/performance-resume/purge-*`; final source-bound checks are linked by completion-evidence.json.

## Hosted verification

Not yet run. Requires an owner-authorized release and the Free-tier preflight.

## Not verified

Unverified: native/global tag-purge propagation; actual edge hits/Age/304, placement and account-wide usage; real encoding and quota-failure behavior for script-disabled browsers/metadata crawlers. Task 5.1's local source integration is complete and the 30+30 s window stays. Owner release, bounded UAT/PRD pilot, apex smoke and conditional predecessor archival remain open. The retained CI/static publication path changes deployed version identity rather than activating the runtime R2 pointer; it is unchanged and is not claimed as extra runtime-purge coverage.

## Recovery on 2026-10-03

The user later requested commit, rebase, local merge and archival. This change's four delta capabilities are synced and verified against main specs. The archive retains four unchecked acceptance or conditional reconciliation tasks, the short HTML freshness window, and all owner/account/pilot gates. Current integration results and the preserved artifact path mapping are in the sibling's local integration record and `.codex-artifacts/performance-integration-2026-10-03/integration-evidence.json` in the primary checkout. Earlier emulation and timing records keep their original source identities.

After rebase, `build:public uat` and a fresh isolated local capture pass against the same validated synthetic snapshot. Bundle and image-markup gates pass against `rebase-hosted-documents` and the rebuilt `dist-public/client`; raw logs and `rebase-hosted-bundles.json` are retained. This verifies current local output, not hosted activation, encoding, quota behavior or global purge propagation.

The user authorized restoring and continuing `claude/upbeat-mayer-2nikhm` from remote tip `fe099b01cea42266cdf21c2318851af361db1210`, the integration base for all resumed slices. Baseline remains `e818b709a2364aa29dfd54cadcd0433779a1f263`. The sibling's [recovery record](../2026-10-03-improve-site-performance-round-three/validation.md#recovery-on-2026-10-03) records the recovered commits, missing historical raw artifacts, graph/browser setup, parallel file ownership and preorder overlap policy.

`complete-image-delivery` is present and unarchived in this branch; its artifacts remain untouched. Existing commits `a56da66b`, `14f98a5b`, and `119a9952` implement the purchase-information alias correction, media-SHA addressing, canonical image source and recent-media lookup. Their missing acceptance is audited alongside the remaining gateway, direct-image, durable-cache and hosted-build work. The hosted implementation remains Local only: no UAT/PRD request, deployment or provider call is made. Release, bounded UAT pilot, apex cutover checks and closure remain separate pending gates.
