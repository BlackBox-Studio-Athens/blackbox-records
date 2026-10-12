# Cloudflare owner setup evidence

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

The backend implementation and staff UI still require their ordinary code-release and browser/provider acceptance steps. This setup does not publish the uncommitted endpoint or implement Claude's section 3. The remaining owner steps for Google/Bing verification, Crawler Hints and the privacy notice remain separate.
