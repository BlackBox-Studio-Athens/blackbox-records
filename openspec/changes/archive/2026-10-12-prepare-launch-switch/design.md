# Design

## Who implements what

`[Claude]` tasks contain UI work and are implemented by Claude. `[Claude or Codex]` tasks have no UI. `[Owner]` tasks need the owner's dashboard sign-in or credentials. This change has no UI work.

## PRD API under the apex

The PRD backend Worker gains the route `blackboxrecordsathens.com/api/*` beside its existing `staff.blackboxrecordsathens.com/api/internal/*` route. Cloudflare picks the most specific route, and a Worker route runs before the origin, so `/api/*` reaches the backend while Pages keeps every other apex path. Cloudflare's docs do not state this for Pages custom domains, so task 1.1 proves it on the apex while it still serves the Holding Page.

`PRD_PUBLIC_BACKEND_BASE_URL` becomes `https://blackboxrecordsathens.com`. Until cutover the PRD site on `pages.dev` calls the apex API cross-origin, so the backend's allowed origins keep `pages.dev` until `finalize`. After cutover the site and API share one origin.

Two checks:

- A Worker cannot reach a same-zone route with `fetch()`. Any server-side call from the PRD renderer or Pages gateway to the backend's public URL must use a service binding instead (task 1.2).
- The Stripe live webhook endpoint URL is updated through the API, which keeps its signing secret, so `STRIPE_WEBHOOK_SECRET` is unchanged. The `workers.dev` address stays alive until `finalize`, so events in flight during the change still arrive.

With the API on the zone, a Free-plan rate-limiting rule can cover the form routes (security finding 1). That fix is tracked with the security findings, not here.

## UAT behind Access

Separate self-hosted Access applications cover `blackbox-records-web-uat.pages.dev` and `*.blackbox-records-web-uat.pages.dev`, allowing the owner's team emails (Free allows 50 users). Each also has a Service Auth policy selecting the CI service token. The wildcard application alone does not cover the production hostname. The UAT API on `workers.dev` stays public, because the Stripe Sandbox webhook and Local `uat-connected` mode call it.

The owner approved a narrow published-media bypass on 2026-10-12: only the canonical production host's `/media/content/*` and public email logo `/assets/images/brand/logo-horizontal.png` are anonymous. Cloudflare Images cannot authenticate its existing URL-based source reads; protecting these accepted media bytes would break uncached images and email branding. Preview paths, UAT pages, release identity and all private CMS media stay protected. Runtime media validation still permits only accepted content-addressed objects; Access bypass grants no publication authority.

PRD's backend origin profile and new approved artwork URLs use the apex. The additional `/media/published/*` Worker route serves approved objects before and after cutover. During migration the existing PRD Worker origin serves the same approved bytes; disabling that address is deferred to finalization. Migrating existing Stripe URLs remains a reviewed live catalog operation.

CI reads UAT with an Access service token (`CF-Access-Client-Id` and `CF-Access-Client-Secret`) wherever it reads the UAT site. The inventory and repository secret names live in [the launch runbook](../../../../docs/launch-switch.md). HTTP reads refuse redirects, and browser requests fulfill one authenticated hop only on the UAT origin. Access-authenticated provider smoke cannot retain a Playwright trace because it would record credentials; screenshots and redacted summaries remain available.

## The launch script

`pnpm launch:switch -- <cutover|finalize|rollback> [--dry-run]` runs locally. It reads the account/zone IDs, `CLOUDFLARE_API_TOKEN`, `STRIPE_LAUNCH_KEY` and optional `BING_WEBMASTER_API_KEY` from the shell or ignored `.env.launch`; shell values win. The runbook lists the scoped permissions needed for DNS, redirects, Pages reads, Worker subdomains and HSTS. Stripe needs account, Product and webhook reads plus webhook endpoint write for preparation. It never prints credentials. `--dry-run` performs only reads and prints planned writes. Every run writes `.codex-artifacts/launch/<stage>/<run>/summary.json` with each step's result. Cloudflare, Stripe and Bing are called with `fetch`; no SDK is added. A local lock prevents overlapping runs. Each run is bounded to 200 requests, with at most 100 public reads for cutover/rollback or 175 for finalize, and never creates new Images transformations during fallback acceptance. The finalize allowance includes the observed catalog's 98 distinct images and 43 browser fallback requests; the 100-image regression preserves room for the remaining checks within the total ceiling.

### `cutover`

1. Preflight, read-only: PRD serves the accepted release, `pages.dev` serves the full site, the Cloudflare token is active and can read the pinned targets, and the Stripe webhook endpoint and saved policy URLs point at the apex. Token verification cannot prove write scopes; the owner reviews those separately. Stripe has no supported read API for saved Checkout legal-link settings. Inspect the live Dashboard through the Chrome extension and retain only account ID, website, terms/privacy URLs, enabled legal links and review time in an ignored receipt; require that review within the preceding 24 hours and matching the API account. The first review was completed through Chrome on 2026-10-12.
2. Save a snapshot of the apex DNS record, `www`, redirect rules and Pages custom domains to `.codex-artifacts/launch/snapshot.json`.
3. Point the apex at the PRD Pages site and wait for active TLS.
4. Verify on the apex:
   - Home, `/terms/`, `/privacy/`, the share card and the email logo return 200
   - canonical and `og:url` use the apex
   - `sitemap.xml` lists apex URLs and `robots.txt` names it
   - HTTP and `www` return 308 to the HTTPS apex, keeping path and query
   - images fall back cleanly while the Images quota is exhausted
   - `/api/` answers from the backend
5. If Home or TLS fails, restore the snapshot and exit non-zero. Other failures are reported without rollback.
6. Submit the sitemap to Bing when its key is set, and print the manual links (Search Console sitemap and URL inspection, Facebook Sharing Debugger, LinkedIn Post Inspector).

### `finalize`

1. Repeat the `cutover` checks as stability evidence and refuse to run earlier than 24 hours after the recorded cutover.
2. Before any write, read active Stripe Products and verify every image is an available apex runtime media URL. Task 1.7 migrates delivery and URLs first, retaining the old route while migration is in flight. Refuse unresolved technical-origin images. Inventories above 100 active Products require an explicit budget review.
3. Create the Bulk Redirect from `blackbox-records-web.pages.dev` to `https://blackboxrecordsathens.com` (301, subpath matching, preserve path and query, include subdomains). This runs after the 24-hour rollback window because "include subdomains" also redirects the Holding Page alias.
4. Turn off the `workers.dev` subdomain and preview URLs of the PRD backend and renderer Workers, then confirm both addresses stop answering.
5. Enable HSTS on the zone (six months, no preload, include subdomains), then confirm the header on the apex and `staff`.

### `rollback`

Restores the snapshot and removes the Bulk Redirect if present. After `finalize` it no longer restores the Holding Page, whose alias is redirected; it only reverses the DNS and redirect writes.

## Rehearsal limits

`--dry-run` proves target reads and planned writes, not write permissions or effects. Before cutover, `finalize --dry-run` deliberately refuses: it needs a real successful cutover older than 24 hours. Stubbed tests cover the later path without fabricating hosted evidence. The first real DNS write is switch day's `cutover`, whose automatic rollback covers a failed Home or TLS check.
