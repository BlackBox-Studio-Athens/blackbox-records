# Spec Delta

## ADDED Requirements

### Requirement: Pre-order logic and presentation use declared entrypoints

Pre-order status rules SHALL be owned by `commerce-domain` and reach other backend modules through its root entrypoint. Shopper wording SHALL be owned by `web-platform`, and pre-order islands SHALL be provided entrypoints of the modules that own their surface.

#### Scenario: Backend modules need pre-order status

- **WHEN** stock, checkout, order, email or HTTP code derives or validates a pre-order
- **THEN** it imports the pure pre-order module through the `commerce-domain` root entrypoint
- **AND** the pre-order estimate notice repository is a provided `commerce-persistence` entrypoint consumed by `orders`.

#### Scenario: Web modules word a pre-order

- **WHEN** Store, cart, checkout, editorial or page code formats a Ship Estimate or badge
- **THEN** it imports `apps/web/src/platform/lib/preorder-estimate.ts`, a provided `web-platform` entrypoint
- **AND** `store-cart` gains no dependency beyond `ui-foundation` and `web-platform`.

#### Scenario: Pre-order islands are mounted

- **WHEN** the home page mounts the pre-order showcase, release surfaces mount the release Store link, and checkout mounts the cart notice
- **THEN** `apps/web/src/components/store/StorePreorderShowcase.tsx` is a provided `web-store` entrypoint, `apps/web/src/components/editorial/ReleaseStoreLink.tsx` a provided `web-editorial` entrypoint, and `apps/web/src/components/store/cart/PreorderCartNotice.tsx` a provided `store-cart` entrypoint
- **AND** boundary validation passes without an ownership exception or compatibility facade.
