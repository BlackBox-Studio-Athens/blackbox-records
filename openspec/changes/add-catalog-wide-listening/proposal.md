## Why

Listeners can audition BlackBox releases, but Distro items and Store collection cards do not offer the same Listen action. Extend the existing player across the music catalog so visitors can hear the item they are considering, including CDs, tapes, singles, splits, and other labels' releases.

## What Changes

- Research the current catalog during planning and retain an item-by-item source register with exact Bandcamp album pages, usable embed URLs, Tidal release links when verified, and explicit unresolved matches. Link discovery is not an implementation task.
- Add the existing optional `bandcamp_embed_url` and `tidal_url` editorial fields to Distro, with the same validation and staff editing treatment as Releases.
- Reuse the current Listen trigger and persistent player on Home catalog cards, Store collection cards, and every music Store Item detail, preserving existing Release and Artist-discography listening.
- Default to Bandcamp when both providers exist; expose Tidal through the existing provider switch. Keep embeds mounted only after listening intent.
- Carry listening metadata through the existing accepted-content snapshot and publication path. Listening remains independent of stock, price, and checkout availability.
- Keep the change small: no new player, provider SDK, discovery service, scheduled link checker, cache, database table, release-matching engine, or additional streaming provider.

## Capabilities

September 24 approved follow-up: the user selected the animated Fluid five design after contextual prototypes. Refine the shared Listen appearance and carry the same decorative mark into the existing modal and mini player. Keep the current player lifecycle and truthful status labels.

The user then selected Below the artwork for Store and requested that the active recording's button become inactive while the floating player owns its controls. Store uses a 112 × 44px action row. Matching controls across Store and Releases show amber In player; this indicates an existing session, not verified playback. Open and Stop remain in the floating player on desktop and mobile.

### New Capabilities

- `catalog-listening`: Catalog coverage, planning evidence, Distro provider fields, and consistent Listen actions across public music-item surfaces.

### Modified Capabilities

- `app-shell-and-player`: Extend source ownership and stable session identity from Releases to Release and Distro editorial records while retaining the existing player lifecycle.

## Impact

- Shared content schemas in `packages/content-model`, the Distro staff form, the frontend catalog view model, `DistroCard.astro`, `StoreItemCard.astro`, and the Store Item template.
- Existing source-based listening in `add-store-item-listening-context` remains the baseline; this change extends its previously unsupported Distro case.
- Coordinate card/template edits with `refine-store-browsing-and-item-information` and `add-store-product-photo-hover`, preserving their current layout and interactions.
- Current repository research baseline: 101 Distro records and 3 Release records. Published CMS records are authoritative; repository JSON is bootstrap/recovery material. The source register must distinguish this baseline from hosted acceptance.
- No commerce API, cart, Stripe, stock, Worker resource, deployment URL, or dependency changes. Hosted publication is a later authorized operation, separate from this planning task.
