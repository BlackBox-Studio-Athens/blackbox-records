# Design

## Context

See [proposal.md](proposal.md) for scope and [research.md](research.md) for historical costs and official references. The implementation owner is **gpt-5.6-luna / max**. The prototype campaign below resolves the implementation choices; Luna should productize them, not repeat a broad tuning study. Work stays in the normal authorized checkout. The historical research retains earlier candidate ideas; this design supersedes recommendations that were not adopted.

## Prototype evidence — 19 September 2026 UTC

Local prototypes used Node 24.21.0, pnpm 12.0.0, Vitest 4.1.11, Windows, an i5-8600K with six logical CPUs, and 31.9 GiB RAM. Normal source stayed at `a66f6755b3f5ca804cc59ae557c4e8b60087d2af`, fingerprint `90559ea5b6ae9691a72df376c8f1c463d1cd4888fb1538c791eec83284be44da`. Alternate configs and measurement scripts live under ignored `.codex-artifacts/speed-prototype/`; production commands were not changed.

| Experiment                                                                      | Result                                                                                                                             | Decision                                                                                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Unchanged full validator, two controls                                          | 221.2s and 197.6s                                                                                                                  | Use both; the faster control prevents a best-case savings claim                                                   |
| Setup reduction + warm formatter cache, original Worker cap 2 and serial builds | 172.3s, all gates passed                                                                                                           | Removes work before adding concurrency                                                                            |
| Same configuration, Worker cap 3                                                | 160.4s, all gates passed                                                                                                           | Adopt on the measured class of Local host; keep CI cap 2                                                          |
| Selected configuration, also overlapping web/staff builds                       | 150.4s and 150.3s; both passed                                                                                                     | 23.9% against the faster control; 28.2% midpoint reduction across two controls/two repeats. Adopt.                |
| Isolated formatter check                                                        | 17.9s uncached / 18.7s cold cache / 8.0s warm cache                                                                                | Adopt native content cache; cold cost and wrapper invalidation still count                                        |
| Isolated web split                                                              | 108 files / 551 assertions without MSW, 1 file / 15 assertions with MSW; 17.5s total commands                                      | Adopt explicit split with network rejection; do not compare isolated timing directly with a loaded full-run phase |
| Parallel web/staff build                                                        | Both passed; longest child 25.9s, wrapper 29.5s; serial full-run build phases 31.4–35.5s                                           | Adopt; existing package and route checks remain                                                                   |
| Staff browser fixtures                                                          | Serial wrapper 105.8s / parallel wrapper 53.9s; both browsers and preview policy passed                                            | Adopt bounded two-browser overlap                                                                                 |
| Restore with twelve media objects and synthetic 100ms read latency              | Serial 1,366ms / four-wide 354ms; both 14 requests; failed first batch settled all four, started no next batch, accepted no output | Adopt mechanism; this is not a Cloudflare latency forecast                                                        |
| Live-request rejection                                                          | Two pure-group checks and one MSW unhandled-request check passed                                                                   | Preserve both guards                                                                                              |

All full prototype runs retained **1,526 identical Vitest assertion identities and 69 passing Node tests**, stable normal-source fingerprints, all seven phases, and existing build checks. The backend move covers exactly **21 files / 235 assertions**: Worker inventory changes from 77 files / 564 assertions to 56 / 329; Node changes from 47 / 302 to 68 / 537. No assertion bodies were changed.

Controls: `.codex-artifacts/validation/2026-09-19T20-30-52-652Z-42152/` and `2026-09-19T20-51-56-249Z-21656/`. Prototype records/logs/native reports are under `.codex-artifacts/speed-prototype/{full-w2,full-w3,selected-1,selected-2,formatter,web-probe,network-guards,builds-parallel,browsers-serial,browsers-parallel}/`; full evidence is linked by each `validation.json`. `comparison.json`, `pilot-summary.json`, and `media-results.json` record comparisons. Prototype scripts are reproducible sketches, not committed infrastructure or completion evidence for a future implementation.

This was a bounded pilot: two controls, two chosen-configuration repeats, and one run of each intermediate profile. It is not a five-sample statistical campaign. Source-tree caches were retained; fresh and fast-all performance were not timed directly. The desktop was not an isolated benchmark host. No hosted request, deployment, or paid resource was used. Do not add overlapping phase savings or extrapolate synthetic media timing to end-to-end CI.

## CI evidence — 20 September 2026 UTC

