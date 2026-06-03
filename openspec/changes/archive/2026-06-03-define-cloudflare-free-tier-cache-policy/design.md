## Context

BlackBox Records is a static Astro site with a persistent React app shell and a separate Hono Worker backend. UAT is GitHub Pages plus the sandbox Worker. PRD is Cloudflare Pages plus the production Worker, with checkout and live provider mutation disabled until the PRD-open gate. The backend uses D1 for commerce, stock, and order state. The repo intentionally avoids Pages Functions and keeps dynamic commerce behavior behind the Worker boundary.

Current repo evidence:

- `apps/web/astro.config.mjs` builds `output: 'static'`, with UAT defaulting to `https://blackbox-studio-athens.github.io/blackbox-records/` and PRD overriding to the Cloudflare Pages root.
- `.github/workflows/cloudflare-pages.yml` builds PRD and uploads `apps/web/dist` to `blackbox-records-web` with `wrangler pages deploy`.
- `.github/workflows/pages.yml` builds UAT through `withastro/action` and deploys to GitHub Pages.
- `apps/web/src/components/app-shell/navigation/shell-page-loader.ts` and `apps/web/src/components/app-shell/overlay/overlay-fragment-loader.ts` already keep same-session in-memory caches for fetched HTML and overlay fragments.
- `apps/backend/src/interfaces/http/routes/register-public-commerce-routes.ts`, `register-internal-stock-routes.ts`, and `register-internal-order-routes.ts` currently return JSON without an explicit cache policy.
- `apps/web/src/pages/admin/config.yml.ts` already returns `Cache-Control: no-store`.
- `apps/web/src/pages/admin/media/[collection]/[asset].ts` currently returns long immutable caching for generated admin media routes, but the user explicitly excluded Decap/CMS-level caching from this epic.

External Cloudflare research refreshed on 2026-05-31:

- Cloudflare Workers Free plan currently lists 100,000 requests/day, 10 ms CPU time per HTTP request, 50 external subrequests per invocation, 1,000 internal-service subrequests per invocation, 128 MB memory, 3 MB compressed Worker size, 64 MB uncompressed Worker size, and 50 Cache API calls per request. Source: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Pages Free plan currently lists 1 build at a time, 500 builds/month, 20,000 files/site, 25 MiB max asset size, and `_headers` constraints of 100 rules and 2,000 characters per header line. Source: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare D1 Free plan currently lists 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, 500 MB max database size, 50 queries per Worker invocation, and daily limit reset at 00:00 UTC. Sources: https://developers.cloudflare.com/d1/platform/pricing/ and https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare Pages recommends avoiding custom caching in most cases because Pages already caches deployed assets until the next deployment; custom caching is mainly appropriate for immutable hashed assets such as CSS or JS with content hashes. Source: https://developers.cloudflare.com/pages/configuration/serving-pages/
- Cloudflare Pages `_headers` can set custom response headers for static assets and includes a documented example of long immutable cache headers for fingerprinted assets. Source: https://developers.cloudflare.com/pages/configuration/headers/
- Cloudflare Cache docs say static content such as images, CSS, and JavaScript is cacheable by default, while dynamic HTML is not cached by default. Source: https://developers.cloudflare.com/cache/get-started/
- Cloudflare Cache Rules are available on the Free plan, but the Free plan allows only 10 rules. Source: https://developers.cloudflare.com/cache/how-to/cache-rules/
- Cloudflare Workers Cache API is data-center-local, does not replicate globally, is unavailable for Workers fronted by Cloudflare Access, respects response cache headers, and does not support `stale-while-revalidate` or `stale-if-error` through `cache.put`/`cache.match`. Source: https://developers.cloudflare.com/workers/runtime-apis/cache/

No material docs drift changed the plan direction. The only implementation-relevant nuance from the refresh is that Worker subrequest limits now distinguish external subrequests from Cloudflare internal-service subrequests; this does not make runtime caching a better first slice because D1 still has its own 50-query Free-plan per-invocation limit and dynamic commerce state remains authoritative.

The practical conclusion is conservative: the valuable first caching work is explicit HTTP policy and validation. Runtime cache stores, service workers, broad Cache Rules, KV, R2, and Pages Functions add failure modes without solving the immediate Free-tier pressure as cleanly as static asset headers, `no-store` dynamic APIs, and route-aware validation.

## Goals / Non-Goals

**Goals:**

- Define a small, durable cache taxonomy for this repo: Static Asset Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.
- Use Cloudflare Pages static headers for PRD static assets where the filenames are fingerprinted and safe to cache aggressively.
- Keep route documents and shell-fetched HTML revalidation-friendly rather than long-lived, because content and route markup change by deploy.
- Add explicit `Cache-Control` headers to Worker responses so browser, CDN, and future maintainers do not infer unsafe caching behavior.
- Preserve D1 as the source of truth for stock and order state.
- Reduce accidental Worker/D1 pressure by avoiding needless browser cache bypass on immutable static assets, not by caching mutable commerce state.
- Add automated checks that verify cache policy in local build output and representative Worker/API responses.
- Define hosted validation that inspects Cloudflare response headers on PRD without requiring a paid Cloudflare plan.

