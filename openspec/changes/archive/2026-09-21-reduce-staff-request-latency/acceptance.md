# Acceptance worksheet

Status: local implementation, UAT hosted acceptance, PRD promotion, and final hosted image-sample verification passed. Greek-network latency was explicitly skipped by the user; no Greek performance claim is made.

## Local evidence

Record the final commit/source fingerprint, command result, and ignored evidence path for each check. Run commands from the repository root. Consult `docs/content-workspace.md` and `docs/content-publication.md` for the current fixture/setup requirements. A partial command is not a replacement for full validation.

| Command                                                          | Purpose                                                 | Result                        |
| ---------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------- |
| `pnpm validate:fast --scope all`                                 | Optional iteration feedback                             | Not run; optional             |
| `pnpm build:staff`                                               | Actual staff bundle for hosting/browser checks          | Passed                        |
| `pnpm --filter @blackbox/backend build:cms`                      | Canonical combined build, including no-KV guards        | Passed                        |
| `pnpm --filter @blackbox/backend test:staff-hosting`             | Private static hosting and route/auth regressions       | Passed                        |
| `pnpm --filter @blackbox/backend test:cms-content`               | Native upload and CMS behavior                          | Passed                        |
| `pnpm --filter @blackbox/backend test:cms-render`                | Retained rendering/publication boundary                 | Passed                        |
| `node --import tsx scripts/test-content-workspace.mjs`           | Chromium workspace, network, and payload acceptance     | Passed                        |
| `node --import tsx scripts/test-content-workspace.mjs --firefox` | Firefox workspace acceptance                            | Passed                        |
| `pnpm validate`                                                  | Required complete repository gates against final source | Passed                        |
| `pnpm validate:editor`                                           | Additional staff/editor acceptance                      | Passed (partial editor scope) |

Local evidence:

- [Starting point](../../../.codex-artifacts/reduce-staff-request-latency/starting-point.md) and [routing/hosting evidence](../../../.codex-artifacts/reduce-staff-request-latency/routing-and-hosting.md)
- [Local thumbnail preparation commands and reports](../../../.codex-artifacts/reduce-staff-request-latency/staff-thumbnails/local-fixture-evidence.md)
- [Built-bundle latency contract evidence](../../../.codex-artifacts/reduce-staff-request-latency/content-workspace-contracts.md)
- [Chromium screenshots](../../../.codex-artifacts/content-workspace/chromium) and [Firefox screenshots](../../../.codex-artifacts/content-workspace/firefox)
- Final validation summaries and fingerprints: [final-validation.md](../../../.codex-artifacts/reduce-staff-request-latency/final-validation.md)

The preparation-script checks must run in the repository's normal test gate after implementation; add the smallest necessary test registration. Store test reports, screenshots, timing JSON, and fixture outputs under `.codex-artifacts/`, not in source control. The canonical Local stack and its WebStorm launcher must remain usable.

## Hosted operation budget

Complete separately for UAT and PRD, before repeated probes or preparation. Apply [the Free-tier operating rule](../../../docs/cloudflare-free-tier.md). Missing usage evidence means stay local, not "assume low traffic."

### UAT preflight