Read-only GitHub history, two targeted job logs, the 9.7 KB smoke artifact, and small local prototypes used **zero new Actions runs/minutes**. Five historical successful UAT attempts took 1,328 / 1,227 / 1,365 / 1,293 / 1,442 seconds from first job start to last required completion: **median 22m08s**, range 20m27s–24m02s. They span revisions and are discovery evidence, not automatically a controlled acceptance baseline. The newest PRD promotion executed in 196s; its longer run wall clock includes waiting behind UAT's shared lock.

Latest UAT run [35448603778](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35448603778), source `a66f6755b3f5ca804cc59ae557c4e8b60087d2af`, has a serial chain: build candidate 847s → inspect Pages 77s → deploy Worker 102s → deploy static 105s → smoke 300s. Only 11s lies between jobs. The 22-minute problem is chiefly execution, not runner queueing.

| Existing CI evidence     | Result                                                                                              | Selected change                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Paid-order polling       | Both concurrent paid scenarios spend 120.4–120.7s polling; their entire scenarios take 144.9–145.7s | Fix the poll's success predicate, preserving final acceptance                       |
| Astro image generation   | UAT: 1,103 images, 92.793s, no hits. Later PRD: 1,103 hits, 0.293s                                  | Persist only the native image asset cache; measure cross-run net savings            |
| Repeated bundle transfer | 793,132,130-byte artifact; four downloads consume 125s total, upload 32s                            | Transfer each identical file content once; reconstruct the complete existing bundle |
| Inspection job setup     | pnpm setup 8s, cached Node setup 14s, install 9s, verification 5s                                   | Keep pinned Node but omit pnpm/install/store-cache setup in this built-in-only job  |
| Dependency install       | Candidate install already takes 8s with a restored pnpm store                                       | Keep current native store caching; no node_modules cache                            |

The artifact's central directory and existing manifest were read with explicit byte ranges: **965,624 bytes**, not a full 793 MB download. Manifest hashes show 3,098 distinct contents: 891.6 MB logical file bytes reduce to **330.2 MB unique bytes**. Matching existing ZIP entries suggests **about 268 MB compressed payload** before new headers/metadata. This is a byte estimate, not a measured full compact upload. Major image bytes currently repeat across UAT/PRD and original/imported paths.

The compact-transfer fixture uses three actual images whose hashes match this CI artifact. Its 29 logical files / 15 unique objects shrink **47.3 MB → 11.8 MB**; pack took 47ms and restore plus the existing bundle verifier 166ms. Round-trip, corrupt-object and traversal checks passed. Compression level 1 took 212ms versus level 6 at 237ms, with only 0.14% more compressed bytes on that sample. This supports a small transport helper, not a new archive format/library or generalized content store.

The fake-clock poll prototype executes the real extracted function and exported final acceptance predicate. Already-paid state takes 120,000ms and 120 public reads before the fix; the proposed predicate takes 0ms, one public read and one existing D1 enrichment read. Delayed payment waits 3,000ms; a never-paid order still waits the complete 120,000ms. Missing checkout projection still fails final acceptance.

Provider correlation was then checked read-only in the BlackBox Chrome profile. Stripe's sandbox webhook destination shows **both exact `20260919144440` scenarios delivered with HTTP 200 at 14:45:07–08 UTC on 19 September**. CI's scenario evidence finishes at 14:47:10. Cloudflare's matching four-minute `/api/stripe/webhooks` query shows 16 successful log events, zero error events, and UAT Worker records at 14:45:07.710 and 14:45:08.149 UTC. Those events include internal calls, not 16 separate payments. This corroborates roughly two minutes of avoidable client waiting after successful delivery; it does not measure the exact first public paid-state read or prove the future end-to-end release gain. No events were resent or payments created. The Stripe connector needed reauthentication and the Cloudflare API returned 403; existing signed-in dashboards supplied the evidence.

Evidence/sketches: `.codex-artifacts/ci-speed-analysis/2026-09-20-follow-up/` contains `critical-path.json`, targeted logs, `artifact-index.json`, `release-manifest.json`, `duplication.json`, `image-stages.json`, `poll-prototype.mjs`, `poll-candidate.ts`, `poll-results.json`, `transport-prototype.mjs`, `transport-results.json`, and `provider-browser-evidence.md`. These are local research records, not production changes.

## Goals / Non-Goals

**Goals:** implement the measured Local configuration, reuse complete checks in CI, remove serial waits in independent preparation, and measure actual outcomes without losing correctness or evidence.

