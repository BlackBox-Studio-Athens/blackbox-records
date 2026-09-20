# Acceptance worksheet

Status: local implementation and acceptance passed. Hosted preparation, deployment, and Greek-network acceptance remain pending explicit authorization and hosted evidence.

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

- Target environment / deployment revision: UAT; candidate source is the final locally validated tree at `c320716293ca3a42998c42fa6afebc675b092fe7` before the release commit.
- Authorization or existing release approval reference: explicit user authorization granted in this implementation session on 2026-09-21 for the hosted continuation.
- Account usage observation time and source: 2026-09-20 22:19 UTC; Cloudflare account dashboard for account `2004bfa6f5ad8b48008f1243b195ab61`.
- Remaining Worker requests/CPU allowance: Workers Free showed `5,498 / 100,000` requests today, leaving 94,502 displayed request slots; current-period Workers usage showed 64.59k requests and 194,838 ms CPU. The Free plan limit is 10 ms CPU per request; stop on any CPU/quota warning.
- Remaining Durable Object requests/duration allowance: current-period dashboard totals were 42.26k requests and 1.85k GB-sec, against the displayed Free limits of 100,000 requests/day and 13,000 GB-sec/day. Keep the candidate pilot bounded and stop on any quota warning.
- Remaining D1 reads/writes allowance: current-period dashboard totals were 402.69k rows read and 1.4k rows written, with 14.91 MB total storage; displayed Free limits are 5,000,000 rows read/day, 100,000 rows written/day, and 5 GB storage.
- Remaining R2 Class A/Class B operations and storage allowance: current-period billing totals were 1.62k Class A, 33.55k Class B, and 0.26 GB-month storage; displayed included amounts are 1,000,000 Class A, 10,000,000 Class B, and 10 GB-month.
- Ordinary-service headroom reserved: retain at least half of each displayed daily allowance for ordinary traffic; no automatic retries or unreviewed follow-on batch.
- Local requests/operations measured per page and per preparation batch: the 25-item Local dry run used 1 LIST, 25 HEAD, and 25 GET with 0 PUT; first apply used 1 LIST, 25 HEAD, 25 GET, and 25 PUT; replay used 1 LIST and 25 HEAD with 0 GET/PUT. The `--limit 3` pilot is bounded to 1 LIST, at most 3 derivative HEADs, at most 3 original GETs, and at most 3 derivative PUTs on apply, with at most 120 KiB derivative storage before backup overhead.
- Allowed pilot views/batches and maximum operations, including setup/background/retry overhead: one canonical UAT candidate release, one `--limit 3` dry run, one reviewed `--limit 3 --apply`, and at most 12 Greek timing activations; no further derivative batch without a new budget check.
- Pilot actual use / difference from estimate: pending deployment.
- Stop condition and final remaining allowance: stop on quota warning, failed authentication, unexpected write amplification, retry loop, or any operation/storage total exceeding this worksheet; record final dashboard values after the pilot.

### PRD preflight

- Target environment / deployment revision: pending separate PRD candidate authorization and UAT candidate evidence.
- Authorization or existing release approval reference: not yet established by the UAT authorization above.
- Account usage observation time and source: the same account snapshot is retained above; a fresh PRD worksheet is required before promotion.
- Remaining Worker requests/CPU allowance: use the fresh account snapshot immediately before promotion.
- Remaining Durable Object requests/duration allowance: use the fresh account snapshot immediately before promotion.
- Remaining D1 reads/writes allowance: use the fresh account snapshot immediately before promotion.
- Remaining R2 Class A/Class B operations and storage allowance: use the fresh account snapshot immediately before promotion.
- Ordinary-service headroom reserved: at least half of each displayed daily allowance.
- Local requests/operations measured per page and per preparation batch: same bounded Local evidence above; hosted PRD values are not inferred from it.
- Allowed pilot views/batches and maximum operations, including setup/background/retry overhead: none until separate PRD authorization and a reviewed full-SHA/candidate run are recorded.
- Pilot actual use / difference from estimate: not run.
- Stop condition and final remaining allowance: do not start PRD work without the separate authorization and fresh usage snapshot.

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

| Criterion                 | Required evidence                                                                                       | Result       |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| Static bypass             | No editorial object/D1 involvement for staff HTML/build files; 200 and authorized 304 work              | Not measured |
| Authentication            | Invalid/missing identity, wrong host, and validators cannot disclose private files or thumbnails        | Not measured |
| Image payload             | 25 compact covers total at most 1 MiB; zero original-image requests                                     | Not measured |
| Startup features          | No closed history/editor JS or editor-specific CSS on Overview/Stock/Orders                             | Not measured |
| Independent panels        | Slow/failed orders do not block drafts/publications                                                     | Not measured |
| Greek warm latency target | Per-route median HTML TTFB ≤500 ms; median usable primary content ≤1,500 ms on stable desktop broadband | Not measured |
| Critical asset outliers   | Report every critical asset above 2 seconds; investigate repeated occurrences                           | Not measured |
| Free-tier viability       | Entry CPU within Workers Free allowance; bounded request/storage costs; no quota failures or sessions   | Not measured |

Report first visits individually and each route's three warm samples as median plus minimum/maximum. Do not claim a meaningful p95 from this small pilot. An improvement over the Swiss observations is not a controlled Greek before/after comparison. If possible, collect the same bounded baseline on the current revision before deployment; otherwise label the comparison unavailable and assess the absolute targets.

## Outcome and handoff

- Local implementation: passed for sections 1–6; final fingerprint is recorded in [final-validation.md](../../../.codex-artifacts/reduce-staff-request-latency/final-validation.md).
- UAT hosted functional acceptance: not run; explicit deployment and hosted-batch authorization are still required.
- Greek performance targets: not measured; local Chromium/Firefox contract probes are not a Greek-network baseline.
- PRD promotion and preparation: not authorized and not run.
- Remaining cause and next action: obtain release authorization, complete bounded UAT evidence, then separately obtain PRD promotion/preparation authorization.

Do not mark hosted tasks complete because local tests passed. Do not archive the change with required acceptance outstanding. If external access or approval is unavailable, hand off the verified implementation and list the unchecked hosted tasks explicitly.
