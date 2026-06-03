## 1. Research Confirmation And Inventory

- [x] 1.1 Re-read `proposal.md`, `design.md`, and all spec deltas for `define-cloudflare-free-tier-cache-policy`.
- [x] 1.2 Re-check current Cloudflare Workers Free-tier limits for daily requests, CPU time, subrequests, Cache API calls, memory, and Worker bundle size.
- [x] 1.3 Re-check current Cloudflare Pages Free-tier limits for builds, files per site, asset size, `_headers` rule count, and `_headers` line length.
- [x] 1.4 Re-check current Cloudflare D1 Free-tier limits for rows read, rows written, database size, storage, queries per Worker invocation, and reset behavior.
- [x] 1.5 Re-check Cloudflare Pages serving and `_headers` docs before choosing document and asset cache headers.
- [x] 1.6 Re-check Cloudflare Workers Cache API docs before deciding whether any runtime cache API use is justified.
- [x] 1.7 Record any Cloudflare docs drift in `design.md` before implementation changes policy.
- [x] 1.8 Inventory current static build output paths after `pnpm build`, including `/_astro/*`, route HTML, overlay partial HTML, `sitemap.xml`, `robots.txt`, public assets, and admin routes.
- [x] 1.9 Inventory every Worker API route and classify it as public store read, checkout mutation, checkout state, internal stock, internal order, webhook, catalog/provider mutation, health/readiness, or generated docs.
- [x] 1.10 Inventory every current cache-related file and behavior, including `_headers` absence/presence, app-shell caches, overlay caches, API client fetches, and existing `Cache-Control` headers.
- [x] 1.11 Confirm Decap/CMS-level caching remains out of scope and record any discovered Decap cache concerns as deferred, not implemented.

## 2. Cache Taxonomy And Policy Mapping

- [x] 2.1 Add the canonical cache taxonomy to repo docs or a dedicated cache policy section: Static Asset Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.
- [x] 2.2 Map every inventoried static path class to one taxonomy category.
- [x] 2.3 Map every inventoried Worker route class to one taxonomy category.
- [x] 2.4 Identify which path classes can safely use immutable caching and document the evidence for each.
- [x] 2.5 Identify which path classes require `no-store` and document the authority or privacy reason for each.
- [x] 2.6 Identify which document path classes use Cloudflare Pages defaults versus explicit revalidation headers.
- [x] 2.7 Identify any route class that might deserve a future TTL but is intentionally kept `no-store` in this change.
- [x] 2.8 Add the policy table to `README.md`, `AGENTS.md`, or a focused docs file according to existing repo documentation patterns.

## 3. Cloudflare Pages Static Header Artifact

- [x] 3.1 Add a repo-owned Cloudflare Pages `_headers` artifact in the Astro static source so it is copied into `apps/web/dist`.
- [x] 3.2 Add an immutable cache header rule for `/_astro/*`.
- [x] 3.3 Keep the `_headers` rule count and line length within Cloudflare Pages Free-tier limits.
- [x] 3.4 Avoid immutable headers for route HTML, overlay partial HTML, `/store/*`, `/stock/*`, `/admin/*`, `sitemap.xml`, and `robots.txt` unless implementation records a specific safer revalidation policy.
- [x] 3.5 Decide whether to add explicit document revalidation headers or leave Cloudflare Pages defaults intact, and record the final choice in docs/design.
- [x] 3.6 If document headers are added, verify direct loads, extensionless redirects, app-shell section routes, and overlay partial routes still behave correctly.
- [x] 3.7 Do not add dashboard-only Cache Rules as a required implementation step.
- [x] 3.8 Do not add Pages Functions, Astro SSR, Worker Static Assets, or a second frontend runtime.

## 4. Worker Cache Header Infrastructure

- [x] 4.1 Add a small backend helper or convention for applying `Cache-Control` headers to Hono/OpenAPI responses.
- [x] 4.2 Ensure the helper keeps response body, status code, CORS behavior, and OpenAPI response shape unchanged.
- [x] 4.3 Apply `Cache-Control: no-store` to checkout session creation responses and handled checkout errors.
- [x] 4.4 Apply `Cache-Control: no-store` to checkout state responses and handled checkout-state errors.
- [x] 4.5 Apply explicit cache policy to `/api/store/capabilities`, defaulting to `no-store`.
- [x] 4.6 Apply explicit cache policy to Store Offer and Store Offer variants responses, defaulting to `no-store`.
- [x] 4.7 Apply `Cache-Control: no-store` to internal stock search, detail, history, StockChange, and StockCount responses.
- [x] 4.8 Apply `Cache-Control: no-store` to internal order list and checkout-session order responses.
- [x] 4.9 Apply `Cache-Control: no-store` to webhook acknowledgement or error responses where response construction is repo-owned.
- [x] 4.10 Apply explicit no-store policy to catalog/provider mutation/readiness routes if they exist in the Worker runtime path.
- [x] 4.11 Confirm preflight/CORS responses keep required CORS headers after cache headers are added.
- [x] 4.12 Confirm generated OpenAPI contracts do not expose internal cache policy as shopper-facing provider details.

