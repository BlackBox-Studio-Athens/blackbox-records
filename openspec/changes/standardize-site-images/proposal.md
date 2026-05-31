## Why

BlackBox Records already has working image handling through Astro content collections, Decap-authored files, public brand assets, store/cart snapshots, metadata, and Stripe catalog projection. The problem is not missing machinery; it is scattered rules.

This change records a simpler image policy so future CMS, checkout, catalog, and PRD-readiness work does not invent separate image ownership or URL rules.

## What Changes

- Add a `site-images` capability that names the small set of supported image roles:
  - Content Image
  - Public Brand Asset
  - Runtime Image Snapshot
  - Provider Product Image URL
- Keep repo content as the source of truth for artist, release, distro, news, home, about, services, and store product images.
- Prefer Astro `image()` fields and Astro `<Image>` for static local content images.
- Allow raw `<img>` only where the source is already a browser/runtime/public string URL or Astro image metadata is unavailable.
- Keep cart and checkout image values as display snapshots only, not product-media authority.
- Require provider-visible product image URLs to be derived from repo content and the target Product Environment.
- Extend asset QA only where it supports this simple policy: broken references, unreadable images, obvious dimension/crop drift, alt-text presence, and provider URL readiness.

## Capabilities

### New Capabilities

- `site-images`: Defines the simple repo image policy across source ownership, rendering, runtime snapshots, provider URL projection, and validation.

### Modified Capabilities

- `commerce-checkout`: Store, cart, checkout, and provider image behavior derive from repo-owned product images.
- `tooling-validation`: Asset QA remains read-only and checks for image-policy drift without rewriting files.

## Impact

- OpenSpec only.
- No image file rewrites.
- No new image CDN, DAM, SSR image service, generated derivative pipeline, or broad frontend refactor.
- Later implementation can be incremental: helper cleanup, asset-check additions, and focused tests.
