## Why

Image rendering is already functional, but several high-traffic surfaces still ship oversized content images, lazy-load visible product media, or lack responsive `srcset` output. This hurts perceived speed on a static music label/store site where covers, artist photos, and product media are primary content, not decoration.

This change turns the existing `site-images` policy into a performance-ready image contract for the whole site while keeping the current static Astro architecture and repo-owned media source of truth.

## What Changes

- Define site-wide image performance rules by section and image role:
  - homepage hero and internal hero images
  - release, artist, distro, news, services, and store cards
  - release, artist, news, store, cart, checkout, email, brand, admin, and provider images
- Require responsive Astro output for static local Content Images where Astro image metadata is available.
- Prioritize above-the-fold content images without blocking the whole page or eager-loading full grids.
- Keep lazy loading for below-fold catalog/card/detail support images.
- Reserve media geometry for every rendered image and use quiet placeholders instead of per-image spinners.
- Add source-asset remediation guidance for ImageMagick and GIMP:
  - ImageMagick for repeatable inspection, resizing, metadata stripping, and safe one-off compression.
  - GIMP for manual crop, focal-point, and editorial art-direction repairs.
  - existing Sharp-backed `pnpm assets:check` for read-only QA and future budget checks.
- Extend validation with Browser Use visual/performance checks, generated HTML inspection, and existing asset QA.
- Avoid adding a CDN, DAM, SSR image proxy, service worker, or new image dependency unless later evidence shows Astro/Sharp cannot meet the target.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-images`: Add whole-site responsive delivery, above-fold priority, source asset, and per-section image optimization requirements.
- `loading-feedback`: Add image loading feedback rules for reserved frames, quiet placeholders, no noisy per-image spinners, and reduced-motion-safe reveal treatment.
- `tooling-validation`: Add required checks for image markup, source dimensions where they are already policy-backed or newly proven necessary, hosted output, and Browser Use performance/visual validation.

## Impact

- Affected frontend components include image-heavy Astro pages and cards under `apps/web/src/components/**` and `apps/web/src/pages/**`.
- Affected content collections include artists, releases, distro, news, home, about, services, settings, and public brand assets.
- Affected tooling includes `pnpm assets:check`, Browser Use validation, optional generated-HTML inspection, and optional local ImageMagick/GIMP remediation workflows.
- No runtime backend API, D1, Stripe, checkout authority, provider mutation, Cloudflare Pages Functions, Astro SSR, or external media service changes.
