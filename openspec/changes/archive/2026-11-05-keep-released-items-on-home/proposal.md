## Why

Home shows a full-screen chapter (video, photo, title, Listen) only for Store Items on an open pre-order. When staff closed the Afterwise pre-order, its chapter left Home, and the label wants to keep it and change the button to Buy vinyl. The chapter should follow the release, and its action should follow the live offer.

Design reference (private canvas): https://claude.ai/artifact/MVs4dAWVSFAF69UfNGhrSX

## What Changes

- Add a staff switch, Show on Home, to the release editor. A release with an open pre-order appears on Home automatically; the switch decides whether a release stays after its pre-order closes.
- Home presents chapters for open pre-orders first, then switched-on releases, newest first. Today it presents only open pre-orders.
- The chapter's purchase block reads the live offer and has three states:
  - Open pre-order: unchanged (Sea Pre-order action, pre-order status, shipping estimate, pre-order terms link).
  - In stock: format-aware Buy action (Buy vinyl, Buy CD, Buy cassette, otherwise Buy) in the Buy colour with the disc icon for vinyl, an Out now status, no shipping estimate, and a Delivery information link.
  - Zero stock: the static Sold out status instead of an action, with the same Out now status and Delivery information link.
- The Home section link reads All pre-orders while any chapter is a pre-order, and Visit the Store otherwise. The section keeps its `#preorders` anchor.
- Commerce adds the Home offers of stocked and sold-out release Store Items to the projection it already pushes, so Home still renders chapters in its first HTML response.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-preorders`: the Home section presents featured releases as well as pre-orders, and its action follows the live offer.
- `preorder-projection`: the pushed projection also carries Home offers, and a missing projection makes no featured claims.
- `emdash-editorial-operations`: releases carry the Show on Home switch in the staff editor.

## Impact

- `packages/content-model` (release schema gains an optional `show_on_home` boolean), staff release editor (`apps/staff`), published content and its accepted snapshot.
- `apps/backend` projection derivation, identity and push (`open-preorder-projection.ts`, `preorder-projection-push.ts`) and the renderer's projection validation and storage.
- `apps/web` Home (`pages/index.astro`, `_preorder-showcase.ts`, `lib/open-preorders.ts`, `StorePreorderShowcase.tsx`, Home CSS), tests and the Home e2e coverage.
- `DESIGN.md` and the Home notes in `docs/` change only where they name the pre-order-only chapter.
- The projection identity changes only when a featured offer's slug, price or availability changes, so the Cloudflare Free-tier push, purge and cache rules stay as they are. No new route, binding or scheduled job.
- The existing projection path stays backward compatible: a projection without Home offers renders exactly as today.
