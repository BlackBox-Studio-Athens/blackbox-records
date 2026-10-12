# Proposal

## Why

Launch must point the apex at the site, confirm everything Stripe, emails, link previews and search engines depend on, and then leave `https://blackboxrecordsathens.com` as the only public PRD address. `prepare-launch-switch` builds and rehearses the script and moves the API; this change runs it.

This change replaces the open launch tasks in `production-go-live-readiness` (6.5a, 6.6, 6.7) and `share-brand-card-link-previews` (2.3). Both changes are archived once their tasks move here.

## What Changes

- Run `pnpm launch:switch -- cutover`, then the manual steps it prints: Search Console sitemap and indexing, Facebook and LinkedIn re-scrapes, and a check of the Stripe Dashboard policy URLs.
- Make the first real sale.
- After 24 hours, run `pnpm launch:switch -- finalize`: `pages.dev` redirects to the apex, the PRD `workers.dev` addresses stop answering and HSTS is on.
- Retire the Holding Page workflow, branch and source, and remove `pages.dev` from PRD configuration.

## Capabilities

### Modified Capabilities

- `environment-model`: PRD has one public address after launch.

## Impact

Hosted Cloudflare and Stripe state through the script, then removal of the Holding Page workflow, branch, source and specs, and `pages.dev` entries in PRD configuration and docs. Depends on `prepare-launch-switch` being complete. No UI work.
