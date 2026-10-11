# Tasks

## 1. Brand card

- [x] 1.1 Generate `apps/web/public/assets/images/brand/share-card.jpg` (1200 × 630, badge logo 520 px centred) with sharp.
- [x] 1.2 Point site config and `SiteLayout.astro` at the card with type and size tags; remove the per-page image props and the Content Image derivative path.
- [x] 1.3 Switch the PRD Holding Page and its prepare/check scripts to the card; update the source tests.

## 2. Acceptance

- [x] 2.1 Verify rendered Local heads for Home, a release, an artist, a news item and a Store Item: absolute card URL, type, width, height and alt; the card loads. Verified on PRD 2026-10-12 instead of Local: Home, a release, an artist, a news item and a Store Item carry the absolute share-card URL, `image/jpeg`, 1200×630 and alt text. The card loads from pages.dev but returns 404 at the apex while it serves the Holding Page; 2.3 rechecks after cutover.
- [x] 2.2 Run strict OpenSpec validation and `pnpm validate` on the final tree; record results.
- [ ] 2.3 After deployment, re-scrape a PRD link in Facebook Sharing Debugger and LinkedIn Post Inspector (hosted check, not Local).
