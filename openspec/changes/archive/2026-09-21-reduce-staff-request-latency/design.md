# Design

## Context

See [proposal.md](proposal.md) for the problem and scope. This design is a handoff for a Luna agent at max reasoning: follow the numbered decisions and tasks in order, reuse the named seams, and leave hosted tasks incomplete until their evidence exists.

The staff frontend is a static Astro build packaged inside the combined CMS Worker. `run_worker_first: true` sends even static requests through the entry Worker. The entry currently forwards them to the single `CmsRuntime` object, which authenticates and eventually calls `ASSETS.fetch`. CMS operations need the object for the existing Free-tier CPU arrangement; serving a static file does not.

### Retained diagnosis from 2026-09-20

| Observation                       | Evidence                                                                               | Interpretation                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Overview cold document            | HTML TTFB 3,523 ms; FCP 4,616 ms; React reads start at 4,869 ms                        | Waiting for the document and code delays useful work.                                                           |
| Website document and code         | HTML 128 ms; FCP 424 ms; script requests including 304s about 3,207–3,278 ms           | A fast document does not ensure a fast hydrated application.                                                    |
| One correlated JavaScript request | Entry Worker wall 3,130 ms / CPU 0 ms; editorial object wall 9 ms / CPU 2 ms; edge AMS | The observed delay was outside the short object handler. It is not evidence of three seconds of JavaScript CPU. |
| Stock compact covers              | 25 images, 30,924,055 decoded-body bytes, displayed about 48 × 48 CSS pixels           | Original image payloads are excessive for their display size.                                                   |
| Overview reads                    | Workspace 1,259 ms; order summary 1,401 ms; publications 218 ms                        | Independent panel rendering can show completed work sooner.                                                     |

The correlated request was `/_astro/ContentApp.BHGIrzbK.js`, Ray `a3e21a8f1a3adf99`, trace `1db7004f6603a1ccf5b65353fa056cb1`. The trace had no sampled spans explaining the dispatch gap. These observations used Swiss egress through AMS, **not a Greek baseline**. A background-tab sample with approximately 48 seconds to paint is excluded. There is no established quota-throttling diagnosis. The optional raw local report is `.codex-artifacts/staff-performance-2026-09-20/diagnosis.md`; this document retains the essential evidence so implementation does not depend on that ignored file.

### Existing seams and pitfalls

| Area                      | Start here                                                                                                                          | Detail to preserve                                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry routing             | `apps/backend/src/cms/index.ts`                                                                                                     | Published media, token export, public API, internal API, workflow, and CMS admission have different rules.                                                                        |
| Identity and asset policy | `apps/backend/src/cms/auth.ts`, `staff-assets.ts`                                                                                   | Reuse `authenticate` and `staffAssetResponse`; do not invent another verifier or cache policy.                                                                                    |
| Upload                    | `apps/backend/src/cms/media-upload.ts`, `apps/staff/src/lib/backend/editorial-api.ts`                                               | Existing original limits: 20 MiB and 100 million pixels; validation checks magic bytes, extension, dimensions, multipart bounds, and fields.                                      |
| Native media              | Installed EmDash 0.38 `src/astro/routes/api/media.ts`                                                                               | Native POST returns `data.item.storageKey`; duplicate uploads can return 200. Its supplied `thumbnail` makes a blur placeholder but is **not persisted as a display derivative**. |
| Private R2                | `apps/backend/astro.config.mjs`, `cms-resources.json`, `scripts/cms-backup.mjs`                                                     | Reuse the environment's `MEDIA` binding and existing local/remote proxy pattern.                                                                                                  |
| Compact artwork           | `ContentApp.tsx`, `stock/StockOperationsApp.tsx`                                                                                    | These currently call `editorialMediaUrl` for small rows. Do not change original-media behavior globally.                                                                          |
| Shared content metadata   | `content/ContentFields.tsx`                                                                                                         | `contentSections` and `ContentSection` live with editor components. `ContentBodyEditor` is **already React-lazy**.                                                                |
| Shell and Overview        | `apps/staff/src/components/StaffShell.tsx`, `StaffOverview.tsx`                                                                     | Shell eagerly imports history; Overview imports editor labels and waits for all three requests before clearing shared loading.                                                    |
| Existing checks           | `apps/backend/test/emdash/staff-smoke.mjs`, `staff-assets.test.ts`, `staff-workspace.test.ts`, `scripts/test-content-workspace.mjs` | Extend the existing checks rather than introducing another browser harness.                                                                                                       |

