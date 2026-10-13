# Design

## Who implements what

Tasks are tagged. `[Claude]` tasks contain UI work and are implemented by Claude. `[Claude or Codex]` tasks have no UI. `[Owner]` tasks need the owner's Google, Microsoft or Cloudflare dashboard sign-in or staff content access.

## Search engines

A Google Search Console Domain property covers the apex, `www` and `staff` and is verified by a DNS TXT record in Cloudflare, so it does not depend on what the apex serves. Bing imports the verified property from Search Console. Cloudflare Crawler Hints is a free zone toggle that notifies IndexNow engines (Bing, Yandex and others) about changed pages. Google has no indexing API for ordinary pages, so indexing requests stay manual on switch day.

## Visit measurement

Cloudflare Web Analytics automatic setup injects the beacon at the edge for the proxied apex, so no site code changes. The beacon follows History API navigation, which covers the shell's `<main>` swaps. Until switch day it measures the Holding Page only; `pages.dev` is removed at launch and is not measured. The beacon sets no cookies and collects no personal data, so no consent banner is needed, but the privacy notice must name Cloudflare Web Analytics. Cloudflare stores this dataset's metadata in the US.

A later content security policy (security finding 6) must allow `static.cloudflareinsights.com` and `cloudflareinsights.com`.

## Staff Stats

Cloudflare's dashboard requires a login and cannot be embedded. The PRD backend instead serves `GET /api/internal/analytics?range=7d|30d` on the existing Access-protected `staff.blackboxrecordsathens.com/api/internal/*` route. It queries the GraphQL Analytics API (`rumPageloadEventsAdaptiveGroups` for visits and page views) with `CLOUDFLARE_ANALYTICS_API_TOKEN`, a token limited to Account Analytics Read. `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG` are plain vars. Responses are cached with the Workers Cache API for 15 minutes, so repeated staff visits do not repeat GraphQL queries; no KV is used.

Range limits and retention are account-specific. After the owner authorized creating the read-only token on 2026-10-12, one GraphQL `settings` query returned HTTP 200 with no errors. **Both `7d` and `30d` are supported, and task 2.1 is complete.** The account returned these limits in seconds:

| Dataset                           |       `maxDuration` |        `notOlderThan` |
| --------------------------------- | ------------------: | --------------------: |
| `rumPageloadEventsAdaptiveGroups` | 8,035,200 (93 days) | 15,897,600 (184 days) |
| `workersInvocationsAdaptive`      | 2,764,800 (32 days) |   7,776,000 (90 days) |

The 7-day and 30-day windows fit both query-duration and retention limits; no range is removed. The `workersInvocationsAdaptive` limits were read before the owner removed Worker requests from Stats on 2026-10-12; the read no longer queries that dataset. Settings evidence and the completed dashboard setup are recorded in [owner-setup.md](owner-setup.md). The settings-only query was:

```graphql
query AnalyticsSettings($accountTag: string!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      settings {
        rumPageloadEventsAdaptiveGroups {
          maxDuration
          notOlderThan
        }
        workersInvocationsAdaptive {
          maxDuration
          notOlderThan
        }
      }
    }
  }
}
```

The read remains owned by `public-commerce-http` behind its existing `register-internal-routes.ts` entrypoint, consuming only its existing `backend-platform` and `operator-auth` dependencies. No new module entrypoint or dependency is needed; the existing boundary metadata/spec still apply. The three optional bindings are forwarded through the existing commerce runtime configuration. Empty vars remain for Local/mock/mock-api/UAT; PRD declares the verified non-secret account and site IDs so future releases preserve the dashboard setup. The API token is a Worker secret only. Runtime-config verification reports absent analytics as optional (`not_applicable`), so optional unconfigured environments cannot block ordinary readiness checks.

The query uses RUM `count` for page views and `sum.visits` for visits, grouped independently by UTC date, path, referrer host, country and device type. Every group filters the configured site tag to `requestHost: "blackboxrecordsathens.com"` and `bot: 0`: member Stats measures the public apex, excluding staff/subdomain traffic and bots. The owner confirmed that scope on 2026-10-13; it changes the read, not Cloudflare collection settings. One uncached read makes one GraphQL POST, has a 10-second abort deadline (including body reads), bounds the response to 128 KiB, validates the GraphQL envelope, and never retries automatically. HTTP failures, GraphQL errors, malformed data, body overflow and timeouts all return the safe problem contract below; raw upstream bodies and credentials never enter logs or responses. `analytics_read_failed` logs only a fixed failure category and the numeric `upstreamStatus` when a response was received, alongside the existing request ID. Categories are `upstream_http`, `upstream_graphql`, `upstream_invalid_json`, `upstream_body_too_large`, `upstream_invalid_shape`, `upstream_network` and `upstream_timeout`.

