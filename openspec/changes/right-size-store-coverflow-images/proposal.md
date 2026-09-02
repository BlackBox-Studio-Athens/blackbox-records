## Why

Post-commerce measurements on commit `81ce9976` showed Store All and Store Distro transferring roughly 5.5–5.8 MB and missing the 2.5-second mobile-stress LCP gate. The bounded responsive slots implemented in `46a78e3f` reduced transfer to 3.05 MB and 3.33 MB and improved LCP to 2.68 and 2.76 seconds, but both routes still miss the gate and Distro retains isolated first-traversal outliers because three covers still compete as eager images.

## What Changes

- Give Store Item and Distro cards one shared Coverflow-preview responsive-size contract matching the existing approximately `56vw` mobile and 256 px desktop cover slots.
- Give Store cards one shared `priority | eager | lazy` loading mode so the initial active Coverflow cover is the only high-priority image and contradictory loading states cannot be represented.
- Keep neighboring and hidden Coverflow covers lazy, preserve ordinary non-Coverflow leading-image behavior, and leave width ladders, source images, canonical card nodes, no-JavaScript fallback, disclosure behavior, and the Coverflow controller unchanged.
- Add focused markup coverage proving both card types share the responsive-slot and loading-mode contracts.
- Rerun Store activation, mobile load, fixed traversal, request-cardinality, Browser Use, and repository gates against one exact tree.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-images`: Require eligible Store Coverflow previews to declare responsive image slots that match their bounded geometry and give initial high priority only to the first visible active cover.

## Impact

- Store card image-loading type, `StoreItemCard.astro`, `DistroCard.astro`, their existing Store renderers, and focused image/Store markup tests.
- Local runtime-performance evidence and the parent production-readiness report.
- No backend, API, D1, Stripe, checkout, stock, order, content, dependency, controller, or public interaction change.
