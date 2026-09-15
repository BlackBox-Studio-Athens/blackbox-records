## Why

The content workspace previews selected fields with separate markup, so editors cannot reliably judge the public result. Publication history consumes editing space and important states lack clear hierarchy.

## What Changes

- Implement the approved focused editor with a searchable selector, live private site preview, responsive tabs, and semantic color.
- Reuse public Astro rendering against published context plus the unsaved record, without saving or publishing.
- Move publication status to the top bar with bounded refresh and on-demand history.
- Improve action copy, image guidance, keyboard behavior, and clickable affordances.
- Recover failed preview assets, gate readiness on actual rendering, and remove measured sequential delays in previews and Items/Stock.

## Capabilities

### Modified Capabilities

- `content-publishing`: private faithful preview and focused editorial workspace.

## Impact

Staff React workspace, public content-reader seam, combined Astro CMS Worker, and local verification. No new hosted resources, migrations, commerce authority, or public rendering mode changes.
