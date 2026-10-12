# Launch preparation and switch

This runbook implements [prepare-launch-switch](../openspec/changes/prepare-launch-switch/tasks.md). Its hosted acceptance tasks remain the authority for readiness. Local tests do not authorize shopper launch or establish hosted routing, Access, Stripe delivery or provider acceptance.

## Prepare the API and artwork

Promote the PRD backend routes `/api/*` and `/media/published/*` on `blackboxrecordsathens.com` while keeping the apex Holding Page. Set GitHub variable `PRD_PUBLIC_BACKEND_BASE_URL=https://blackboxrecordsathens.com` before the public PRD build. The apex and PRD Pages origin are already allowed checkout origins; retain Pages while it serves readiness. Verify apex API release identity, Holding Page identity, and browser prices, checkout start and all public forms from the Pages site.

The PRD profile now produces apex URLs for approved product artwork. The old backend media address continues serving those same approved bytes during migration. Before finalization, inventory active Stripe Products and migrate their saved image URLs to apex runtime media, checking identical image identity and availability. This remains a separately reviewed live catalog operation; do not republish drafts, change prices/stock, or use the read-only launch key to bypass catalog authorization. Finalize refuses technical-origin images and inventories beyond its bounded read of 100 active Products.

Update the existing live Stripe webhook endpoint's URL to `https://blackboxrecordsathens.com/api/stripe/webhooks`, retaining its endpoint ID, events and signing secret. Do not delete/recreate the endpoint. Verify configuration with `pnpm stripe:webhooks:verify --env prd`, then confirm a delivered signed event in Workbench and the runtime. The verifier now expects the apex even while migration is pending. Keep the old Worker address available until finalization.

## UAT Access setup and read inventory

