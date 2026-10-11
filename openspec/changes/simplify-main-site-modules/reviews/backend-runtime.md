# Backend-runtime received review

Reviewer thread: `01a125d6-2f56-78b3-8ff8-8a4a76802544`.
Review turn: `01a125d6-3a96-7703-b94b-ccad3b0e9b0e`.
Immutable source: `.codex-artifacts/simplification/29-backend-runtime-review.result.json`.
Raw SHA-256: `bc91ac9796cd5fad53b88bcdcf387320a7254086d63d4edd401b6df6de42d649`.
Preserved in full below; estimates describe the read-only review, not the combined implemented slice.

What this change does: `backend-runtime` composes the commerce Worker, the combined Worker, and application-owned editorial request policy. It routes requests, supplies current scalar configuration to retained Durable Objects, and coordinates scheduled work. This was a read-only review; no repository files were written and no tests were started.

Module 29/29: **backend-runtime**, application root `apps/backend/src`. Three deletion-focused findings are actionable. Estimated reductions are **5 production lines**, **16–18 test lines**, and **21–23 net lines across four existing files**. No files need to be added or deleted. These estimates exclude formatting and audit Markdown; the actual applied reduction is zero.

**1. Remove repeated header setup after the request was already sanitized**

Locations: `apps/backend/src/cms-worker.ts:821–842`, specifically the repeated setup at lines 826–828 and 837–842.

**What this is:** The editorial write path normalizes and validates a payload, removes its original `Content-Length`, and creates a replacement request at lines 821–823. Two later branches replace that request’s body again: draft creation at lines 824–829, and relation-backed Release writes at lines 830–843.

**Problem:** Both branches allocate another `Headers` object and delete `Content-Length` again. The current request already contains the sanitized headers. Nothing between those constructions modifies its headers: `nativeDraftCreation` transforms payload data, and the intervening EmDash callback only reads the Release artist field’s schema.

