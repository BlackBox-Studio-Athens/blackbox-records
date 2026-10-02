# Proposal

## Why

On phones, shoppers could not find format choice (vinyl sizes, CDs, tapes) in the Store. PRD and UAT at 390px placed the format links inside the collapsed Browse disclosure together with the artist filter, and on All Store its label named only artists. Format is the first way people browse a record shelf, so it must be visible without a hidden step.

## What Changes

- Below the 64rem desktop pane, Distro format links render as visible, wrapping, square chips with their counts on Store Distro and All Store. They never scroll horizontally.
- The current format chip takes the selected chip face: ink border and check mark.
- The collapsed disclosure now holds only the artist filter and reads `Artist` plus the current artist.
- The desktop sticky pane keeps the existing format ledger and artist list.
- Format selection no longer closes a disclosure, so the unused `formatDisclosure` field is removed from the Distro search DOM.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `distro-format-jump-navigation`: The narrow-viewport presentation changes from a native disclosure to visible wrapping chips. The disclosure, sticky-row and disclosure-closing clauses are replaced.

## Impact

Public web frontend only: `StoreBrowsePane.astro`, the two Store layouts that fill it, `StoreDistroSearch.tsx` and `global.css`, with unit and e2e coverage. No API, content schema, commerce, publication or dependency changes. PRD is the target environment and receives the change through the normal UAT candidate and PRD code promotion.
