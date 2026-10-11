# Proposal

## Why

The label asked for two things: make the artist photos uniform again, as they were, without the black strip under the artist name; and make artist images react on hover the way News images do. `redesign-artist-roster-crate-index` answered with a full redesign (crate-index list, tilted native-aspect prints, a hover pile, genre and sort filters, an A–Z index), and `simplify-artist-roster` trimmed that redesign. The label wants the redesign reverted and only the original fix kept.

The black strip came from two things. A whole photo in a 3:4 frame on a dark fill leaves dark bars when the photo is not 3:4 (Chronoboros is a square logo on white, Afterwise is landscape). A black gradient behind the overlaid name then turns the bottom bar into a band. The band chose to keep every photo whole and fill the leftover space with a blurred copy of the same photo.

## What Changes

- Restore the Artists card grid, the Home featured roster cards, the artist detail lead frame, the original Artists search, and the staff 3:4 artist picker frame, by reverting the crate-index code (`eaaa2c30`, `57eeac8a`) and `simplify-artist-roster` (`e032de4f`). The `simplify-artist-roster` change is dropped unarchived.
- Artist card photos hover like News images: the same 1.03 zoom over 500 ms from `match-artist-image-hover`, clipped to the frame, with the blurred fill held still and no zoom under reduced motion.
- Artist cards keep uniform 3:4 frames and show the whole photo. Space the photo leaves shows a blurred, darkened copy of it instead of a dark fill. The artist detail frame uses the same fill.
- Genre and name move below the photo. No gradient or scrim covers an artist photo.
- Remove the unused `default` `ArtistCard` variant.
- Out of scope: the Afterwise and Sidus photo swaps already published on PRD stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `artist-roster-presentation`: replace the crate-index and print requirements with one requirement for uniform, whole artist photos over a blurred fill, with the name below.
- `artists-search`: return to the six-profile search gate without genre filters, sort, or the A–Z index.
- `site-images`: return artist image scenarios to the 3:4 card frame, now with the blurred fill, and restore the Artist card hover zoom.
- `emdash-editorial-operations`: the artist upload guidance returns to the 3:4 frame and 1800 × 2400 px (minimum 1200 × 1600 px), describing the blurred fill.

## Impact

- `apps/web`: `ArtistCard.astro` (restored, then changed for the fill and the name), `ArtistDetailContent.astro`, the Artists and Home pages, Artists search, app-shell portal and snapshot code, `global.css`, the image checks and their tests, and the `artists` module boundary exports.
- `apps/staff`: artist picker frame and guidance copy.
- README, `docs/agent-reference.md`, `docs/content-workspace.md`.
- No backend, API, CMS schema, or dependency changes.
