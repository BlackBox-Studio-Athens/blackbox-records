# Launch preparation and switch

This runbook implements [prepare-launch-switch](../openspec/changes/archive/2026-10-12-prepare-launch-switch/tasks.md), completed on 2026-10-12. Its [validation record](../openspec/changes/archive/2026-10-12-prepare-launch-switch/validation.md) establishes preparation readiness. Local tests do not authorize shopper launch or replace hosted routing, Access, Stripe delivery or provider acceptance.

## Prepare the API and artwork

Promote the PRD backend routes `/api/*` and `/media/published/*` on `blackboxrecordsathens.com` while keeping the apex Holding Page. Set GitHub variable `PRD_PUBLIC_BACKEND_BASE_URL=https://blackboxrecordsathens.com` before the public PRD build. The apex and PRD Pages origin are already allowed checkout origins; retain Pages while it serves readiness. Verify apex API release identity, Holding Page identity, and browser prices, checkout start and all public forms from the Pages site.

The PRD profile produces apex URLs for approved product artwork. On 2026-10-12 the authorized image-only migration moved all 99 active Products to apex URLs, checked their 98 distinct content hashes and preserved other Product fields and all 99 stock rows. The old backend media address continues serving the same approved bytes until finalization. Recheck the live inventory before finalization; any later migration remains a separately reviewed catalog operation. Do not republish drafts, change prices/stock, or use the read-only launch key to bypass catalog authorization. Finalize refuses technical-origin images and inventories beyond its bounded read of 100 active Products.

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

Access setup and hosted proof completed on 2026-10-12: run 38239956395 passed its deploy gate with Access enabled; anonymous production and preview pages require sign-in, token reads succeed, accepted media and the email logo remain public, and the UAT API remains public. The original UAT checkout override is restored to true on accepted source 58035ca. See the change's validation record for evidence and the corrected Dashboard restoration incident.

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

Both scoped launch credentials were created with specific owner approval on 2026-10-12 and saved in ignored `.env.launch`; the Stripe owner completed email verification. No automatic expiry was selected. The optional Bing key is absent. The cutover rehearsal passed with 12 reads; the pre-cutover finalize rehearsal correctly refused with zero requests. Shell values still override the file, so remove unrelated process credentials before using this file.

PRD email branding currently uses the public PRD Pages URLs, matching `readEmailRuntimeConfig`; replies use `support@blackboxrecordsathens.com`. Those three deployed variables were corrected during form acceptance, preserving accepted code and every other binding. Finalization's Pages redirect carries existing email links to the apex. Any future direct-apex email-brand migration must update the runtime profile and variables together.

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

## Run from GitHub Actions

On your phone, open [Launch switch](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/workflows/launch-switch.yml) in a browser, or use **Repository → Actions → Workflows → Launch switch** in the [GitHub app](https://github.blog/changelog/2024-07-30-run-workflows-set-as-workflow_dispatch-manually/). Select **Run workflow**, branch **main**, and stage **cutover**, **rollback** or **finalize**. Leave **dry_run** checked for a rehearsal; uncheck it to apply the selected stage, then tap **Run workflow**. The `prd-launch` environment permits only `main`; it holds the four required launch secrets and the non-secret `STRIPE_DASHBOARD_REVIEW` variable.

The one-off real cutover is scheduled for **2026-10-16 at 13:30 Athens time (10:30 UTC)**. The annual cron is guarded by that exact UTC date and does nothing on other dates. GitHub can [delay or drop scheduled runs under load](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows); 13:30 is the intended start, not a guaranteed completion time. Check the run before dispatching manually, and remove the schedule during launch-switch-day task 2.1.

Open the run and its **Summary** to read the launch status, step results, errors and manual follow-up links. Under **Artifacts**, tap **launch-state** to download the ZIP (sign in and use the browser if the app does not expose it). It is retained for 90 days, including failed runs. Every stage, including dry-runs, restores the newest live cutover snapshot found to guard against duplicate cutovers; rollback/finalize fail if none exists. For a later **local** rollback or finalize, download that artifact first and place its `snapshot.json` at `.codex-artifacts/launch/snapshot.json`; preserve any existing local recovery evidence before replacing it. A dry-run does not create a rollback snapshot.

Finalize still requires at least 24 hours after cutover and a Stripe Dashboard review refreshed within the preceding 24 hours. After reviewing the live Dashboard again, update **Settings → Environments → prd-launch → Environment variables → STRIPE_DASHBOARD_REVIEW** with the review JSON above. The review from `2026-10-15T16:13:10Z` covers only until **2026-10-16T16:13:10Z** and will need refreshing for finalize. Neither the workflow nor its schedule promotes code to PRD.

## Run locally

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

Cutover polls active apex TLS and the selected Home release up to 12 times, five seconds apart. DNS write uncertainty, failed TLS or failed Home triggers automatic restoration and a Holding Page check. Policy, metadata, assets, redirects, API or fallback failures after Home succeeds leave the apex live and return failed for operator review. Browser fallback deliberately intercepts existing Images URLs with 503 and decodes an accepted original; it creates no new transformation variant. Each invocation stops at 200 requests. Cutover and rollback allow at most 100 public reads; finalize allows 175 to cover up to 100 distinct catalog images alongside the measured 43 browser requests and other stability/retirement checks. Inventories with more images or increased browser traffic can still exhaust the fixed ceiling and require review.

Finalize repeats readiness, then applies a 301 Bulk Redirect for the PRD Pages origin and its subdomains, disables both PRD Workers' technical/preview addresses, and applies six-month HSTS including subdomains without preload. Verify all zone subdomains support HTTPS before using that setting. The Holding Page alias is affected by the Bulk Redirect. Finalization failures can leave partial changes; inspect the failed step and reconcile hosted state before continuing. Once Pages redirects, a repeat invocation cannot use Pages release preflight. The command does not silently resume or undo Worker/HSTS changes.

Rollback removes only the named launch redirect rule/list and restores the saved apex record after checking identity and drift. It never overwrites unrelated rules and does not undo Worker retirement or HSTS. After completed finalization, treat it as DNS/redirect reversal only; full recovery needs explicit Worker/HSTS review. Neither rollback nor launch changes checkout approval or availability-alert send authorization.

With an optional Bing key, successful real cutover submits the sitemap. Search Console sitemap/inspection and Facebook/LinkedIn refresh remain manual links printed by the command. A provider submission failure is reported without reverting a healthy Home.
