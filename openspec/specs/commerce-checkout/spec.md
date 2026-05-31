## Purpose

Specify native storefront, cart, checkout, Stripe, feature-gate, and secret-boundary behavior.

## Requirements

### Requirement: Native store projection

The system SHALL render native store pages from repo-owned content and stable store projections.

#### Scenario: Shopper opens a store item

- **GIVEN** a release or distro entry projects into a `StoreItem`
- **WHEN** the shopper opens the item route
- **THEN** the page presents editorial content and option availability through app-owned identifiers and browser-safe data.

### Requirement: StoreCart convenience state

The system SHALL treat `StoreCart` as browser convenience state only.

#### Scenario: Cart persists locally

- **GIVEN** the browser stores a cart draft
- **WHEN** the shopper returns to the store
- **THEN** local storage may restore display/routing data
- **AND** the Worker still validates all price, stock, payment, order, and eligibility authority before checkout.

### Requirement: Worker-owned checkout creation

The system MUST create Stripe Checkout Sessions only from the Worker through the backend Stripe gateway.

#### Scenario: Checkout starts

- **GIVEN** the shopper submits checkout intent
- **WHEN** the Worker validates the request
- **THEN** it creates a Stripe-hosted Checkout Session with Worker-owned success and cancel URLs
- **AND** the browser receives only the hosted `checkoutUrl`.

### Requirement: Stripe payment method configuration

The system MUST use a required Stripe Payment Method Configuration for Stripe-backed checkout.

#### Scenario: Configuration is missing

- **GIVEN** `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is blank or missing
- **WHEN** `createStripeCheckoutGateway()` is constructed
- **THEN** gateway creation fails before Checkout Session creation.

### Requirement: Browser-safe capability exposure

The system SHALL expose checkout capability status without leaking provider internals.

#### Scenario: Browser reads store capabilities

- **GIVEN** the browser calls `/api/store/capabilities`
- **WHEN** the Worker evaluates native checkout availability
- **THEN** the response is browser-safe and omits provider names, feature flag keys, Stripe IDs, D1 bindings, secrets, and internal evaluation errors.

### Requirement: Environment-scoped checkout readiness

The system MUST evaluate checkout readiness against the canonical Local, UAT, and PRD product environment model.

#### Scenario: Local mock checkout starts

- **GIVEN** Local runs in `mock` mode
- **WHEN** checkout readiness is evaluated
- **THEN** the system uses local Worker state, local D1, and stripe-mock behavior
- **AND** it does not require Stripe live/test secrets or deployed provider writes.

#### Scenario: Local UAT-connected checkout is inspected

- **GIVEN** Local runs in `uat-connected` mode
- **WHEN** checkout readiness is inspected from the local static frontend
- **THEN** browser calls target the deployed UAT Worker/API
- **AND** local config does not receive UAT Stripe secrets or UAT Worker secrets.

#### Scenario: Local UAT-connected checkout write is requested

- **GIVEN** Local runs in `uat-connected` mode
- **WHEN** a maintainer triggers checkout behavior that creates provider state
- **THEN** the write is performed only by the deployed UAT Worker under UAT rules
- **AND** the command or UI path is explicitly labeled as a UAT checkout/smoke action.

#### Scenario: UAT checkout starts

- **GIVEN** UAT checkout is enabled
- **WHEN** the shopper starts checkout from GitHub Pages
- **THEN** the request is handled by the UAT Worker against sandbox D1 and Stripe test mode.

#### Scenario: PRD checkout is disabled

- **GIVEN** PRD has not been opened by a production-readiness gate
- **WHEN** the browser reads checkout capability or attempts checkout from Cloudflare Pages
- **THEN** checkout remains disabled without exposing provider internals
- **AND** no live Stripe Checkout Session is created.

### Requirement: Hosted Checkout amount matches Store Offer

The system MUST ensure the Stripe-hosted Checkout amount matches the Worker-authoritative Store Offer amount for each checkout line.

#### Scenario: Shopper reaches hosted Checkout

- **GIVEN** the Worker creates a Stripe Checkout Session for a Store Item variant
- **WHEN** hosted Checkout renders the payment page
- **THEN** the displayed amount matches the Worker Store Offer amount and currency for that variant.

#### Scenario: Store Offer and Stripe Price drift

- **GIVEN** the Store Offer amount or currency differs from the mapped Stripe Price
- **WHEN** checkout start is requested
- **THEN** the Worker revalidates the active Stripe Price before creating the Checkout Session
- **AND** rejects checkout with a catalog-drift error if the Stripe Price cannot be resolved unambiguously.

#### Scenario: Sandbox smoke detects hosted amount drift

- **GIVEN** the Worker creates a Stripe Checkout Session for a Store Item variant
- **WHEN** sandbox smoke reaches hosted Checkout before payment submission
- **THEN** the smoke fails if the hosted amount or currency differs from the Worker Store Offer evidence.

### Requirement: Hosted Checkout uses approved payment method configuration

The system MUST use the approved Stripe Payment Method Configuration for Stripe-backed Checkout Sessions and verify the visible hosted payment surface.

#### Scenario: Dynamic payment methods are expected

- **GIVEN** the UAT sandbox account, browser context, amount, currency, and shipping country are documented with expected dynamic payment labels
- **WHEN** hosted Checkout renders before payment submission
- **THEN** the smoke evidence includes the visible payment method labels
- **AND** a card-only surface fails validation when non-card labels are expected for that documented context.

#### Scenario: Payment method configuration cannot be verified

- **GIVEN** `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is missing locally or on the deployed Worker
- **WHEN** payment method verification runs
- **THEN** the verification reports the gap without creating checkout acceptance evidence.

