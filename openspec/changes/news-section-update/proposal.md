## Why

BlackBox Records is already participating in album releases while the public site remains pre-launch, but `/news/` does not record the label's work on Afterwise's _Disintegration_ or Ouranopithecus' _Anarchotribal_. Their Release entries also omit useful verified context and credits, while both stored dates conflict with the album-level sources verified by `7193409a`.

## What Changes

- Add source-backed `/news/` entries for Ouranopithecus' _Anarchotribal_ and Afterwise's _Disintegration_, backdated to their verified June 6 and June 9, 2026 release events.
- Enrich both matching Release entries with useful summaries, confirmed digital/label-owned physical formats, and structured performer, recording, mixing, mastering, production, artwork, and label credits supported by official artist sources or current label authority.
- Carry the core release facts and credits into both News articles while keeping the Release detail credit list the complete structured record.
- Correct both conflicting Release dates and stale matching Artist copy so News, Release, and Artist surfaces describe completed releases in the same chronology.
- Preserve the verified album-level Bandcamp and Tidal values introduced by `7193409a`.
- Reuse existing content fields, release artwork, News routes, and Release credit rendering; add no scheduling system, schema field, runtime dependency, or new UI.

## Capabilities

### New Capabilities

- `release-news-publication`: Defines source-backed label release coverage, pre-launch backfill chronology, shared release facts/credits, and consistency between News, Release, and Artist content.

### Modified Capabilities

- `release-catalog-presentation`: Requires both Release detail pages to expose their verified summaries, formats, dates, and structured credits through the existing presentation.

## Impact

- Content: `apps/web/src/content/news/`, both matching Release entries, and stale matching Afterwise/Ouranopithecus Artist copy.
- Assets: existing release artwork is reused; no new artwork pipeline or duplicate media is required.
- Rendering: existing homepage and `/news/` sorting plus existing Release summary/format/credit presentation consume the enriched content without code changes.
- Music links: the album-level Bandcamp and Tidal values from `7193409a` remain unchanged and continue to drive the existing player.
- External evidence: official artist/label pages are preferred; secondary sources may supply attributed background but cannot establish an Actual Release Date when primary evidence is missing or conflicting.
