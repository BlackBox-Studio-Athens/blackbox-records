# Remove vinyl animation across the public site

## Why

The owner wants the vinyl animation removed everywhere while keeping the existing Vinyl edition action. Release cards currently slide and rotate a record behind their artwork, and vinyl Buy icons spin their printed label.

## What Changes

- Delete release-card record markup, image generation, animation styles and the record photo asset.
- Keep Vinyl edition text, bracket styling, shared artwork/action destinations and independent listening behavior.
- Make vinyl Buy icons static using their existing artwork; delete the separate spinning label asset.
- Preserve CD and cassette effects and the existing Grid and Crate browsing behavior.

This supersedes the record-motion requirements in `share-release-edition-link`; its completed implementation evidence remains historical.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: vinyl visuals remain static and release editions retain their existing actions and destinations.

## Impact

Public editorial cards, Store Buy icons, global styles, design guidance and focused existing tests. No catalog, stock, checkout, Worker or release operation changes.
