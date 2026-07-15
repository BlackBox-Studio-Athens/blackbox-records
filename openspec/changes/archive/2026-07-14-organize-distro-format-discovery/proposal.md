## Why

The 79-record Distro catalog currently mixes exact physical types with presentation categories, and one verified 7-inch record is classified as 12-inch. Catalog artifacts can therefore be generated from content that disagrees with the accepted inventory source.

## What Changes

- Keep exact Distro physical types in content and inventory data while deriving the combined `7-inch & 10-inch Vinyl` browse category only for presentation.
- Correct `Magic Sleazeball Corrida` to `Vinyl 7-inch` and preserve deterministic group and item ordering.
- Require bijective Distro Inventory Source matching and reject physical-type disagreement before catalog artifacts or Store Offers are derived.
- Add focused regression coverage for grouping, ordering, source reconciliation, and the complete server-rendered catalog.

## Capabilities

### New Capabilities

- `distro-format-discovery`: Defines exact Distro physical-type ownership, derived browse categories, ordering, and fail-fast inventory reconciliation.

### Modified Capabilities

None.

## Impact

- Distro content and grouping helpers under `apps/web`.
- Catalog-source validation and its tests under `scripts`.
- Distro route rendering and browser verification.