**Non-Goals:** application/runtime changes; affected-only completion; test deletion; disabled storage isolation; cached test results or final lint; new dependencies; generic schedulers; more concurrency profiles; changed release credentials/locks/targets; partial target artifacts; paid/custom runners; extra matrix jobs; agent/token campaigns; benchmark-only hosted releases.

## Decisions

### 1. Preserve comparable evidence with existing tools

Extend `scripts/benchmark-validation.mjs` minimally for aggregate-versus-aggregate and same-checkout capture/compare. Preserve its legacy/two-directory interface. Reuse summary/log/statistics helpers; do not create another framework. Evidence must reject outer-success/inner-failure, missing phases, partial-as-full, changed source, incompatible tools/machine/scenario, and overwritten campaigns. Record failed/interrupted attempts, priming, cache state, source identities, and complete test inventories.

Freeze three warm baseline runs before implementation; retained controls can be reused only if source differences are reviewed as documentation-only and machine/tools/conditions still match. Run three final warm candidate samples after selecting the already-prototyped configuration. One matched fresh pair and one fast-all pair are diagnostic non-regression checks, not median claims. Warm priming is outside timing. Fresh cleanup uses the existing reviewed generated/cache allowlist, extended to the formatter cache; verify resolved in-workspace, ignored, non-tracked paths, and never clear pnpm storage or persistent D1/R2.

Use the existing GitHub tooling and Node built-ins for a small read-only release timing collector. Read a bounded declared window with pagination and attempt-specific jobs. Keep execution (first relevant job start through last required completion), available queue time, manual rerun gaps, UAT/PRD/catalog/diagnostic classification, conclusions, workflow/source revision, job seconds, and available content/cache/artifact metadata separate. Missing data is unavailable, never inferred. CI acceptance uses five comparable successful baseline and five post-change UAT attempts plus all conclusions in the window. Use natural releases only; do not dispatch to fill samples. Reuse the saved raw history before another API query. Historical revisions/content must be reviewed for comparability; five arbitrary successes are not a baseline.

Cheap Linux confirmation: allow **one optional shadow pack/restore/verify probe, capped at 60 seconds**, inside the next already-authorized ordinary candidate job, using its already-built bundle in separate temporary directories. It uploads only tiny timing results, never a duplicate bundle, and triggers no build, payment or deployment. Timeout/failure records an inconclusive result and leaves the canonical original bundle untouched; it cannot establish optimization success. Once compact transport is active, its ordinary round-trip verifier is the gate and no shadow run remains.

Add small timing fields to existing evidence/step summaries for image hits and phase duration, cache restore/save, pack/restore/verify bytes/time, first paid-state observation and poll count. Reuse existing smoke timers and GitHub step timestamps; no profiler service, tracing deployment, background collector or benchmark matrix. Diagnostic overhead is included in reported release time. The first natural image-cache run populates it; the next compatible natural run supplies the warm observation. Do not force cache eviction or duplicate builds for a cold/warm CI matrix.

If provider timing remains unclear, inspect the existing sandbox webhook delivery and matching narrow Cloudflare log window. Use current retained evidence first, never replay events or create another payment just for measurement. Keep secrets and checkout/customer payloads out of reports. Dashboard access is sufficient when a connector cannot authenticate.

### 2. Productize the proven test split

Backend: add the 21 current `test/application/**/*.test.ts` and `test/domain/**/*.test.ts` files to the existing Node selection. Freeze them as explicit file entries after reviewing the retained inventory; do not classify future files implicitly. Share this one selection between existing Node includes and Worker excludes, preferably through an export from the existing config rather than a new selection framework. Every unclassified backend file still defaults to Workers. Keep D1/R2/DO, `SELF`, execution-context, fetchMock, Worker SDK-shape and remaining integration tests under workerd with per-file storage isolation. A collection check must prove disjoint sets with the same union, including a newly added unclassified fixture.

Web: use the tested two-invocation shape. The existing config becomes the 108-file lightweight group; a small request config reuses its base settings but selects only `src/lib/backend/public-checkout-api.test.ts` and the original MSW lifecycle. Remove that file's exclusion when deriving the request config. Wire both `test` and `test:unit` to run both groups; keep scoped commands and root contracts correct. Use distinct native reporter names so neither group overwrites the other.