## Goals / Non-Goals

**Goals:** remove the editorial object from authenticated static delivery; bound compact image bytes; make initial dependencies and independent reads match the feature being used; produce honest local and hosted acceptance evidence.

**Non-Goals:** change cloud plans, resource location, database schema, public routing, CMS revision semantics, launch gates, cache freshness windows, or the editor's navigation model. Do not add Cloudflare Images, KV, sessions, a service worker, another router, or a new dependency. Do not alter other active OpenSpec changes.

## Decisions

### 1. Authenticate static requests in the entry Worker, then use ASSETS directly

Edit the entry `fetch` in `apps/backend/src/cms/index.ts`. Keep the existing early published-media handler, `ec_pat_` rejection, public API dispatch, hosted hostname check, and internal commerce dispatch in their current precedence. After those exclusions, classify only GET/HEAD requests outside `/_emdash/` and `/api/` as staff static requests. Explicitly exclude the existing publication workflow paths and token-export paths even if a future path moves.

For that static branch, call the existing `authenticate(request)` before `bindings.ASSETS.fetch(request)`, then wrap the response with `staffAssetResponse(request, response)`. Authentication failure uses the existing private/no-store 403. Reuse the existing module-cached JWK verifier. Avoid duplicate authentication for Local static requests when rearranging the existing Local check. Remove the now-unreachable static serving branch from `CmsRuntime.fetch`; do not move the native CMS handler or its initialization into the entry Worker.

| Request class                                       | Destination after this change                           |
| --------------------------------------------------- | ------------------------------------------------------- |
| Existing published media                            | Existing published-media handler, unchanged             |
| Existing public `/api/*`                            | Existing `CommerceRuntime`, unchanged                   |
| `/api/internal/*`                                   | Existing hostname and commerce authorization path       |
| Valid private thumbnail GET/HEAD                    | Entry identity check, then one `MEDIA` read; decision 2 |
| Staff HTML and build assets GET/HEAD                | Entry identity check, then `ASSETS`                     |
| CMS API, original media, workflow, supported export | Existing `CmsRuntime` and route-specific authorization  |
| Unsupported CMS routes and methods                  | Existing denial; never turn these into asset fallbacks  |

Keep `run_worker_first: true`. Do not enable `assets.not_found_handling` SPA behavior. Preserve the exact `staffAssetResponse` classification: eligible hash-named scripts/styles/fonts with validators are `private, no-cache, must-revalidate`; HTML, query-bearing/ineligible responses, errors, and cookie-bearing responses remain `private, no-store`. Authorization must run before both 200 and 304, including conditional HEAD. No new cache TTL or authenticated-content CDN cache is needed.

**Why:** the existing platform binding is sufficient. Making assets public, bypassing the Worker, or caching private HTML would break the established security/cache contract. Free hosting helps with asset proximity but does not remove an application-imposed object hop. Worker-first requests still count as Worker requests.

### 2. Use one fixed private thumbnail format and route

Create `apps/backend/src/cms/staff-thumbnails.ts` for the small, shared key/validation/storage functions used by upload handling and the preparation script. This is a concrete module, not a provider interface.

| Contract          | Fixed choice                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Image             | PNG; preserve aspect ratio; at most 96 × 96; never upscale                                                                      |
| Byte bound        | 40 × 1,024 bytes, validated before storage and response                                                                         |
| Original key      | Native flat storage filename matching `^[A-Za-z0-9][A-Za-z0-9_-]{0,159}\.(?:png                                                 | jpe?g | webp)$` case-insensitively |
| Derivative R2 key | `staff-thumbnails/v1/<original-storage-key>.png`                                                                                |
| Private URL       | `/_emdash/api/blackbox/thumbnails/<encoded-original-storage-key>`                                                               |
| Response          | GET image/png or HEAD metadata; `Cache-Control: private, no-store`; `X-Content-Type-Options: nosniff`                           |
| Errors            | Malformed key/query 400; absent/invalid derivative 404; unsupported method 405; failed authentication 403; all private/no-store |
| Missing artwork   | Existing fixed-size visual placeholder; no fetch of the original as fallback                                                    |