- Target environment / deployment revision: UAT; source `7a5f1c342bdcd85713e75c3877428bde729f245b`, Worker version `11616c53-30fa-4257-86fb-d54f3310467f`, Pages deployment `74d0ad0b-f70b-4bda-bc1c-60b7615a13fe`.
- Authorization or existing release approval reference: explicit user authorization granted in this implementation session on 2026-09-21 for the hosted continuation.
- Account usage observation time and source: 2026-09-20 22:19 UTC; Cloudflare account dashboard for account `2004bfa6f5ad8b48008f1243b195ab61`.
- Remaining Worker requests/CPU allowance: Workers Free showed `5,498 / 100,000` requests today, leaving 94,502 displayed request slots; current-period Workers usage showed 64.59k requests and 194,838 ms CPU. The Free plan limit is 10 ms CPU per request; stop on any CPU/quota warning.
- Remaining Durable Object requests/duration allowance: current-period dashboard totals were 42.26k requests and 1.85k GB-sec, against the displayed Free limits of 100,000 requests/day and 13,000 GB-sec/day. Keep the candidate pilot bounded and stop on any quota warning.
- Remaining D1 reads/writes allowance: current-period dashboard totals were 402.69k rows read and 1.4k rows written, with 14.91 MB total storage; displayed Free limits are 5,000,000 rows read/day, 100,000 rows written/day, and 5 GB storage.
- Remaining R2 Class A/Class B operations and storage allowance: current-period billing totals were 1.62k Class A, 33.55k Class B, and 0.26 GB-month storage; displayed included amounts are 1,000,000 Class A, 10,000,000 Class B, and 10 GB-month.
- Ordinary-service headroom reserved: retain at least half of each displayed daily allowance for ordinary traffic; no automatic retries or unreviewed follow-on batch.
- Local requests/operations measured per page and per preparation batch: the 25-item Local dry run used 1 LIST, 25 HEAD, and 25 GET with 0 PUT; first apply used 1 LIST, 25 HEAD, 25 GET, and 25 PUT; replay used 1 LIST and 25 HEAD with 0 GET/PUT. The `--limit 3` pilot is bounded to 1 LIST, at most 3 derivative HEADs, at most 3 original GETs, and at most 3 derivative PUTs on apply, with at most 120 KiB derivative storage before backup overhead.
- Allowed pilot views/batches and maximum operations, including setup/background/retry overhead: one canonical UAT candidate release, the reviewed `--limit 3` dry/apply/replay, one reviewed first-page expansion capped at 25 objects, and at most 12 Greek timing activations; no unbounded continuation or further derivative batch.
- Pilot actual use / difference from estimate: the UAT three-object apply used 1 LIST, 3 HEAD, 3 GET, and 3 PUT with 1,038 derivative bytes; replay used 1 LIST and 3 HEAD with 0 GET/PUT. The reviewed first-page expansion used a dry run of 1 LIST, 25 HEAD, and 22 GET, then 1 LIST, 25 HEAD, 22 GET, and 22 PUT on apply; replay found all 25 valid with no writes. Reports are linked in [UAT hosted evidence](../../../.codex-artifacts/reduce-staff-request-latency/uat-hosted-evidence.md).
- Post-pilot dashboard: Workers 6,289/100,000 requests today and 65.39k requests/195,580 ms CPU current period; Durable Objects 42.7k requests/1.86k GB-sec; D1 424.96k reads/1.52k writes/14.91 MB; R2 1.65k Class A/37.81k Class B/1.45 GB. No quota warning, retry, unexpected write amplification, or paid setting was observed.
- Stop condition and final remaining allowance: the reviewed UAT batches are stopped. The next-page token was invalid across a fresh hosted session, so no second-page write or unbounded retry was attempted. Further UAT derivative work requires a fresh worksheet and explicit bounded review.

### PRD preflight

- Target environment / deployment revision: PRD promotion of reviewed source `7a5f1c342bdcd85713e75c3877428bde729f245b`; candidate run `35541402889` is the successful UAT run.
- Authorization or existing release approval reference: explicit user authorization in this implementation session on 2026-09-21 to push to PRD; scope is code promotion plus the bounded derivative pilot, not catalog mutation, checkout launch, or a plan change.
- Account usage observation time and source: fresh Cloudflare account dashboard snapshot after UAT probes, 2026-09-20 22:46 UTC observation window; account `2004bfa6f5ad8b48008f1243b195ab61`.
- Remaining Worker requests/CPU allowance: 6,289/100,000 requests today, leaving 93,711 displayed request slots; current period 65.39k requests and 195,580 ms CPU. Keep the PRD pilot bounded and stop on any CPU/quota warning.
- Remaining Durable Object requests/duration allowance: 42.7k requests and 1.86k GB-sec current period against displayed Free limits of 100,000 requests/day and 13,000 GB-sec/day.
- Remaining D1 reads/writes allowance: 424.96k rows read and 1.52k rows written current period, 14.91 MB total storage against displayed Free limits of 5,000,000 reads/day, 100,000 writes/day, and 5 GB storage.
- Remaining R2 Class A/Class B operations and storage allowance: 1.65k Class A, 37.81k Class B, and 1.45 GB current-period storage against displayed included amounts of 1,000,000 Class A, 10,000,000 Class B, and 10 GB-month.
- Ordinary-service headroom reserved: at least half of each displayed daily allowance.
- Local requests/operations measured per page and per preparation batch: same bounded Local evidence above; hosted PRD values are not inferred from it.
- Allowed pilot views/batches and maximum operations, including setup/background/retry overhead: one PRD workflow promotion of the reviewed candidate, the reviewed `--limit 3` dry/apply/replay, explicit 25-object continuation pages, and an explicit two-key repair; no catalog or checkout mutation and no unbounded pagination.
- Pilot actual use / difference from estimate: the three-object PRD apply wrote 3 derivatives and replay wrote 0. The first-page expansion wrote 22 derivatives. Three same-session continuation pages wrote 25 derivatives each and replayed with 0 writes. A final two-key repair wrote 2 derivatives after measured placeholder keys were identified. Total derivative writes were 102; original and derivative byte totals per batch and all R2 operation counts are recorded in [prd-hosted-evidence.md](../../../.codex-artifacts/reduce-staff-request-latency/prd-hosted-evidence.md) and [hosted-measurements-2026-09-21.md](../../../.codex-artifacts/reduce-staff-request-latency/hosted-measurements-2026-09-21.md).
- Stop condition and final remaining allowance: the authorized PRD code promotion and bounded derivative preparation are complete. Catalog, checkout, and CMS-cutover mutation jobs were skipped. Preparation stopped after the final 25-row browser sample loaded all 25 derivatives; no unbounded loop or automatic retry was used.

