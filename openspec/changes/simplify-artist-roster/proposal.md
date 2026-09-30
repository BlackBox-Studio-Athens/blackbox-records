# Proposal

## Why

The crate index roster carries more than an artist directory needs. Its Listen buttons repeat the players already on Releases and Store/Distro, its roster numbers add noise without meaning, and its prints look clickable but are not.

## What Changes

- Remove the Listen action from the roster preview panel and the phone disclosure; View artist stays the only action.
- Make the photo in each roster print (the wide-viewport pile and the phone disclosure) a link to the artist, which the shell opens as the artist overlay. The row and View artist links stay the keyboard path, so the photo links sit outside the tab order.
- Remove roster numbers from the rows, the preview topline and the print captions. Letter markers stay for grouped rosters; captions keep the artist name.
- Drop the now-unused roster release entry and player data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `artist-roster-presentation`: print captions carry the artist name only; rows show no roster number; the preview panel has one action; roster print photos link to the artist.

## Impact

`ArtistRosterIndex.astro`, `ArtistPrint.astro`, `artist-roster-index.ts`, `catalog-data.ts`, roster styles in `global.css` and their tests. The artist overlay, Home featured roster and the Listen trigger elsewhere are unchanged. No API, dependency or publication work.