Successful snapshots use the named Workers Cache API cache `site-analytics-v2` through `caches.open()` with a 900-second TTL. Both the cache name and key version changed with the apex/bot filter, preventing reuse of earlier staff-inclusive snapshots. The internal cache key includes range, UTC day, Product Environment, account and site tag to prevent cross-site/environment reuse. Only the data body is stored; Access verification runs before cache access on every request, and each response gets its own request ID. Missing configuration and failures are never cached. Cache failures produce a safe diagnostic and continue with an upstream read or the successful snapshot. Cache API storage is local to the serving data center and can evict early; it uses no KV or new scheduled work. Browser-facing responses always use `Cache-Control: no-store`.

## Response contract

The upstream request uses `redirect: "manual"`. Workerd rejects `redirect: "error"` during Request construction, before any HTTP response; the original fetch stub hid this runtime incompatibility. Manual mode never follows a redirect or forwards the token to another origin, and the existing non-2xx check returns the safe upstream HTTP failure. Regression tests construct a native workerd Request for both ranges and cover 301, 302, 303, 307 and 308 rejection.

`GET /api/internal/analytics?range=7d|30d` requires `range`; a missing, empty or other value returns HTTP 400 `invalid_request`. The existing verified Access JWT is required on hosted requests; Local retains the existing loopback-only operator bypass. HTTP 200 returns exactly this JSON shape:

```typescript
type SiteAnalytics = {
  range: '7d' | '30d';
  generatedAt: string | null;
  status: 'ok' | 'not_configured';
  daily: Array<{ date: string; visits: number; pageViews: number }>;
  topPaths: Array<{ path: string; visits: number; pageViews: number }>;
  topReferrers: Array<{ host: string; visits: number; pageViews: number }>;
  topCountries: Array<{ country: string; visits: number; pageViews: number }>;
  deviceTypes: Array<{ deviceType: string; visits: number; pageViews: number }>;
};
```

For `ok`, `generatedAt` is an ISO 8601 UTC timestamp: the snapshot's exclusive query upper bound, preserved on cache hits. The daily array has exactly 7 or 30 entries in ascending `YYYY-MM-DD` order, including the current partial UTC day. The window begins at midnight UTC 6 or 29 days before today; missing days have zeros. Cloudflare adaptive metrics may be estimates; do not assume integers or unique visitors.

The three top lists contain at most 10 rows each, ordered by page views descending; device types contain all returned provider groups (query ceiling 100). Dimension strings are provider values. An empty referrer host represents direct/unknown traffic; the UI should label it without changing the API value. Countries and devices can contain unknown values and should be displayed safely as text. No URLs, HTML or flags are synthesized by the backend. No totals are computed from the truncated top lists.

For `not_configured`, `generatedAt` is `null` and every array is empty. This state means at least one of the three bindings is absent or whitespace-only; it is distinct from a configured site with no traffic (`ok`, zero-filled daily arrays and empty breakdowns). It does not reveal which credential is missing. Local, UAT and PRD can return it before owner task 2.2 is complete.

Example before owner provisioning:

```json
{
  "range": "7d",
  "generatedAt": null,
  "status": "not_configured",
  "daily": [],
  "topPaths": [],
  "topReferrers": [],
  "topCountries": [],
  "deviceTypes": []
}
```

For example, a configured daily entry is `{ "date": "2026-10-12", "visits": 3, "pageViews": 5 }`. Tests retain representative edge cases and a captured live response from 2026-10-13. Through the owner's authorized Cloudflare GraphQL Explorer session, both the original query and the apex/bot-filtered query succeeded with all five groups. Explorer authorization is separate from the Worker's secret: this establishes live field compatibility, not the cause of the deployed 503 or staff/dashboard parity. See [validation.md](validation.md).

Failure responses use HTTP 503, `application/problem+json`, and the existing shape `{ type, title, status, detail, code, error, requestId }`: `type` is `/problems/service_unavailable`, `title` is `Service unavailable.`, `code` is `service_unavailable`, and `detail`/`error` are `Analytics is temporarily unavailable. Try again.`. `requestId` matches `X-Request-Id`. Hosted Access failures retain existing `401 unauthorized` or `503 operator_access_unavailable` semantics. Claude should retain the last successful snapshot on read failure, label it using `generatedAt`, offer Retry, and give `not_configured` its own setup state.

