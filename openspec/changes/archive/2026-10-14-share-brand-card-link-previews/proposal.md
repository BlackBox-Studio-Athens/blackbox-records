# Proposal

## Why

Link previews currently send a 1024 px square logo or a page's cover, artist or product photo. Wide previews (X, Facebook, LinkedIn, Discord, Slack, iMessage) crop squares and portraits, square previews (WhatsApp, Telegram) crop wide images, and the result differs per app. The user chose one Blackbox brand card for every shared link.

## What Changes

- Add a 1200 × 630 JPEG brand card (`share-card.jpg`, 23.5 KB): the badge logo, which carries the Blackbox Records name, centred in the middle 630 px square on `#0d0d0d`.
- Shell documents and the PRD Holding Page use it as `og:image` and `twitter:image`, with `og:image:type`, `og:image:width` and `og:image:height`.
- Release, artist, news and Store Item pages stop passing their own images as link previews; their titles and descriptions still vary per page.
- The PRD Holding Page artifact ships the card instead of the 1024 px PNG.

## Capabilities

### Modified Capabilities

- `app-shell-and-player`: Shared links use the configured site and the brand card instead of the product image.
- `site-images`: Link-preview metadata uses the fixed brand card rather than Content Image derivatives.

## Impact

`SiteLayout.astro`, site config, four page templates, the PRD Holding Page and its prepare/check scripts, and their source tests. No data, API, dependency or publication changes. Apps cache previews, so existing shared links refresh only after their own cache expiry or a debugger re-scrape.
