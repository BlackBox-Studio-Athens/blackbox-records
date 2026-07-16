## Why

The All Store collection now has 81 cards, 79 of which are Distro items, but it lacks Distro's format-led discovery surface. Its visible prices begin as `Checking price`, then queue up to 81 read-time Store Offer reconciliations, while redundant card CTAs and an always-empty Merch category make the Store harder to browse.

## What Changes

- Add a compact Distro browse panel to `/store/`, derived from the existing Distro groups and linking to the canonical Store Distro format fragments. It will show Distro copy, total, and current format counts without rendering a second copy of the 79-item catalog.
- Replace per-card listing Store Offer reads with one browser-safe, presentation-only listing-price response backed by current Store Offer snapshots and one persistent Store-shell loader. Store Item details and checkout retain Worker-authoritative Store Offer reads and checkout revalidation.
- Remove redundant `View Item` / `View in Store` labels from Store cards, whose whole card is already the canonical Store Item link. Rename native release-to-Store actions to `Shop release`; retain external `Buy merch` actions.
- Make Merch a derived `Clothes` facet that is discoverable only when it has canonical items. Hide its Store navigation and sitemap entry at zero items, preserve its reserved route segment, and redirect direct empty Merch visits to Store instead of presenting an empty shelf. **BREAKING**: `/store/merch/` changes from an empty collection document to a redirect while no merch exists.
- Add focused Worker, UI, shell-transition, sitemap, and hosted UAT regression coverage for prices, browsing, CTAs, and zero-to-populated Merch behavior.

## Capabilities

### New Capabilities

- `store-listing-price-presentation`: Bounded, browser-safe presentation of catalog listing prices without exposing checkout authority or reconciling Stripe per card.

### Modified Capabilities

- `commerce-checkout`: Permit a presentation-only listing-price response while preserving Store Offer and checkout authority.
- `distro-format-jump-navigation`: Let All provide Distro format discovery through canonical Store Distro fragment links.
- `store-catalog-categories`: Refine the unarchived predecessor capability so zero-item Merch is not navigable or indexed, while `Clothes` remains its sole derived source.
- `module-boundaries`: Declare the Store listing-price presentation entrypoint used by the persistent app shell.

## Impact

- Web catalog: Store collection cards, Distro cards, Store navigation, sitemap, release commerce labels, and shell-managed Store transitions.
- Commerce Worker/API: Store Offer snapshot read seam, public OpenAPI contract, generated public client, and UAT cache/CORS behavior; no new Stripe, D1, cart, or provider authority is introduced in the browser.
- Validation: unit/API contracts, generated-client checks, hosted UAT behavior, category output checks, and module-boundary manifest updates.
- Sequencing: apply after `consolidate-distro-into-store` is accepted and archived, because this change narrows that change's `store-catalog-categories` contract.
