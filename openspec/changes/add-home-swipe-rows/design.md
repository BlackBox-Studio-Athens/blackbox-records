# Design

## Row mechanics

The rows use the browser's own horizontal scrolling with `scroll-snap-type: x mandatory`, so the phone moves the cards on its scrolling thread and the row swipes before any script loads. The row bleeds to the screen edges with negative inline margins equal to the layout gutter, and its padding and `scroll-padding` keep the first card aligned with the page text.

Measured in headless Chromium at 4x CPU, median of six one-card touch swipes with the fade on: the native row used 3.6 ms of script per swipe; the shadcn Carousel (Embla 8.6.0) with the same dots and an Embla opacity tween used 17 ms and moved the cards from JavaScript on every frame. The Embla bundle with dots was 7.8 KB Brotli against 0.56 KB for the dots island alone. Comparison page: https://claude.ai/artifact/VUQeroBw3SEfJEUayBpUCt.

## Dots

shadcn ships no dot indicator; its carousel example shows a text counter. ReUI `c-carousel-11` (MIT, Keenthemes, found through the Design Library) adds rounded dots on top of the shadcn Carousel. The island keeps ReUI's look and timing but reads the native row's scroll position instead of Embla's `select` event. Each dot is drawn inside a 24 px button to meet WCAG 2.5.8; ReUI's own dots are 8 px targets.

The island uses `client:load`. The shell inserts fetched page content and hydrates its islands, but it never runs page scripts. Astro defines each directive loader with an inline script only on pages that use that directive (observed in the Local Home and About HTML: only `load`), so a `client:visible` island would stay unhydrated after shell navigation to Home from a page that did not define that loader. Every page defines the `load` loader for the shell island.

`client:load` puts the island's chunk in Home's eager graph: 795 Brotli bytes (1,729 minified), on top of React and `cn`, which Home already loads. Home measured 105,931 bytes against its 105,472-byte budget, so the owner approved a 104 KiB Home budget. Estimated, not measured: a few milliseconds of download over 4G, fetched in parallel with the other island chunks, and a millisecond or two of parsing and hydration on a mid-range phone; after that the dots only read the scroll position once per frame while a row scrolls.

The card image `sizes` follow the narrower cards on phones (82% News, 74% Artists), so phones fetch smaller artist and news images than the old full-width hints asked for.

## Fade

The fade is a CSS scroll-driven animation (`animation-timeline: view(inline)`) on opacity, which runs off the main thread. Measured script time per swipe with the fade off and on was 3.6 ms and 3.8 ms, within run-to-run noise. It is declared with longhands, because the web build's minifier drops `animation-timeline` next to an `animation` shorthand, and it sits inside `@supports (animation-timeline: view())`: without timeline support, a `fill-mode: both` animation applies its last keyframe permanently and every card would stay dimmed.

Firefox has no scroll timelines in stable releases, so it shows the row without the fade. A scripted fallback like the Home hero's was not added; the row works fully without the fade.

## Rejected

- Native CSS scroll markers (`::scroll-marker`): no code, but Safari and Firefox draw no dots, and the owner wants identical dots in every browser.
- A custom pill indicator: the owner preferred an existing shadcn-ecosystem component.
- The shadcn Carousel (Embla): larger, JavaScript-driven swiping, no swipe before hydration, and the Astro cards would need wrapping in React.
