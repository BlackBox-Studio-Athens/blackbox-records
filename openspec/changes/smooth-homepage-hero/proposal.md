# Proposal

## Why

The client reported that scrolling down past the Home hero photo drops its brightness abruptly, like a blackout. The coarse scrolled class flips at half of the fade distance and crossfades the fixed media layer from `1` to `0.12` in 240 ms.

A label member reported that the photo lags when navigating to Home from another page. On PRD (390 px, Fast 4G, 4x CPU) a shell tap from Artists to Home blocks the main thread for about 2.3 s in one forced layout of the new Home DOM. The hero `<img>` requests only after that task, so the photo appeared about 1.7 s after Home was revealed. The layout cost comes from the Veneer brand font, whose glyphs carry 1,600 to 4,300 outline commands each; every new Veneer glyph size costs 220 to 300 ms of layout unthrottled on a desktop. That font cost is outside this change.

An earlier JavaScript custom-property writer was removed (commit `45455219`) because per-scroll style writes were costly on mobile, so the fade must not reintroduce per-frame application work.

## What Changes

- Where `animation-timeline` is supported, the media layer and its black veil animate from opacity `1`/`0` to `0.12`/`0.5` along the root scroll timeline over the first `42vh`. Lenis drives the native scroll position, so the fade follows its smoothing without JavaScript. Transitions are disabled there; keyframes declare explicit `from` values so the coarse class cannot become the start value.
- Browsers without scroll-driven animations keep the existing coarse 240 ms crossfade. Reduced motion keeps the instant endpoint switch.
- A fetched shell section snapshot preloads its eager images as soon as its HTML is parsed, for both link intent and activation, so the image request is queued before the insertion task's layout. Cached snapshots and overlays are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Homepage hero scroll opacity, homepage hero render work and first-screen image preparation.

## Impact

CSS in `apps/web/src/styles/global.css` and the shell page loader. No dependency, content, Worker or commerce change.

Depends on `reveal-first-screen-images` (implemented, not archived): archive it before this change, because this change modifies its requirement.

Ceiling: the first Veneer layout per page and size still blocks the main thread. Reducing it needs a decision on the brand font asset and is tracked separately.
