# Design

## Who implements what

Tasks are tagged:

- **`[Claude]`** tasks contain UI work and are implemented by Claude.
- **`[Claude or Codex]`** tasks have no UI.
- **`[Owner]`** tasks need the owner's Google or Cloudflare sign-in.

The backend reads land first, with their generated internal contracts. Claude then builds the staff sections against those contracts. Both releases go through the normal UAT push run and PRD promotion before the 2026-10-16 launch.

## Shared rules

Both routes follow `GET /api/internal/analytics` (see `add-site-analytics` design):

- **Access:** the existing Access-protected `/api/internal/*` middleware, with Local's loopback-only operator bypass.
- **Range:** `range=7d|30d` is required. A missing or other value returns HTTP 400 `invalid_request`.
- **Windows:** UTC windows identical to analytics. The current window starts at midnight UTC 6 or 29 days before today and ends at `generatedAt` (now), so it includes today so far.
- **Response headers:** `Cache-Control: no-store` and `X-Request-Id`.
- **Failures:** HTTP 503 `application/problem+json` with the existing shape `{ type, title, status, detail, code, error, requestId }`. A structured warning carries a safe reason category; secrets, tokens and provider bodies are never logged or returned.

## Store stats

`GET /api/internal/store-stats?range=7d|30d` reads D1 through the orders module's repository seam. Aggregate queries read only the two windows' rows. No cache is used, because D1 is the authority and the reads are small.

Implementation uses the existing `orders` root export and `internal-order-services.ts`, with one parameterized aggregate per window in `PrismaOrderStateRepository`. The creation-date and order-line indexes already exist; migration `0034_checkout_order_paid_at_index.sql` adds the missing `paidAt` index so paid-order reads do not scan historical orders. No order fields or records change. The query plan is checked in workerd; each request makes two aggregate queries, with line reads only for the matching paid orders. The existing module entrypoints and allowed dependencies remain sufficient, so no boundary metadata change is needed.

`start-checkout.ts` creates the Stripe session before `bindCheckoutSession` or `recoverCheckoutSession` writes its ID. Sessionless holds keep a null ID. Recovery also writes an ID only when the provider has returned an existing session, including an ambiguous-creation recovery. `checkoutSessionId IS NOT NULL` therefore marks a checkout that reached Stripe; a sessionless stock hold is excluded.

```typescript
type StoreStats = {
  range: '7d' | '30d';
  generatedAt: string; // ISO 8601 UTC, the exclusive upper bound of the current window
  currencyCode: 'EUR';
  current: StoreFigures; // the range
  previous: StoreFigures; // the same number of days immediately before it
};
type StoreFigures = {
  checkoutsStarted: number; // CheckoutOrder rows created in the window that reached Stripe (checkoutSessionId set)
  paidOrders: number; // orders whose paidAt falls in the window, whatever their later status
  itemsSold: number; // sum of CheckoutOrderLine.quantity over those paid orders
  paidTotalMinor: number; // sum of amountTotalMinor over those paid orders, delivery included; null counts as 0
  deliveryMinor: number; // sum of the accepted delivery amount over those paid orders; null counts as 0
};
```

- **Started vs paid:** a checkout started in one window can be paid in the next, so the two counts are not a strict funnel. The UI describes them as "checkouts started" and "orders paid", never as a percentage that could exceed 100%.
- **Refunds and withdrawals:** refunds are made in Stripe, and neither refunds nor withdrawals are subtracted. The UI says "paid", not "earned" or "net".
- **Environment:** UAT counts its own test orders.
- **Failure detail:** `Store figures are temporarily unavailable. Try again.`

## Search stats

`GET /api/internal/search-stats?range=7d|30d` reads the Search Console Search Analytics API for `GOOGLE_SEARCH_CONSOLE_SITE` (`sc-domain:blackboxrecordsathens.com`, PRD var).

- **Authentication.** `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` is a PRD Worker secret holding a service-account JSON key. The Worker signs an RS256 JWT with WebCrypto (no new dependency) and exchanges it at `https://oauth2.googleapis.com/token` for the `https://www.googleapis.com/auth/webmasters.readonly` scope. The access token stays in Worker memory or the Cache API until shortly before it expires. The service account has no Google Cloud roles; its only access is a **Restricted** user on the Search Console property.
- **Queries.** All use `POST https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query` with `dataState: "all"`:
  - totals with no dimensions
  - `dimensions: ["query"]` with `rowLimit: 10`
  - the newest date with data, for `latestDate`

  Search Console days follow Pacific Time, and the newest days are provisional.

  All three queries use the selected UTC window's `YYYY-MM-DD` start and current date labels; Google interprets those inclusive labels in Pacific Time. The date query requests up to 30 rows, enough for either range, and selects the greatest returned date rather than treating the requested end date as proof of data.

