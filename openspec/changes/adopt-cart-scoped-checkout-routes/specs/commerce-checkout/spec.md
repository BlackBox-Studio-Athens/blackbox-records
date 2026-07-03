## ADDED Requirements

### Requirement: Cart-scoped checkout document routing

The system SHALL expose shopper checkout documents at cart-scoped store routes rather than item-scoped routes.

#### Scenario: Shopper opens cart checkout

- **GIVEN** `StoreCart` contains one or more `CartLine`s
- **WHEN** the shopper chooses Checkout from the cart drawer
- **THEN** the browser navigates to `/store/checkout/`
- **AND** the route does not include any `storeItemSlug`.

#### Scenario: Cart checkout starts hosted Checkout

- **GIVEN** the shopper is on `/store/checkout/`
- **WHEN** the shopper starts hosted checkout
- **THEN** browser code sends the current `CartLine` and `CartQuantity` values to `/api/checkout/sessions`
- **AND** the Worker validates every line before creating a Stripe Checkout Session.

#### Scenario: Cart checkout direct load has no cart

- **GIVEN** the shopper opens `/store/checkout/` with no browser `StoreCart` lines
- **WHEN** the checkout page renders
- **THEN** it presents an empty-cart checkout state
- **AND** it does not create a Stripe Checkout Session.

### Requirement: Cart-scoped checkout return routing

The system SHALL use cart-scoped checkout return and cancel URLs for Stripe-hosted Checkout Sessions.

#### Scenario: Stripe checkout success returns

- **GIVEN** the Worker creates a Stripe Checkout Session
- **WHEN** it builds the success URL
- **THEN** the URL targets `/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}`
- **AND** the URL uses a configured checkout return target base URL, including any configured path prefix such as `/blackbox-records`.

#### Scenario: Stripe checkout cancellation returns

- **GIVEN** the Worker creates a Stripe Checkout Session
- **WHEN** it builds the cancel URL
- **THEN** the URL targets `/store/checkout/`
- **AND** the URL uses a configured checkout return target base URL, including any configured path prefix such as `/blackbox-records`.

#### Scenario: Checkout return resolves paid state

- **GIVEN** Stripe redirects the shopper to `/store/checkout/return/?session_id=<id>`
- **WHEN** browser code loads checkout state from the Worker
- **THEN** the return page renders the order status without requiring a `storeItemSlug` in the route.

### Requirement: Item-scoped checkout compatibility

The system SHALL keep old item-scoped checkout URLs as compatibility entry points during the cart-scoped checkout rollout.

#### Scenario: Old checkout route is opened

- **GIVEN** a shopper or smoke script opens `/store/{storeItemSlug}/checkout/` with browser `StoreCart` lines
- **WHEN** the route is handled during the compatibility window
- **THEN** the shopper can continue through the cart-scoped checkout flow
- **AND** new primary checkout links do not point at the item-scoped route
- **AND** the route does not treat `storeItemSlug` as checkout authority.

#### Scenario: Old checkout route is opened without cart state

- **GIVEN** a shopper opens `/store/{storeItemSlug}/checkout/` with no browser `StoreCart` lines
- **WHEN** the route is handled during the compatibility window
- **THEN** the page helps the shopper recover item intent through a validated item link or add-to-cart action
- **AND** it does not create a Stripe Checkout Session until browser cart lines exist and the Worker validates them.

#### Scenario: Old checkout return route is opened

- **GIVEN** an older Stripe Session returns to `/store/{storeItemSlug}/checkout/return/?session_id=<id>`
- **WHEN** the route is handled during the compatibility window
- **THEN** the shopper can still reach the checkout return status for that session
- **AND** the `session_id` value is preserved when the route redirects or renders compatibility UI
- **AND** the route does not require browser trust in the `storeItemSlug`.

### Requirement: Store item routes remain item-scoped

The system SHALL keep store item detail pages focused on a single sellable Store Item and add-to-cart behavior.

#### Scenario: Shopper opens a store item

- **GIVEN** a release or distro entry projects into a `StoreItem`
- **WHEN** the shopper opens `/store/{storeItemSlug}/`
- **THEN** the page presents item details, availability, and add-to-cart action
- **AND** checkout navigation from cart state uses `/store/checkout/`.

#### Scenario: Reserved checkout segment is rejected

- **GIVEN** store content would project a `StoreItem` with slug `checkout`
- **WHEN** store routes are generated
- **THEN** generation fails with a slug collision
- **AND** `/store/checkout/` remains reserved for cart checkout.

#### Scenario: Store item projection omits checkout path

- **WHEN** a release or distro entry projects into a `StoreItem`
- **THEN** the projection includes its item route as `storePath`
- **AND** it does not expose `checkoutPath`.

### Requirement: Store format URL model remains one Store Item per format

The system SHALL model separate physical formats as separate Store Item URLs until a later product-variant page change is approved.

#### Scenario: Release has separate vinyl and CD sellable options

- **GIVEN** a release needs separately buyable vinyl and CD options
- **WHEN** the options are exposed in the current storefront model
- **THEN** each sellable option has its own `storeItemSlug`, `variantId`, Store Offer, and `/store/{storeItemSlug}/` page
- **AND** the cart-scoped checkout can include either or both options as separate `CartLine`s.

#### Scenario: Product-style variant page is considered

- **WHEN** a future change proposes one `/store/{productSlug}/` page with a vinyl/CD selector
- **THEN** that change MUST define product identity, variant selection, Store Offer list reads, stock display, and cart snapshot behavior before replacing one-Store-Item-per-format URLs.