## 5. Frontend Fetch Freshness

- [x] 5.1 Inspect the generated API client fetcher extension points before changing public checkout API fetch behavior.
- [x] 5.2 Add explicit fresh-read intent for public checkout and Store Offer API calls where the fetch abstraction supports `cache: 'no-store'`.
- [x] 5.3 Add explicit fresh-read intent for internal stock/order API calls in `internal-stock-api.ts`.
- [x] 5.4 Preserve credentials behavior for protected operator APIs.
- [x] 5.5 Preserve browser-safe checkout payloads and do not add Stripe IDs, D1 IDs, provider state, or secrets to frontend cache keys.
- [x] 5.6 Avoid cache-busting query strings unless a specific browser compatibility issue is proven.
- [x] 5.7 Add or update frontend tests for fetch options where local test seams make that observable.

## 6. Same-Session Shell Cache Boundaries

- [x] 6.1 Review `shell-page-loader.ts`, `overlay-fragment-loader.ts`, and `AppShellRoot.tsx` before changing shell cache behavior.
- [x] 6.2 Document that shell page snapshots are Same-Session Shell Cache, not HTTP cache or Worker authority.
- [x] 6.3 Document that overlay HTML fragments are Same-Session Shell Cache, not immutable CDN assets.
- [x] 6.4 Confirm shell and overlay caches never cache Worker API JSON.
- [x] 6.5 Add a bypass, clear, or refresh method only if implementation needs it to satisfy the specs.
- [x] 6.6 If a cache bypass or clear method is added, test affected section navigation, overlay navigation, focus reset, scroll reset, and stale-state cleanup.
- [x] 6.7 Preserve persistent player behavior and avoid full document reloads for normal shell-managed navigation.
- [x] 6.8 Confirm route loading feedback remains correct for cache hit, in-flight request, and fresh network request paths.

## 7. Backend Tests

- [x] 7.1 Add or update tests for public store capability `Cache-Control`.
- [x] 7.2 Add or update tests for Store Offer `Cache-Control` on success and not-found responses.
- [x] 7.3 Add or update tests for Store Offer variants `Cache-Control` on success and not-found responses.
- [x] 7.4 Add or update tests for checkout session creation `Cache-Control` on success and handled error responses.
- [x] 7.5 Add or update tests for checkout state `Cache-Control` on success and handled error responses.
- [x] 7.6 Add or update tests for internal stock search, detail, and history `Cache-Control`.
- [x] 7.7 Add or update tests for StockChange and StockCount mutation `Cache-Control`.
- [x] 7.8 Add or update tests for internal order list and checkout-order detail `Cache-Control`.
- [x] 7.9 Add or update webhook route tests for cache headers where route response construction is covered.
- [x] 7.10 Confirm cache header tests do not require external Stripe, Cloudflare, or D1 provider mutation.

## 8. Static And Build Validation

- [x] 8.1 Add a validation script that inspects the built Cloudflare Pages header artifact after `pnpm build`.
- [x] 8.2 Validate that `/_astro/*` has the expected immutable cache policy.
- [x] 8.3 Validate that unapproved non-fingerprinted asset patterns do not receive immutable caching.
- [x] 8.4 Validate that route HTML and overlay partial HTML do not receive immutable year-long caching.
- [x] 8.5 Validate that `_headers` stays within Cloudflare Pages Free-tier rule and line limits.
- [x] 8.6 Add the static cache policy validation command to an appropriate existing gate if it is deterministic and local.
- [x] 8.7 If the validation is added to `pnpm check`, update any docs or AGENTS command lists that mention check coverage.
- [x] 8.8 Add focused unit tests for the validation script's parser and failure cases.

## 9. Hosted Header Audit