Reject path separators, traversal, control characters, double-encoding tricks, and unsupported extensions. Decode once and validate; never accept an arbitrary R2 path. Unsupported legacy keys get a placeholder and a preparation report entry rather than a more permissive path parser. Originals produced by the current native upload use flat generated IDs and extensions; test the existing hyphenated local fixture keys too.

Handle the exact thumbnail prefix in the entry Worker before the remaining `/_emdash/` dispatch. Authenticate and require the normal editorial role (at least 30), including for malformed or missing objects. Do not admit token-export credentials to this route. GET performs one R2 `get`, HEAD one `head`; neither performs a source lookup, D1 query, object dispatch, transform, PUT, or session operation. Validate stored content type, size, and generated dimension/version metadata; for GET also check the bounded PNG header. Do not return raw exception details. Keep original-media routes unchanged.

The 96-pixel maximum covers a 48-CSS-pixel row at 2× display density. Twenty-five maximum-sized bodies total 1,024,000 bytes, below 1 MiB. Larger editor previews retain their original-image behavior. A bigger derivative family can be proposed separately if a measured larger display needs it.

### 3. Persist upload thumbnails without replacing native media ownership

In `editorial-api.ts`, change the existing Canvas thumbnail maximum from 64 to 96 pixels, still PNG and without upscaling. Keep the original upload and validation contract. Canvas failure must retain the existing actionable upload behavior; do not introduce silent original-image row fallback.

In `media-upload.ts`, return the already parsed validated thumbnail information to the caller instead of parsing another full multipart copy. Preserve all current original validation and bounds. A thumbnail accepted by the existing native contract but exceeding the new display bounds remains usable by native metadata processing; it simply does not qualify for derivative storage. This preserves compatibility with other existing upload callers.

In the exact `POST /_emdash/api/media` branch of `CmsRuntime.fetch`, retain the validated candidate, call the native handler, and only on a valid successful native response use **the returned** `data.item.storageKey` for the derivative. Handle both 201 new media and 200 native deduplication. Await the single bounded R2 PUT before returning, then retain the native response body/status and private headers. Store generated dimension/version metadata with the PNG. Never use a request-supplied destination key, patch EmDash storage ownership, or add thumbnail columns to D1.

If the native upload fails, create no derivative. If only derivative storage fails, preserve the successful upload, log a bounded diagnostic without credentials or user content, and allow the row placeholder. Preparation can repair the derivative later. No automatic retry loop or background job.

### 4. Prepare existing media with a bounded local Node script

Create `apps/backend/scripts/prepare-staff-thumbnails.mjs`, using Node `parseArgs`, already installed `sharp`, the shared derivative contract, and the `getPlatformProxy`/temporary-config cleanup pattern in `cms-backup.mjs`. Bind **only MEDIA**, from `cms-resources.json`; do not reuse backup execution, export SQL, attach D1, create buckets, or add a new credential scheme.

Command contract, from the repo root after implementation:

```text
pnpm --filter @blackbox/backend exec node --import tsx scripts/prepare-staff-thumbnails.mjs --env local --limit 25
pnpm --filter @blackbox/backend exec node --import tsx scripts/prepare-staff-thumbnails.mjs --env local --limit 25 --apply
```

Arguments: required `--env local|uat|prd`; `--limit` default 25, allowed 1–25; optional opaque `--cursor`; `--max-bytes` default 64 MiB with a hard maximum of 64 MiB per invocation; `--apply` default false; hosted invocations also require `--hosted-budget-reviewed`. A flag is an assertion that the documented review happened, not a substitute for review or deployment authorization.

Process one R2 listing page of at most `limit` entries, then stop and report the next cursor. Filter to supported original flat filenames; skip snapshots, published objects, thumbnail prefixes, and all other keys. Inspect existing derivative metadata with HEAD and skip valid derivatives. For remaining candidates, fetch originals sequentially within both the 20 MiB per-image and cumulative byte bound; verify listed ETag against the fetched object. Use `sharp` with the existing 100-million-pixel ceiling, auto-orient, resize inside 96 × 96 without enlargement, and PNG output. Validate the generated bounds before any PUT. Dry run generates/checks locally but writes nothing. Apply writes only the deterministic derivative key.

