# Proposal

## Why

Stats shows site visits only. Label members also want to see in one place whether the store is earning, whether shoppers finish checkout, how visits turn into orders and what people search on Google to find the label, without Stripe or Search Console logins. `add-site-analytics` left sales figures and Search Console data out; the owner has now asked for them and chose to show revenue to every staff account.

## What Changes

- Add a protected backend read, `GET /api/internal/store-stats`, that counts started checkouts, paid orders, items sold and the paid total from D1 for the chosen range and the period before it.
- Add a protected backend read, `GET /api/internal/search-stats`, that reads Google Search Console clicks, impressions, average position and top search terms with a read-only service account held only by the Worker.
- Add Store and Google search sections to the staff Stats page, plus paid orders per 100 visits, after the owner approves a visual option. Each source loads and fails on its own.

## Capabilities

### Modified Capabilities

- `site-analytics`: Stats gains store figures, search figures and a visit-to-order rate.

## Impact

- **Backend:** two internal routes, one PRD var (`GOOGLE_SEARCH_CONSOLE_SITE`), one PRD secret (`GOOGLE_SEARCH_CONSOLE_CREDENTIALS`) and regenerated internal contracts.
- **Owner setup:** a Google Cloud service account with Search Console API access, added to the Search Console property as a Restricted user.
- **Staff:** the Stats page and its client.
- **No changes to:** shopper-facing code, D1 schema, cookies or dependencies.

Cloudflare stays on Free.
