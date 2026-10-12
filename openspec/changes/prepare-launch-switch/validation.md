# Launch preparation evidence — 2026-10-12

## Initial local implementation

Prepared locally on `main` in the primary checkout. Four of fifteen tasks are complete: server-side call inspection (1.2), UAT read inventory/authentication (2.1), staged command (3.1) and its stubbed acceptance tests (3.2). API/artwork routes, URL generation and compatibility are implemented locally; tasks requiring promotion, credentials, live migration or hosted observation remain unchecked. No commit, push, deployment, DNS/Access change, Stripe mutation, payment or content publication was performed.

Source base: `d9ea4bc96f47f24ecc5f8f44b77a6e5476f7f2c3` plus this uncommitted implementation. Unrelated analytics and switch-day planning directories were preserved.

The owner approved the narrow published-media Access exception and the artwork migration prerequisite. The former protects UAT pages/previews while allowing accepted canonical media and the email logo; the latter prevents finalization from disabling a live Stripe image source. Details and the hosted read inventory are in [the runbook](../../../docs/launch-switch.md).

## Implementation evidence

- PRD backend routes now include apex `/api/*` and `/media/published/*`; existing staff routes and Pages checkout origin remain. The PRD backend profile produces apex artwork URLs, while the old Worker media origin continues serving the same approved objects during migration.
- Renderer/gateway inspection found no server-side fetch to the backend's public URL. `StoreListingPricePrefetch.astro` fetches inside its browser inline script; checkout/forms are browser consumers. Public rendering reads accepted content, and the Pages gateway already calls `PUBLIC_SITE` through a binding while excluding API paths. No new service binding was needed.
- UAT release/HTTP, browser smoke and account-migration image reads use scoped service-token headers. Local browser suites and API-only/catalog/provider checks are excluded from the hosted-site inventory for the reasons recorded in the runbook. HTTP login redirects fail; browser requests authenticate one UAT hop. Token-bearing traces are refused and diagnostics redact configured credentials.
- The launch command retains unique summaries and a pinned rollback snapshot, bounds requests, checks accepted release identity, restores DNS after uncertain writes or failed TLS/Home, enforces the 24-hour window, verifies apex Stripe artwork before retirement, and implements launch-owned redirect/DNS reversal. Fallback acceptance intercepts Images requests with controlled 503 responses instead of consuming transformation variants.
- Live Stripe business website, Checkout terms/privacy and enabled legal links were inspected through the signed-in Chrome extension on 2026-10-12 at 09:04:37 UTC. They point at the apex. A safe account-matched receipt is retained only in ignored `.codex-artifacts/launch/stripe-dashboard-review.json`. No settings were edited. The script requires a fresh review within 24 hours for each applicable stage; this observation does not prove future settings or policy-page availability before cutover.

## Checks

- `pnpm openspec:guard`: passed on `main`.
- `pnpm test scripts/launch-switch.test.mjs`: passed all eight selected/dependency tasks after correcting a release test fixture that derived UAT by replacing `-prd` in the old PRD URL. Covers launch dry-run, critical recovery including lost PATCH response, noncritical failure, retirement, rollback, secret redaction, invalid stage and artwork dependency refusal; shared Access tests also pass.
- `pnpm test apps/backend/src/cms/item-artwork.worker.test.ts`: passed all three affected projects (`cms-runtime`, `cms-integration`, `backend-runtime`), including apex/legacy byte parity, environment isolation and malformed requests.
- `pnpm openspec -- validate prepare-launch-switch --type change --strict`: passed.
- `pnpm launch:switch -- --help` and `git diff --check`: passed.
- `graphify update .`: local AST refresh succeeded (27,343 nodes, 43,524 edges). Its existing partial-parse warning for `scripts/pages-workflow-contract.test.ts` remains; no semantic/LLM graph update was run.
- `pnpm validate`: passed all 63 selected tasks, including browser token-scoping and diagnostic-redaction regressions, with 58 cache hits. Successful summary: `.codex-artifacts/validation/2026-10-12T09-54-16-177Z-45232-cd01c6/summary.json`, `mode: local`, `status: passed`. Before/after source SHA matches the base above; both source fingerprints are `f655640daefadbcde075893575607dd5665025c8e81554e10a32b0afb3f73b6e` (49 changed/untracked source files, no source drift).

Earlier failures remain in `.codex-artifacts/validation/2026-10-12T09-37-48-180Z-68240-b48355/summary.json` and `2026-10-12T09-51-20-280Z-15468-cb1e81/summary.json`: the existing migration CLI subprocess exceeded its 15-second deadline during the first run, and its automatic retry stopped on the browser test added after initial formatting. The timeout did not repeat and required no timeout change. The next run exposed incomplete Playwright mock types in that new test; those test-only types were corrected. The successful run above covers the correction. Stopped dependency tasks in those failed runs are not additional accepted results.

After this evidence-only note, validation is repeated to capture the final tree. The ignored `.codex-artifacts/launch/completion.json` points to that final summary and records its matching before/after fingerprint, avoiding a self-changing evidence record.

Acceptance rows: tooling/instructions and release/environment. No product interface changed, so visual, player-continuity and staff-editor browser acceptance are not applicable. Hosted forms/checkout/routing, Access sign-in and fresh anonymous media, actual image fallback, signed webhook delivery and release gates remain required at the corresponding unchecked tasks. Stubbed launch tests do not establish provider write permissions or real recovery.

## Remaining hosted work

Owner setup: GitHub PRD backend variable; production/preview Access applications and repository service-token secrets; restricted Stripe launch key; scoped Cloudflare token and optional Bing key in ignored `.env.launch`. No launch credential file was present during implementation. The live artwork URL migration needs its reviewed catalog authorization and appropriate provider authority, rather than the launch command's read-only Product access.

