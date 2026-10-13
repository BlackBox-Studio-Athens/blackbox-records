# Owner setup evidence

Completed on 2026-10-12 through the signed-in BlackBox Chrome GPT extension. The owner explicitly authorized creating and storing the prepared read-only token at the creation step. Tasks 1.4, 2.1 and 2.2 are complete; no software code, checkout control, content publication, DNS record or plan was changed.

## Web Analytics

The existing `blackboxrecordsathens.com` site used automatic setup but selected **Enable, excluding visitor data in the EU**. It now selects **Enable**, and the saved page states **The JS Snippet will be automatically injected**. This includes Greek/EU visitors in collection.

- Account ID: `2004bfa6f5ad8b48008f1243b195ab61`.
- Web Analytics site tag: `a1737ae1db5e45b1b57d1c86c9fe52e8`.
- [Enabled collection screenshot](../../../.codex-artifacts/site-analytics-setup/web-analytics-enabled.png).

These identifiers are non-secret. The site tag is the existing Web Analytics site identifier, not the public beacon token.

## Read-only token and PRD configuration

Token `blackbox-records-site-analytics` has exactly **Account Analytics: Read**, restricted to **Blackboxrecordsathens@gmail.com's Account**. The reviewed custom token adds no write, zone, DNS or Worker-management permission. Its [summary screenshot](../../../.codex-artifacts/site-analytics-setup/token-summary.png) contains no credential value.

The existing `blackbox-records-backend-prd` Worker Production settings now contain:

| Type     | Name                                | Verified value/state               |
| -------- | ----------------------------------- | ---------------------------------- |
| Secret   | `CLOUDFLARE_ANALYTICS_API_TOKEN`    | Value encrypted                    |
| Variable | `CLOUDFLARE_ACCOUNT_ID`             | `2004bfa6f5ad8b48008f1243b195ab61` |
| Variable | `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG` | `a1737ae1db5e45b1b57d1c86c9fe52e8` |

The dashboard's **Add 3 variables and deploy** action saved a configuration version of the existing Worker. It did not publish repository code or run Software Release. A before/after DOM-table comparison found every existing variable/secret row and resource binding preserved. The API token was transferred directly from the one-time creation view to the encrypted secret field, never printed, committed or written to a local file; transient token variables were cleared afterward. The one-time token page was closed back to the token list.

The two PRD non-secret IDs are also set in `apps/backend/wrangler.jsonc`, replacing empty placeholders that a later release could otherwise reapply. Local/mock/mock-api/UAT remain unconfigured, as allowed by the design.

[PRD bindings screenshot](../../../.codex-artifacts/site-analytics-setup/prd-analytics-bindings.png).

## Account limits

One authenticated POST to `https://api.cloudflare.com/client/v4/graphql` ran only the `AnalyticsSettings` query recorded in [design.md](design.md). It returned HTTP 200, no GraphQL errors, and:

| Dataset                           |        Maximum query window |                     Retention |
| --------------------------------- | --------------------------: | ----------------------------: |
| `rumPageloadEventsAdaptiveGroups` | 8,035,200 seconds / 93 days | 15,897,600 seconds / 184 days |
| `workersInvocationsAdaptive`      | 2,764,800 seconds / 32 days |   7,776,000 seconds / 90 days |

Both planned ranges, `7d` and `30d`, are supported. No traffic-data query, hosted runtime probe or retry was performed. This settings read does not establish live data-query mapping, beacon navigation behavior or staff dashboard parity.

## Receipts and remaining acceptance

The safe [setup receipt](../../../.codex-artifacts/site-analytics-setup/receipt.json) records the identifiers, exact limits, encrypted-secret state and preservation checks; it contains no API token. The [final local validation receipt](../../../.codex-artifacts/site-analytics-setup/completion.json) records strict OpenSpec validation and the final repository summary/source identity after these changes.

