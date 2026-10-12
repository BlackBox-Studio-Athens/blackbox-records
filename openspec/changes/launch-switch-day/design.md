# Design

## Who implements what

`[Claude]` tasks contain UI work and are implemented by Claude. `[Claude or Codex]` tasks have no UI. `[Owner]` tasks need the owner's sign-in, credentials or a purchase. This change has no UI work.

## Sequence

The script, its checks, snapshot and rollback are defined in `prepare-launch-switch`. On the day:

1. `cutover` switches the apex and verifies it; it rolls back on a failed Home or TLS check.
2. The owner does the manual steps, which have no usable API:
   - Google Search Console: submit the sitemap and request indexing for Home and Store.
   - Facebook Sharing Debugger and LinkedIn Post Inspector: re-scrape the apex.
   - Stripe Dashboard: confirm the business website and policy URLs. Stripe has no API to edit the platform account's own settings; the script only checks them.
3. The first real sale proves the paid order, order email, stock decrement and staff order view.
4. The Holding Page stays available as rollback for 24 hours.
5. `finalize` removes `pages.dev` and the PRD `workers.dev` addresses and turns on HSTS. After it, rollback can no longer restore the Holding Page.
6. Holding Page code and configuration are retired.