Then promote and prove the Holding Page/API coexistence, Pages commerce/forms, apex artwork bytes, retained webhook signing secret and delivered event, and UAT gates with Access enabled. Run credentialed cutover dry-run. Before real cutover, finalize dry-run must refuse; do not create artificial hosted stability evidence. Finalization rehearsal after 24 hours needs renewed Dashboard review and stability checks. Archive only after all preparation acceptance is complete.

## Authorized hosted continuation — 2026-10-12

The owner explicitly authorized autonomous continuation of preparation. GitHub's repository variable `PRD_PUBLIC_BACKEND_BASE_URL` was changed to `https://blackboxrecordsathens.com` and read back. Existing Wrangler OAuth permits Workers, routes, D1 and Pages operations. The existing live Stripe connector matches the reviewed account; the process Stripe key is test-only and is not used for PRD.

At approximately 10:09–10:15 UTC the signed-in Cloudflare dashboards showed Workers 4,163/100,000 daily requests; D1 120.73k/5M daily rows read and 211/100k written; R2 536/1M Class A and 59.33k/10M Class B operations for the current billing period, with 0.5/10 GB-month storage. Durable Objects current-period totals provide conservative daily upper bounds: 46.84k requests, 2.23k GB-seconds, 114.61k SQL rows read and 12.46k written, with 4.81 MB storage and zero KV operations. There is ample headroom while reserving at least half of every daily allowance for ordinary service.

Preparation budget: one push and promotion, at most 1,000 Worker invocations, 100k D1 rows read/5k written, 500 DO requests/50k rows read/10k written, and 500 R2 reads/100 writes, including migration bookkeeping, smoke and retries. Inspect actual usage before another full run or if any quota warning occurs. Artwork verification is separately bounded to 100 public requests (98 distinct apex images plus two old-origin pilot comparisons), followed by at most 99 image-only Product updates. No new Images transformation variants, content publication or shopper launch is authorized by these checks.

The live Product inventory is complete (`has_more=false`): 99 active PRD Products, 98 distinct approved `/media/published/<sha>` images, all on the legacy PRD Worker origin. The planned mutation changes only each image origin to the apex, retaining its content hash and all other Product fields. Prices and D1 stock are outside this mutation. The existing enabled webhook retains its ten configured checkout/catalog event types and still needs its URL changed after apex routing is proven.

`pnpm build:web` passed, including cache policy, brand font, image markup, route isolation and bundle budgets. The remote main is an ancestor of this checkout; pushing the preparation also carries the five already-prepared local commits, including the accepted Bandcamp resolver and player continuity changes. The unrelated analytics and switch-day planning directories remain excluded.

### Hosted outcomes

Preparation commit `5f09436cb8984390991060ff807d446bba3d3293` was pushed to main. UAT release run `38235322712` passed on attempt 2, including all four e2e shards, WebKit and both staff-preview browsers. Attempt 1 deployed successfully but verification refused the owner's open UAT checkout. Its existing plain-text `NATIVE_CHECKOUT_ENABLED=true` override was temporarily changed to false; the failed deployment job alone was rerun. Restore that original value after the final release acceptance. PRD promotion `38237055376` passed. The apex API and PRD Pages release both report the selected source; apex Home remains the noindex Holding Page. Listing readiness returned 99 ready Store Items.

The one-time apex routes were applied with `wrangler triggers deploy` using an ignored reviewed config that retains both staff/preview custom domains, the internal staff route, workers.dev and the five-minute cron. Routine PRD promotion uploads/deploys versions and intentionally does not reconcile routes. No apex DNS, public-site launch, HSTS or technical-address retirement was performed.

The existing live connector changed only the webhook URL, keeping its endpoint identity and ten event types. The repository webhook verifier reported no issues, no missing event types, and a present Worker signing secret. In live Workbench a manually resent existing `product.updated` event was delivered to the apex at 10:22:57 UTC with HTTP 200 and `{"received":true}`. The subsequent image-only migration generated 99 fresh catalog events; a complete event read showed zero pending webhooks for all 99. No payment was made.

All 98 distinct apex product images matched their SHA-256 path identities; two old-origin pilot reads matched identical bytes, using exactly 100 public reads. The 99 Product updates changed only image origin and provider update timestamps; complete post-inventory has no further page and every image uses the apex. All 99 D1 Stock rows match before/after exactly. Private evidence: `.codex-artifacts/launch/artwork-migration-plan.json`, `artwork-byte-proof.json`, `artwork-migration-journal.json`, `stock-image-migration-proof.json`, `webhook-config-verification.json`, `webhook-delivery-proof.json`, and `promoted-apex-proof.json`. A Windows command-length limit interrupted saving the journal after 90 successful updates; the retained results were recovered using native patching, and only the nine remaining Products were then updated.

A controlled PRD Pages fallback pilot decoded the original, cleared responsive candidates and used 43 browser requests plus its initial HTML read, with Images requests fulfilled locally as 503. This exposed an insufficient 100-public-request finalization cap for the actual catalog. A regression with 100 distinct images plus the measured 43 browser requests failed at that cap, then passed after allowing 175 public requests for finalize only. The total 200-request cap and 100-public-request cutover/rollback caps remain. This is a bounded implementation correction for the observed inventory within the recorded Free headroom; the later real-cutover stability proof remains unperformed.

Eight of fifteen tasks are complete. Dedicated launch credentials and the UAT Access service token/applications are still absent. The ignored `.env.launch` is prepared with the verified account/zone IDs and blank credential fields; no secret value belongs in Git or chat.