Preparation upper bound per invocation is one LIST plus at most 25 derivative HEADs and 25 original GETs; apply adds at most 25 PUTs. Account for remote proxy overhead and backup retention. Start with `--limit 3`, compare actual use, then explicitly authorize the next bounded batch. GET probes must still be checked for incidental writes. Do not loop until all pages complete.

## Greek-network timing worksheet

Use one initial visit and three warm visits each to Overview `/`, Website `/content/`, and Stock `/stock/`: at most 12 page activations for the first complete pilot, and fewer if the reviewed budget requires it. Do not add automated retries. A warm visit keeps normal browser caching and a valid Access session. The first visit is fresh browser resource state with a valid session; exclude interactive Google sign-in from application timing and report it separately if observed.

Record the same fields for every activation:

- Revision, URL, timestamp, browser/version, device, and viewport.
- Greek city/ISP or equivalent connection description, VPN status, foreground-tab status, cache state, and any throttling.
- Document TTFB, FCP, time to usable primary content, and individual critical script/style request durations.
- API durations per panel, total request count, encoded image-body bytes, and original-image request count.
- Available Ray/trace identifiers and ingress colo; no cookies, tokens, staff emails, or private record contents.
- Relevant entry Worker/object wall and CPU evidence, storage operations, and quota errors if any.

"Usable primary content" means successfully loaded Overview content/publication panels or a loaded/intentionally empty Website/Stock list with its intended controls enabled. A loader, server-rendered default collection, blank hydrated container, or failed API result is not successful completion. Record unexpected API/asset failures as failed activations rather than dropping them or adding replacement samples. Local browser checks should use these same visible states without adding production telemetry.

| Criterion                 | Required evidence                                                                                       | Result                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Static bypass             | No editorial object/D1 involvement for staff HTML/build files; 200 and authorized 304 work              | Passed in UAT and PRD hosted checks                                                                                                           |
| Authentication            | Invalid/missing identity, wrong host, and validators cannot disclose private files or thumbnails        | Passed in UAT pilot; see hosted evidence                                                                                                      |
| Image payload             | 25 compact covers total at most 1 MiB; zero original-image requests                                     | Passed: final PRD reload loaded 25/25 thumbnails, 357,824 encoded bytes, dimensions ≤96 × 96, 25 non-empty alt texts, and 0 original requests |
| Startup features          | No closed history/editor JS or editor-specific CSS on Overview/Stock/Orders                             | Passed in UAT Overview/Stock request capture                                                                                                  |
| Independent panels        | Slow/failed orders do not block drafts/publications                                                     | Not measured                                                                                                                                  |
| Greek warm latency target | Per-route median HTML TTFB ≤500 ms; median usable primary content ≤1,500 ms on stable desktop broadband | Skipped per explicit user instruction on 2026-09-21; no Greek-network claim                                                                   |
| Critical asset outliers   | Report every critical asset above 2 seconds; investigate repeated occurrences                           | Not measured                                                                                                                                  |
| Free-tier viability       | Entry CPU within Workers Free allowance; bounded request/storage costs; no quota failures or sessions   | Passed for the reviewed work: Workers/R2 remained within Free limits, `$0.00` billable usage, no quota warning, and no KV operation observed  |

Report first visits individually and each route's three warm samples as median plus minimum/maximum. Do not claim a meaningful p95 from this small pilot. An improvement over the Swiss observations is not a controlled Greek before/after comparison. If possible, collect the same bounded baseline on the current revision before deployment; otherwise label the comparison unavailable and assess the absolute targets.

## Outcome and handoff

- Local implementation: passed for sections 1–6; final fingerprint is recorded in [final-validation.md](../../../.codex-artifacts/reduce-staff-request-latency/final-validation.md).
- UAT hosted functional acceptance: passed for the canonical run and bounded thumbnail pilot; evidence is [uat-hosted-evidence.md](../../../.codex-artifacts/reduce-staff-request-latency/uat-hosted-evidence.md).
- Greek performance targets: intentionally skipped per explicit user instruction; the controlled connection was Switzerland (`loc=CH`, `colo=AMS`), so no Greek result is inferred.
- PRD promotion and preparation: explicitly authorized and completed through the canonical workflow for source `7a5f1c342bdcd85713e75c3877428bde729f245b`; the final 25-row browser sample passed with all compact derivatives loaded. Evidence is [prd-hosted-evidence.md](../../../.codex-artifacts/reduce-staff-request-latency/prd-hosted-evidence.md) and [hosted-measurements-2026-09-21.md](../../../.codex-artifacts/reduce-staff-request-latency/hosted-measurements-2026-09-21.md).
- Final handoff: all requested non-Greek work is complete. The change is ready to archive with the Greek worksheet explicitly skipped and its performance claim withheld.

Do not mark hosted tasks complete because local tests passed. Do not archive the change with required acceptance outstanding. If external access or approval is unavailable, hand off the verified implementation and list the unchecked hosted tasks explicitly.
