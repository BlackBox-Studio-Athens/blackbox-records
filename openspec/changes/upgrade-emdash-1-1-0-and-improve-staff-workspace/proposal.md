## Why

EmDash 1.1.0 supplies image editing, upload and content fixes. BlackBox's custom staff interface needs integration to use these features, and staff need more editing space, batch uploads and a useful publication audit.

## What Changes

- Upgrade all three direct EmDash dependencies together, retain concurrency patches and apply verified migration histories.
- Make Stock a focused workbench and make Preview explicitly closable without losing drafts.
- Support batch image uploads, richer Full text images and restricted YouTube/Vimeo embeds.
- Add readable publication comparisons and a read-only Athens publication calendar based on accepted BlackBox snapshots.
- Restore Firefox mouse-wheel scrolling after dismissing a release detail by clicking its backdrop.

## Capabilities

### New Capabilities

- `staff-workspace-improvements`: focused Stock, closable preview, batch uploads, editorial image/video support and publication history/calendar.

### Modified Capabilities

## Impact

Staff frontend, CMS publication journal/routes, content-model, public editorial rendering, dependency patches and migration smoke. No new infrastructure or dependencies. Local acceptance precedes UAT; PRD remains separately approved.
