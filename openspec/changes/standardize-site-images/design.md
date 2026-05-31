## Context

Current image handling is mostly good enough:

- Astro content collections already use `image()` for collection-owned local images.
- Most static pages and cards already use Astro `<Image>`.
- Decap writes media into repo content paths.
- Store/cart/checkout surfaces carry image strings because browser/runtime state cannot carry Astro `ImageMetadata`.
- Stripe catalog projection already needs absolute public image URLs per Product Environment.
- `pnpm assets:check` already performs read-only Sharp-backed asset QA.

The goal is to simplify and document this as one boring contract, not to build a new image pipeline.

## Goals / Non-Goals

**Goals:**

- Make repo content the image source of truth.
- Keep static rendering on Astro's built-in image handling.
- Keep runtime image strings as derived display snapshots.
- Keep provider-visible image URLs target-environment scoped.
- Keep validation read-only and warning-first where legacy media quality is subjective.

**Non-Goals:**

- No automatic image rewriting, resizing, cropping, or format conversion.
- No image CDN, DAM, Cloudinary-like service, R2 media bucket, or SSR image proxy.
- No universal image component replacing Astro `<Image>`.
- No broad Decap media reorganization.
- No live Stripe/provider mutation.

## Decisions

### Decision 1: Four Image Roles Only

Use these terms:

- **Content Image**: repo-owned image referenced by content collections or CMS-authored files.
- **Public Brand Asset**: static public logo, favicon, badge, or chrome asset.
- **Runtime Image Snapshot**: browser-safe display image copied into cart/checkout convenience state.
- **Provider Product Image URL**: absolute public URL emitted for Stripe/catalog provider use.

Rationale: these four roles cover current behavior without creating a fake generalized media platform.

### Decision 2: Content Owns Product Images

Release and distro content remains the source for store product images. Cart, checkout, metadata, and provider projections derive from that source.

Rationale: duplicate editable image fields would create Stripe/CMS/content drift.

### Decision 3: Use Astro Images Where Astro Can Help

Static Astro pages, cards, details, and editorial surfaces should use Astro `image()` plus `<Image>` when they receive local `ImageMetadata`.

Raw `<img>` is acceptable for Public Brand Assets, Runtime Image Snapshots, player/provider badges, admin chrome, external URLs, and client-rendered state.

Rationale: Astro already solves dimensions and optimized output for local static images. React/runtime strings cannot use that path directly.

### Decision 4: Validate, Do Not Mutate

`pnpm assets:check` remains read-only. It can grow into a contract check, but it must not rewrite content or images.

Rationale: image quality and crop replacement are editorial decisions.

## Migration Plan

1. Keep this change spec-only on main.
2. In a later implementation slice, inventory current image roles and add focused helpers only where duplication exists.
3. Extend `pnpm assets:check` with small read-only checks that match the policy.
4. Add focused tests for provider URL projection and cart/checkout image snapshots.
5. Use Browser Use only when rendered image framing or loading behavior changes.

## Open Questions

None for this plan. Defer CDN/DAM/derivative generation unless current repo-hosted images become a proven bottleneck.