**Source/caller proof:** `nativeDraftCreation` at `apps/backend/src/middleware.ts:67–74` removes the null image field while retaining the surrounding payload. `nativeEditorialWrite` at lines 57–63 moves the artist into native references. Their connected regression cases are `scripts/editorial-draft-creation.test.mjs:6–31` and `scripts/cms-draft.test.mjs:7–54`. The same root already uses body-only Request construction at `cms-worker.ts:796` and `:863`. Cloudflare’s current implementation copies the existing request’s headers, URL, method, CF metadata, redirect and signal, then applies supplied overrides; a string body does not introduce a constructor-level `Content-Length` header. [Cloudflare Request implementation](https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B#L303-L501), [Workers Request API](https://developers.cloudflare.com/workers/runtime-apis/request/).

**Smaller change:** Keep the initial header cleanup at lines 821–823. In each later branch, construct `new Request(request, { body: ... })`; delete the two additional header declarations, their two repeated deletions, and the now-unnecessary multiline `headers` property. Keep both replacement requests and their existing serialization points.

**Preserve:** The initial removal of stale `Content-Length`; all other headers, including identity, Origin and `X-EmDash-Request`; URL, method and request metadata; normalization and validation order; the SchemaRegistry read; legacy-versus-relation behavior; and the existing 400/422 error paths. Do not combine all serialization into one final operation.

**Focused validation:** Run `pnpm test backend-runtime` during implementation. Verify a null-artwork create and a relation-backed Release write retain their forwarded headers and exact JSON. Retain the existing draft/reference contract checks in the verifier’s affected content-test selection. A read-only Node probe compared 32 rewritten-request cases covering POST/PUT, four header sets and four payload shapes: zero differences in headers, URL, method, body and standard request metadata. Native workerd verification remains deferred.

**Expected reduction:** Production **−5 lines**, tests **0**, net **−5**; one existing file changed, no files added/deleted.

**If skipped:** The two redundant header copies and repeated cleanup operations remain on those write paths.

**2. Consolidate the duplicated CMS promise-rejection scheduler case**

Locations: `apps/backend/src/emdash-checkpoint.test.ts:461–483` and `:501–512`; production contract at `apps/backend/src/cms-worker.ts:110–120`.

**What this is:** The combined scheduler starts commerce and CMS work independently, awaits both with `Promise.allSettled`, and reports rejected work through an `AggregateError`.

**Problem:** The `invoke` row in the first table and the `cms` row in the second table exercise the same CMS promise rejection. Each configures `runMaintenance` to reject while commerce resolves. Their useful assertions differ, so deleting either entire table would lose coverage.

**Source/caller proof:** The first table also covers a synchronous `CMS_RUNTIME.getByName` failure and checks exact commerce forwarding with `scheduledTime: 1234`. The second checks commerce promise rejection and invocation counts for both jobs. These are three distinct failure situations currently represented by four generated cases. The production wrapper at line 113 is specifically needed to capture a synchronous binding failure without preventing commerce work.

**Smaller change:** Use one local `it.each` table for `orders`, `cms`, and `binding`. Keep the existing controller and bindings shape, reset both mocks per row, and retain exact commerce forwarding, the original failure in `errors`, and CMS invocation counts: one for promise failures, zero when binding lookup throws. Remove the duplicated fourth case and its repeated setup. Add no test helper or generalized scheduler harness.

**Preserve:** All three distinct failure modes; independence of both jobs; exact controller/bindings forwarding; one invocation of each reachable operation; and aggregate failure propagation. Leave production scheduling unchanged.

**Focused validation:** Run `pnpm test apps/backend/src/emdash-checkpoint.test.ts`, then the normal `backend-runtime` module selection. The three retained rows must independently fail if commerce is suppressed, CMS is suppressed, synchronous lookup escapes the wrapper, forwarding changes, or the original error disappears.

**Expected reduction:** Production **0**, tests approximately **−12 to −14 lines**, net **−12 to −14**; one existing file changed, no files added/deleted. Four generated cases become three while retaining all three distinct regressions.

**If skipped:** The same CMS rejection continues to have two separately maintained fixtures and assertion sets.

**3. Delete unused and already-covered test scaffolding**

Locations: `apps/backend/src/emdash-checkpoint.test.ts:3–8,24`; `apps/backend/src/commerce-runtime.test.ts:30–35,151–157`; `apps/backend/src/paid-order-delivery-schedule.worker.test.ts:14–17`.

**What this is:** These suites provide local doubles for the composition root and verify scheduled delivery behavior.

**Problem and proof:**

- `fetchCommerce` is a private mock with exactly three references: its hoisted binding, its declaration, and the mocked `./index` default’s `fetch` property. No test configures or asserts it. The combined Worker routes commerce through Durable Object `fetchWithBindings` calls at `cms-worker.ts:137–140` and `:175–178`; its dynamic `./index` import at line 112 uses only `scheduled`. Keep the `CommerceRuntime` and scheduled mocks, but remove this unused fetch mock and property.
- `deliver.mockClear()` at `commerce-runtime.test.ts:153` follows `beforeEach`’s `deliver.mockReset()` at line 34. No intervening operation calls `deliver`. Delete the redundant clear.
- The `worker.scheduled` function-type assertion at `paid-order-delivery-schedule.worker.test.ts:15` is implied by retained tests that actually call the real exported scheduled function at `commerce-runtime.test.ts:80,143–148`. Keep the empty-queue assertion at schedule-test line 17, and name that case for its remaining no-op behavior.

**Smaller change:** Delete those unused mock members, the redundant clear, and the function-type assertion plus its separating blank line. Retain all substantive assertions and all four owned test files.

**Preserve:** Empty-queue behavior; scalar configuration forwarding; overlapping request isolation; published-name injection; preflight avoidance of the Durable Object; delivery limits and ordering; persisted delivery/alert state; PRD gates; recipient routing; retention; and redacted logs.

**Focused validation:** Run `pnpm test backend-runtime`. The commerce forwarding and scheduled-error tests, the empty-queue Worker case, and the combined Worker’s routing cases remain required. No new test is needed for deleting an unused mock or a clear immediately implied by reset.

**Expected reduction:** Production **0**, tests approximately **−4 lines**, net **−4**; three existing files changed, no files added/deleted. This overlaps the checkpoint file in finding 2, so the combined portfolio touches four files, not five.

**If skipped:** The suite retains an unused mock, redundant mock lifecycle work, and a weaker assertion already covered by actual invocation.

**Reduction accounting**

| Finding                     | Production reduction | Test reduction | Net reduction |
| --------------------------- | -------------------: | -------------: | ------------: |
| 1. Repeated header setup    |                    5 |              0 |             5 |
| 2. Duplicate scheduler case |                    0 |          12–14 |         12–14 |
| 3. Test scaffolding         |                    0 |              4 |             4 |
| **Total estimate**          |                **5** |      **16–18** |     **21–23** |

Estimated file effect: **four existing files modified, zero added, zero deleted; net file count change 0**. No new abstraction, dependency, exported interface or test file is proposed. Line estimates count semantic cleanup only. No implementation has been applied.

**Rejected or deferred ideas**

- **Token-export classification cache — deferred under the latest deletion-first direction.** The entry calls `isCmsTokenExportRead` at `cms-worker.ts:131,156,169`. The classifier is read-only (`middleware.ts:9–35`). A gated cache matched 1,248 in-memory routing cases, reduced classifications in 182, and increased them in none. However, the clear version adds two local declarations. It is excluded from actionable deletion findings and from reduction totals; no latency benchmark established a material benefit.
- **Shorten composed error responses using `cmsNestedProblemResponse` — rejected.** The root’s workspace/save/publish errors include `success: false` at `cms-worker.ts:552–562,809–820,846–856,881–891`. The existing helper at `platform/interfaces/http/responses.ts:344–352` omits that field. Substitution would change response bodies. Removing the explicit detail at line 815 would also change how the error message becomes the problem detail.
- **Remove request configuration filtering or mutate the retained object’s environment — rejected.** `index.ts:17–26` and `platform/env.ts:217–242` retain the scalar allowlist and explicit undefined values, so removed settings clear old values without replacing resource bindings. The A → B → A and overlapping-call tests in `commerce-runtime.test.ts:38–123`, plus the native RPC suite, have distinct value.
- **Remove Prisma scopes or move provider/client construction — rejected.** `create-prisma-client.ts:6–25` links request scopes to a retained object client and prevents per-request cleanup from disconnecting it. The connected Worker test at `create-prisma-client.worker.test.ts:18–35` verifies separate object scopes and retained clients. Keep existing startup and construction order. This also respects Cloudflare’s guidance to pass request state through arguments. [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
- **Remove the native RPC suite as a duplicate of mocked tests — rejected.** `commerce-runtime-rpc.test.ts` crosses real Miniflare/workerd RPC with changing gates and signed webhook bodies. Its removed-secret case and unchanged-body signature verification are not covered by local forwarding mocks.
- **Remove authentication, hostname, PAT restrictions, body bounds or editorial guards — rejected.** Entry policy and object policy enforce different boundaries. The object is also directly callable through its provided methods. Preserve Origin/role/revision checks, pending-publication and discard guards, upload validation, and private-response headers.
- **Simplify scheduled work with fail-fast `Promise.all`, or invoke binding lookup directly — rejected.** That can suppress independent work or allow a synchronous lookup failure to escape before both jobs start. Preserve lines 110–120 and the three distinct failure tests.
- **Remove publication alarms, single-flight state, preview ownership/persistence, or HEAD body cancellation — rejected.** These retain work across eviction, prevent duplicate processing, protect private contexts, and release streams. They are lifecycle behavior, not speculative scaffolding.
- **Eagerly decode preview media aliases or replace their traversal with a short-circuit loop — rejected.** At `cms-worker.ts:381–397`, decoding currently occurs inside `find`, before the media phase assignment. Moving it changes whether malformed aliases throw and which failure phase is logged; changing traversal can also change evaluation order.
- **Split the root into new routing/composition abstractions, cache Durable Object stubs, or partition objects — rejected.** No concrete deletion or lower-complexity result was established. Existing Ponytail comments document one low-traffic store/editorial site per object. Stub lifetime and ordering also have runtime semantics. [Durable Object stub documentation](https://developers.cloudflare.com/durable-objects/api/stub/).

**Inspected ownership and flows**

Every actually owned source/test file was inspected in full: three production files, four test suites, and `project.json`. Production totals **1,181 lines**; test totals **1,090 lines**; project configuration adds 29 lines.

- `index.ts`: app/preflight construction, object client scope, native fetch and scalar RPC forwarding, published item-name reader selection, OPTIONS bypass, and scheduled dispatch/error propagation.
- `cms-worker.ts`: entry routing precedence; private/static/public/internal/workflow destinations; current configuration forwarding; authentication and host gates; scheduler isolation; publication single-flight/alarm lifecycle; preview creation, ownership, assets/media/API/frame routing, logging and HEAD cleanup; workspace/publication composition; pending mutation and discard guards; token administration; initialization; draft normalization/validation/native translation; publish validation; upload derivatives; Astro/Cloudflare handoff; and response rewriting/cache policy.
- `middleware.ts`: bounded token-export routing, supported API policy, native artist references, null-artwork draft creation, editorial action/field/revision/reference validation, and rejected-body draining.
- All four owned suites: configuration replacement and overlap, forwarding and preflights, published names, native RPC/signatures, combined routing/access/upload/lifecycle cases, scheduler failures, real D1 queue limits/order, alert gates/state/recipient routing/retention and log redaction.

Connected contracts were inspected through the CMS public barrel, auth/verifier functions, preview and publication path contracts, published-name reader, Prisma scope/client factory and test, HTTP app/preflight factory, orders schedule entrypoint, scalar binding mapper, error-response helpers, shared content predicates/normalizers/validators, and connected middleware tests. Build/test configuration was read to establish entrypoints, bindings and test ownership. CMS implementation was not reviewed as a cleanup target.

Excluded nested roots: `platform`, `cms`, `interfaces/http` including `auth` and `stock`, `domain/commerce`, `application/email`, commerce `stock`, `orders`, `checkout`, `catalog-sync`, and infrastructure `persistence`, `stripe`, `resend`. Generated source under `src/generated` was excluded. Staff/CMS implementations, generated contracts, migrations, content and operational tooling are outside the proposed edits.

Ownership follows current `apps/backend/src/project.json`: it exports `index.ts`, `middleware.ts`, and `cms-worker.ts`. The boundary spec retains an older conflicting combined-worker ownership sentence; this review follows the current executable root ownership and the explicit application-root assignment, without proposing a boundary/documentation change.

**Source identity and stability**

Review date: **2026-10-10**. Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch **main**.

Opening and closing HEAD: `1dc943972e0c8cd28bc82c3d16bc964909d37963`.

Owned manifest SHA-256: `1f11de1e082051503706d5f66f80c5dc0a25747465d1e929cb3d9df750685f29`.

Connected source/configuration manifest SHA-256: `8aeeae8a1905cd24a20080a4ccbc04ab9aef0975a1c74f574f21ea2e42fed2b2`.

Each manifest hashes UTF-8 records of `path<TAB>file-SHA256<LF>`, sorted by path, with a final LF. All eight owned hashes and all 26 connected hashes matched their captured baselines at closing. Owned-path Git status was clean. Concurrent unrelated changes were preserved. Future implementation must recheck file identities rather than infer stability from HEAD alone.

Owned file identities:

```text
apps/backend/src/cms-worker.ts	c39cfe852babbd16d7b4e4a4355da606ff15d131e02ca97c429839dc89fe1a1e
apps/backend/src/commerce-runtime-rpc.test.ts	db405c594ad735307bb79dd7e85f27caf083954245222c46234fbf94659ec569
apps/backend/src/commerce-runtime.test.ts	87a24523aa72573093655861b62cb09251ca9de67af4dc290435afdca1bbbd27
apps/backend/src/emdash-checkpoint.test.ts	a125b4c6a050992c7f4b72a5869cc7d1d77c4da1fb0ae96a095569a90434a946
apps/backend/src/index.ts	69ae94139326c6038b6ed684e9fb4ceea3d0f97cf9bf23786860cdeee5584dd5
apps/backend/src/middleware.ts	9f8596784820371ae1dfdf8191f3b747e4506316cc7ed39eaf7e5295f700f1f7
apps/backend/src/paid-order-delivery-schedule.worker.test.ts	d20635c9b0e740a152e4426accc0cef8eb428ebd1fce47795f5bdde8046a72a9
apps/backend/src/project.json	028a4b9a57b18990cadfae5a8f55500537e079ee3a0b51b8f303ecd59de98ec1
```

Connected file identities:

```text
apps/backend/astro.config.mjs	e377465e63a859c16013f9416d999a98a68ab4dc87b14a78510dc9c3e931437f
apps/backend/src/application/commerce/orders/run-paid-order-delivery-schedule.ts	fcd5af5638ec30633de58cc2b58e583b31bd2b592c193c4346669cd337f36ace
apps/backend/src/cms/auth.ts	865a5c61f951e54b4ded2c02d4cef6ef4512deba78f6018ae91a2c49ceef03f4
apps/backend/src/cms/index.ts	1e070a26159489a04305751938098acdf9ad8d03faccd3c4c0f1b68499c4362b
apps/backend/src/cms/item-artwork.ts	84e53dbc15d884ad277f3c22c01d668df2da6d869a8bed2e870478496cec1220
apps/backend/src/cms/preview-content.ts	11fdabf39872ea7151d3d25836ed154a023c64f4926f89807a17f0ab74b97756
apps/backend/src/cms/preview-host.ts	094310c804f852e700ba1cfecb0e6ff2aff46ea02ca557b042f547b420c69609
apps/backend/src/cms/publication-routes.ts	5391f70a1c45c9239397635506cc31067ebece47ddeefdf09a2258893c0536d3
apps/backend/src/cms/published-store-item-names.ts	64d75d39991418d43252b8f392d7d12a17301780824ae7fdfb69b419fc645b92
apps/backend/src/infrastructure/persistence/prisma/create-prisma-client.ts	3ba60dd1032115d50b23608fa50d0f647f13b1e5ddeb6d51b2dd9d16c3ac52cc
apps/backend/src/infrastructure/persistence/prisma/create-prisma-client.worker.test.ts	f7c93bb57935f030011d04237da2993216801accbc6616e893f4f0758e378b39
apps/backend/src/infrastructure/persistence/prisma/index.ts	45d449f74cf824ce88a7fedffcb6c86df895d3ea9fc0a6aa42c0a78eb716cd77
apps/backend/src/interfaces/http/app.ts	a47cc5216052b82acdcd4c94e759694f0a46bfb1505839849888d78303b640a0
apps/backend/src/interfaces/http/auth/operator-identity.ts	f4345aaa3e81c651507ac1abe76b81ced51460b5f4eb3c34d2b8072c8c502e05
apps/backend/src/platform/env.ts	c5c4b8e480a2a0388ecab8053f0bfe1a0de959b6d44b256458661fa0cbd7eae9
apps/backend/src/platform/interfaces/http/responses.ts	6e315041e13e40c1f7aa106401eab675e8f37d5e69b6fa5b33c882ec46330991
apps/backend/test/integration/cms/snapshot-storage.worker.test.ts	075d7e20aa8d6abbb8c49ebc3f862481eb0be696540975f7be0843d051067a80
apps/backend/vitest.config.ts	2d58a6b590708ef3e21f1a8ca5841ea479c1bfaaa5a3db493f395fddb6d78e1f
apps/backend/vitest.modules.config.ts	e854374eb961ea9cc55a71f20112a56097834a2c1987a4b60321014ec91299a7
apps/backend/vitest.node.config.ts	5c6e22df174089c3e7b83cfecb609d229faa863433cc8b6682333b3f666fcc42
apps/backend/wrangler.jsonc	51cf8e733fe79b7e09100dcfcd2c7c271e4774f375178ecb7b765e0904ad668c
packages/content-model/src/emdash-content.ts	a90a7f32cd9d1eeeda55d0f0789209c0cd6a0f25cdf0bf79489a1e0969281fc2
scripts/cms-content-schema.test.mjs	95191d3b16ebdbbf69d5f62e0b9e7ddb1625353d218387fb2970759bf45894f8
scripts/cms-draft.test.mjs	aca1baf249fa63e61088d06960cfc00be88a47a2145a6ea327196e47837447fb
scripts/editorial-draft-creation.test.mjs	be7dc5aaf5d9bf9c163eed55f215fd63fb0bb96a22f43c78fa34ca74878c3fba
scripts/module-test-projects.ts	b13c016383248f87414d47d09f98fdc13d3d27b47c104e132b30239998e4d204
```

**Evidence and gaps**

Both existing graph tools were used. The initial Graphify query found 625 nodes and truncated its output; focused `CommerceRuntime`, `CmsRuntime`, middleware and token-classifier explains established the relevant extracted relationships. Inferred historical/document edges were not used as behavioral proof. CodeGraph supplied source/caller context but omitted portions of the large root file, test DSL bodies, and the RPC suite; bounded exact reads filled those gaps. No graph was initialized, enriched or refreshed.

The only execution was permitted read-only, in-memory probing: 32 rewritten-request comparisons, plus 1,248 routing comparisons for the deferred gated classifier cache. All matched their original counterparts. Dependency doubles represented downstream calls; these probes establish limited equivalence, not native Worker, browser, provider or release acceptance. No provider calls or repository writes occurred. Installed Workers types were inspected at version `5.20260926.1`; current official documentation and workerd source supported the Request-construction review.

No test runner, build, formatter, shared validation, OpenSpec mutation, commit, deployment, publication, hosted probe or provider mutation was performed. The fresh implementation thread owns independent verification and focused tests; the persistent verifier owns shared validation and acceptance evidence.

Verdict: **Ship the current behavior; the three scoped cleanup findings are ready for fresh implementation verification.**

Lean: **approximately −5 production lines, −16 to −18 test lines, −21 to −23 net lines; net files 0.**

Not checked: native workerd execution of the proposed cleanup, repository test/validation results, browser/provider acceptance, and hosted free-tier usage. Those remain deferred; no behavioral or release acceptance is claimed.
