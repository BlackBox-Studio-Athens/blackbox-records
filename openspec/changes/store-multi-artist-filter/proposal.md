# Proposal

## Why

Shoppers asked for two Store filter changes: a Clear filters control that is easier to see, and an Artists filter that accepts several artists at once ("so someone can tick 2-3 together"). Today Clear filters is a muted ghost button, and the artist filter is single-choice: radios in the desktop pane and a native select on phones. Both options were compared on the "Store filter options" design canvas, and the owner approved options 1A and 2B with the phone layout on 9 October 2026.

## What Changes

- Clear filters keeps its place, name and behavior and becomes a bold 16px Inter text button with a 2px underline and a leading × mark (option 1A).
- Artists becomes a checkbox list (option 2B). Ticking nothing means all artists, so `All artists` is removed. A `Find an artist` box narrows the unticked list, ticked artists are pinned above it under `Selected · N` with an artists-only `Clear`, and focus stays on a checkbox when it moves.
- Results show items whose credit matches any ticked artist, combined with the existing text, format and Pre-orders filters.
- Below 64rem, the native `Artist` select is replaced by an `Artists` chip in the toolbar row, beside Pre-orders and Clear filters on one line at 375px and wider. It opens a bottom sheet holding the same checkbox list, with `Show N items` to close it.
- Snapshot sanitation resets ticked artists, the find box, pinned options and the sheet.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `distro-format-jump-navigation`: The artist filter becomes a multi-select checkbox list with find and pinned selections, and phones use an Artists chip and sheet instead of the native select. This change builds on the unsynced `show-mobile-store-formats` delta and must sync after it.

## Impact

Public Store frontend only: `StoreDistroSearch.tsx`, `StoreBrowsePane.astro`, a new internal artist-options helper, Store CSS in `global.css`, both snapshot sanitizers, unit tests, the Store e2e specs and the Store section of `DESIGN.md`. No API, content schema, dependency, commerce, publication or hosted operation changes.
