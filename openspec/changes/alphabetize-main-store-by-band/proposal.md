# Proposal

## Why

The main Store catalog currently inherits source ordering, separating BlackBox releases from Distro items. Shoppers should be able to browse the complete All collection by artist or band, using the same alphabetical rule as Distro.

## What Changes

- Order `/store/` by displayed artist/band or label credit A–Z, then item title and slug for deterministic ties.
- Share the existing non-mutating Distro sorter with All, preserving Distro's current order.
- Preserve the ordered server-rendered sequence through Grid, Coverflow, artist/text filtering, clearing filters and shell navigation.
- Keep BlackBox Releases, Merch and the Home pre-order showcase on their existing ordering rules; no release or pre-order priority applies in All.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: Define artist/band alphabetical ordering for the complete All Store collection.

## Impact

Frontend collection sorting, the All route, Distro's existing caller and sorting test references, plus Store design guidance and Local acceptance evidence. No API, content schema, dependency, commerce identity, publication or hosted operation changes.