The lightweight setup rejects unmocked `fetch` and Node HTTP/HTTPS request/get calls, restores globals after the file, and synchronizes named built-in exports. The prototype is `reject-network.mjs`. Actual request tests retain `onUnhandledRequest: 'error'`, handler reset and shutdown. Keep the three tested network-rejection cases as the regression check. No per-test concurrency, shared mocks/storage, skipped assertions, or timeout reductions.

### 3. Pin the measured scheduling choices

Keep existing workspace overlap and Node/web worker caps. Backend Workers use **3 on Local hosts with at least six logical CPUs and 24 GiB RAM; 2 otherwise, including CI**. Expose a validated 1–3 override for diagnosis, not an auto-tuner. Record the effective value. The lower-resource/CI default preserves the known two-worker behavior; Local adoption is grounded in the six-core/32-GiB prototype. Do not add the former P0/P1/P2 profile menu or overlap backend Node/Worker processes.

Retain the full runner's tests/checks overlap and build prerequisite. Retain fast mode's existing phase order; it benefits from the same test split. Keep `--jobs 1` as phase-level diagnosis; it does not serialize nested test pools.

Reuse `runFiniteCommand` with one explicit `Promise.allSettled` group for web/staff builds, preserving both package post-checks and route checks. Both outputs must finish before packaging. Similarly overlap exactly Chromium and Firefox after staff build and preview-policy success; each uses its existing process-local fixture, port `0`, and browser-specific evidence directory. Never use `--serve`.

Join every child outcome and stop/settle children on cancellation. Test injected failure and cancellation using existing process/validator tests. Preserve a serial diagnostic fallback. UAT/PRD builds and CMS builds that share output/configuration paths remain ordered. Keep the existing serial downstream job graph, distinct deployment jobs, credential contexts, and shared non-cancelling release/publication lock.

### 4. Cache only native formatting results

Wrap the installed Prettier CLI with `--check --cache --cache-strategy content`, using `node_modules/.cache/blackbox-validation/`. The cache filename includes a digest of lockfile, root package metadata, formatter config/ignore/editorconfig and referenced local plugin/config implementation, plus runtime/platform identity. Native content/config checks still own per-file validity. If identity is unavailable, fail clearly or run uncached.

Keep `format:check:uncached` as direct `prettier . --check`; never narrow the file set. Test same-timestamp byte edits, config/ignore/plugin/tool changes, malformed cache, and a warmed-cache formatting failure. A corrupt-cache retry may discard only that cache and run once uncached; never retry formatting errors into success. Final ESLint remains uncached.

### 5. Reuse full prerequisites in CI

Add `validate:checks` / `--checks` using explicit named phase groups in `validate.mjs`; replace the `phases.length === 7` scheduling condition. Checks mode executes every unit/check leaf, emits `mode: partial, scope: checks`, and rejects fast/editor/package-scope combinations. It performs no build. Preserve full/fast/editor source evidence and status distinctions.

Replace only candidate serial test/check steps with this command, then retain unused audit, target restores/builds, Worker/renderer preparation, previews, packaging/upload and hosted acceptance. Apply the chosen build/browser overlap without changing target variables or source/content/artifact identity. Upload failed validator logs/native reports separately from the promotable bundle.

The `inspect-uat-pages` job invokes only `node scripts/release-candidate.mjs verify uat`, whose imports are Node built-ins. Remove its pnpm setup, dependency install and setup-node pnpm cache; keep its pinned Node, checkouts, artifact download and complete verification. Other jobs retain their dependencies. Its existing 31 seconds of setup is a savings opportunity, not a measured 31-second win: Node setup still runs.

Update workflow and environment contract tests to assert gate leaves and dependency order. Preserve downstream IDs/`needs`, environments, credentials, promotion inputs, retention, and PRD retained-artifact promotion without rebuilding.

### 6. Use four-wide media batches

Modify only the media loop in `restorePublishedContent`: iterate `[...media]` in slices of four, run each slice with `Promise.allSettled`, await every result, and throw before scheduling another batch if any read failed. The executable sketch is `restore-batched.mjs`, generated by `media.mjs` from the original function.

Retain the initial public identity and authenticated snapshot reads, target/schema checks, digest deduplication, auth headers, redirect refusal, timeouts, streaming byte checks, request preflight and 256 MiB total limit. No automatic retries. Write completed snapshot/identity only after every object succeeds. Keep UAT/PRD restores sequential. Successful CMS requests remain `1 + unique media count`, plus the separate public identity read.

