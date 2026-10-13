# Resolve Bandcamp player links

## Why

Staff currently requires hand-copied Bandcamp embed code and rejects the versioned player metadata advertised by pages such as Misty Route's Ethos. Editors should be able to paste the recording's page address without admitting unresolved URLs into saved content.

## What Changes

- Automatically resolve Bandcamp-hosted album and track addresses after 750 ms in the existing optional player field.
- Reuse validated recording identities to derive canonical house-style embeds, including existing embed URLs and iframe code.
- Add a bounded authenticated CMS lookup with metadata agreement checks and safe redirects.
- Keep unfinished input outside draft data and block saving/review until resolved, reverted or cleared.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `catalog-listening`: Staff resolution of recording pages into supported saved player sources.

## Impact

Shared content model, CMS runtime and combined Worker dispatch, staff content forms and autosave/navigation guards. No new dependencies, content migration, hosted content edits or publication.