At the initial 2026-10-12 setup, the backend and staff UI still required ordinary code-release and browser/provider acceptance. That setup did not publish repository code or implement section 3. The subsequent release and successful Stats comparison are recorded in [validation.md](validation.md#stats-503-redirect-mode-correction--2026-10-13). The following section records the remaining pre-launch dashboard work.

## Pre-launch dashboard steps — 2026-10-13

The separate software release finished before this work: UAT release 567 (`38385146954`) and PRD promotion 17 (`38386078069`) passed for `24cacf78491c54e826807764b1cf7b156cd61821`. The clean local baseline was the subsequent evidence commit `2bb24c89644a5e45f11d58a122bf39b7dd4f0a66`. All dashboard work uses the owner's signed-in Chrome BlackBox profile through the ChatGPT extension. The owner approved `blackboxrecordsathens@gmail.com` for Google/Bing sign-in and the existing Cloudflare account ending `ab61`, and chose Bing import with a separate consent stop.

- **1.1 verified:** added the Google Domain property `sc-domain:blackboxrecordsathens.com`, selected **Any DNS provider → TXT**, and added exactly one apex TXT record in Cloudflare with **DNS only / Auto TTL**. Google displayed **Ownership verified**, then opened the Domain property. No Google access to Cloudflare was granted. The before/after DNS table retained all existing values, including the proxied apex CNAME to `holding.blackbox-records-web.pages.dev`. [Ownership screenshot](../../../.codex-artifacts/owner-setup/google-domain-verified.jpg).
- **1.3 verified:** Cloudflare → Caching → Configuration already showed **Crawler Hints Beta On** on the Free zone. No toggle, terms acceptance, cache purge or other setting change was needed. [Enabled screenshot](../../../.codex-artifacts/owner-setup/crawler-hints-on.jpg).

- **1.2 verified:** the owner separately approved Google's profile/email sign-in permission and the ongoing **view-only Search Console** permission for Bing. Only `https://blackboxrecordsathens.com/` was imported; the selection showed **0 sitemaps**. Bing's Verification Code panel explicitly states that the site was imported from Search Console, is already verified there, and needs no Bing code. [Verified screenshot](../../../.codex-artifacts/owner-setup/bing-verified.jpg), [import selection](../../../.codex-artifacts/owner-setup/bing-import-selection.jpg), [Search Console consent](../../../.codex-artifacts/owner-setup/bing-search-console-consent.jpg). The transient blank import-result page recovered with one read-only reload; no second import was sent.
- **No sitemap submission:** Google's Submitted sitemaps table shows **0-0 of 0** and Bing's Sitemaps table shows **0 rows**. The automatic import brought no sitemaps. [Google screenshot](../../../.codex-artifacts/owner-setup/google-no-sitemaps.jpg), [Bing screenshot](../../../.codex-artifacts/owner-setup/bing-no-sitemaps.jpg). Sitemap and indexing submission remain switch-day work.

### Approved privacy notice and publication

The editorial owner is **Website → Buying & delivery → Privacy → purposes → Full wording**, in `purchase_information` entry `01M2J1HPQXJC1EHRVB42HRQC5N`. It is Portable Text content, not repository copy or a Cloudflare setting. The initial entry showed **Everything is live**, so no unrelated saved draft was adopted.

The owner approved this exact new paragraph before any save:

> We use Cloudflare Web Analytics to count visits and page views on this site. It sets no cookies and does not build individual visitor profiles. We see aggregate figures for the pages viewed, referring sites, countries and device types. Cloudflare processes this data on our behalf as our hosting provider.

The owner also approved removing only **Optional visit-statistics analytics is disabled.** from the existing technical-security paragraph and changing **Date of wording** from `2026-10-09` to `2026-10-13`. The paragraph's cookie/profile claims match [Cloudflare's Web Analytics description](https://www.cloudflare.com/web-analytics/); its dimensions match the [official dimensions reference](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/) and this change's design. Existing provider-transfer wording remains present; no new claim about regional confinement or legal consent was added.

The saved private draft's **Review before publishing** comparison contained only those approved text/date differences. A normalized comparison of both rendered sides, after applying exactly those replacements, matched. Preview initially requested its existing sign-in; opening the provided preview session completed sign-in without password entry or permission changes, and one **Retry preview** produced **Preview up to date**. The owner then separately confirmed publication of the single reviewed Buying & delivery entry. **Publish change** ran once through Preparing and completed as **Your changes are on the website / On the website**. History records a PRD Publish update by the approved account, completed **13 October 2026 at 14:33 Athens time**. No other entry was selected.

**1.5 verified:** [PRD privacy](https://blackbox-records-web.pages.dev/privacy/) contains the exact approved paragraph, no longer contains the obsolete disabled sentence, and shows `Updated 2026-10-13`. [Review screenshot](../../../.codex-artifacts/owner-setup/privacy-review.jpg), [staff confirmation](../../../.codex-artifacts/owner-setup/privacy-published-staff.jpg), [publication history](../../../.codex-artifacts/owner-setup/privacy-publication-history.jpg), [public screenshot](../../../.codex-artifacts/owner-setup/privacy-public.jpg) and [public text](../../../.codex-artifacts/owner-setup/privacy-public.txt).

### Shipping/returns and remaining work

Search Console → Settings for the verified Domain property offers **no Shipping and returns** controls. No policy was saved and `improve-search-presence` 4.1 remains unchecked. Its [validation note](../improve-search-presence/validation.md#owner-shipping-and-returns-dashboard-check--2026-10-13) records the dashboard and real published Greece-only delivery/withdrawal terms for the Organization structured-data fallback. No fallback code was added during this dashboard task.

Tasks **1.1, 1.2, 1.3 and 1.5 are verified**. Task 1.6 remains after switch day. No sitemap, URL submission, launch control, checkout switch, catalog, price, stock, Stripe setting or paid plan was changed. The only DNS addition is Google's apex verification TXT; Cloudflare access was never granted to Google. Bing's approved read-only grant remains available for its stated periodic verification. No terms acceptance was encountered or performed; Crawler Hints was already enabled.

Screenshots and safe text receipts are under `.codex-artifacts/owner-setup/`; the [setup receipt](../../../.codex-artifacts/owner-setup/receipt.json) records outcomes and the [completion receipt](../../../.codex-artifacts/owner-setup/completion.json) records final checks and the local evidence commit. A fresh optional browser navigation to `release.json` was blocked by the client; the completed release prerequisite was established from the inspected source-bound release receipt before any dashboard changes. This task does not push or start Software Release.