### Requirement: Paid checkout return avoids duplicate visual status surfaces

The system MUST keep the checkout return page from showing a full non-final recovery/status screen before the paid confirmation screen renders.

#### Scenario: Checkout return state is still resolving

- **GIVEN** a shopper has returned from Stripe Checkout
- **WHEN** the browser has not yet loaded the Worker-owned checkout state
- **THEN** the page exposes an accessible pending marker only
- **AND** it does not show retry, cart, item, or continue-shopping recovery actions.

#### Scenario: Paid checkout state is confirmed

- **GIVEN** the Worker returns a paid checkout state
- **WHEN** the checkout return page renders the result
- **THEN** the page shows one final success surface with next steps
- **AND** it does not show the non-final recovery/status card behind or before that success surface.

### Requirement: Checkout consumes field-owned Store Offers

The system MUST create and display Stripe-backed checkout state from field-owned Store Offers rather than Astro price fixtures, browser cart prices, or unverified Stripe Dashboard state.

#### Scenario: Store page loads checkout controls

- **GIVEN** a static Store Item page has repo-owned editorial content and app identifiers
- **WHEN** the page needs checkout price or readiness
- **THEN** browser code reads the Worker Store Offer for that Store Item
- **AND** treats the Worker Store Offer as the only browser-safe buyable price/readiness source.

#### Scenario: Checkout starts with a stale cart snapshot

- **GIVEN** `StoreCart` contains an older browser-safe price snapshot
- **WHEN** checkout starts
- **THEN** the Worker revalidates the current Store Offer, stock, feature gate, and Stripe Price mapping
- **AND** creates the Stripe Checkout Session only from the currently resolved Stripe Price.

#### Scenario: Store Offer projection cannot be confirmed

- **GIVEN** Product projection, Price authority, D1 mapping, stock, or availability cannot be confirmed for the selected variant
- **WHEN** the storefront renders checkout state or checkout start is requested
- **THEN** the system disables checkout or rejects checkout with catalog drift
- **AND** no browser-supplied amount or Stripe Price ID is accepted.

### Requirement: Hosted Checkout display follows Product projection

The system SHALL keep Stripe-hosted Checkout display aligned with repo-owned Product projection for checkout-eligible Store Item variants.

#### Scenario: Hosted Checkout opens for a synced Product

- **GIVEN** a Store Item variant has a clean Product projection and resolved Stripe Price
- **WHEN** the Worker creates a hosted Stripe Checkout Session for that variant
- **THEN** the Stripe-hosted page uses the Product name and image derived from the repo-owned projection
- **AND** the amount and currency come from the resolved Stripe Price.

#### Scenario: Product projection is stale

- **GIVEN** the Stripe Product presentation fields do not match the repo-owned projection
- **WHEN** checkout readiness is verified before sandbox acceptance
- **THEN** verification fails or reports Product projection drift
- **AND** hosted Checkout evidence is not accepted as catalog-aligned until drift is resolved.

### Requirement: Browser checkout state MUST remain non-authoritative

Static Astro pages and browser state MUST NOT expose Stripe Price IDs, Stripe secrets, D1 IDs, stock authority, paid order state, or authoritative item prices. They MAY show current Store Items as available with Worker-confirmed checkout copy when the Worker remains responsible for Store Offer reads and checkout creation.

#### Scenario: Static availability remains browser-safe

- **GIVEN** a current Store Item is rendered on the static UAT storefront
- **WHEN** the page displays purchase availability
- **THEN** it may show the item as available and "Worker-confirmed at checkout"
- **AND** it does not include a Stripe Price ID, D1 ID, stock count, secret, or authoritative amount.

### Requirement: Environment-scoped provider mutation

The system MUST prevent provider catalog mutation unless the target product environment and gate allow it.

#### Scenario: UAT catalog apply runs

- **GIVEN** a generated Desired Catalog State targets UAT
- **WHEN** the promotion workflow applies provider catalog changes
- **THEN** it uses the sandbox Worker/D1/Stripe test mapping
- **AND** Product Projection image URLs resolve from the GitHub Pages UAT asset base
- **AND** records UAT Promotion Evidence.

#### Scenario: PRD catalog apply is requested while PRD is disabled

