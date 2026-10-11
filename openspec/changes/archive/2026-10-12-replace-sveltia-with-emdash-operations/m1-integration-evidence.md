# M1 integration evidence

Updated 2026-09-13. Tasks **1.1–1.5 are complete**. CMS and commerce CPU blockers are resolved through separate free SQLite-backed Durable Objects in the same deployment, and scheduled work uses object RPC. Final UAT CMS, test checkout creation, storage, and account quota checks pass; no paid upgrade is authorized or pending. The isolated UAT Worker and Access application are deployed. R2 activation was approved and completed on 2026-09-13. Production entrypoints and data remain unchanged. The final sections supersede historical blockers and paid-plan recommendations below. The unified workspace and editorial migration remain later implementation milestones.

## Current reproducible checkpoint

Run `pnpm --filter @blackbox/backend test:emdash`. The fixture at `apps/backend/test/emdash/` builds the real Astro/EmDash Worker, starts local Wrangler on 8799, and uses a native Node callback on 8800 to coordinate overlapping saves. Both processes stop after assertions. Synthetic D1/R2 identities and fake Stripe configuration require no real credentials. Its authorized isolated UAT deployment is diagnostic; this is not the unified staff workspace.

The dependency versions in the historical table below are now locked in pnpm, alongside Workers types `5.20260911.1`, Vite `8.3.0`, and Rolldown `1.2.8`. The older workspace-resolved bundler emitted an invalid EmDash chunk (`v$2` undefined). The pinned pair and `strictExecutionOrder` build and run correctly; existing commerce Worker test-pool overrides remain intact.

The initial M1 correction in `patches/emdash@0.37.0.patch` changed one expression in upstream source and its distributed runtime. Revision-backed saves retain the originally validated row for compare-and-swap instead of rereading a newer row after hooks. Existing upstream conflict handling rejects the loser. The subsequent [Local collection checkpoint](local-editorial-migration-evidence.md) also carries the same revision precondition into native soft deletion and proves both race directions. No application lock, service, or separate CMS fork was added. Remove the patch when an upstream release passes the save and deletion regressions.

The fixture injects the upstream exported OpenAPI route through Astro's supported integration hook. EmDash's supported auth-provider interface reuses `verifyOperatorAccess`, exact hosted hostname checks, and Local-loopback identity. Verified members map to role 30, the configured owner to 50.

Verified behavior:

- Compiled HTTP CRUD, OpenAPI, revision reads, sequential stale saves, and deterministic concurrent saves for draft and published entries. The winner returns 200, the delayed loser returns 409, and the winner remains stored.
- Publish/unpublish stale-token rejection, missing revision and mixed metadata save rejection, registration denial, and foreign-origin denial. Final collection validation, member/admin UI, and production mutation coverage remain later work; this restricted test namespace does not establish blanket upstream write safety.
- Hono public capabilities, checkout validation, and webhook signature rejection remain reachable independently of CMS auth.
- Signed-JWT unit tests cover member/owner mapping, expired tokens, wrong issuer/audience, forged/missing identity, ignored forwarded email, alternate hostnames, and Local bypass restrictions.
- Scheduler composition runs existing paid-order delivery and CMS maintenance independently. A rejected CMS invocation cannot suppress the order handler; aggregate failure reporting preserves outcomes.
- Generated configuration has D1, R2, assets, adapter session KV, and one free SQLite-backed `CmsRuntime` Durable Object. It has no sandbox loaders, AI, paid cache, or runtime image transforms.

Final checks passed: `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm --filter @blackbox/backend test:emdash`. Existing lint deprecations and the Zod hint remain. The webhook negative test intentionally logs redacted `missing_signature` and returns 400.