- **Cache.** One hour in the Workers Cache API, keyed by environment, site, UTC day and range.

  The named cache is `search-stats-v1`. Only successful data snapshots are cached, preserving `generatedAt`; each caller receives a fresh request ID and `no-store`. Missing configuration and failures are never cached. Token reuse is isolate-local, keyed by environment and a SHA-256 credential digest, and stops 60 seconds before expiry. Authentication failures discard the token. All upstream requests use `redirect: "manual"`, a shared 10-second deadline including body reads, a 128 KiB cap per response and no automatic retry. OAuth 400/401/403 and query 401/403 use `upstream_auth`; other HTTP/network failures use `upstream_http`; malformed or oversized responses use `upstream_invalid_shape`. PRD's site var is committed to Wrangler so releases preserve it; Local/mock/mock-api/UAT stay blank.

```typescript
type SearchStats = {
  range: '7d' | '30d';
  generatedAt: string | null; // null when not_configured
  status: 'ok' | 'not_configured';
  latestDate: string | null; // YYYY-MM-DD, newest day with data; null when none
  totals: { clicks: number; impressions: number; position: number | null }; // position null when impressions are 0
  topQueries: Array<{ query: string; clicks: number; impressions: number; position: number }>; // ≤10, clicks then impressions descending
};
```

- **`not_configured`:** the var or the secret is absent or blank. It returns zeros, an empty list and null dates, and does not say which binding is missing. UAT and Local return it.
- **Anonymized queries:** Google omits them, so the totals can exceed the sum of `topQueries`. The UI never sums the list.
- **Failure detail:** `Search figures are temporarily unavailable. Try again.`, with safe reasons such as `upstream_auth`, `upstream_http`, `upstream_timeout` and `upstream_invalid_shape`.

## Staff Stats

The page reads analytics, store stats and search stats as three independent sources. Each keeps its own loading, error, stale snapshot and `not_configured` state, so one failing source never blanks the page. A 401 or 403 from any of them shows the existing Access-required state.

- **Paid orders per 100 visits** is computed in the browser from `current.paidOrders` and the same range's visit total. It shows only when visits are above 0 and is labelled as an estimate, because visits are Cloudflare estimates.
- **Revenue** is visible to every staff account (owner decision, 2026-10-13).

The sections follow the design approval gate:

1. Claude writes a shape brief.
2. Claude presents two visual options at 390 and 1280 px, keeping the approved "A · Summary sentence" direction, Recharts through shadcn Chart and Lucide icons.
3. Implementation starts only after the owner picks one, which is then recorded here.

**Owner decision, 2026-10-13: Option 2, Visits first.** The options canvas is `.codex-artifacts/design/staff-stats-store-search/index.html`.

- **Summary sentence:** adds a store clause (paid orders, paid total, checkouts started) and, when orders and visits are above 0, "About N paid orders per 100 visits."
- **Store section:** opens the rail with three parts.
  - A lead sentence comparing the paid total with the period before.
  - Two HTML bars for the paid total: the period before in a dark neutral and the range in a light neutral. Violet stays reserved for visits.
  - Orders paid, items sold and checkouts started, each with a change marker: a Lucide trend icon plus a signed number, "new" when the period before was 0, and "same" when equal. Colour never carries the meaning alone.
- **Google search section:** sits under the visits chart in the main column. A lead sentence with clicks, impressions and average position, then a table of search term, clicks, times shown and position.
- **Notes:** each section carries its own. Paid totals include delivery and do not subtract Stripe refunds. Google hides rare searches, and its latest day can still change.
- **Phone order:** the rail follows the main column, so Store appears after Top pages. The owner accepted this.

## Not included

- Per-item sales rankings and daily order charts.
- Refund and withdrawal deductions.
- Search Console page-level data.
- Click-outs to Bandcamp or Tidal and player plays: Cloudflare Web Analytics has no custom events.
