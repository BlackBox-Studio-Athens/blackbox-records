# Proposal

## Why

A label member reported that the Chronoboros photo shows a black band around the artist name while other artist photos look even. Artist cards force every image into a fixed 3:4 frame with `object-contain` on a dark fill and put a black gradient behind the name. A square image with a white background (the Chronoboros logo) therefore shows dark bars and a visible band; dark photos hide the same bars. The artist detail hero and the Home featured roster repeat the pattern. Every new CMS upload that is not a dark 3:4 portrait will repeat the defect, and the card grid also does not scale well past a handful of artists.

## What Changes

- Replace the Artists roster card grid with a typographic "crate index" list: numbered rows with the artist name, genre, country, and release count, each linking to the artist.
- Show artist images as native-aspect photo prints: an off-white border, a caption strip, a slight tilt, and a shadow. Images are never forced into a fixed ratio, never padded with fill bars, and never overlaid by text.
- On wide viewports, a sticky preview panel shows the hovered or focused artist as the top print of a small pile (the active artist plus the two most recently previewed), together with a bio excerpt, release count, latest release, and actions. The server-rendered page shows the first artist's print, so the panel works without JavaScript.
- On narrow viewports, each row shows a small tilted print thumbnail and discloses the full print, latest release, and a link to the artist inline, without JavaScript.
- Extend Artists search, which still appears only at six or more artists, with genre filters and an A–Z / latest-release sort. From 13 artists up, add an A–Z jump index and letter grouping.
- Apply the print treatment to the artist detail lead image and the Home featured roster, and remove their fixed frames and text-over-image gradients.
- **BREAKING (content standard):** retire the documented 3:4 portrait crop for artist images. Any aspect ratio is valid, asset QA no longer warns about non-portrait artist sources, and the staff artist pickers drop the dark 3:4 preview frame and portrait dimension guidance.
- Out of scope (CMS content work): replacing the Afterwise photo and the Sidus photo (the current Sidus file has black bars baked into the image).

## Capabilities

### New Capabilities

- `artist-roster-presentation`: how the Artists roster, artist detail lead image, and Home featured roster present artist identity and imagery: native-aspect prints, the crate index list, the preview pile, the narrow-viewport disclosure, and accessibility and reduced-motion behavior.

### Modified Capabilities

- `artists-search`: search availability stays gated at six profiles; the requirement adds genre filtering, sorting, and an A–Z index with letter grouping for large rosters, and clarifies that the preview portal is not a search outlet.
- `site-images`: the artist image scenarios drop the 3:4 portrait framing in favour of native-aspect print slots with role-specific width ladders, and the Artists direct-route priority scenario targets the first preview print instead of leading portrait cards.
- `emdash-editorial-operations`: the artist upload scenario keeps the full image at its native aspect ratio and recommends at least 1200 px on the long edge instead of a dark portrait frame and 1800 × 2400 px.

## Impact

- Artists route page, a new roster index component, the artist card and detail components, the Home page roster section, and global styles in `apps/web`.
- The app shell: a new lazily loaded, route-owned Artists preview portal, alongside the existing Artists filter portal, plus shell snapshot cleanup for its state.
- Artists search component and search helpers; tests for roster layout, image markup, asset QA, and roster search.
- The `artists` module boundary exports in `apps/web/src/components/artists/project.json`.
- Staff artist image pickers (`ContentFields`, `EditorialPicker`, `MediaLibrary` in `apps/staff`): preview framing and guidance copy only.
- No backend, API, CMS schema, or dependency changes.