Report listed/skipped/prepared/written/error counts, original/output bytes, R2 operation counts, and the resume cursor in an ignored JSON artifact. On an error or byte-budget stop, retain the input page cursor for replay: completed derivatives are skipped on rerun. Do not advance past unfinished work, retry automatically, parallelize decoding, or follow pagination to completion. Repeated explicit bounded batches are sufficient; no checkpoint service is needed.

Per full 25-entry page, the upper bound is one LIST, 25 derivative HEADs, 25 original GETs, and 25 PUTs on apply, plus measured proxy/setup overhead. A dry run has zero PUTs. Budget backup storage growth too: current backups enumerate MEDIA, so these small derivative objects are included automatically. Their logical status is regenerable; no restore/schema change is required.

### 5. Switch only compact artwork callers

Add `staffThumbnailUrl` alongside `editorialMediaUrl` in `apps/staff/src/lib/backend/editorial-api.ts`. Preserve the existing same-origin and trusted original-media path checks. Extract a valid storage key from the supported native media shapes (`storageKey`, `meta.storageKey`, or the validated native file URL); generate the new private URL, or return empty for an unsupported shape.

Use it in `ContentApp.tsx` catalog/list row artwork and `StockOperationsApp.tsx` compact row artwork. Reuse the existing image fallback and dimensions; clear the failing image without requesting another source. Do not modify full-resolution preview, crop assessment, public snapshot images, or the default `MediaImage`/`editorialMediaUrl` behavior. Retain alt text, lazy loading, and reserved dimensions.

### 6. Remove avoidable startup dependencies and the Overview barrier

Move `contentSections`, `ContentSection`, and any directly associated pure section constants from `ContentFields.tsx` into `apps/staff/src/lib/content-sections.ts`. Update all importers, including `StaffOverview`, `PublicationHistory`, `PublicationComparison`, `WebsiteChanges`, and `ContentApp`. The metadata module imports no React component or editor stylesheet. Preserve the already-lazy `ContentBodyEditor`; do not reimplement its lazy loading.

Change the shell's publication-history import to React `lazy` plus conditional mounting when history opens. Reuse existing loading/error primitives and accessible modal semantics. Verify the **built network graph**, not only the presence of a dynamic import: unopened history/editor JavaScript and `content-editor.css` must not be fetched on Overview, Stock, or Orders. If style collection still pulls editor CSS in eagerly, move its inclusion to the existing editor's actual lazy boundary; do not redesign global styling or the bundler.

In `StaffOverview.tsx`, retain parallel requests but settle drafts, publications, and orders independently. Give each panel its own loading/error/retry state, using existing read helpers and UI primitives. A mounted/generation guard must prevent an obsolete request from replacing current state. Preserve the existing query freshness/refetch policy; do not extend TTLs or introduce localStorage/sessionStorage caches for these reads.

Preserve all existing full-document and query-state navigation. The installed Astro router sends `location.href = to.href` after a prevented preparation event; it is not a safe drop-in dirty-editor cancellation mechanism. Also, persisting `StaffShell` would persist a wrapper containing nested page islands. A router migration is a separate change only if measurements after these fixes justify it.

### 7. Prove the change locally, then measure it from Greece

Reuse `staff-smoke.mjs` for actual built-Worker hosting and `scripts/test-content-workspace.mjs` for browser behavior. Extend existing unit tests for the branches introduced here; do not create broad snapshot tests or require hosted accounts during `pnpm validate`.

Local checks must prove:

- Static 200/304 GET/HEAD reaches ASSETS after identity verification and makes zero editorial-object/database calls; unsupported/API/workflow requests keep their routing.
- Private assets and thumbnails deny missing/invalid identity and alternate hostnames, including matching validators. No session cookie or KV binding appears in source or generated configuration.
- Native upload success/dedup/failure and derivative PUT failure follow decision 3. Invalid thumbnail keys and oversized/corrupt PNGs fail closed.
- A 25-row fixture with large originals requests no originals and receives at most 1 MiB of image bodies; missing thumbnails leave stable placeholders. Check body bytes, not `transferSize` alone, which can be zero for cached responses.
- Delaying/failing only the order-summary request does not hold back drafts/publications. Closed optional features produce no editor/history JS or editor-specific CSS requests, and opening them works.
- The existing Chromium and Firefox workspace checks still pass for save, autosave, conflict, navigation, recovery, stock, and publication flows affected by these files.
- Preparation dry run writes nothing; apply writes only derivatives; second apply skips them; cursor replay after interruption is safe; source ETag/byte limits are enforced.

