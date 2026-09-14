## Context

See `proposal.md` for scope. The public application is static Astro with a persistent React shell/player. `apps/staff` already contains stock and order workflows. `apps/backend` owns Hono APIs, Prisma/D1 commerce persistence, Stripe Checkout, signed webhooks, and scheduled paid-order email delivery. Its desired-catalog reader still imports a generated catalog manifest; root install/check/build commands regenerate catalog inputs.

The authoritative migration inventory is the actual `apps/web/src/content.config.ts`, content files, runtime catalog bindings, and current D1 state, not an old collection count or test stock seed. Preserve the completed catalog/default-Price and staff-order work as well as unfinished tax, shipping, purchase-information, order-reconciliation, and distro-content changes.

## Goals / Non-Goals

**Goals:** One member workspace and login; one backend deployment per environment; CMS-backed content and runtime catalog; independent content publication; safe price/stock/item work; one normal local command.

**Non-Goals:** Rewriting checkout/stock/order business logic, replacing Prisma, shopper accounts, a generic workflow engine, automatic UAT-to-PRD data copying, new payment authority, marketplace plugins, BOX NOW automation, or public SSR. EmDash supplies CMS capabilities, not inventory transactions or an order engine.

## Decisions

### 1. Keep the monorepo and combine only the backend deployment

| Existing package/resource | Target responsibility                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                | Static public Astro pages, shell/player, content snapshot loader, image builds                                                                  |
| `apps/staff`              | BlackBox-owned static staff UI for content, items, stock, and orders                                                                            |
| `apps/backend`            | One Worker entrypoint composing EmDash's supported Astro/Cloudflare runtime, existing Hono APIs, protected staff assets, and scheduled handlers |
| `packages/api-client`     | Existing separated public/internal generated application contracts                                                                              |
| `packages/content-model`  | Only portable editorial validation and content snapshot DTOs genuinely shared by CMS, staff, and public build                                   |
| `COMMERCE_DB`             | Existing commerce plus runtime catalog and durable item/price operation records                                                                 |
| `CMS_DB`                  | EmDash-owned editorial records, users, revisions, and CMS metadata                                                                              |
| Private R2 storage        | CMS media originals and immutable content export snapshots; private backups have separate storage/access                                        |

Keep two deployed applications per environment: public Pages and the combined backend Worker. `apps/staff` remains a source/build boundary, not a third hosted service. Build staff before backend packaging and stage its verified assets into the Worker asset directory. Never import staff or public application source into backend runtime.

The combined fetch entrypoint routes existing application APIs to Hono and CMS requests to the supported EmDash handler. Serve staff assets only after hostname and Access checks, including alternative Worker hostnames. Configure asset routing to run the Worker first for protected paths; test it rather than trusting the Access hostname alone. Keep public checkout, inquiries, newsletter, and signed Stripe webhooks outside the staff sign-in challenge.

The user reaffirmed Workers Free only on 2026-09-13. Run the supported CMS handler inside one SQLite-backed `CmsRuntime` Durable Object for this editorial site, exported by the same backend deployment. The entry Worker checks the CMS hostname and forwards the original request; the object verifies Access before any CMS or private asset response. Keep `CMS_DB` in D1 and media in R2. The object supplies the free platform's 30-second CPU allowance, not a replacement database or a concurrency lock: revision compare-and-swap remains authoritative. Public commerce bypasses the CMS object and runs the existing Hono app in a separate `CommerceRuntime` object in the same deployment; `COMMERCE_DB` remains authoritative. Both Free HTTP and Cron entrypoints have a 10 ms CPU budget, so scheduled work also forwards through object RPC. Measure entry Worker CPU separately from object CPU, request counts, and duration; do not activate Workers Paid. Send browser-generated thumbnails through EmDash's supported upload field to avoid decoding large originals for placeholders.

Compose, rather than replace, the current scheduled paid-order-delivery handler with bounded CMS maintenance/publication retry. Isolate handler failures and preserve the existing schedule contract. Do not introduce a full-catalog Stripe cron.

Alternative rejected: separate CMS, commerce, and staff deployments connected through service bindings. That retains the coordination the user wants removed. Also reject a CMS rewrite of working commerce logic.

### 2. Prove the pinned EmDash integration before migration

