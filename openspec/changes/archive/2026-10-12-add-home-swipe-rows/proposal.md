# Proposal

## Why

The client asked for the phone layout of Home to stop stacking every card. At 390 px the News section takes about 1,500 px and the Artists section about 2,030 px, so the page runs to 5,464 px and a visitor scrolls past three tall artist cards to reach the newsletter. The client wants these sections in one frame that the visitor swipes sideways.

The owner approved the direction from rendered drafts on 2026-10-07: native scroll-snap rows, ReUI's shadcn dot indicator in its rounded form (style A), and a fade on the neighbouring cards. The owner compared it with the shadcn Carousel (Embla) and chose the native row (option 1).

## What Changes

- Below 40rem, the Home News and Artists grids become horizontal rows that snap card by card. News cards are 82% of the row and Artists cards 74%, so the next card stays visible as the swipe cue. Artists cards are narrower because they are taller (3:4 photos); this keeps the swipe area away from most of the viewport.
- A dot indicator under each row shows the current card and scrolls to a card when tapped. It is ReUI `c-carousel-11` (MIT, Keenthemes), drawn inside 24 px tap targets, as a `client:load` React island.
- Cards beside the current one fade to 45% opacity, driven by a CSS scroll-driven animation. Browsers without scroll timelines (Firefox) show the row without the fade. It is off under reduced motion.
- The Artists section uses less vertical padding on phones.
- Tablet and desktop keep the current grids.

## Capabilities

### New Capabilities

- `home-section-rows`: Home News and Artists sections as swipe rows on phones.

### Modified Capabilities

None.

## Impact

`apps/web/src/pages/index.astro`, `global.css`, the News and Artists card image `sizes`, a new `ui-foundation` component and its tests, and a new e2e spec that also runs in Firefox. Home eager JavaScript grows by the island's own chunk, 795 Brotli bytes, to 105,931 bytes; Home had 336 bytes of headroom, so the owner approved raising Home's eager budget from 103 to 104 KiB on 2026-10-07. No content, Worker or commerce change.
