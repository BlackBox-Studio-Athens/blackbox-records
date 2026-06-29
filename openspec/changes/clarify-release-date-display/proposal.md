## Why

Editors can change `release_date` in Decap, but the public site mostly compresses it to a year and the CMS field does not explain what that edit changes. This makes editors unsure whether the date belongs in body copy, post metadata, release metadata, or commerce state.

## What Changes

- Show release dates as delicate metadata on release-facing UI, without forcing editors to repeat dates inside summary/body copy.
- Keep the existing `release_date` content field as the source of truth; do not add a second date field.
- Clarify Decap release date help text so editors know Releases dates drive public display and release ordering/latest behavior, while Distro dates are optional display metadata.
- Preserve current release sorting/latest behavior unless implementation finds a direct bug in the existing `release_date` flow.

## Capabilities

### New Capabilities

- `release-date-presentation`: Defines how editorial release dates appear in public release UI and how Decap explains the field to editors.

### Modified Capabilities

- None.

## Impact

- Public UI: release cards, release detail content, releases landing latest/upcoming feature blocks, artist discography/release references, and any existing distro/store card surface that already renders `release_date`.
- CMS config: Decap release collection field hint, and matching distro release date wording only if the shared editor language would otherwise stay inconsistent.
- Validation: unit/config tests for Decap YAML generation and focused render/build checks for affected Astro pages.
