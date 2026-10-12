# Proposal

## Why

The label has no traffic or search visibility figures before launch. The owner chose free, cookieless providers: Google Search Console and Bing Webmaster Tools for search, Cloudflare Web Analytics for visits, and simple charts in staff so members without a Cloudflare login can read the numbers. Uptime monitoring was considered and declined.

## What Changes

- Verify `blackboxrecordsathens.com` as a Domain property in Google Search Console and import it into Bing Webmaster Tools. Turn on Cloudflare Crawler Hints so changed pages are announced to IndexNow engines. Sitemap submission and indexing requests wait for switch day (`launch-switch-day`).
- Turn on Cloudflare Web Analytics for the apex with automatic setup. It sets no cookies, so no consent banner is added. The privacy notice names it.
- Add a protected backend read, `GET /api/internal/analytics`, that queries Cloudflare's GraphQL Analytics API with a read-only token and returns visits, page views, top pages, referrers, countries and device types.
- Add a staff Stats page that draws those figures as simple charts, after the owner approves a visual option.

## Capabilities

### New Capabilities

- `site-analytics`: search-engine verification, cookieless visit measurement and the protected staff Stats view.

## Impact

Backend internal routes, one Worker secret (`CLOUDFLARE_ANALYTICS_API_TOKEN`) and two vars, the staff navigation and a new staff page, the privacy notice content, and Cloudflare/Google/Microsoft dashboard settings. No shopper-facing code, cookies or D1 schema changes are planned. The owner approved one staff dependency, `recharts`, for the chosen chart option, and the staff frontend gains a closed `staff-stats` module (module-boundaries delta). Cloudflare stays on Free.
