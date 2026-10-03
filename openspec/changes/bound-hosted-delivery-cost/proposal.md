## Why

The `e818b70` review ([PERF-004](../improve-site-performance-round-three/reports/PERF-004-review-e818b70.md)) found that the hosted public site's main risk is quota, not speed. UAT is live and PRD is the readiness site. Both run every non-asset request through the Pages Function and a billed service-binding hop to one public renderer Durable Object. The findings are inferred from code, Node 24 benchmarks of the real reader, and Cloudflare documentation; hosted UAT and PRD were not contacted.

- **Worker requests.** Every HTML document, each `/_image` candidate, `/media`, and `favicon-96x96.png` runs the Function. A first-visit page view therefore costs about 20-80 Worker requests. The account's shared Free 100,000 requests a day (UAT, PRD, CMS and commerce API together) runs out at roughly 1,500-5,000 such views, and checkout goes down with it. Not-found responses and scanner probes also run the Function and a full render. ESM logos travel the whole chain as unresized PNGs, and `favicon-96x96.png` is corrupted by text decoding.
- **Images quota.** Media URLs embedded the snapshot SHA, so every publication, even a text-only one, changed every image URL. That cold-started browser and edge caches and re-minted transformations against the 5,000 a month Images Free allowance shared by UAT and PRD (1,105 source × width pairs at the time). Every historical snapshot's media × 17 widths stayed a valid `/_image` target. Transforms ran only for the exact `pages.dev` host, so the planned apex cutover would have served originals cached immutably.
- **Hosted HTML.** HTML is edge-cached for only 30 + 30 s. The Durable Object page cache (64 entries, 8 MiB, clear-all eviction) and the parsed snapshot vanish whenever the object hibernates after 10 idle seconds. Most low-traffic views pay a pointer read, a snapshot parse (about 150 ms) and a full render. Revalidation always re-downloads the page: there is no ETag, and the gateway drops `If-None-Match`. The object has no location hint, and it serialises SSR, media, image proxying, previews and publication validation.
- **Correctness.** The hosted build's purchase-information alias targeted a module that no longer exists, so published purchase information never reached hosted pages.
- **Gates.** No performance gate runs on hosted output, and `strictExecutionOrder` also reaches the hosted client build.

## What Changes

- Hosted pages receive published purchase information, and a regression test proves every module the hosted config overrides still exists.
- Address hosted media by media SHA only. Accept it only for the live and three most recent accepted snapshots and only for widths the components emit. Transform from a configured canonical source origin. Serve a short-lived original fallback when a transformation fails, never an immutable one.
- Take images and static assets off the Pages Function: a hosted image service emits direct transform URLs on the images host, ESM images become plain `/_astro` URLs, `/favicon*` is excluded from the Function, asset responses pass through byte-for-byte, and the gateway answers non-site paths with a static 404. The Free-tier rule gains a Worker-requests-per-page-view budget that the UAT pilot checks.
- Keep hosted HTML through hibernation: render cache persisted in Durable Object storage with byte-accounted LRU, single-flight pointer refresh, weak ETags with `If-None-Match` forwarded, streamed responses, and a European location hint with publication work on a separate instance. Longer edge reuse with publication-tagged purge is used if the Free plan allows it, keeping the current window as fallback.
- Run the bundle-graph and image-markup checks on hosted output, and scope `strictExecutionOrder` to the SSR build.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cloudflare-free-tier-cache-policy`: hosted page views stay within a declared Worker-request budget; published HTML is reused across renderer hibernation and revalidates cheaply.
- `site-images`: hosted CMS media is addressed by media identity and transformed from a canonical source through direct URLs.
- `content-publishing`: hosted pages render accepted purchase information.
- `tooling-validation`: hosted public output passes the public performance gates.

## Impact

- Backend: `apps/backend/astro.public.config.mjs`, `src/cms/public-runtime.ts`, `public-image-transform.ts`, `published-storage.ts`, `snapshot-storage.ts`, the published reader's media base, publication routes (activation purge hook), and the public Durable Object's name, location hint and storage.
- Gateway and release build: `scripts/pages-public-gateway.mjs`, `scripts/build-public-release.mjs` (`_routes.json`, route allowlist), `scripts/check-runtime-bundle-graphs.ts` and the image-markup check for `dist-public`.
- Shared package: `packages/content-model/src/published-content.ts` (media URL building).
- Docs: `docs/cloudflare-free-tier.md`, `docs/content-publication.md`, `docs/environment-model.md`, `docs/worker-observability.md`.
- Cloudflare stays on Free. Nothing is deployed by this change; hosted verification follows the Free-tier rule after an authorized release.
- Commerce authority, the commerce API Worker, and Local static output are unchanged.

## Out of scope

- HOST-11 (pruning the static site from hosted release CI): needs an owner decision on the Pages fail-open mode first. Task 6.2 records the options; nothing changes until the owner decides.
- Paid Cloudflare products (Cache Reserve, paid Images plans, Workers Paid) and any KV binding.
- Main-site runtime work, which is in `improve-site-performance-round-three`.