Keep Astro sessions disabled because Access already verifies private requests. The canonical CMS build must fail on KV bindings in source or final adapter output, including after dependency updates. Preserve the authenticated-request no-session-cookie regression. Follow the [Free-tier operating rule](../../../docs/cloudflare-free-tier.md) before bulk hosted work: rehearse locally, inspect hidden writes, check account-wide remaining allowances, measure a bounded pilot, and budget retries plus ordinary service headroom. Unknown usage prevents bulk execution; quota alerts stop affected bulk work pending diagnosis. Any future KV exception requires an intentional guard/test change with purpose, owner, measured Free-tier budget, and exhaustion behavior, never a silent bypass or paid upgrade.

Use exact tested versions of EmDash, its Cloudflare adapter, Astro integration, and compatible Astro/React dependencies. The backend can have its own compatible build dependency versions; changing the public application version is not an automatic prerequisite.

EmDash documents a Worker/Astro integration with D1/R2 and allows omitting sandbox plugins and their loader. Use that supported composition, with no marketplace, AI, KV cache, runtime image-transform service, or extra paid binding by default. Explicitly select passthrough image behavior in the backend; retain public image optimization at build time. Inspect generated Wrangler configuration as well as checked-in configuration. [EmDash Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/)

Checkpoint M1 must prove: a custom UI can list/create/edit/publish through supported APIs; stale revisions are rejected; Access identity works; local mock identity works only on loopback; existing Hono routes and scheduled retries survive composition; schemas/data survive redeploy. Use the documented external REST contract and enforced revision checks, not undocumented internal browser endpoints. [EmDash REST API](https://docs.emdashcms.com/reference/rest-api/)

The 2026-09-12 implementation authorization permits a minimal version-pinned package patch for the reproduced revision race. Preserve the client's originally validated state through EmDash's existing database compare-and-swap and reject a failed conditional write without rebasing a stale request. Keep the patch reproducible from a clean install, test concurrent HTTP saves, and remove it when an upstream release passes those tests. Review every permitted mutation path; the two-line draft fix alone is not proof for metadata, non-revision collections, or other lifecycle writes. Require revision tokens on staff edits and reject unsupported write shapes before any partial change. Do not add an isolate mutex, lock service, or general concurrency framework. Register an exported upstream REST route through Astro when the integration omits it; do not reimplement its contract.

Measure the final generated bundle and representative deployed UAT CPU, requests, D1 reads/writes/storage, R2 operations/storage, and CI usage against current account limits. Low traffic reduces request counts, not per-request CPU limits. Test authenticated reads/saves, media operations, publication, and checkout after warm-up and on cold starts. Record actual limits and observations, including shared UAT/PRD/backup usage. A paid-plan requirement or unsupported integration is a stop-and-report condition, not authorization to spend or fork upstream.

### 3. One Access identity, separate authorization boundaries

Retain Google plus explicit Cloudflare Access email allowlists. Use EmDash's supported auth-provider interface backed by the existing `verifyOperatorAccess` verifier, preserving the same target issuer/audience and strict expiry checks as commerce. Require the exact configured CMS hostname before private reads, and map the verified email to EmDash member/owner roles. This avoids a second identity lookup, relaxed token expiry, or identity logging from the packaged Access adapter. Never trust a forwarded email alone. Distinct UAT and PRD Access applications are required. PRD's current staff hostname is `staff.blackboxrecordsathens.com`; use the proposed `staff-uat.blackboxrecordsathens.com` only after authorized provisioning and verification.

Use existing EmDash permission primitives, not a new RBAC framework. Ordinary allowlisted members get only the content/commerce operations required here; owner-only user/schema/security administration stays restricted. Provision and test the mapping explicitly, including revocation. Disable alternative hosted login/registration methods and keep built-in administrative CMS screens owner-only, not the member workspace. [EmDash authentication](https://docs.emdashcms.com/guides/authentication/)

Cookie-authenticated mutations enforce same-origin/CSRF protection, request validation, and revision checks. Server-held API/service credentials never enter staff bundles or localStorage. Local maps the existing configured mock operator into the supported CMS auth interface only when Product Environment is Local and the request is loopback; use no forged hosted JWT or authentication bypass on public aliases.

### 4. Preserve content shape; migrate ownership rather than redesign pages

Model the existing Artists, Releases, Distro, News, fixed pages, settings, navigation, socials, newsletter, and purchase-information content in EmDash. Preserve relation IDs, public slugs, ordering, fixed-layout objects, dates, optional-field semantics, embeds, image alt text, and deletion policy. News/social confirmed deletion stays; Artist/Release/Store Item/fixed-page hard deletion stays unavailable to ordinary members. Keep Release editorial identity distinct from its sellable Store Item.

Move only genuinely shared, framework-free schemas/closed values into `packages/content-model`. Astro `image()` and rendering remain in `apps/web`; CMS adapters remain in backend. Do not introduce a generic schema-driven form framework. Reuse current staff components and the existing seven preview outcomes for focused forms/preview panels. Draft preview stays inside the protected workspace, clearly labeled; it does not create a public preview deployment.

Convert existing Markdown into EmDash's supported rich-text representation with an explicit semantic comparison. Reject unsupported/lossy content instead of silently dropping it. Use the CMS's supported editor/rendering facilities and a tested public rendering adapter, with unsafe HTML/URLs rejected. Preserve the current public visual design, route/overlay behavior, category derivation, search, SEO, and persistent playback.

### 5. Persist the catalog; keep Stripe and inventory authority

Add runtime catalog persistence through the existing commerce repository/application seams. Records contain stable Store Item/variant identity, source kind and CMS source linkage, public slug, physical type, supported price policy, published/paused state, and the checkout presentation projection required by current readers. Extend/reuse existing mapping, availability, and snapshot records; do not duplicate fields already owned there.

Replace callers of the generated desired-catalog reader with runtime repository reads. Public price lists use existing snapshots; detail/checkout resolve the persisted Product binding and its current default Price. Neither path queries the CMS or scans a Stripe account for its catalog. Keep current webhook deduplication, direct Product retrieval, historical Prices, fixed/custom pricing, tax policy, and fail-closed behavior.

Stock stays in existing Stock/StockChange/StockCount and reservation logic. Preserve physical quantity, online allocation, expected revisions, holds, and paid-order exactly-once transitions. Generic CMS CRUD has no route to these tables. Code/data import never resets them to original opening quantities.

### 6. One guided workflow, small durable operations

Extend the staff item list/detail with Content, Price, Stock, and relevant order links. The normal tasks are:

| Member action                   | Backend effect                                                                                       | Public deployment                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Change price                    | Validate; create/reuse replacement Price on bound Product; select default; reconcile snapshot        | None                                |
| Change stock                    | Existing movement/recount/allocation use case, reason, actor, expected revision                      | None                                |
| Add label Release with 10 vinyl | Editorial Release + one linked Store Item/variant + reviewed initial Price + one opening stock entry | Publish listing when setup is ready |
| Add Distro with 10 vinyl        | Distro source + one Store Item/variant + reviewed initial Price + one opening stock entry            | Publish listing when setup is ready |

Default EUR, one standard variant, appropriate vinyl format, and all explicitly entered opening stock online. Default quantity is zero; never invent price or inventory. Keep advanced online allocation and supported pay-what-you-want policy available. A Release can remain editorial-only. Merch reuses the same setup with existing physical-type/category derivation; do not create a new commerce category authority.

Use one small typed operation journal in `COMMERCE_DB` for item setup and price changes, not a workflow framework. Persist operation ID, kind, validated input hash, actor, target identity, expected revision, current step, provider results, and completion/error. Unique constraints protect stable source/variant identity and opening-stock application. Use conditional claims/leases to serialize commands for the same item and reject stale edits. A lease is not a substitute for provider idempotency.

Setup proceeds through validated draft/source linkage, runtime identity, Stripe Product/Price binding, one-time stock initialization, and ready-to-publish state. Each step can resume using persisted results; if the network fails after a provider write, inspect the known object/identity before retrying. Recover after Stripe idempotency retention using durable identity and scoped provider inspection; never blind-retry object creation. A retry with changed inputs is a conflict. Stop on ambiguous identity rather than deleting/recreating objects.

Price operations create immutable replacement Prices with existing approved VAT/currency/kind policy, then set the Product default and reconcile. Keep old Prices and existing Checkout Sessions/order snapshots intact. Check the expected default immediately before writing. Concurrent staff commands serialize; an external Dashboard edit is not transactionally locked, so reread after the write and surface detected conflict instead of claiming cross-system atomicity. Dashboard remains a deliberate recovery path, not the normal workflow.

Staff confirmation authorizes only the named PRD item operation. Bulk PRD migration retains its separate one-run live confirmation. Neither opens checkout. Publishing a sellable item includes a targeted Product Projection step only when its checkout title, description, or artwork changed; keep this inside the same guided operation, not a separate member task. It never changes an existing Price. Ordinary post/page publication and unchanged item presentation make no Stripe writes. If the targeted projection fails, retain the last live item and show the resumable failed step; do not run a full-catalog synchronizer.

### 7. Independent publication through the existing static build

Keep the public site static. Replace Git/content glob inputs with an Astro content loader reading an explicit validated export snapshot. Preserve the `site-data` and storefront presentation interfaces where practical. Unit tests use explicit local fixtures; hosted builds fail on missing snapshots and never fall back to committed production content.

The member's Publish action creates a durable publication request. Reuse CMS native status/revision support, with a small app-owned publication record for requested revision, snapshot identity, code SHA, CI run/deployment identity, and pending/live/failed outcome. Keep this record and its application migration separate from EmDash core tables, in `CMS_DB`. Do not expose it through generic editable content collections.

Use a narrowly scoped server-held GitHub credential to trigger a dedicated content workflow in this repository. It can dispatch only the fixed workflow/target payload; it is not a browser credential. The workflow resolves deployed code SHA from the canonical successful deployment record, not event-supplied shell text or latest `main`. Use least-privilege target-scoped read/export and completion credentials; the export identity cannot edit content, inspect orders, or write commerce. Only trusted workflow code handles secrets.

Export immutable published content and referenced media to private snapshot storage. At this traffic level a complete export is simpler than incremental invalidation. Capture and recheck the complete record ID/revision vector, including deletions and references; retry if it changes. Do not assume separately paginated reads are an atomic snapshot. Do large export/image/build work in CI, with bounded API pages, rather than serializing the entire catalog inside a free-tier Worker request. The captured snapshot identifies its schema version and SHA/content digest.

Build with the target's approved code and snapshot, run content/schema/render/route-isolation checks, and deploy only `apps/web/dist` atomically through Pages. Reuse previous code-gate evidence for the same approved SHA; a content publication does not need a new Worker deployment or provider apply. Verify the resulting deployment revision and send an authenticated idempotent completion acknowledgement before marking Live. Pending requests survive browser closure and failed dispatch. Retry using the existing scheduler at a bounded cadence; coalesce waiting requests to the latest published revision. No Queues, Durable Objects, or event bus is needed for this workload.

All code and content deploy paths share the target mutation lock. Recheck current deployed code/content identity after acquiring it. A waiting publication must rebuild if code changed. A code candidate built against older PRD content must refresh its PRD-targeted artifact using the same reviewed code SHA and current PRD snapshot, rerun target/content/compatibility checks, and require explicit promotion of that refreshed artifact. Do not copy UAT content or roll back a PRD publication to promote a UI fix.

New items remain non-buyable until setup and first public deployment are confirmed. Unpublish/archive pauses new checkout before attempting static removal. Existing orders and reservations remain processable. Publication does not forcibly reload a tab playing music; fresh loads see the new revision and the existing same-session cache limitation remains explicit.

### 8. Media and backups do not become another platform

Keep media originals private in R2. At publication, copy only approved media into the static build and retain existing stable `/assets/catalog/...` URLs where referenced. A narrowly scoped public media route serves explicitly approved immutable objects needed by Stripe before the first item-page deployment; it must not expose a bucket listing, drafts, snapshots, or backups. Initial draft Product setup can omit optional artwork; the guided Publish item operation approves its referenced media and applies the initial Product artwork before requesting the static publication, without another member action. Uploads validate MIME/bytes/size, safe filenames, dimensions, and URL origins. Do not fetch arbitrary editor-supplied URLs from the server.

Use existing Astro/Sharp build optimization and image roles, not paid runtime transformations. Keep old referenced media across replacements and code rollback. No automatic garbage collector is required in this first migration.

EmDash's JSON export alone is not a full restore: it omits important state and does not include media binaries. Use actual D1 backups/exports plus media recovery, with a restore rehearsal before cutover. Keep backups inaccessible through every public media path. [EmDash backup limitations](https://docs.emdashcms.com/guides/backups/)

Set an initial daily backup, seven daily recovery points, and a pre-migration/pre-upgrade backup; retain at least the currently deployed and prior verified content snapshots. Measure retention against free storage. State the initial disaster-recovery objective as up to 24 hours of editorial loss and manual same-day recovery, not guaranteed zero loss. Preserve EmDash revision history for normal editing recovery. Commerce backup/restore remains separate and must never be restored just to undo a content error.

### 9. One local command reuses the existing launcher

Make root `pnpm dev` delegate to `pnpm dev:stack:stripe-mock`; retain that command and `.run/BlackBox Local Stack.run.xml` unchanged as entrypoints. Extend `scripts/start-local-stack.ts` and existing process helpers to prepare local `CMS_DB`, `COMMERCE_DB`, R2 fixtures, staff assets, public web, combined Worker, and the official stripe-mock proxy. Keep web 4321, backend 8787, and proxy 12110; fail on occupied ports and stop children together.

Bootstrap only empty local stores. Persist edits and stock between restarts; fixture reset is an explicit Local-only diagnostic. Local Publish refreshes the local content snapshot/web loader without GitHub or hosted writes. Keep fake IDs, mock email, and provider compatibility patches in existing development tooling, never production use cases.

`dev:web`, UAT-connected frontend work, and real Stripe test preflight remain advanced diagnostics. The normal stack needs no Docker, real Stripe keys, GitHub login, `.dev.vars`, or hosted CMS account. Update both existing IDE launchers only where their underlying implementation changes; do not add more launch configurations.

## Risks / Trade-offs

- **EmDash is evolving; free-tier fit is unproven here** → Pin versions and pass M1 before removing anything. No silent paid fallback.
- **One Worker increases shared failure impact** → Keep public commerce routing independent of CMS initialization where supported, bounded CMS calls, explicit scheduler composition, and a known-good rollback artifact.
- **Static publishing takes a build** → Show pending/live/failure honestly; use full snapshots and coalescing at very low frequency instead of an incremental publishing platform.
- **Stripe/CMS/D1 cannot share a transaction** → Durable identities, per-item conditional claims, provider reconciliation, and resumable visible steps; never promise all-or-nothing cross-system rollback.
- **Code promotion and content edits race** → Shared target lock plus code/content preconditions, not lock ordering assumptions.
- **Removing Git removes the editorial recovery source** → Full private DB/media backups and tested restore before cutover; JSON export is not enough.

## Migration Plan

1. Reconcile completed overlapping changes and finish the Cloudflare UAT/promotion prerequisite. Inventory content, media, stable identities, Stripe bindings, D1 stock/orders/reservations, and active tasks without mutating them.
2. Pass the supported-integration/free-tier checkpoint on isolated UAT resources. Configure explicit core/schema migrations before traffic; do not rely on first-request migration or a default seed to mutate hosted data.
3. Build CMS schemas, private media import, and dry-run reconciliation. Import first into Local/UAT. Keep source files and Sveltia operational until replacement paths are verified; do not maintain ongoing bidirectional sync.
4. Backfill runtime catalog from reviewed current data. Compare counts/IDs, exact prices, balances, online allocation, reservations, pauses, and order references before/after. Abort on ambiguity. Add migrations; never rewrite existing commerce migration history.
5. Implement unified staff, item/price commands, independent publication, and the complete local launcher. Test retries at every external-write boundary and both supported pricing paths.
6. Rehearse cutover in UAT, including draft privacy, new items with ten stock, publish/code races, old admin retirement, backup restore, and application rollback while orders remain intact.
7. For authorized PRD cutover, freeze old editorial writes, take final backups, import the final delta, verify reconciliation, switch the read/publication source once, and enable the protected staff workspace. Keep checkout gates unchanged. Never restore UAT operational data into PRD.
8. Before any new CMS writes, rollback can restore the previous application/read source. After new CMS writes or runtime items exist, an old compiled-catalog Worker is not a safe rollback: pause affected writes/checkout and roll forward or use a tested compatible runtime-catalog release. Editorial recovery must preserve post-cutover edits or explicitly export/reconcile them; commerce DB restore is not a content rollback.
9. Remove Sveltia runtime/config/auth, obsolete generated catalog imports and ordinary generation hooks, direct Git content publishing, separate staff Pages deployment, obsolete tests/scripts, and superseded documentation. Retain only explicit import/recovery inputs outside production runtime; inspect the dependency graph to prove no silent fallback remains.
