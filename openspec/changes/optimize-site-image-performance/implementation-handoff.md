# Optimize Site Image Performance Handoff

## Final Strategy

- Static local Content Images now use Astro responsive output where Astro metadata is available.
- Catalog/card images use small width ladders and a page-provided `imageLoading` prop. Leading grid items are eager; the rest stay lazy.
- First-viewport lead media use Astro `priority` only on direct routes that have one clear lead image.
- Overlay detail fragments keep lead images lazy, so opening a fragment does not add high-priority fetch pressure.
- Runtime image snapshots, provider URLs, public brand assets, admin previews, checkout/cart images, and email markup stayed on their existing raw image paths.
- Existing aspect-ratio frames were kept. No spinner, shimmer, loading-copy, CDN, DAM, service worker, SSR image proxy, or new image dependency was added.

## Source Warnings

`pnpm assets:check` still passes with the same three pre-existing artist source warnings:

- `src/content/artists/481665433_122220429290035240_840634763596090822_n.jpg` is `2048x1365`, not the preferred 3:4 portrait source.
- `src/content/artists/Chronoboros-band-logo.jpg` is `1200x1200`, not the preferred 3:4 portrait source.
- `src/content/artists/Ouranopithecus-band-photo.jpg` is `800x1200`, below the preferred `1200x1600` minimum.

These were deferred as editorial source-quality issues. No ImageMagick or GIMP source edits were needed for this implementation.

## Validation

- `pnpm openspec:guard` passed before implementation.
- `pnpm assets:check` passed before and after image markup changes, with only the warnings listed above.
- Focused generated-markup tests passed: `pnpm --filter @blackbox/web exec vitest run test/assets/check-image-markup.test.ts`.
- `pnpm test:unit` passed.
- `pnpm check` passed.
- `pnpm build` passed, including static cache policy validation and the new generated image markup validation.
- WebStorm MCP did not expose a test runner for arbitrary commands; WebStorm file-problem checks reported no issues for the changed TypeScript/test/page files. Project validation used the repo pnpm gates.

## Browser Use Findings

Browser Use validated the local static site at mobile and desktop widths for:

- `/`
- `/distro/`
- `/store/`
- `/releases/`
- `/artists/`
- `/news/`
- `/store/disintegration-black-vinyl-lp/`
- `/releases/disintegration/`
- `/artists/afterwise/`
- `/news/lorem-ipsum/`
- `/services/`

Checks covered first viewport and scrolled states where relevant. No horizontal overflow, visible unloaded image frames after normal load, text overflow, console warnings/errors, or blank zero-size media frames were found. Distro and Store grids showed three eager leading card images, lazy remaining cards, responsive `srcset` output, and no high fetch priority on grid cards. Direct detail routes showed a single eager/high-priority lead image.

Hosted Product Environment checks were not run because deployment/hosted acceptance was not part of this local implementation slice.