Use [acceptance.md](acceptance.md) for exact local commands, a hosted budget worksheet, and timing criteria. Local CPU/wall timings are not Cloudflare-hosted timings. Do not repeatedly run a hosted load test or call a five-sample percentile a p95.

For the Greek pilot, use a foreground browser on a real Greek connection without VPN, record device/network, retain the same revision and data, and separate first visit from warm visits. The target for a stable desktop broadband connection is warm median HTML TTFB at most 500 ms and useful workspace content within 1,500 ms. Record critical asset timings individually and investigate repeated delays above two seconds. These are acceptance targets, not promised gains from this plan. A failed target keeps hosted performance acceptance open with a trace of the remaining delay; do not secretly expand implementation into a data migration.

### 8. Keep geography and pricing as measured constraints

Cloudflare's network can serve Greek users nearby; it does not guarantee that an editorial object, D1 database, and every request all execute in Greece. Existing object placement is not moved by adding a location hint. Do not rename `editorial`, replace its namespace, recreate D1, alter migrations, or enable Smart Placement in this change.

If a correctly budgeted pilot still shows a CMS API bottleneck, record entry/object wall and CPU times, relevant database duration, the observed ingress colo, and known resource-location metadata. Unknown location stays unknown. Produce a separate follow-up recommendation from that evidence rather than applying a speculative hint or buying capacity. Static delivery optimization and thumbnails remain useful independent of that result.

References checked during planning: [Worker-first authenticated assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Durable Object location](https://developers.cloudflare.com/durable-objects/reference/data-location/), [D1 location](https://developers.cloudflare.com/d1/configuration/data-location/), [Astro transition events](https://docs.astro.build/en/reference/modules/astro-transitions/). Installed dependency source was used for the EmDash upload and Astro cancellation details.

## Risks / Trade-offs

- Entry authentication consumes Worker CPU → reuse the current verifier and confirm the Free allowance with actual hosted CPU evidence; do not rely on burst tolerance.
- The three-second dispatch gap may have another platform cause → the plan removes a measured unnecessary hop but requires new traces before claiming the incident resolved.
- Existing images have no derivatives until prepared → prepare the PRD acceptance sample before promoting the compact-image UI; UAT can use placeholders while its bounded preparation pilot runs.
- More objects are retained in MEDIA and backups → cap object size, skip existing derivatives, and include incremental storage/operation counts in the budget.
- A successful upload can lack its optional derivative → preserve the successful original and repair through the explicit preparation command.
- CMS/editor work is active elsewhere → inspect the current tree before each slice, keep changes within the named seams, and preserve other changes and their acceptance work.

## Migration Plan

1. Complete local implementation and tests in tasks 1–6. No D1 migration or new cloud resource is required.
2. Record exact-source full validation, editor validation, and the relevant local CMS/publication checks. Stop with a locally verified result if hosted authorization or account evidence is unavailable.
3. With deployment authorization, deploy the canonical combined CMS UAT artifact through the existing repository release path. Staff assets remain inside that artifact; do not upload a detached Pages site.
4. Review account allowance, run a small UAT preparation dry run and apply pilot, and record operation counts before any further explicit batch. Confirm authentication and payload bounds on the resulting deployment.
5. Run the bounded Greek pilot. Retain failures and residual API timing separately from local functional success.
6. Promote the reviewed candidate to PRD only through the existing promotion requirements with separate authorization. PRD thumbnail preparation needs its own environment-specific budget and explicit apply. This does not authorize live catalog changes or shopper launch.
7. Roll back using the previous reviewed software artifact if behavior regresses. Extra derivative objects can remain unused; do not delete originals, reset databases, rename objects, purge buckets, or run cleanup as part of rollback.

## Open Questions

- Actual object/database placement and the internal cause of the observed dispatch gap remain operational unknowns. They do not block implementing the fixed route and payload changes.
- The current Greek-network baseline and available account allowance must be filled during authorized acceptance; no figures are inferred from the Swiss sample.
