# Proposal

## Why

A label member reported that the Home photo lags when navigating to Home from another page. `smooth-homepage-hero` made the photo request earlier; two causes remained, both observed on PRD (`https://blackbox-records-web.pages.dev/`):

- **Veneer layout cost.** The brand font's distressed glyphs are traced polygons with up to 668 contours and 3,936 points each. Every new Veneer text size costs about 385 ms of layout on a desktop and roughly four times that on a phone; a cold Artists to Home tap froze the main thread for 2.3 s (390 px, 4x CPU).
- **Stretched hero after shell navigation.** The page-enter animation leaves `transform: translateY(0px)` inline on `<main>`. Any transform makes `<main>` the containing block of `position: fixed` descendants, so after a shell navigation the fixed Home hero image is 4,991 px tall instead of the 844 px viewport and shows as a blurred grey slice. Direct loads are unaffected.

## What Changes

- Replace both retained copies of `veneer_regular.woff2` with an outline-simplified derivative made by `apps/web/scripts/simplify-veneer.py` from the original (SHA-256 `f02b74cb…2939`): contours smaller than 12 font units (of 2048) are dropped and the rest are simplified at 8 font units. Glyph set, cmap, advance widths, GPOS, GSUB, GDEF, name, OS/2, post, gasp and cvt are unchanged; the script asserts this. 312,816 → 78,616 bytes. The owner confirmed on 2026-10-02 that modifying the font is permitted.
- The page-enter animation on `<main>` animates opacity only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `frontend-runtime-performance`: Critical font delivery allows the owner-approved outline-simplified Veneer.
- `app-shell-and-player`: Shell page entry keeps fixed layers viewport-fixed.

## Impact

Font asset, its delivery check, the generator script and the shell page-enter animation. No content, Worker or commerce change. The 8 px entry slide is removed.

Ceiling: the finest sub-pixel dust of the grain is thinner; the owner chose this variant from rendered comparisons at 54 px (3x density) and 120 px (2x density).
