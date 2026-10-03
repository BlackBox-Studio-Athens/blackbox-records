## Context

This change is the hosted sibling of `improve-site-performance-round-three`. Both come from the `e818b70` review (`PERF-004`), the post-commerce measurement that the closed performance program requires before a new child starts. The program wrapper is archived at `../2026-08-31-site-performance-program/`.

Hosted topology today:

- The Pages `_worker.js` (`scripts/pages-public-gateway.mjs`) forwards every non-asset GET and HEAD, with only the `Accept` header, through the `PUBLIC_SITE` service binding to the public renderer Worker.
- The renderer (`apps/backend/src/cms/public-runtime.ts`, built by `astro.public.config.mjs` with `output: 'server'` over `apps/web/src`) has Workers Caching enabled on its default and image entrypoints.
- On a cache miss it calls one Durable Object, `PUBLIC_SITE_RUNTIME.getByName('public')`. That object re-reads the R2 publication pointer when its 5 s window lapses, keeps the parsed snapshot in memory, and renders pages.
- `complete-image-delivery` (open) added Images URL transformations at `images.blackboxrecordsathens.com`, `Accept` forwarding, width snapping and a 60 s HTML edge window.

The review did not contact hosted UAT or PRD. Its costs come from code reading, Node 24 benchmarks of the real reader (not workerd), and Cloudflare documentation read through Context7 (Pages Functions pricing, Workers pricing, Workers Cache, Durable Object lifecycle and limits, Images pricing). Real edge hit rates and the public object's location are unknown. This change therefore plans from those documented limits and verifies on UAT only after an authorized release.

The Free-plan figures this change budgets against:

| Resource               | Free allowance                    | Shared by                   | Hosted cost at `e818b70`                                          |
| ---------------------- | --------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| Workers requests       | 100,000 a day, account-wide       | UAT, PRD, CMS, commerce API | about 20-80 per first-visit page view (Function plus binding hop) |
| Images transformations | 5,000 unique a month              | UAT and PRD                 | every publication re-minted all source × width pairs              |
| Durable Object idle    | hibernation after about 10 s idle | the single public object    | page cache and parsed snapshot lost on each hibernation           |

## Goals / Non-Goals

**Goals:**

- Cut Worker requests per hosted page view to a declared, checked budget, so ordinary traffic cannot exhaust the shared allowance and take checkout down.
- Make the Images allowance proportional to distinct live media, not to publications or crawlers.
- Serve most low-traffic hosted views without a snapshot parse and full render.
- Fix the hosted purchase-information correctness bug.
- Give hosted output the same performance gates as static output.

**Non-Goals:**

- No paid Cloudflare product, KV binding, or plan change.
- No change to commerce authority, the commerce API Worker, or the Local static build's behaviour.
- No change to which pages exist or what they render, beyond published purchase information reaching hosted pages.
- No decision on Pages fail-open mode or static-site pruning (HOST-11) without the owner.

## Decisions

### 1. Hosted pages read published purchase information (PAGES-07)

The hosted alias matches the current owner module, `@/platform/lib/purchase-information`, in alias, resolved-path and relative-import forms. A regression test proves every module the hosted config overrides still exists in `apps/web` and exports the same names. The inline `#purchase-information` JSON is emitted only in builds whose browser reader needs it: hosted pages keep it, static pages drop it. Static and hosted renders stay consistent.

### 2. Media is addressed by media SHA (HOST-02, HOST-N1, HOST-06, HOST-10)