Wrangler dry-run passed: `pnpm --filter @blackbox/backend exec wrangler deploy --dry-run --config test/emdash/dist/server/wrangler.json --outdir ../../.codex-artifacts/emdash-m1/bundled-checkpoint`. Total upload is **17,683.77 KiB uncompressed / 4,437.01 KiB gzip**, with 401 additional modules and 57 asset files. This fits the current **64 MiB uncompressed** limit. The old compressed limit was removed September 4; gzip size is not a deployment blocker. See [Cloudflare's size-limit change](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/).

## Remaining M1.5 gate

Read-only `wrangler whoami` succeeded. `wrangler r2 bucket list` returned `10042`: “Please enable R2 through the Cloudflare Dashboard.” This initial blocker was resolved on 2026-09-13 after the user explicitly accepted the R2 subscription terms and usage billing. Chrome showed “Purchase complete” and an active subscription; `wrangler r2 bucket list` then succeeded with no buckets. The base fee is $0, with the displayed Standard storage allowance and usage-based overages. See [R2 setup](https://developers.cloudflare.com/r2/get-started/).

Isolated UAT must still establish representative reads/saves/uploads, cold/warm CPU, public commerce, D1/R2 usage, and account-specific free-tier capacity. Hosted Access provisioning and an authenticated CMS list read were verified on 2026-09-13; full write/media and identity-negative acceptance remain outstanding. Local timing and dry-run size do not substitute for hosted measurements. Task 1.5 stays unchecked; real imports and migration wait for that gate.

## Historical investigation before patch authorization

The following records preserve the original failure. Statements about unpatched behavior, missing scheduler composition, or pending scope authorization describe the earlier checkpoint and are superseded above.

Observed on 2026-09-12. M1 is **blocked at task 1.2** by a reproducible stale-revision lost update in EmDash 0.37.0. Task 1.1 is complete; tasks 1.2–1.5 remain unchecked. No application runtime integration, migration, hosted deployment, or account mutation was performed.

## Astro upgrade and validation

Both existing Astro workspaces, `apps/web` and `apps/staff`, now pin Astro 7.3.2. The root pnpm lockfile was updated. Static output, routes, and hosting configuration remain unchanged.

- `pnpm test:unit`: passed, including web, staff, backend, API client, and release contracts.
- `pnpm check`: passed; existing ESLint boundary deprecations and one Zod deprecation hint remain.
- `pnpm build`: passed; web produced 349 pages and staff produced 3 pages, with cache, image, font, CMS build-mode, and route-isolation checks.
- Baseline OpenSpec validation: 45 specs passed. The completed staff-order delta was synchronized; catalog baseline reconciliation is recorded in [overlap-inventory.md](overlap-inventory.md).

These checks cover the application tree after the Astro upgrade. They do not constitute EmDash acceptance.

## Isolated dependency and runtime probe

The disposable probe is under ignored `.codex-artifacts/emdash-m1/probe/`, outside the pnpm workspace. It uses synthetic local D1/R2 identities, a loopback-only development identity, and disposable posts. No real editorial or commerce data was imported.

| Dependency               | Exact version |
| ------------------------ | ------------- |
| `astro`                  | 7.3.2         |
| `@astrojs/cloudflare`    | 14.3.1        |
| `@astrojs/react`         | 6.0.4         |
| `emdash`                 | 0.37.0        |
| `@emdash-cms/cloudflare` | 0.37.0        |
| `react`, `react-dom`     | 19.2.8        |
| `wrangler`               | 4.131.1       |

The initial Astro 7.2.9 probe failed at build time because the adapter imports `renderForPrerender`, which that Astro installation did not export. Astro 7.3.2 builds successfully. Wrangler was updated from 4.127.1 because its local workerd did not support the probe's 2026-09-12 compatibility date. The standalone npm probe ran under Node 24.17.0; the repository commands retain their pnpm-managed engine contract.

Default server chunking built but failed while evaluating Kysely's `ImmediateValueTransformer`, which extended an undefined `OperationNodeTransformer` across generated chunks. The supported Vite/Rolldown option below allowed the unmodified packages to initialize and serve CMS requests:

```js
vite: {
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true;
      }
    }
  }
}
```

This is a measured probe configuration, not a production workaround already adopted. Its size and execution cost must remain part of M1.5. See [Rolldown execution-order guidance](https://rolldown.rs/reference/OutputOptions.codeSplitting).

### Fetch response handling

The running probe uses the supported `astro/fetch` pipeline with `cf()` and `finalize()` from `@astrojs/cloudflare/fetch`, as suggested by the user. Installed adapter 14.3.1 confirms that `@astrojs/cloudflare/hono` calls `finalize()` after downstream middleware. The eventual Hono composition should use that middleware once, after hostname/identity protection and only for the intended Astro branch; static asset early returns must not bypass protection.

`finalize()` consumes Astro cookies and applies Cloudflare response defaults. Its CDN `no-store` default is conditional on the cache provider being enabled, so it does not replace explicit private response policy. CMS and operator responses must retain explicit `Cache-Control: private, no-store`. See [Astro Cloudflare advanced routing](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#using-advanced-routing).

The probe's fetch entrypoint does not yet compose the paid-order scheduler. No claim is made for task 1.3.

### Build and resource observations

- `npm run build`: passed with the final probe configuration.
- `npx --no-install wrangler deploy --dry-run --outdir bundled-final`: passed, with **11462.16 KiB upload / 2828.00 KiB gzip**, including the diagnostic plugin; 57 static files were read.
- Generated bindings: `CMS_DB` D1, `MEDIA` R2, `SESSION` KV, and `ASSETS`.
- No sandbox loader, AI binding, object-cache binding, runtime image-transform binding, or Durable Object was configured. The image service is `passthrough`.
- The adapter adds session KV. It is session storage, not the optional CMS object cache, but its quota must be measured too.
- The current published Workers Free limit is 64 MiB uncompressed, with a 10 ms CPU limit per request. Bundle size alone does not prove free-tier viability. See [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
- Hosted CPU, cold/warm execution, account quotas, representative uploads, and shared D1/R2/KV usage were **not measured**. Local request wall time is not hosted CPU evidence.

## Blocking REST result: concurrent stale saves overwrite

Real HTTP requests were sent to the compiled Worker on `http://127.0.0.1:8799`. The test used documented content routes and `X-EmDash-Request: 1`, not direct database writes. A standard-format trusted diagnostic plugin paused one `content:beforeSave` hook for 1500 ms; the plugin requested `content:write` and ran in-process without a sandbox loader.

The passing preliminary checks were content creation (201), reading (200), editing (200), sequential stale-token rejection (409), revision listing (200), publication (200), and unpublication (200). Deletion was not reached because the concurrency assertion failed.

The failing sequence was:

1. Read a post and retain its `_rev` token.
2. Start save A with that token and title `delayed-save`.
3. Wait until A enters `content:beforeSave`, after the initial revision check.
4. Save B with the same token and title `Competing`; B returns 200.
5. Let A continue. **A also returns 200**, and a fresh read returns title **`delayed-save`**.

Expected: A returns 409 and B's title remains. Observed output:

```text
{"competing":200,"resumed":200,"finalTitle":"delayed-save"}
AssertionError: Intervening successful save must invalidate the delayed request revision
200 !== 409
```

The installed `emdash/dist/astro/middleware.mjs` `handleContentUpdate` explains the result: it validates `_rev` against the initial read, awaits hooks and validation, then rereads the entry and uses that newer state for `replaceDraftRevision`. It does not revalidate the submitted token against the newer state. The later compare-and-swap therefore does not protect the original client revision in this interleaving. The delayed hook makes an ordinary asynchronous save window deterministic; it does not modify the revision or database.

The local reproduction files remain available:

- `probe/package.json` and `probe/package-lock.json`: exact standalone dependencies.
- `probe/astro.config.mjs`, `probe/wrangler.jsonc`, and `probe/src/`: minimal build, loopback auth, fetch pipeline, and diagnostic plugin.
- `probe/rest-probe.mjs`: runnable HTTP assertion; run `node rest-probe.mjs` from the probe directory while its compiled Wrangler server runs.
- `probe/rest-results.json`: request methods, paths, status codes, and disposable response data.
- `probe/local-server.log`, `probe/build.log`, `probe/dry-run-final.log`: local runtime and build evidence.

To repeat: run `npm ci`, `npm run build`, then `npx --no-install wrangler dev --ip 127.0.0.1 --port 8799` with output redirected to `local-server.log`; run the probe script in another terminal. Stop Wrangler before rebuilding on Windows because it holds the asset directory open. The server started for this investigation was stopped.

One additional contract issue remains: the documented `/_emdash/api/openapi.json` returned 404. The package contains its route implementation, but the inspected integration did not inject it. Other tested content/schema routes were present. Resolve contract delivery through a supported path before task 1.2 can pass. [EmDash REST contract](https://docs.emdashcms.com/reference/rest-api/)

## Required decision

The current design requires enforced stale-revision rejection through supported CMS APIs. This probe does not satisfy that requirement. Do not mark task 1.2 complete, import real content, or proceed to hosted migration on this evidence.

The preferred next step is an upstream-supported fix and a passing rerun. If work must proceed before that, revise the change explicitly to approve and specify application-owned concurrency enforcement across every permitted CMS write path, including admin writes. That is additional scope, not an already approved substitution. A frontend-only guard or an isolate-local mutex is insufficient. No upstream patch, fork, paid resource, or weakened conflict contract has been introduced.

### UAT Access preparation — 2026-09-13

The Dashboard has one existing Access application, `BlackBox Records Staff`, for the production staff hostname. The existing `Allow shared label account` policy allows only `blackboxrecordsathens@gmail.com`. The team domain is `blackboxrecords.cloudflareaccess.com`.

Created after explicit user approval: `BlackBox Records Staff UAT`, protecting all paths at `staff-uat.blackboxrecordsathens.com`, reusing that single-email policy, Google-only authentication, and a 24-hour application session. No production policy was edited. The saved application ID is `cefff7f6-1ff2-47cb-82ff-ea75e1d3781b`; audience is `fdb43a80812cec4c151e8bff2d9a0245b3fda2437ff23a51b68f6d1256dba92d`. The saved settings were reread and verified.

### Isolated hosted checkpoint — 2026-09-13

Deployed the previously tested compiled fixture as `blackbox-emdash-m1-uat`, version `c49ce336-1b37-493a-818c-0a8716f3b101`, at `staff-uat.blackboxrecordsathens.com`. This is a disposable M1 probe, not the UAT commerce replacement. Existing UAT/PRD Workers, commerce resources, staff application, and public Pages were not modified. No real Stripe or email credentials were attached; native checkout is disabled, and no scheduled trigger was added.

Isolated resources:

| Binding     | Resource                               | ID                                   |
| ----------- | -------------------------------------- | ------------------------------------ |
| CMS_DB      | blackbox-emdash-m1-uat                 | 1e308981-165d-4ce3-bd43-9c2e2ece2868 |
| COMMERCE_DB | blackbox-commerce-m1-uat               | 361316a6-d522-42fb-b9a5-b54576950bb6 |
| MEDIA       | blackbox-emdash-m1-uat, Standard, WEUR | private R2 bucket                    |
| SESSION     | blackbox-emdash-m1-uat-session         | 092dae41677444e2b0214b26903d7884     |

Deployment configuration and logs are ignored under `.codex-artifacts/emdash-m1/wrangler.uat.json` and `uat-deploy.log`. It uses UAT identity bindings and the new exact audience/hostname, no Local identity, `workers_dev: false`, and worker-first assets. The fixture still has runtime CMS initialization and its local race-test plugin; neither is accepted as the final production configuration. Production migration ownership and removal of test-only behavior remain required.

Measured:

- Upload: 17,683.77 KiB uncompressed, 4,437.01 KiB gzip; Worker startup 62 ms.
- Google Access redirected successfully and the browser displayed `{"success":true,"data":{"items":[],"total":0}}` for the CMS posts list.
- A captured GET of that path returned 200, outcome `ok`, CPU 73 ms, wall time 744 ms. This sample does not establish warm/cold distributions or sustained free-tier compliance. Sanitized evidence is `uat-read-redacted.json`; the raw tail log was removed because request metadata is unnecessary for the report.
- D1 after initialization: 71 tables, 1,318,912 bytes, 256 read queries / 358 write queries and 32,768 rows read / 1,216 rows written over the reported 24-hour window. These are startup-window counters, not per-request costs.
- R2: 0 objects, 0 bytes. Media upload has not yet been measured.
- Dashboard confirms active Workers Free and Zero Trust Free; R2 shows its activated usage-based subscription. No Workers paid upgrade was performed. Workers Free documents 10 ms CPU/request, with limited tolerance for infrequent excess; this successful 73 ms response is not proof of a safe free-tier workload. See [current Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

Chrome subsequently rendered `ERR_BLOCKED_BY_CLIENT` for the authenticated JSON page even though the captured Worker invocation succeeded. The agent did not disable browser protections or extract the Access session. Browser recovery is needed to continue the authenticated measurements. Keep 1.5 unchecked: hosted saves/uploads, redeploy persistence, negative identity tests, public commerce, and representative CPU/storage distributions are still incomplete. No real content import or migration has begun.

### Resumed browser and workload verification — 2026-09-13

Chrome's `Network.loadingFailed` diagnostic identified `blockedReason: inspector` for raw JSON document navigation. Successful Worker responses were still captured. Added the protected, test-only `apps/backend/test/emdash/public/checkpoint.html`, served after the existing hostname/identity check with private/no-store caching. Exact HTML asset handling avoids a redirect to an unhandled path. No browser protections, Access rules, or credentials were changed. The HTML page works through ordinary browser fetch requests.

Three hosted runs passed: five sequential list reads, post creation, save, stale-save 409, publish/unpublish, generated 1200×1600 PNG upload, media list/download with byte-count verification, and Hono capabilities. Upload deduplication is explicitly disabled in this disposable probe so repeated runs measure actual storage uploads rather than a cached/deduplicated path. Each image is 43,789 bytes. Posts and images are retained solely for persistence checks. An unauthenticated test-page request returned 302 to the correct Access team domain.

Latest deployment is `09af90b9-b5b7-4c71-99c7-37d570b6234a`; upload is 17,684.12 KiB / gzip 4,437.07 KiB. A read-only D1 lookup after redeployment confirmed the first post (`01M2C6MFQQMD2GQMMRQM7G1W2B`) survived. Sanitized per-request evidence is under ignored `.codex-artifacts/emdash-m1/resume-metrics.json`; raw request logs were removed after extracting method/path/status/CPU/wall-time/outcome.

| Operation                     | Measured CPU       |
| ----------------------------- | ------------------ |
| Warm list reads               | 5–9 ms             |
| Warm post creation            | 22 ms              |
| Warm save                     | 31 ms              |
| Warm stale-save rejection     | 6 ms               |
| Warm publish / unpublish      | 26 / 24 ms         |
| PNG uploads across three runs | 208 / 159 / 221 ms |
| Media file reads              | 2 ms               |
| Hono capabilities             | 4–10 ms            |

These observations rule out startup overhead as the sole explanation. Outcomes were `ok`, but infrequent overrun tolerance is not a supported sustained operating budget. Workers Free remains active with its documented 10 ms limit. The existing free-tier acceptance criterion is not satisfied; migration must not start by silently accepting those overruns.

D1's reported 24-hour counters after the runs: 783 read queries, 472 write queries, 39,599 rows read, 1,792 rows written; 71 tables and 1,318,912 bytes. R2 bucket-info counters still displayed zero despite three successful upload/download checks; treat those aggregate counters as lagging, not proof of no stored objects. Media storage cost is not the observed blocker.

`pnpm test:unit`, `pnpm check`, and `pnpm build` passed during this slice. The final compiled `test:emdash` rerun passed after the repeat-upload setting. Added an unauthorized-host regression for the diagnostic page and assertions for its successful private response. Production runtime and data remain unchanged.

Historical proposal, rejected by the user: Workers Paid checkout was prepared but never activated. The checkout tab has been closed. Workers Free remains the constraint; no Workers Paid charge or new agreement was accepted.

## Free-tier runtime correction — 2026-09-13

Kept the supported Astro/EmDash handler and existing D1/R2 data, and wrapped CMS requests in one SQLite-backed `CmsRuntime` Durable Object for this editorial site. The same Worker artifact exports the object class. The entry Worker checks the hosted CMS hostname; the object verifies the original Access JWT before every private response. Local retains the existing loopback verifier. Hono routes bypass the object, and the existing scheduler failure isolation remains unchanged. There is no application mutex, replacement database, or EmDash fork. SQLite object storage is configured because that is the free-plan class type; editorial records remain in `CMS_DB`.

The browser probe now supplies EmDash's supported `thumbnail` upload field using a 24×32 canvas preview. It verifies the stored original still has 1200×1600 dimensions and downloads all 43,789 bytes. The thumbnail-only deployment reduced image upload CPU to 19 ms from 159–221 ms; it did not solve content-save CPU alone.

Deployed version `923503a8-a7fe-4127-8500-63fbdbe8fe22` passed two hosted runs including initial runtime initialization and a warmed repeat: reads, create/save, stale 409, publish/unpublish, actual uploads, media reads, and Hono capabilities. The compiled local probe also passes deterministic overlapping saves through the object, preserving D1 compare-and-swap rather than relying on serialization.

| Execution                     | Measured CPU |
| ----------------------------- | ------------ |
| Entry Worker, CMS forwarding  | 0–1 ms       |
| Object, initial CMS list      | 41 ms        |
| Object, subsequent lists      | 6–8 ms       |
| Object, create                | 36 / 25 ms   |
| Object, save                  | 43 / 33 ms   |
| Object, publish               | 30 / 25 ms   |
| Object, unpublish             | 29 / 22 ms   |
| Object, upload with thumbnail | 15 / 8 ms    |
| Unchanged Hono capabilities   | 14 / 11 ms   |

Cloudflare documents a 30-second default CPU allowance for Durable Object invocations, including free SQLite-backed classes. Free compute includes 100,000 requests/day and 13,000 GB-s/day, with quota exhaustion returning errors rather than charging overage. See [object limits](https://developers.cloudflare.com/durable-objects/platform/limits/) and [free object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/). The 31 observed object requests total 24,092 ms wall time; multiplying by 128 MB estimates approximately 3.1 GB-s of request duration. This is a workload estimate, not an account billing measurement or proof of aggregate quota headroom. No keep-alive timer or persistent connection was added.

The artifact is 17,684.70 KiB uncompressed / 4,437.25 KiB gzip, with 70 ms Worker startup. Sanitized evidence is `.codex-artifacts/emdash-m1/free-metrics.json`, including entrypoint and deployment version so entry Worker and object costs cannot be confused. Raw request logs were removed. Existing CMS records remain in the same D1 database; no data migration occurred. The attempted supported migration CLI check required an API token that was not available; no token was extracted and automatic migration behavior was not changed in this checkpoint.

This behavioral tree passed `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm --filter @blackbox/backend test:emdash`. The remaining capabilities overhead was subsequently corrected below.

### Final capabilities correction and verification

`/api/store/capabilities` unnecessarily constructed all commerce repositories and a Prisma client, then disconnected it. The route now calls `readPublicStoreCapabilities` directly; feature evaluation, launch approval, pricing disclosures, logging, response shape, and no-store caching are preserved. Database-backed routes keep their existing lifecycle. The existing route regression now asserts that capability reads never construct database services or call disconnect.

Final UAT version `378b6d35-2a4c-4be6-9808-1d325c69e8d0` passes the complete browser probe. Capabilities measure **6 ms initially, then 1/1/1/1 ms**, with unchanged Hono routing. Entry Worker CMS forwarding remains **0–1 ms**; initial CMS list is 44 ms and save 43 ms inside the object's 30-second budget. The upload is 13 ms inside the object. Artifact size is 17,684.61 KiB / gzip 4,437.26 KiB; startup is 73 ms. Sanitized final evidence is `.codex-artifacts/emdash-m1/free-final-metrics.json`; raw logs were removed.

All required checks were rerun against the final behavioral tree and passed: `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm --filter @blackbox/backend test:emdash`. The focused capabilities route suite also passes all 21 tests. Task 1.5 remains unchecked because full hosted checkout and shared-account quota reconciliation are not established by this restricted diagnostic. There is no remaining paid-plan approval request. Continue free-tier acceptance before importing real editorial content or cutting over production.

### Commerce execution and final UAT verification

The previous measurements above are historical. Canonical UAT initially measured 89 ms for a Store Item read and 138/87 ms for two test Checkout Session creations. Those requests succeeded but exceeded the Free entry Worker's supported CPU allowance. The existing Hono application now runs in a separate SQLite-backed `CommerceRuntime` object; original requests, signed webhook bodies, Access verification, repository lifecycles, and `COMMERCE_DB` ownership remain unchanged. No object storage, application lock, or new business workflow was added.

Scheduled paid-order work also uses the object through RPC. Free Cron has the same 10 ms CPU allowance as Free HTTP, so leaving Prisma work in the Cron entrypoint would retain the problem. CMS maintenance uses its own object's RPC. The composition waits for both branches and reports failures after both have run, including a synchronous CMS binding failure. Focused regressions cover original HTTP inputs, scheduled timestamps, propagated failures, and scheduler isolation.

Final canonical UAT version: `9365d68f-8a1f-46c4-bfed-0765865b83aa`. Final isolated CMS version: `91a572ac-fc31-45ef-9a31-e582c46defeb`. Chrome's BlackBox extension session passed the complete CMS probe after deployment. Two real Stripe test-mode Checkout Sessions returned 200 and Stripe-hosted test URLs; no payment was submitted. This verifies checkout creation, not paid-order acceptance or the later migration milestones.

| Final execution                             | CPU             |
| ------------------------------------------- | --------------- |
| Entry Worker, all measured forwarding       | 0–1 ms          |
| CMS object, initial / warm lists            | 43 / 6–8 ms     |
| CMS object, create / save / stale rejection | 38 / 38 / 9 ms  |
| CMS object, publish / unpublish / upload    | 31 / 28 / 12 ms |
| Commerce object, capabilities               | 0–4 ms          |
| Commerce object, Store Item read            | 93 ms           |
| Commerce object, two test checkouts         | 24 / 21 ms      |

All captured outcomes were `ok`, including the expected stale-save HTTP 409. Sanitized evidence: ignored `completed-uat-metrics.json`, `completed-cms-metrics.json`, and `completed-checkout-results.json` under `.codex-artifacts/emdash-m1/`. Raw request logs were removed. The combined fixture is 17,685.23 KiB uncompressed / 4,437.43 KiB gzip with 113 ms startup; commerce is 5,964.20 KiB / 1,541.81 KiB with 76 ms startup. Current Free limits allow 64 MiB uncompressed, no compressed-size limit, and one-second startup. [Worker limits](https://developers.cloudflare.com/workers/platform/limits/)

Read-only reconciliation of all six account D1 databases reported 5,984,256 bytes total, 93,457 rows read and 5,039 rows written over the reported 24-hour window. This includes current UAT/PRD, historical sandbox/production, and both diagnostic databases. Free allows ten databases, 500 MB per database, 5 GB total, five million rows read/day and 100,000 rows written/day; current measurements leave room for separate PRD CMS and isolated recovery resources. These are observations, not reservations of future capacity. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)

R2 reported one bucket with six objects and 263 kB before the final upload; aggregate counters lag the verified upload/download workload. The repository is public and uses standard Ubuntu Actions runners, whose execution minutes are free. Artifact storage and the future seven-day backup retention still require checks when those workflows are implemented. No additional hosted CI run, Workers Paid subscription, or paid binding was introduced. [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

The supported `emdash migrate --check --json` command now passes against isolated CMS D1: no pending migrations and no unknown applied migrations. It used the existing authorized Wrangler OAuth session through `wrangler auth token --json` in memory, passed only to the child CLI environment; no new credential, persisted token, or migration apply was required. Sanitized result: `cms-migration-status.json`. Hosted automatic migration behavior has not yet been changed.

Final behavioral verification passed: `pnpm test:unit`, `pnpm check`, `pnpm build`, and the compiled `pnpm --filter @blackbox/backend test:emdash`. Logs are `completed-unit.log`, `completed-check.log`, `completed-build.log`, and `completed-probe.log`. Production deployment/data remain untouched. Account-wide Worker/Object daily request and duration counters are not captured by these per-request traces; do not describe these measurements as an account-wide billing audit or completed end-to-end migration acceptance.

### Account reconciliation closes M1

The subsequent read-only Cloudflare dashboard check through the BlackBox Chrome extension reported **210 / 100,000 Worker requests today**, and **88 Durable Object requests / 8.03 GB-seconds for September 2–October 2** across all three namespaces. Even the whole period's object totals are below the daily Free allowances of 100,000 requests and 13,000 GB-seconds. Both dashboards showed **$0.00 billable usage**. Object SQL/KV storage and storage operations were zero, consistent with retaining data in D1/R2. Dashboard aggregation may lag the most recent probe requests; this is a dated observation, not a future usage guarantee.

The current media inventory under content and public assets contains 153 files totaling 150,363,885 bytes. Conservatively reserving a full copy plus seven daily copies for each of UAT and PRD, and using the entire account's current D1 size as the database estimate for each copy, totals approximately **2.50 GB**. This stays below R2's 10 GB-month free storage allowance, before future content growth. Two full 153-file daily copies imply about 9,180 monthly object writes before metadata/export overhead, below one million free Class A operations; current probe operations are only dozens. Retention enforcement, restore testing, and recalculation against actual imported content remain implementation requirements in section 10. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

GitHub's read-only API reported 3,961,611,760 bytes of unexpired artifacts and 271,363,320 bytes of cache in this public repository. The organization's current Actions billing response had zero net amount for every Linux-minute and artifact-storage entry. The existing release/smoke workflow already retains artifacts for seven days and uses standard Ubuntu runners; this checkpoint created no additional hosted artifacts or caches. Preserve private CMS exports/backups in R2 rather than uploading them as public CI artifacts.

M1 task 1.5 is complete for the representative integration workload. The final combined product still requires the later publication, recovery, and paid-checkout acceptance tasks; this checkpoint does not satisfy them or authorize production cutover. No paid upgrade, live commerce mutation, or new credential was performed.
