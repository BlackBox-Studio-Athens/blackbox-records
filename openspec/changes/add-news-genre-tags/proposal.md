# Proposal

## Why

On mobile, visitors reach three News cards before seeing the Artists roster and its genre labels. News cards should identify the music without requiring that extra scroll.

## What Changes

- Add an optional Artist reference to News, editable and removable with the existing picker.
- Resolve each linked Artist's published genre into a small, wrapping tag beside the date on homepage and News listing cards at every viewport.
- Preserve the reference through native revisions, imports, preview and accepted snapshots; reject unresolved publication references.
- Link the three retained release articles to their existing Artists without changing their copy or dates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-news-publication`: News cards identify the linked Artist's published genre before their title.
- `emdash-editorial-operations`: News supports an optional native Artist reference across editing, revisions, preview and publication.

## Impact

Shared content schemas and snapshot mapping, CMS reference handling/schema preparation, the staff picker and News form, the public NewsCard, retained News metadata, and focused checks. No new dependency, route, commerce authority, or hosted deployment/publication.