- **GIVEN** a generated Desired Catalog State targets PRD
- **WHEN** the promotion workflow reaches the PRD apply step before the PRD-open gate exists
- **THEN** the apply step fails closed or records `not_configured` evidence
- **AND** it does not mutate Stripe live mode, production D1, or production Worker checkout availability
- **AND** it does not record successful PRD Promotion Evidence.

#### Scenario: PRD catalog readiness checks product image URLs

- **GIVEN** a generated Desired Catalog State targets PRD
- **WHEN** catalog readiness or dry-run verification evaluates Product Projection image URLs
- **THEN** the URLs resolve from the Cloudflare Pages PRD asset base or an approved PRD custom domain asset base
- **AND** GitHub Pages UAT asset URLs are rejected for PRD readiness/live provider mutation unless a later approved change defines GitHub Pages as a shared canonical asset CDN.

### Requirement: Environment-scoped checkout origins

The system MUST keep checkout return origins, browser CORS origins, and Worker API targets aligned with the Local, UAT, and PRD product environment matrix.

#### Scenario: UAT checkout origin is evaluated

- **GIVEN** checkout runs through the UAT Worker
- **WHEN** return origins or browser origins are evaluated
- **THEN** GitHub Pages UAT is allowed
- **AND** local `uat-connected` origins are allowed only as an explicitly named diagnostic path
- **AND** Cloudflare Pages PRD and Cloudflare Pages preview origins are not accepted as UAT checkout evidence origins.

#### Scenario: PRD checkout origin is evaluated

- **GIVEN** checkout runs through the PRD Worker
- **WHEN** return origins or browser origins are evaluated
- **THEN** Cloudflare Pages PRD and approved PRD custom domains are the only PRD shopper-facing origins
- **AND** GitHub Pages UAT, local origins, and Cloudflare Pages preview origins are not accepted as PRD checkout evidence origins.

#### Scenario: Local mock checkout origin is evaluated

- **GIVEN** checkout runs through the Local `mock` Worker
- **WHEN** return origins or browser origins are evaluated
- **THEN** only local static origins are accepted
- **AND** deployed UAT, PRD, and preview origins are not needed for Local mock checkout.

### Requirement: Store purchase readiness is visibly pending

The storefront SHALL show explicit loading feedback while Store Item purchase actions wait for Worker-confirmed Store Offer readiness.

#### Scenario: Store item purchase action is checking availability

- **GIVEN** a Store Item page has browser-safe static item data and must read the Worker Store Offer before enabling the purchase action
- **WHEN** the Store Offer read is in progress
- **THEN** the purchase action renders as a disabled busy action with visible spinner or equivalent loading affordance
- **AND** the label describes availability confirmation rather than checkout implementation internals
- **AND** the pending, ready, unavailable, and error states preserve stable button geometry.

#### Scenario: Store item purchase action becomes ready

- **GIVEN** the Worker Store Offer confirms the item can be added to StoreCart
- **WHEN** the purchase action changes to `Add To Cart`
- **THEN** the transition is visually calm and does not expose Stripe Price IDs, D1 IDs, stock authority, provider secrets, or authoritative payment state.

### Requirement: Checkout start handoff is visibly pending

The checkout page SHALL make hosted checkout creation and redirect handoff visibly pending in the CTA area after the shopper activates the checkout CTA.

#### Scenario: Shopper starts hosted checkout

- **GIVEN** checkout is ready and the shopper activates the Stripe checkout CTA
- **WHEN** the Worker checkout start request is in flight
- **THEN** the CTA is disabled, shows an inline pending affordance, and labels the operation as opening Stripe Checkout
- **AND** any under-button status copy reinforces the same pending handoff instead of becoming the only visible loading signal
- **AND** duplicate submission is blocked until redirect or error
- **AND** any failure leaves a visible actionable error without clearing the shopper's cart context.

#### Scenario: Checkout readiness detail is displayed

- **GIVEN** checkout readiness has been confirmed
- **WHEN** the checkout page displays detail text such as `You will finish payment on Stripe.`
- **THEN** adjacent CTA and under-button status states remain consistent with that readiness message
- **AND** later pending copy clearly distinguishes opening Stripe Checkout from already-confirmed readiness.

### Requirement: Checkout return pending state is visible

The checkout return page SHALL show a visible pending state while it confirms checkout session state with the Worker.

#### Scenario: Checkout return status is loading

- **GIVEN** the shopper returns from hosted Checkout with a session identifier
- **WHEN** the browser is waiting for the Worker checkout-state read
- **THEN** the page renders a visible payment-status confirmation state
- **AND** the pending region exposes `aria-busy` or `role="status"` with polite live announcement
- **AND** the page does not look empty while payment state is unknown.

### Requirement: Checkout loading feedback remains browser-safe

The storefront and checkout UI MUST keep loading feedback browser-safe and non-authoritative.

#### Scenario: Checkout loading copy is displayed

- **WHEN** checkout-related loading feedback is rendered to the browser
- **THEN** it describes availability, payment handoff, or payment status at user level
- **AND** it omits provider IDs, feature flag keys, D1 bindings, Worker secret names, raw provider errors, and internal evaluation details.
