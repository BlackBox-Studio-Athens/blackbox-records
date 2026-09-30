# Design

## Context

See proposal.md for motivation. Current state:

- `apps/web/src/pages/artists/index.astro` renders `ArtistCard` (`roster-detailed` variant) in a grid. Each grid item carries `data-artist-roster-item` and `data-artist-*` attributes. At six or more artists it also emits the `[data-artists-roster-filters]` outlet.
- `ArtistsRosterFilters.tsx` is a route-owned React island. `AppShellRoot` finds its outlet with `connectShellPortalTarget` (`targetPathname: '/artists/'`), and `ShellPortalOutlets` mounts it through `React.lazy` + `createPortal`. It filters by toggling `hidden` on server-rendered items. `readDocumentShellPageSnapshot` empties the outlet before caching a page snapshot.
- `ArtistCard.astro` (roster, featured-roster, and default variants) and `ArtistDetailContent.astro` put images in fixed `aspect-[3/4]` / `16/13` frames with `object-contain` on `#141414`; the cards add a black gradient scrim under the name.
- The `app-shell-and-player` and `frontend-runtime-performance` baselines require route-owned portals to load only on their route, keep server content usable while a portal chunk loads or fails, and stay out of the initial app-shell and Home closures.
- The design reference is the "Crate index v2" page of https://claude.ai/artifact/HPtVVjZSTkWZWetR2k7Ay6.

## Goals / Non-Goals

**Goals:**

- One print treatment reused by the roster, artist detail, and Home roster.
- Keep the News hover zoom from `match-artist-image-hover` where artists appear as link cards (Home featured roster). Each print wraps its image in an overflow-clipped window so the zoom stays inside the paper border. That change must archive first, because this change replaces its requirement.
- Server-rendered roster and default preview; client code adds only the hover/focus pile, filtering, sorting, and the jump index.
- Keep images on `astro:assets` responsive delivery with source dimensions, so there is no layout shift.

**Non-Goals:**

- CMS schema changes, focal-point fields, or automated cropping (the staff picker change is preview framing and copy only). Editorially wrong sources stay content fixes (the Afterwise and Sidus photo swaps go through the CMS).
- Scroll-driven motion on mobile (prints straightening as rows cross the viewport centre). It was explored in the design and deferred.
- Changing the artist detail layout beyond its lead image.

## Decisions

1. **Server-render a hidden "print deck"; the island only manages state.** The preview panel contains one server-rendered print per artist (Astro `<Image>`, preview width ladder, `loading="lazy"`), plus a details block per artist. Only the first artist's print and details are visible and eager in the initial HTML.
   - The new route-owned React island (`ArtistRosterPreview`) holds the active artist and history in `useState`. It listens to hover and focus on rows through delegation from the list root, and sets `data-print-depth` (0–2) and `hidden` on deck prints and details blocks.
   - _Alternative:_ build the preview from JSON inside the island. Rejected: it duplicates content, loses `astro:assets` srcsets, and works less well without JavaScript.
   - _Alternative:_ a plain DOM controller like the Store coverflow helpers. Rejected at the user's request in favour of an island, for maintainability. The island keeps state and event handling testable, and loads lazily only on `/artists/`.

2. **Portal mount beside the default preview.** The island portals into an empty `[data-artist-roster-preview]` mount inside the panel. `AppShellRoot` connects it with `connectShellPortalTarget` (`'/artists/'`), and `ShellPortalOutlets` loads it with `React.lazy`, separate from the filters chunk. It exists at every roster size: it is not a search outlet, so the `artists-search` gate is unchanged.
   - `readDocumentShellPageSnapshot` empties the mount and resets deck state before caching: first print at depth 0, the others hidden, first details visible, active-row markers removed.

3. **One row, two presentations.** Each `<li data-artist-roster-item>` holds:
   - a row link (visible from `lg`) for hover, focus, and navigation;
   - a native `<details>`/`<summary>` (visible below `lg`) with a tiny print thumbnail in the summary and, when open, the full print, the existing `artist-release-stat` and `artist-latest-teaser` blocks, and a "View artist" link.

   Filtering keeps toggling `hidden` on the `li`, so counts stay correct and the mobile disclosure needs no script. `display: none` on the inactive presentation removes it from the accessibility tree.

4. **Sorting and grouping without moving DOM.**
   - Rows are server-rendered in A–Z order with `data-artist-sort-name` and `data-artist-latest-release-sort` (an ISO date, or a max value for upcoming or undated releases). The filters island applies latest-release order with CSS `order` on the flex list, so shell snapshots and server order stay intact.
   - At 13 or more artists, the server renders letter markers on the first row of each group and a jump index of anchor links. The filters island hides the markers while the latest-release sort is active.

5. **Print styles as a small CSS component.** In `styles/global.css`:
   - `.artist-print`: `#f2f1ec` paper border, 34 px caption strip, `--print-tilt` custom property, two-layer shadow.
   - `.artist-print--thumb`: a 3/3/11 px border for row thumbnails.
   - Tilt comes from the roster index (a fixed sequence, so SSR and client agree). Drop-in motion is a 220 ms transform/opacity transition on `data-print-depth` changes, disabled under `prefers-reduced-motion`.

6. **Slot sizing from source dimensions.** Print slots compute width and height from `image.width` / `image.height` within role maxima: preview 340×390 px, thumbnail 72×54 px, detail lead by container. `<Image>` receives explicit `width`/`height`, so no aspect ratio is forced.

7. **Retire the 3:4 roster standard in tooling.**
   - `scripts/check-assets` stops warning about non-portrait artist sources.
   - `scripts/check-image-markup` locates roster images through a new stable hook (`data-artist-roster-print`) instead of `.artist-roster-card__image`.
   - The staff artist pickers pass no crop ratio, so artist photos preview like other media, and the guidance names a long-edge minimum instead of 1800 × 2400 px. The CMS never cropped artist bytes; only the preview frame and copy change.

## Risks / Trade-offs

- [Hidden deck grows with the roster (one print and one details block per artist)] → Hidden lazy images are not fetched. The DOM cost stays small at the expected tens of artists. Revisit if the roster exceeds about 60 artists.
- [Hover pile can feel busy on slow pointers] → Only three prints ever render, and rapid hovering updates state without queuing animations.
- [Two row presentations can drift] → Both come from one Astro component with shared data; the layout test asserts both exist per item.
- [Tilted prints reduce effective image size] → Tilt stays within ±3.5° (±3° on thumbnails), and prints size to fit their rotated bounds.
- [Removing `ArtistCard` variants affects module exports] → Update `components/artists/project.json` boundary exports and the boundary manifest together, and run the architecture checks in `pnpm validate`.

## Migration Plan

- A normal frontend release: no data migration.
- Rollback is a code revert.
- CMS photo swaps (Afterwise, Sidus) can happen before or after release; both images render correctly in the new treatment.