- Media URLs are `/media/content/<media-sha256>`, so a text-only publication changes no image URL, and browser, edge and Images caches stay warm.
- A media SHA is served only while the live snapshot or one of the three most recently accepted snapshots references it. Drafts, failed candidates and retired media return 404 `no-store`, preserving Content Publication privacy. The legacy `<snapshot>/<media>` shape stays readable for those snapshots only.
- `/_image` accepts only widths the components emit (the 17-rung ladder, 540, and each image's intrinsic `src` width). It always transforms one canonical source URL per media SHA, from the configured `PUBLIC_IMAGE_SOURCE_ORIGIN` rather than the request host, so the apex cutover keeps transforms.
- A failed or quota-exhausted transformation serves the verified original with `public, max-age=300` and `X-Blackbox-Image: original-fallback`, never immutably. Transformations resume after the monthly reset, and the edge absorbs repeats meanwhile.
- The recent-snapshot index costs one acceptance-marker listing plus at most three media-only manifest reads per renderer instance, which removes the per-request manifest re-parse for older snapshots.

This narrows two parts of `complete-image-delivery`'s unarchived requirement: "exact UAT/PRD Pages source origins" becomes a configured canonical origin, and "original-byte fallback" becomes a short-lived fallback. Task 7.1 reconciles the wording once that change is archived.

### 3. Images and assets bypass the Pages Function (HOST-01, HOST-13, HOST-14)

- A hosted Astro image service emits direct Images transform URLs on the images host, so browsers fetch resized CMS images without invoking the Function or the renderer. `SiteLayout` preconnects to that host.
- Repo-owned ESM images (logos) emit plain fingerprinted `/_astro` URLs served by Pages assets.
- `_routes.json` excludes `/favicon*`, and the renderer returns asset responses byte-for-byte, which fixes the corrupted `favicon-96x96.png`.
- At release build, a route allowlist is generated from the site's routes. The gateway answers paths outside it with a static `no-store` 404 without calling `PUBLIC_SITE`.
- `docs/cloudflare-free-tier.md` gains a Worker-requests-per-page-view budget for a cold first visit and a warm repeat view of representative routes, and the UAT pilot measures it. The target is one Function invocation and at most one renderer invocation per HTML document, with zero for images and static assets. Slice B2 sets the recorded number from its measured local trace; task 7.2 reconciles the delta with it.

Image transformation URL syntax, caching and Free limits are checked against current Cloudflare documentation through Context7 before use, and each feature's Free availability is cited in `validation.md`.

### 4. Hosted HTML survives hibernation (HOST-05, HOST-07, HOST-08, HOST-09, HOST-04)

- **Render cache.** Rendered pages persist in the public Durable Object's SQLite storage, keyed by release SHA, snapshot SHA and path, with LRU eviction by byte size instead of clear-all at 64 entries. A woken object can serve a page without re-parsing the snapshot.
- **Edge reuse.** Published HTML may carry a `Cache-Tag` for its release and snapshot with a longer shared `s-maxage`, purged from a private `/__publication` route after activation, but only if Workers Cache purge by tag is confirmed available on the Free plan. Otherwise the current 30 + 30 s window stays, and the persisted render cache carries the win. Browsers keep revalidating on every use, as the document revalidation policy requires.
- **Pointer refresh (HOST-07).** Snapshot pointer refresh is single-flight, and the current snapshot is served while a refresh is in flight.
- **Revalidation (HOST-09).** HTML responses carry a weak ETag derived from release, snapshot and path. The gateway forwards `If-None-Match` beside `Accept`, so a matching revalidation returns 304 without a body.
- **Streaming (HOST-08).** After the content-read fixes in round three, a render streams to the client and is teed into the cache inside `waitUntil` instead of being buffered first, if that stays simple.
- **Location and isolation (HOST-04).** The public object is recreated under a new name with a European `locationHint`, and `/__publication/*` runs on a separate instance, only after confirming the object holds caches only, so the migration loses nothing.

`cloudflare-free-tier-cache-policy` currently says the first accepted cache implementation uses repo-owned headers and tests unless a stronger OpenSpec change approves an added runtime dependency. This change is that approval, for Durable Object SQLite storage and, if available on Free, tag purge. It adds the requirement instead of modifying "Document revalidation policy", which `complete-image-delivery` modifies. Task 7.3 reconciles the HTML cache wording with slice B3's result and with that change.

### 5. Hosted output is gated like static output (HOST-12)

`strictExecutionOrder` applies to the hosted SSR build only. The bundle-graph and image-markup checks also run against `dist-public`, with the same route budgets as static output. The hosted release job calls them before upload.

HOST-11 stays open. The hosted release currently builds and ships the full static site, which hosted HTML never references unless it is the Pages fail-open fallback. Pruning it requires the owner to choose between fail-open (keep the static fallback) and fail-closed (an explicit 503). Task 6.2 documents the two options with their cost and risk; nothing changes until the owner decides.

## Risks / Trade-offs

- **A wrong recent-snapshot window could 404 media that a cached page still references.** Three accepted snapshots cover the 60 s edge window and the persisted render cache keyed by snapshot; cached pages for older snapshots are evicted or re-rendered.
- **Direct transform URLs expose the images host.** They carry only the media SHA, an allowed width and format options; the source must be the canonical origin, and Images rejects other sources.
- **A gateway allowlist could 404 a real page.** It is generated from the same release build as the pages, covers dynamic route prefixes as prefixes, and is tested against the built route list.
- **A persisted render cache could serve a stale release.** Keys include release and snapshot SHAs; activation changes the pointer, so old keys are never read and are evicted by LRU.
- **A Durable Object rename discards in-memory state.** The object holds caches only (verified before the change), so the first requests after deploy re-render.
- **Unverified Free-plan features.** Tag purge, SQLite storage limits and location hints are confirmed in current documentation before use; a feature that is not Free is dropped, not paid for.

## Migration Plan

1. Land slices B0-B4 locally with worker and gateway tests; deploy nothing.
2. Reconcile the deltas with slice results and with `complete-image-delivery` (group 7).
3. After the owner authorizes a release, follow the Free-tier rule. Record account-wide usage, run the bounded UAT pilot, and measure Worker requests per page view, Images transformations, `/_image` sizes, HTML `cf-cache-status`, 304 revalidation and the purchase-information content. Then repeat for PRD after UAT succeeds.
4. Append `PERF-006` and archive.

Rollback is per slice: revert the commit and redeploy the previous candidate. The media-SHA URL shape keeps the legacy snapshot-prefixed URLs readable for recent snapshots, so a rollback does not break cached pages. The renamed Durable Object can be retired after rollback; it holds caches only.

## Open Questions

- Is Workers Cache purge by tag available on the Free plan for this account? Slice B3 answers it from current documentation.
- What Worker-requests-per-page-view figure does the Free-tier rule record? Slice B2 measures it locally; the UAT pilot confirms it.
- Pages fail-open or fail-closed? Owner decision; it gates HOST-11.

## Recovered implementation decisions, 2026-10-03

- Local accepted-snapshot emulation renders the actual SSR artifact and supplies separate document/client roots to unchanged bundle and image budgets before release artifacts are copied. The fixture includes explicitly synthetic purchase-information wording, verified through the native snapshot validator; it establishes alias/renderer behavior, not legal approval or hosted publication.
- Direct image output preserves default WebP, editorial WebP68, a 160 px WebP40 blur and 1,200 px JPEG metadata. Seventeen width rungs bound candidates; 144/216 thumbnails snap to 160/240 and 176 cart seeds snap to 240. The conservative compatibility ceiling is 53 source/options combinations per distinct media SHA per environment; the shared monthly allowance remains 5,000.
- Native browser fallback clears responsive candidates and requests the canonical original once. JavaScript-disabled browsers and metadata crawlers cannot use it on cross-zone transformation failure; that acceptance limitation remains open.
- Persisted HTML uses an 8 MiB byte LRU with a 2 MiB entry ceiling, indexed eviction, single-flight pointer refresh, weak ETags and separate cache-only `public-v2`/`publication-v2` objects with best-effort `eeur` placement. Buffering remains because it keeps HTML validation/cache failure handling simple within that ceiling.
- Tag purge is available on Free according to current documentation. Runtime activation now calls a private default-entrypoint invalidation seam: verify and refresh the current accepted pointer in `public-v2`, then purge publication-tagged HTML in the owning entrypoint. Refresh epochs reject stale in-flight results; failed or lost purge receipts retain accepted content and pending confirmation for idempotent retry. Local can proceed without an edge cache API after pointer verification; UAT/PRD require success. The installed emulator lacks native purge, so propagation remains a hosted pilot gate. Keep the existing 30 s freshness plus 30 s revalidation window; no longer TTL or provider/zone mutation is claimed.
- The local document request model is two invocations on cold or warm renderer visits (Pages Function plus Worker/DO), while public repo assets bypass the Function. Direct image URLs remove per-image Pages invocations from browser requests, but cold Images source fills and browser original fallbacks still add origin work. Actual account-wide cost/cache behavior is a bounded, owner-authorized UAT pilot gate.
- Both fail-open and fail-closed static fallback options are documented. The owner choice, actual location, account usage, apex image smoke and UAT/PRD release remain unverified. This change stays unarchived.
