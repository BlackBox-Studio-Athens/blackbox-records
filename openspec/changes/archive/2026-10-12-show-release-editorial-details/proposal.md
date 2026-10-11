# Proposal

## Why

LOTUS's published tracklist and full description appear in Store but are omitted from its Release page. The shared Release template never renders these fields, regardless of release date.

## What Changes

- Show the saved full description and tracklist on Release pages, overlays and private previews, including upcoming releases.
- Reuse editorial text rendering and track grouping, preserving links, formatting, side/disc headings, positions and optional durations.
- Omit empty sections and retain the existing release cards, typography and media sections.
- Extend the Local publication smoke to cover future and past dates, private drafts, accepted content and empty fields.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: Release detail views display their existing editorial description and tracklist independently of release date and commerce availability.

## Impact

The shared public Release detail component and existing Local publication smoke. No API, schema, dependency, commerce or content migration changes. Existing published LOTUS content supplies the missing details after compatible code promotion.