Port the local fixture checks into `capture-cms-snapshot.test.mjs`, including concurrency bound, unchanged count/output, current-batch settling, no next batch and no accepted identity on failure. Hosted observation follows the Free-tier operating rule and existing release authorization; synthetic timing is not hosted evidence.

### 7. Reuse Astro's native image cache across ordinary releases

The real CI cold/warm pair now justifies the previously deferred cache. Restore/save only `apps/web/node_modules/.astro/assets/` with native `actions/cache/restore@v6.1.0` and `actions/cache/save@v6.1.0`, following the repository's pinning style. Restore after dependency installation and before the first target build; save once after all build/preview gates succeed. Keep shared-path UAT/PRD builds sequential.

Use a versioned compatibility prefix covering OS, architecture, Node, lockfile, web package/config and any referenced image-service implementation. Append source SHA and run ID to the save key, with the compatible prefix as restore fallback, so later published-image sets can populate a fresh immutable cache. Native Astro source/transformation keys still decide individual hits; source SHA alone is insufficient because content changes independently. Test one changed image and one changed transformation locally against uncached output. Never cache `data-store.json`, `dist`, authenticated snapshots, drafts, `.wrangler`, or credentials. A miss still performs the full build; unusable cache must regenerate safely or fail, never accept stale output.

Record actual restore/save time and bytes. Current GitHub caches total 1.59 GB; the accumulated Local image cache is 492 MB, not a measured fresh CI cache. Skip saving above 600 MiB or when current repository cache capacity would require paid storage. Keep existing storage limits; no paid allowance or cleanup service. Enable persistence only if the next compatible natural cold/warm observations show **at least 30s net saving including transfer/save overhead**; otherwise remove persistence and keep native within-job reuse. The observed 92.5s compute difference is not a net cross-run promise.