- [x] 9.1 Add a bounded read-only hosted cache audit command if implementation can do so without adding provider mutation.
- [x] 9.2 Make the hosted audit accept explicit PRD static URL and Worker URL inputs.
- [x] 9.3 Audit a small representative URL set: one hashed asset, one route document, one store route document, one overlay partial if public, one capability endpoint, and one safe public Store Offer endpoint if configured.
- [x] 9.4 Report status, URL, `Cache-Control`, `ETag`, and `CF-Cache-Status` when present.
- [x] 9.5 Ensure the audit does not create checkout sessions, mutate stock, call webhooks, apply catalog state, or warm large path sets.
- [x] 9.6 Ensure the audit prints a skipped/blocked status when URLs or credentials are missing rather than failing with ambiguous errors.
- [x] 9.7 Document the maximum request count and whether each audited URL can touch Worker/D1.
- [x] 9.8 Keep hosted audit out of required CI if deployment propagation timing makes it flaky.

## 10. Documentation And OpenSpec Baseline Updates

- [x] 10.1 Update `README.md` with the accepted cache policy and Free-tier rationale.
- [x] 10.2 Update `AGENTS.md` only if setup, validation commands, or architecture rules changed.
- [x] 10.3 Update `openspec/specs/cloudflare-free-tier-cache-policy/spec.md` only at archive time if the new capability becomes baseline.
- [x] 10.4 Update `openspec/specs/static-site-and-deployment/spec.md` at archive time with PRD static header requirements.
- [x] 10.5 Update `openspec/specs/commerce-checkout/spec.md` at archive time with checkout API freshness requirements.
- [x] 10.6 Update `openspec/specs/orders-stock-operator/spec.md` at archive time with no-store operator API requirements.
- [x] 10.7 Update `openspec/specs/app-shell-and-player/spec.md` at archive time with Same-Session Shell Cache boundaries.
- [x] 10.8 Update `openspec/specs/tooling-validation/spec.md` at archive time with cache validation requirements.
- [x] 10.9 Update `openspec/specs/project-language/spec.md` at archive time with cache-policy terms.
- [x] 10.10 Ensure docs explicitly state that Decap/CMS-level caching is not part of this epic.

## 11. Local Verification

- [x] 11.1 Run focused tests for changed backend cache header behavior.
- [x] 11.2 Run focused tests for changed frontend fetch behavior.
- [x] 11.3 Run focused tests for static cache validation scripts.
- [x] 11.4 Run `pnpm test:unit`.
- [x] 11.5 Run `pnpm check`.
- [x] 11.6 Run `pnpm build`.
- [x] 11.7 Run the static cache header validation against final `apps/web/dist`.
- [x] 11.8 Run `openspec validate define-cloudflare-free-tier-cache-policy --type change --strict`.
- [x] 11.9 Run `openspec validate --all --strict`.
- [x] 11.10 Re-run any failed or impacted checks after final edits.

## 12. Rendered And Hosted Verification

- [x] 12.1 If UI or app-shell runtime behavior changes, start the relevant local dev server and validate affected routes with Browser Use.
- [x] 12.2 If only headers, tests, scripts, and docs change, record why Browser Use is not required.
- [x] 12.3 If hosted PRD URL is available, run the bounded hosted header audit against Cloudflare Pages PRD.
- [x] 12.4 If hosted Worker URL is available, run the bounded hosted API header audit against safe non-mutating Worker endpoints.
- [x] 12.5 Record any hosted audit blocker as provider/configuration state, not as local implementation proof.
- [x] 12.6 Confirm no validation step materially risks Workers Free daily request limits or D1 Free daily row limits.

## 13. Closeout

- [x] 13.1 Confirm immutable caching applies only to approved content-fingerprinted static assets.
- [x] 13.2 Confirm all dynamic authoritative Worker routes have explicit no-store or approved route-specific cache policy.
- [x] 13.3 Confirm StoreCart, checkout, stock, Stripe, D1, order, webhook, and provider authority boundaries are unchanged.
- [x] 13.4 Confirm no service worker, Pages Function, Astro SSR runtime, KV, R2, paid Cloudflare feature, or new cache storage product was introduced.
- [x] 13.5 Confirm no Decap/CMS-level caching was implemented.
- [x] 13.6 Confirm docs distinguish Static Asset Cache, Document Revalidation, Worker API Freshness, Authoritative Commerce State, and Same-Session Shell Cache.
- [x] 13.7 Confirm generated API clients, OpenAPI docs, and scripts are updated if backend route contracts changed.
- [x] 13.8 Confirm final validation evidence distinguishes local proof from hosted Cloudflare proof.
- [x] 13.9 Leave archive task unchecked until implementation, strict OpenSpec validation, repository gates, and any required hosted/rendered validation are complete.
