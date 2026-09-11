## Why

Store Item pages expose purchase actions but no direct listening action or route back to their editorial release. BlackBox already has a custom shell-owned Bandcamp/Tidal player and reliable release-to-artist relationships that can supply this context.

## What Changes

- Add a Listen action on release-backed Store Item pages when the source release has supported player data, reusing the existing trigger, provider builder, and custom site player.
- Link the source release and actual related artist using existing editorial identities and overlay routing.
- Carry the Releases page's recognizable Listen treatment into the Store Item identity area before the long description, with restrained editorial links and Add to Cart retained as the primary purchase action.
- Keep the selected sellable option explicit without presenting every release format as a selectable or available Store Item option.
- Omit listening/editorial actions when supported data or a verified relation is absent. Current Distro content has no listening fields; do not guess relationships or add catalog-wide enrichment in this slice.
- Preserve single-session, close/minimize/stop, keyboard/focus, and third-party iframe navigation limits.

## Capabilities

### New Capabilities

- `store-item-listening-context`: Existing-player listening and source-backed editorial navigation from Store Items.

### Modified Capabilities

None. The existing app-shell/player lifecycle and route classification remain unchanged.

## Impact

`apps/web/src/pages/store/[slug]/index.astro`, current catalog/source lookups, `MusicStreamingServiceListenTrigger.astro`, existing player data builders, and focused rendering/browser coverage. Coordinate edits to the shared item template with Distro media enrichment and shopper purchase information. No new player, provider, streaming service, content-authority field, or commerce API is introduced.