Create separate applications for the production hostname `blackbox-records-web-uat.pages.dev` and preview wildcard `*.blackbox-records-web-uat.pages.dev`. Check both explicitly: Pages' default preview application does not protect production. Each needs an Allow policy for team emails and a Service Auth policy selecting the CI service token. Cloudflare's [Pages limitations](https://developers.cloudflare.com/pages/platform/known-issues/) describe production/preview setup; [strict service-token authentication](https://developers.cloudflare.com/changelog/post/2026-10-02-strict-service-token-authentication/) requires Service Auth for these requests.

Use more-specific production-host-only applications with an Everyone Bypass policy for `/media/content/*` and `/assets/images/brand/logo-horizontal.png`. The owner approved this published-media exception. Keep wildcard previews, Home, release metadata and private CMS media protected. The runtime still rejects unknown hashes and unaccepted/private media. URL-based Images source fetches cannot carry the service token; see [origin access](https://developers.cloudflare.com/images/optimization/transformations/control-origin-access/).

Store `UAT_ACCESS_CLIENT_ID` and `UAT_ACCESS_CLIENT_SECRET` as **repository secrets** so the PRD promotion job can read UAT too. Local hosted checks read the same names from the process environment. These are distinct from staff Access credentials.

| Hosted read                                                                      | Authentication                                            |
| -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `pages.yml` deploy-uat release verification and static smoke                     | Both secrets on the deploy job                            |
| `promote-prd.yml` Resolve release step, reading UAT release/capabilities/Home    | Both repository secrets on that step                      |
| `uat-smoke.yml` manual provider smoke                                            | Both secrets on the smoke job                             |
| `scripts/release-candidate.mjs` UAT release, readiness and Home reads            | Shared `fetchWithUatAccess`                               |
| `scripts/smoke-uat-static.ts` readiness/route fetches and desktop/phone browsers | Shared HTTP helper and origin-scoped browser interception |
| `scripts/smoke-stripe-sandbox.ts` site readiness and shopper browser             | Shared HTTP helper and browser interception               |
| `apps/backend/scripts/migrate-stripe-account.ts` UAT Pages image verification    | Scoped headers; redirects remain forbidden                |

HTTP reads refuse UAT redirects instead of treating the login page as success. Browser interception supplies credentials for one hop on the exact UAT origin; redirected third-party requests receive none. Diagnostics redact configured token values. Provider smoke refuses `--trace` when authenticating with this token because Playwright traces retain request headers; use screenshots and redacted summaries.

Public/staff e2e jobs build local fixtures; they make no hosted UAT site read. Content-workspace tests only use the UAT URL as fixture data. Resend smoke sends the UAT URL as an Origin header to the public API; it does not read the site. Worker identity checks, Stripe webhooks, catalog API reads and Local `uat-connected` stay on the public UAT API and receive no site token.

After enabling Access, run the UAT push and promotion gates, verify anonymous production and preview pages require sign-in, verify a fresh accepted image and email logo anonymously, and confirm the UAT API remains public. No Access setup or hosted proof has been performed by the local implementation.

## Credentials and saved Dashboard review

Use an ignored repository-root `.env.launch` or process environment. Shell values win, including empty values. Required names:

```dotenv
CLOUDFLARE_ACCOUNT_ID=<32-hex-account-id>
CLOUDFLARE_ZONE_ID=<32-hex-zone-id>
CLOUDFLARE_API_TOKEN=<scoped-user-api-token>
STRIPE_LAUNCH_KEY=<restricted-live-key>
# Optional: BING_WEBMASTER_API_KEY=<key>
```

Scope the Cloudflare token to the project account and `blackboxrecordsathens.com` zone: Zone Read, DNS Edit, Zone Settings Edit, Single Redirect Read, Account Pages Read, Workers Scripts Edit, Bulk URL Redirects Edit and Account Filter Lists Edit. The last two are both required by the [Bulk Redirect API](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/create-api/). The implementation reads `/user/tokens/verify`; use a user API token. It checks active status, zone/account identity and resource reads; it cannot prove write permissions without writing.

The restricted live Stripe key needs account, Product and webhook endpoint reads, plus webhook endpoint write for the separately executed preparation update. Artwork mutation needs its own reviewed catalog authority. No payment, refund or customer write is needed by the launch command. `gh` must already be authenticated for read access to repository Actions runs/jobs. Chromium must be installed for the controlled fallback check.

Inspect the signed-in live Stripe Dashboard through the Chrome extension: business website, Checkout terms/privacy and enabled legal links. Save only this review data to ignored `.codex-artifacts/launch/stripe-dashboard-review.json`:

```json
{
  "accountId": "acct_reviewed_live_account",
  "reviewedAt": "<UTC ISO timestamp>",
  "website": "https://blackboxrecordsathens.com/",
  "terms": "https://blackboxrecordsathens.com/terms/",
  "privacy": "https://blackboxrecordsathens.com/privacy/",
  "displayLegalPolicies": true
}
```

Stripe's saved Checkout policy URLs have no supported read API. The script matches the reviewed account to `/v1/account` and requires the review to be no more than 24 hours old. Refresh it for finalization after the rollback window. Never retain unrelated business/customer details, credentials or screenshots exposing them.

## Run stages

Before hosted checks, record the current shared Cloudflare Free headroom using [the Free-tier rule](cloudflare-free-tier.md). Reserve up to 200 requests per invocation and keep the ordinary daily reserve intact; the command's per-run ceiling does not establish account-wide quota headroom.

```powershell
pnpm launch:switch -- cutover --dry-run
pnpm launch:switch -- cutover
# After at least 24 hours and renewed stability/policy review:
pnpm launch:switch -- finalize --dry-run
pnpm launch:switch -- finalize
# To reverse launch-owned DNS/redirect changes:
pnpm launch:switch -- rollback --dry-run
pnpm launch:switch -- rollback
```

Before a real cutover, `finalize --dry-run` deliberately refuses. Record that refusal during preparation; do not forge a cutover timestamp. Stubbed tests rehearse the later path. A successful dry-run proves reads and planned writes only. Cutover/finalize require the accepted runtime release and its successful main push run with browser suites. A newer PRD SHA after cutover requires an explicit stability review; the script refuses that mismatch.

Every invocation writes a unique redacted summary beneath `.codex-artifacts/launch/<stage>/<run>/summary.json`. Real cutover first writes an exclusive `snapshot.json`; dry-run never creates a rollback snapshot. Preserve it. A local `launch.lock` prevents overlapping runs. After a crashed process, inspect its summary, snapshot and provider state before manually removing the stale lock. An existing snapshot prevents a second cutover until its recovery is resolved; do not delete evidence to force a retry.

Cutover polls active apex TLS and the selected Home release up to 12 times, five seconds apart. DNS write uncertainty, failed TLS or failed Home triggers automatic restoration and a Holding Page check. Policy, metadata, assets, redirects, API or fallback failures after Home succeeds leave the apex live and return failed for operator review. Browser fallback deliberately intercepts existing Images URLs with 503 and decodes an accepted original; it creates no new transformation variant. Each invocation stops at 200 requests, including at most 100 public reads.

Finalize repeats readiness, then applies a 301 Bulk Redirect for the PRD Pages origin and its subdomains, disables both PRD Workers' technical/preview addresses, and applies six-month HSTS including subdomains without preload. Verify all zone subdomains support HTTPS before using that setting. The Holding Page alias is affected by the Bulk Redirect. Finalization failures can leave partial changes; inspect the failed step and reconcile hosted state before continuing. Once Pages redirects, a repeat invocation cannot use Pages release preflight. The command does not silently resume or undo Worker/HSTS changes.

Rollback removes only the named launch redirect rule/list and restores the saved apex record after checking identity and drift. It never overwrites unrelated rules and does not undo Worker retirement or HSTS. After completed finalization, treat it as DNS/redirect reversal only; full recovery needs explicit Worker/HSTS review. Neither rollback nor launch changes checkout approval or availability-alert send authorization.

With an optional Bing key, successful real cutover submits the sitemap. Search Console sitemap/inspection and Facebook/LinkedIn refresh remain manual links printed by the command. A provider submission failure is reported without reverting a healthy Home.
