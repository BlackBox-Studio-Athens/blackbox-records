## Why

Loading animations make network waits visible, but they do not reduce Worker invocations, D1 reads, or stale-content risk. Because BlackBox Records is hosted on Cloudflare's Free tier for Pages, Workers, and D1, the repo needs an explicit cache policy that uses the CDN for static assets while keeping checkout, stock, order, and provider state authoritative and fresh.

## What Changes

- Define a Cloudflare Free-tier cache policy for the hosted architecture: static Astro frontend on Cloudflare Pages PRD, GitHub Pages UAT, separate Cloudflare Worker APIs, D1-backed commerce/stock state, and no Pages Functions.
- Add Cloudflare Pages `_headers` policy for Cloudflare-hosted static output where it is safe:
  - long immutable caching for fingerprinted Astro build assets.
  - conservative revalidation for HTML and route documents that shell navigation fetches.
  - no broad "cache everything" rule for HTML or app routes.
- Add Worker response cache headers by route class:
  - `no-store` for checkout creation, checkout state, orders, stock operations, internal APIs, webhooks, and browser-safe capability reads unless a later change proves a narrower safe TTL.
  - optional tiny TTL or conditional validation only for public, non-authoritative reads after Store Offer freshness semantics are explicit.
- Keep the existing in-memory app-shell and overlay caches as same-session navigation optimizations, but define when they must be bypassed or invalidated after commerce or stock state changes.
- Add validation that inspects built assets and representative responses for required `Cache-Control` headers.
- Add verification guidance for Cloudflare response headers and Free-tier limits without requiring a paid plan, Workers KV, R2, paid Cache Reserve, Pages Functions, or a service worker.
- Explicitly exclude Decap/CMS-level caching from this epic.

## Capabilities

### New Capabilities

- `cloudflare-free-tier-cache-policy`: Defines cache-control, CDN/browser caching, Worker route freshness, and validation requirements for Cloudflare Free-tier hosting.

### Modified Capabilities

- `static-site-and-deployment`: Static deployment requirements must emit and verify Cloudflare Pages cache headers for PRD without adding Pages Functions or a second frontend runtime.
- `commerce-checkout`: Checkout, Store Offer, capability, and checkout-state reads must preserve Worker/D1/Stripe authority and reject unsafe shared caching.
- `orders-stock-operator`: Protected stock and order APIs must stay uncached and operator-authoritative across reads and mutations.
- `app-shell-and-player`: Shell page and overlay fetch caches must remain same-session conveniences and must not mask authoritative commerce or stock changes.
- `tooling-validation`: Repository and hosted validation must verify cache headers, route classifications, and Free-tier-safe behavior.
- `project-language`: Canonical terms must distinguish Static Asset Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.

## Impact

- `apps/web/public/_headers` or equivalent Astro-copied static header artifact.
- `apps/web/src/components/app-shell/**` and `apps/web/src/lib/app-shell/**` where shell/overlay cache invalidation or bypass semantics are documented or adjusted.
- `apps/web/src/lib/backend/public-checkout-api.ts` and `apps/web/src/lib/backend/internal-stock-api.ts` if browser fetch options need explicit cache modes.
- `apps/backend/src/interfaces/http/**` for Worker route-level `Cache-Control` headers.
- API contract tests under `apps/backend/test/**` and frontend tests under `apps/web/src/**`.
- Validation scripts under `scripts/**`, especially checks that can inspect route/header policy from build output or local Worker responses.
- `.github/workflows/cloudflare-pages.yml` and `.github/workflows/pages.yml` only if cache validation is added to deployment gates.
- `README.md`, `AGENTS.md`, and OpenSpec baseline specs where cache policy becomes architecture guidance.
- No Decap admin collection behavior, Decap media workflow, or CMS-level cache policy is included in this change.