**Non-Goals:**

- Do not add Decap/CMS-level caching, Decap media cache policy changes, Decap auth changes, or Decap collection behavior.
- Do not add a service worker or offline cache.
- Do not add Pages Functions, Astro SSR, or Worker Static Assets for the frontend.
- Do not introduce KV, R2, Durable Objects, Cache Reserve, paid Workers, paid D1, paid Pages, or a new storage product.
- Do not cache checkout session creation, checkout state, stock reads, stock writes, order reads, webhooks, operator APIs, or provider mutation responses.
- Do not use broad "cache everything" rules for HTML, `/store/*`, `/stock/*`, `/admin/*`, `/api/*`, or app-shell overlay routes.
- Do not assume Cloudflare dashboard-only rules are the source of truth when a repo-owned header file or Worker header can express the policy.

## Decisions

### Decision 1: Start with HTTP cache policy, not a runtime cache subsystem

Implement cache behavior through response headers, build-output validation, and route tests before adding any Worker Cache API, KV, R2, service worker, or dashboard Cache Rule dependency.

Rationale: Cloudflare Free-tier limits make unnecessary Worker/D1 requests worth avoiding, but runtime cache code can consume Worker CPU, subrequests, Cache API calls, and open-connection slots. It also adds invalidation complexity. Static asset headers reduce repeat static transfer cost without touching dynamic authority.

Alternative considered: Use the Worker Cache API for Store Offer reads. Rejected for the first slice because Store Offer combines availability, stock, feature gates, Stripe mapping, and D1 state. A stale Store Offer can mislead checkout and stock perception, and the Cache API is data-center-local rather than a globally coherent catalog cache.

Alternative considered: Add a service worker for all static and API requests. Rejected because it creates stale-shell and stale-checkout risk, makes debugging harder, and requires a separate cache invalidation lifecycle.

### Decision 2: Cache only fingerprinted static assets aggressively

The PRD Cloudflare Pages build should include an `_headers` rule for hashed Astro assets such as `/_astro/*`:

```text
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

Other stable public assets can be evaluated, but only assets with content-addressed filenames or clear versioning should receive immutable caching.

Rationale: Cloudflare Pages recommends custom caching mainly for immutable content-hashed files. Astro build assets are fingerprinted, so deploys produce new filenames when content changes. This is the highest-confidence Free-tier optimization.

Alternative considered: Long-cache all images and public assets. Rejected because many source image filenames are editorial/content-owned and not guaranteed content-addressed. Long caching mutable filenames can show stale media after content replacement.

### Decision 3: Keep documents revalidation-friendly

HTML documents, app routes, overlay partial HTML, `sitemap.xml`, and `robots.txt` should not get immutable caching. The target policy is either no custom header, or a conservative document header such as:

```text
Cache-Control: public, max-age=0, must-revalidate
```

Implementation should choose the least intrusive option after checking current Cloudflare Pages defaults. If adding document headers, tests must prove redirects, direct loads, shell-managed navigation, and overlay partial routes still work.

Rationale: Cloudflare Pages already has deploy-aware defaults. Overriding all HTML with long TTLs can serve stale route markup after deploy and can interfere with redirects or future Functions if they are ever introduced. Shell/overlay fetches already maintain same-session caches; HTTP revalidation is enough at the network layer.

Alternative considered: Cache HTML at the edge for minutes or hours. Rejected for now because this is a small static site and the risk of stale store or event content outweighs the likely benefit.

### Decision 4: Dynamic Worker APIs are uncached by default

All Worker API responses should receive an explicit cache header. Default dynamic route policy is:

```text
Cache-Control: no-store
```

This applies to:

- `POST /api/checkout/sessions`
- `GET /api/checkout/sessions/{checkoutSessionId}/state`
- `/api/internal/*`
- Stripe webhook routes
- any provider mutation, catalog apply, or operator mutation route
- error responses for the above

Public store read APIs also start with `no-store` unless implementation defines and tests a narrower route-level exception.

Rationale: The Worker owns checkout capability, Store Offer freshness, Stripe mapping checks, D1 stock authority, and order state. Shared caches must not replay stale or user-sensitive responses. Explicit `no-store` also documents intent for future Cache Rules or proxies.

Alternative considered: Cache `/api/store/items/{slug}` for a short TTL. Deferred. It may become safe later for presentation-only fields or a split endpoint, but the current Store Offer includes checkout-facing availability and stock semantics.

### Decision 5: Browser fetches should not rely on accidental cache behavior

Frontend API clients should use explicit cache intent when the underlying fetch abstraction permits it:

- checkout and internal stock/order API calls use `cache: 'no-store'`.
- shell/overlay HTML fetches continue to use same-session memory caches, but implementation must expose a bypass or invalidation path if future content or commerce actions need a fresh document snapshot.
- static asset loading should rely on normal browser/CDN behavior and should not be forced through cache-busting query strings.

Rationale: Server headers are authoritative, but explicit browser fetch options prevent the browser HTTP cache from making API behavior ambiguous during local and hosted validation.

Alternative considered: Add cache-busting query strings to all API and shell fetches. Rejected because it defeats revalidation for documents and increases origin traffic.

### Decision 6: Same-session shell caches stay scoped and invalidatable

The shell page cache and overlay fragment cache are not CDN caches. They are same-tab, same-session UI caches for static HTML snapshots. The cache policy must document:

- they can serve previously visited static route content during the same session.
- they must not cache Worker API JSON.
- they must not preserve checkout, stock, order, or payment authority.
- they must be bypassable or cleared after future mutations that change visible static content within the same browser session.

Rationale: The existing app-shell cache improves navigation and player continuity without touching backend authority. Naming the boundary avoids confusing it with HTTP caching.

Alternative considered: Remove shell/overlay caches to guarantee fresh markup. Rejected because the persistent shell/player model depends on fast same-document navigation, and the cached content is static route markup, not authoritative backend state.

### Decision 7: Hosted validation must fit Cloudflare Free-tier operation

Validation should include local checks and optional hosted checks:

- local build-output validation confirms `_headers` exists in `apps/web/dist` and classifies each route pattern.
- backend tests confirm representative API routes include `Cache-Control`.
- a non-mutating hosted script can issue `HEAD` or `GET` requests to PRD static assets and route documents and report `Cache-Control`, `ETag`, and `CF-Cache-Status` when available.
- hosted checks must avoid high-volume cache warming and stay well below Workers and D1 daily limits.

Rationale: Free-tier hosting is enough for this project if validation is bounded and non-mutating. Heavy synthetic load tests or cache warmers would be counterproductive.

Alternative considered: Add dashboard Cache Rules and inspect them through the Cloudflare API as the main proof. Rejected because repo-owned `_headers` and Worker headers are easier to version and review, and Free-tier Cache Rules are limited.

## Risks / Trade-offs

- [Risk] Immutable headers are applied to non-fingerprinted assets and stale images persist after content edits. Mitigation: initially restrict immutable headers to `/_astro/*`; require explicit inventory before adding other patterns.
- [Risk] API `no-store` prevents useful browser caching for public Store Offer reads. Mitigation: accept the small cost until Store Offer can be split or freshness semantics are proven; D1 query/index hygiene is safer than stale checkout state.
- [Risk] Adding `_headers` affects Cloudflare Pages PRD but not GitHub Pages UAT in the same way. Mitigation: document UAT/PRD parity limits and validate PRD headers on Cloudflare Pages while keeping UAT functional.
- [Risk] Cloudflare Pages default caching plus custom headers interact unexpectedly. Mitigation: verify deployed headers and `CF-Cache-Status` on representative PRD URLs after deployment.
- [Risk] Cache validation accidentally hammers Worker/D1. Mitigation: use a bounded URL set, prefer static URLs for cache checks, and avoid loops/load tests.
- [Risk] Decap/admin media cache concerns get pulled into this epic. Mitigation: keep Decap/CMS-level caching explicitly out of scope and do not alter Decap media/admin behavior in implementation tasks.

## Migration Plan

1. Inventory generated build output paths and classify static assets, route documents, partial overlay routes, admin routes, and API routes.
2. Add the minimal Cloudflare Pages `_headers` artifact for fingerprinted Astro assets.
3. Add route-level Worker cache helpers and apply `Cache-Control: no-store` to dynamic commerce/operator routes.
4. Add frontend fetch cache intent for public checkout and internal stock clients where the fetch abstraction allows it.
5. Document shell/overlay cache boundaries and add bypass/invalidation tests if implementation changes code.
6. Add local validation script(s) for `_headers` and API route cache headers.
7. Add optional hosted PRD header audit that is read-only and bounded.
8. Update README/AGENTS/OpenSpec baseline docs with the accepted cache policy.
9. Run `openspec validate define-cloudflare-free-tier-cache-policy --type change --strict`, `openspec validate --all --strict`, `pnpm test:unit`, `pnpm check`, and `pnpm build`.
10. If rendered UI or shell behavior changes, validate with Browser Use. If only headers/tests/docs change, Browser Use is not required.

Rollback is a normal git revert. Removing the `_headers` file or route header helper returns the app to current Cloudflare/Worker defaults. No persisted D1 data, Stripe state, checkout session state, stock ledger, or content schema migration is part of this epic.

## Open Questions

- Should public Store Offer reads stay strictly `no-store`, or should a later implementation split presentation-only catalog reads from checkout-authoritative availability reads?
- Should `sitemap.xml` and `robots.txt` get explicit revalidation headers, or should they keep Cloudflare Pages defaults?
- Should hosted PRD header verification run in CI on every `main` deploy, or remain an operator-run smoke command to avoid coupling CI to deployment propagation timing?