Sources: [Astro asset caching](https://docs.astro.build/en/guides/images/#asset-caching), [GitHub cache behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching), [cache v6.1.0](https://github.com/actions/cache/releases/tag/v6.1.0).

### 8. Stop polling when the required order state arrives

In `scripts/smoke-stripe-sandbox.ts`, `waitForRemoteOrderAfterCheckout` calls `didScenarioPass` without the checkout projection. Paid scenarios requiring that projection therefore cannot break early. Inside that loop, use `latest.status === 'paid'` for the paid scenario's wait predicate; retain the existing non-paid behavior. Keep the existing D1 enrichment/fallback and complete timeout for genuinely pending orders.

Leave `didScenarioPass` and final surface/projection/amount/shipping checks authoritative and unchanged. Add one focused fake-clock regression covering ready, delayed, never-paid and non-paid cases plus missing-projection final rejection. Record first-paid observation and poll count in existing timing evidence, without secrets. Do not shorten the timeout, create extra payments, raise the already-two scenario concurrency, or weaken final acceptance. The exact executable sketch is `poll-candidate.ts`.

### 9. Transfer repeated bytes once, then verify the complete bundle

Extend existing `scripts/release-candidate.mjs` with small pack/materialize operations using Node filesystem and crypto helpers. Reuse the existing schema-2 manifest and its file-to-SHA mapping: transfer `manifest.json`, a version-1 transport marker, and one regular file `objects/<sha256>` per distinct content. Keep `release-<sha>`, artifact retention, both complete targets and the existing native upload/download actions. Use ZIP compression level 1. Do not introduce a registry, third-party archive dependency, cross-release object store, target splitting or selective verification.

Before packaging, retain all current inventory/verification gates. After download in every consumer, materialize into a fresh, separate bundle directory; then run the unchanged full bundle/file/target/source/content verification before using any output. Preserve manifest bytes and every logical target file. Validate marker version, manifest shape, relative paths, unique destinations, sizes, hex digests, and resolved in-root destinations before writing. Reject missing, corrupt or unexpected objects, duplicate paths and symlinks. Copy regular files rather than hardlinking shared contents. Failure leaves no accepted partial bundle.

With no marker, accept only the fully verified legacy directory layout. Keep this compatibility for retained seven-day candidates, including PRD dispatch using the candidate SHA's helper: the packer/materializer must ship in that same source revision before it produces compact candidates. Verify the newly added marker/objects and reconstructed tree without treating the marker as authority or bypassing the existing manifest checks. Retain exact PRD candidate run/workflow/SHA authorization and no-rebuild promotion.

Port the compact fixture's round-trip into existing release-candidate tests, covering both targets, legacy input, tampered/missing/extra objects, path escape, duplicate destinations and symlinks. Integrate materialization wherever the workflow downloads/uses a candidate, including PRD promotion; keep diagnostic artifacts separate. Collect actual full-bundle bytes and total pack/upload/download/materialization/verification time during normal releases. Byte reduction alone is not latency acceptance.

The installed upload-artifact v7.0.1/download-artifact v8.0.1 already support newer transfer options. Unarchived upload was considered but is unnecessary here: keep their standard ZIP transport and use [native compression tuning](https://github.com/actions/upload-artifact). Larger runners, ARM migration, extra sharding, and more pool tuning remain outside this bounded change.

## Acceptance and decision rules

| Metric                     | Required result                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warm full Local validation | Three comparable baseline/candidate runs; median at least **20% lower**, with unchanged full gates/assertion inventories and p75 no more than 10% higher. The pilot's observed range is evidence, not a guaranteed 40% reduction. |
| Fresh full and fast-all    | One comparable pair each, preserved cache labels and correctness; no more than 10% regression. Repeat only if noisy or failing. No unmeasured 30%/25% speed claim. Fast remains partial.                                          |
| Browser preparation        | Both browsers pass together with distinct state/evidence and correct prerequisites; report observed serial/parallel wall time including wrapper overhead.                                                                         |
| UAT execution              | Five comparable successes per cohort, all attempts visible; median must improve, p75 and total job seconds must not regress by more than 10%. Report actual gain; the previous 35% forecast is not a demonstrated threshold.      |
| Reliability and cost       | No lost assertion, weakened check/isolation, false success, repeatable new failure, or increase in successful-path hosted requests for identical content.                                                                         |
| PRD control                | Existing safety/retained-artifact checks pass; available comparable timings must not regress over 10%. Sparse evidence is low-confidence; no benchmark-only promotion.                                                            |

For compact transport, require a full logical-file hash round-trip and at least 50% fewer stored payload bytes on the current representative bundle; its actual end-to-end transfer cost must improve. For paid polling, ready state must finish within one iteration, delayed/pending cases retain their semantics, and final projection failures remain failures. Image persistence follows decision 7’s net-saving rule. These component checks do not replace the five-natural-run release acceptance.

Run focused checks per slice, final uncached formatting, validator/process acceptance tests, `validate:editor`, and affected publication/build checks. A final full candidate sample can satisfy `pnpm validate` only if it matches the exact final tree. Preserve legacy command contracts without rerunning equivalent full suites solely for ceremony. Reports/task edits change fingerprints: finish them before the final gate.

Document accepted changes and measured results in `performance-report.md`, preserving raw ignored evidence and this pilot's limitations. Do not silently weaken a missed threshold. Local implementation can be verified while hosted performance acceptance remains pending; do not archive as a proven CI improvement until the natural-run evidence exists.

## Risks / Trade-offs

- Runtime movement can hide platform behavior → freeze the proven 21-file set, retain integration/SDK cases, and compare complete collections.
- Missing MSW could allow live requests → retain both network guards and lifecycle tests; new request tests must join the explicit request selection.
- Extra processes can contend or overwrite output → fixed caps, separate existing write sets, complete child joins, and serial fallback.
- Cached formatting can become stale → native content checks, explicit tool/plugin/config identity and uncached parity.
- Four hosted reads increase instantaneous load → fixed bound, no retries, unchanged budgets, Free-tier review.
- Corrupt transport or stale image reuse can hide wrong output → reconstruct all files, retain manifest verification, validate every transport path/object, and test native image invalidation.
- Early polling completion could be confused with acceptance → only the wait predicate changes; final paid/surface/projection checks stay required.
- Small pilots and desktop noise limit certainty → report both controls/repeats, use conservative acceptance, and separate Local evidence from hosted results.

## Migration Plan

Implement the ten ordered tasks; no application/database/secret/URL migration or Local stack launcher change is required. Validate final ordinary commands rather than treating ignored prototype wrappers as production completion.

Rollback each optimization independently: restore formatter uncached operation, Worker cap 2, original pool/setup selection, serial build/browser groups or serial media loop. Disable image persistence independently. Return new uploads to the legacy full-directory format while retaining compact-reader compatibility for already-created candidates until expiry. The poll fix is a correctness repair: preserve final gates rather than restoring the known two-minute wait. Keep failures/evidence and all release authority checks. Do not restore production data or bypass gates to improve timing.
