# Why

The Home pre-order film has an unwanted manual background-play button. Releases lose alignment and readable purchase hierarchy on narrow screens. International-order notices can also mistake a network country, including travel eSIM routing or a retained tab hint, for the shopper's intended delivery destination.

# What Changes

- Remove the Home background-play text button while retaining accessible motion handling, poster fallback and explicit full-video playback.
- Refine the existing Releases composition for small screens without replacing its approved artwork, typography, desktop layout or shell player.
- Diagnose and correct misleading international-order hints across Store, item, cart and checkout. Network location remains advisory; the Worker continues enforcing actual shipping eligibility.

# Capabilities

## New Capabilities

None.

## Modified Capabilities

- `store-preorders`: no manual Play background text button on Home.
- `app-shell-and-player`: aligned, usable mobile Releases presentation preserves shell navigation and listening.
- `shipping-fulfillment`: advisory country notices can recover from a misleading network hint without changing fulfillment authority.

# Impact

Home pre-order presentation, release-specific responsive styles, shared shopper-country/notice code and scoped tests. Work happens directly on main. No new dependency, location permission, hosted content publication, stock mutation or deployment is part of this follow-up.
