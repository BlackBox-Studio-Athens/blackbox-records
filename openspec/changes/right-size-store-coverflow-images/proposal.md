## Why

Post-commerce measurements on commit `81ce9976` show Store All and Store Distro transfer roughly 5.5–5.8 MB and miss the 2.5-second mobile-stress LCP gate even though Browser Use confirms only the six positioned Coverflow covers are loaded. Those covers still advertise full-card responsive slots, so the browser selects image candidates materially larger than their actual Coverflow geometry.

## What Changes

- Give Store Item and Distro cards one shared Coverflow-preview responsive-size contract matching the existing approximately `56vw` mobile and 256 px desktop cover slots.
- Keep current width ladders, source images, first-card eager loading, remaining lazy loading, canonical card nodes, no-JavaScript fallback, disclosure behavior, and Coverflow controller unchanged.
- Add focused markup coverage proving both card types use the same bounded preview slot while ordinary catalog cards keep their current grid sizes.
- Rerun Store activation, mobile load, fixed traversal, request-cardinality, Browser Use, and repository gates against one exact tree.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-images`: Require eligible Store Coverflow previews to declare responsive image slots that match their bounded rendered cover geometry rather than ordinary full-card grid widths.

## Impact

- `StoreItemCard.astro`, `DistroCard.astro`, their existing Store renderers, and focused image/Store markup tests.
- Local runtime-performance evidence and the parent production-readiness report.
- No backend, API, D1, Stripe, checkout, stock, order, content, dependency, controller, or public interaction change.
