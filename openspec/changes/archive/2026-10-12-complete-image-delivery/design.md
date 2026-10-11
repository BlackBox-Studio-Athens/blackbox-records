# Design

## Staff thumbnails

Use one flat-key contract for native JPEG, PNG, and WebP media across the upload validator, thumbnail route, client URL helper, media-reference audit, and backfill. Permit safe Unicode and punctuation in a flat key up to 200 characters; reject path separators, control characters, malformed Unicode, and unsupported extensions. Encode the complete key as one URL path segment.

The browser always submits a PNG derivative. If its first 96-pixel render exceeds 40 KiB, shrink and render again until it fits or fail the upload before sending either file. The server independently checks PNG bytes, dimensions, and byte size. EmDash also uses the submitted thumbnail to prepare its low-quality placeholder. The CMS stores the same bytes as a separate private derivative only after the native upload succeeds; derivative write failures are logged and leave the original intact for later backfill.

The read-only media-reference audit pages EmDash image records in D1 and compares each key with its original and derivative in R2. It reports missing originals, unsupported keys, valid derivatives, missing derivatives, and invalid derivatives. An optional hash mode reads a bounded source page and records SHA-256 values for before/after preservation checks. The bounded R2 preparation report also inventories unreferenced native R2 objects and published/non-image objects. It writes only `staff-thumbnails/v1/` objects, in one page per invocation, and retains the source ETag check. Resume R2 scans with `startAfter` because Local cursors can repeat after process restart. An explicitly requested source key that is absent is reported as a missing original.

## Public CMS images

Astro's passthrough image route already receives the original URL and requested width. Route only exact `/media/content/<snapshot-sha>/<media-sha>` URLs through the image transformation host. Snap the requested width up to the next rung of a finite ladder (96 to 1800 pixels, capped at 1800) and pass `format=auto`; reject non-approved source origins, URL queries and arbitrary paths, and keep the original for a missing or non-positive width. Snapping covers every width Astro emits, including `src` fallbacks at the source width. The Pages gateway forwards only the shopper's `Accept` header, which is what lets `format=auto` negotiate AVIF or WebP. `_astro` and `/assets/` requests continue to the static asset binding.

The transformation host is a non-secret Worker variable for UAT and PRD and is empty in Local. Cloudflare Images fetches each source from the current environment's Pages origin. A failed, rejected, or non-image transformation response falls back to the verified original response from the public renderer. Snapshot and media hashes make both source and transformed URLs immutable. No preview route can reach this public image path. Cloudflare Images Free allows 5,000 unique transformations per month; Workers Free allows 100,000 incoming requests per day, including cache hits.

The public Worker uses its existing `PublicSiteRuntime` Durable Object. Replace its legacy migration declaration with the documented equivalent declarative export (`sqlite`), preserving the provisioned class, and add a named `PublicImageRenderer` entrypoint. Its response varies on `Accept` when the transformed format is negotiated, and remains `public, max-age=31536000, immutable`. An original returned after a failed or rejected transformation is `no-store`, because the failure can be transient, such as an exhausted monthly Images allowance, and a cache must not pin a multi-megabyte original at a sized URL.

## Published HTML edge cache

The Pages gateway reaches the public Worker's default entrypoint through a service binding, and that entrypoint now enables Workers Caching. The renderer marks successful renders of the accepted snapshot `public, max-age=0, s-maxage=30, stale-while-revalidate=30`; every other renderer response keeps `no-store`, and not-found responses set it explicitly because Workers Caching otherwise stores header-less 404s heuristically.

- Category: Document Revalidation with a bounded edge window. Browsers revalidate every use.
- Authority: the accepted snapshot pointer. Published HTML is identical for every visitor, because prices, stock and cart state load client-side from the Worker API.
- Stale tolerance: the edge may serve a page for up to 60 seconds after its render, on top of the renderer's five-second pointer poll. Content Publication confirmation reads the uncached `/content-version.json`, so a confirmed publication can take about a minute more to appear on a cached page.
- Invalidation: the cache key includes the Worker version, so a deployment starts empty; content changes expire within the window. No purge is available, because the CMS Worker holds no API token and `pages.dev` is not a purgeable zone.
- Free-tier impact: a cache hit still counts one Worker request but skips the Durable Object and its render. Cached `/_image` responses vary on `Accept`, and the query string is part of the cache key.

The cache helps bursts of traffic, such as a release announcement. A page requested less often than once per minute at a data centre still renders in the Durable Object.

## Cloudflare setup and rollout

Enable URL transformations on the existing `blackboxrecordsathens.com` zone at `images.blackboxrecordsathens.com`. Configure only `https://blackbox-records-web-uat.pages.dev` and `https://blackbox-records-web.pages.dev` as source origins. The DNS/zone change and hosted backfill are not executed during local implementation. The runbook records the Free-tier headroom review, bounded UAT pilot, then PRD rollout gate.