References: [GraphQL settings discovery](https://developers.cloudflare.com/analytics/graphql-api/features/discovery/), [Web Analytics dimensions](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/), [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/). The owner must supply the Web Analytics **site tag/site identifier**, which is distinct from the public beacon's `site_token` ([Site Info API](https://developers.cloudflare.com/api/resources/rum/subresources/site_info/)).

The staff page follows the design approval gate: visual options first, implementation after the owner picks one. A chart dependency is avoided unless the chosen option needs one and the owner approves it.

**Owner decision, 2026-10-12.** From the three-option canvas (`.codex-artifacts/design/staff-stats-options/index.html`), the owner chose **C, Traffic and rail**, rebuilt with Recharts through the shadcn/ui Chart component, and explicitly approved adding `recharts` as an `apps/staff` dependency for it. The staff app pins `recharts@3.10.1`, the current stable 3.x release (the official new-york-v4 `chart` registry entry targets Recharts 3); `components/ui/chart.tsx` is the official source with the local `cn` import path and four lint-only changes. Recharts draws the traffic chart (visit columns with page-view dots on one axis); the devices split bar and breakdown tables stay HTML/CSS. Series colours are the dataviz-validated `#9085e9` (visits) and `#199e70` (page views) set through the chart config; both series pass the validator's lightness, chroma, CVD, normal-vision and 3:1 contrast checks on the staff card and page surfaces.

The page lives in a new closed `staff-stats` module (depends on `staff-ui` and `staff-platform`; the analytics client stays in `staff-platform`). `/stats/` is its own Astro route, and `StatsCharts` is a dynamic import, so Recharts never enters another route's eager graph. Stats joins the navigation after Orders with a straw-yellow `ChartColumn` area icon; `?range=30d` is the only accepted query parameter.

**Owner review, 2026-10-12.** Stats shows only what label members need. Worker requests were removed end to end: the `workersInvocationsAdaptive` query, `workerRequests` in the response and generated types, its tests and fixture, and its staff chart, table column and notes. The token permission stays Account Analytics Read. Member wording replaces environment details: the `not_configured` state reads "Stats aren't available here yet", and the notes say only that figures are Cloudflare estimates, a visit is not a unique person, and days run midnight to midnight UTC including today so far. Failed reads keep the reference ID for support. The owner also approved fixing the pre-existing desktop header overflow: between 1440 and 1919 px the header utilities (Publication history, Calendar, Add, View website) move into the existing Menu drawer, which already lists them; from 1920 px they stay in the header.

## Not included

Uptime monitoring (declined), conversion funnels and sales figures (Stripe Dashboard and the order workspace already cover these), and Search Console data in staff.

**Readability redesign, approved 2026-10-12.** The owner confirmed the Impeccable shape "A · Summary sentence": spacious, low variance and static, built on option C. Under the heading one Inter sentence with bold figures states the range total, the busiest day (ties and today so far handled) and the top merged source ("Most visits had no referring site" when direct leads); a range without visits keeps the empty message. Rankings show member-readable names derived from the value only: page paths become Home, Store, Releases and so on, detail pages a humanised slug plus type ("Chronoboros · Artist"), unknown paths the path; referrer hosts merge into Instagram, Facebook, Google, Bandcamp, Linktree, YouTube, Bing and DuckDuckGo with summed counts, other hosts drop `www.`, and an empty host is direct. Lucide icons mark page types and devices; brand marks are monochrome inline SVGs (Instagram, Facebook, Linktree and Bandcamp copied from `apps/web`, Google, YouTube and DuckDuckGo from Simple Icons CC0; Simple Icons has no Bing mark, so Bing uses lucide Search). Each row shows visits and their share of the range total, ordered by visits client-side; page views move to the row title, screen-reader text and the daily table. Recharts draws visits-only bars with the busiest day labelled, today's partial bar lighter, a dashed complete-day average with an HTML key, and a tooltip with visits and page views; devices get a plain sentence and a donut with an HTML centre label and an icon legend. Colour stays one violet accent for visits plus tinted neutrals. The Stats route budget rises to 126 KiB for the names, marks and sentence; Home and Store icons are inlined so other routes' shared icon chunks do not change.
