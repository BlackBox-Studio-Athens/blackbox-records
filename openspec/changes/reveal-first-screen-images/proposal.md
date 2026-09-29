# Proposal

## Why

In-app section navigation and detail overlays showed images popping in after the swap. The shell revealed new content before its first-screen images had loaded or decoded, and overlay lead images were lazy.

## What Changes

- Preload the destination's eager images when a shell section or overlay link receives hover or focus intent. Nothing is preloaded on the click path.
- Keep the page-enter transition until the swapped content's eager images have decoded, capped at 300 ms. Section navigation and cached-page restoration share this wait; already-decoded images add none.
- Load detail overlay lead images (Release, Artist, News) eagerly without high fetch priority. Full pages keep their priority image.
- Extend the generated image-markup check to the release, artist and news overlay fragments.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Shell navigation reveals first-screen images.

## Impact

Client-side shell navigation and detail markup only. No dependency, content, publication, Worker or commerce change.

Ceiling: a first cold visit still depends on download speed, and the 300 ms cap lets slow images arrive after the reveal. First-visit placeholders using EmDash's stored `dominantColor` or `blurhash` are a possible follow-up.
