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

### Requirement: Cart-scoped checkout document routing

The system SHALL expose shopper checkout documents at cart-scoped store routes and keep item-scoped checkout routes compatibility-only.

#### Scenario: Shopper opens cart checkout

- **GIVEN** `StoreCart` contains one or more `CartLine`s
- **WHEN** the shopper chooses Checkout from the cart drawer
- **THEN** the browser navigates to `/store/checkout/`
- **AND** the route does not include a `storeItemSlug`.

#### Scenario: Cart checkout direct load has no cart

- **GIVEN** the shopper opens `/store/checkout/` with no browser `StoreCart` lines
- **WHEN** the checkout page renders
- **THEN** it presents empty-cart checkout state
- **AND** it does not create a Stripe Checkout Session.

#### Scenario: Checkout return uses cart route

- **GIVEN** Stripe redirects the shopper after hosted Checkout
- **WHEN** the Worker builds return and cancel URLs
- **THEN** success targets `/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}`
- **AND** cancellation targets `/store/checkout/`.

#### Scenario: Old item-scoped checkout route is opened

- **GIVEN** a shopper opens `/store/{storeItemSlug}/checkout/`
- **WHEN** the route is handled during the compatibility window
- **THEN** the page is noindex
- **AND** it may help recover item intent through a validated item add-to-cart action
- **AND** hosted checkout still starts only from browser `StoreCart` lines validated by the Worker.

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

#### Scenario: Checkout policy resolves Product Environment

- **WHEN** the Worker evaluates checkout capability, checkout start, or provider mutation policy
- **THEN** it resolves the Product Environment as `LOCAL`, `UAT`, or `PRD`
- **AND** it derives Stripe mode, feature-gate defaults, and provider mutation policy from that Product Environment profile.

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
- **THEN** the request is handled by the UAT Worker against UAT D1 and Stripe test mode.

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

### Requirement: Provider smoke remains authoritative

The system SHALL keep Stripe sandbox and promotion smoke as the authoritative proof for hosted Checkout and checkout readiness that depends on provider state.

#### Scenario: Static smoke does not replace provider smoke

- **WHEN** a smoke run reads only static routes or CMS boot output
- **THEN** it does not replace Stripe sandbox smoke for amount, currency, payment-method surface, webhook delivery, order reconciliation, or D1 stock and payment authority
- **AND** PRD no-payment promotion smoke remains the no-live-payment readiness evidence unless an explicit paid-smoke policy is enabled.

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
- **THEN** it uses the UAT Worker/D1/Stripe test mapping
- **AND** Product Projection image URLs resolve from the GitHub Pages UAT asset base
- **AND** records UAT Promotion Evidence.

#### Scenario: PRD catalog apply is requested while PRD is disabled

- **GIVEN** a generated Desired Catalog State targets PRD
- **WHEN** the promotion workflow reaches the PRD apply step before the PRD-open gate exists
- **THEN** the apply step fails closed or records `not_configured` evidence
- **AND** it does not mutate Stripe live mode, PRD D1, or PRD Worker checkout availability
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

### Requirement: Store Images Remain Derived Display Data

The system SHALL keep shopper-facing store, cart, and checkout images derived from repo-owned product images.

#### Scenario: Cart or checkout stores image data

- **GIVEN** a StoreCart line, checkout summary, checkout return, or order summary includes an image
- **WHEN** the image value is stored or rendered in browser/runtime state
- **THEN** it is a Runtime Image Snapshot for display only
- **AND** it is not stock, price, payment, order, provider, or product-media authority.

### Requirement: Checkout API responses are not cache-authoritative

The system MUST keep checkout and Store Offer authority in the Worker, D1, and Stripe seams rather than in browser, CDN, or service-worker caches.

#### Scenario: Checkout session is created

- **GIVEN** the browser submits checkout intent
- **WHEN** the Worker returns a checkout session response
- **THEN** the response includes `Cache-Control: no-store`
- **AND** no shared cache can replay a prior checkout URL for a later request.

#### Scenario: Checkout state is read

- **GIVEN** the browser reads a checkout session state
- **WHEN** the Worker returns payment/order status
- **THEN** the response includes `Cache-Control: no-store`
- **AND** the browser must not rely on cached payment, order, or cart-clearing decisions.

#### Scenario: Store capabilities are read

- **GIVEN** the browser reads checkout capability status
- **WHEN** the Worker returns capability state
- **THEN** the response includes an explicit cache policy
- **AND** the policy does not permit stale provider capability, feature-gate, or PRD disabled-state data to become checkout authority.

### Requirement: Store Offer freshness is explicit

The system SHALL keep Store Offer read freshness explicit before any nonzero cache TTL is introduced.

#### Scenario: Store Offer response includes checkout-facing data

- **WHEN** a Store Offer response includes availability, stock, Stripe Price mapping, checkout eligibility, or feature-gate-derived state
- **THEN** the response defaults to `Cache-Control: no-store`
- **AND** the Worker revalidates the request again before creating a hosted Checkout Session.

#### Scenario: Presentation-only catalog caching is proposed

- **GIVEN** a future implementation wants to cache store presentation data
- **WHEN** that data is separable from availability, stock, payment, provider mapping, and checkout eligibility
- **THEN** the implementation may propose a split presentation endpoint or static projection cache
- **AND** checkout start still validates against Worker/D1/Stripe authority.

### Requirement: Browser API fetches express fresh-read intent

The system SHALL make browser fetch behavior consistent with Worker cache headers for checkout-related API reads.

#### Scenario: Checkout frontend reads Worker API

- **WHEN** browser checkout code calls public Worker checkout or Store Offer APIs
- **THEN** the request path uses explicit fresh-read intent where the fetch abstraction supports it
- **AND** the UI loading state does not imply that cached browser state is authoritative.

### Requirement: Storefront price display follows Worker Store Offers

The system SHALL display buyable storefront prices from Worker Store Offers that reflect current Stripe Price Authority.

#### Scenario: Store item card renders price

- **GIVEN** a Store Item appears on the storefront
- **WHEN** the browser needs the visible price
- **THEN** it reads the Worker Store Offer for that Store Item
- **AND** it does not use Astro content, Decap content, static JSON, or browser cart state as the authoritative displayed price.

#### Scenario: Stripe price changed after static deploy

- **GIVEN** a Stripe Dashboard operator changes a Store Item variant's Price after the current static site artifact was deployed
- **WHEN** the shopper opens or refreshes the Store Item page
- **THEN** the browser-visible price comes from the Worker Store Offer path
- **AND** the new price is visible without an Astro rebuild when webhook or read-time reconciliation has resolved it.

#### Scenario: Store Offer cannot confirm price

- **GIVEN** the Worker cannot resolve one unambiguous active Stripe Price for the Store Item variant
- **WHEN** the storefront asks for price/readiness
- **THEN** the response is non-buyable and browser-safe
- **AND** the UI does not present a stale static amount as checkout-ready.

### Requirement: Store Offer API responses stay fresh for commerce authority

The system MUST keep public Store Offer API responses from being cached as long-lived static assets.

#### Scenario: Browser reads Store Offer

- **WHEN** `/api/store/items/:storeItemSlug` returns price or checkout readiness
- **THEN** the response uses no-store or equivalent Worker API Freshness headers
- **AND** the response does not expose Stripe Price IDs, D1 IDs, secrets, raw provider payloads, or internal drift details.

#### Scenario: Same browser session saw an old price

- **GIVEN** a shopper opened a page before a Stripe Dashboard price change
- **WHEN** they open checkout or revisit the Store Item view in the same session
- **THEN** the browser rereads the Worker Store Offer or checkout start revalidates current Price Authority
- **AND** stale same-session display state cannot create a Checkout Session at the old price.

### Requirement: Checkout start revalidates replacement Prices

The system MUST revalidate active Stripe Price Authority at checkout start after any Stripe-side price change.

#### Scenario: Shopper checks out after replacement Price

- **GIVEN** a Stripe Dashboard operator replaced the active Price for a Store Item variant
- **AND** D1 mapping or Store Offer snapshot has been updated by webhook, read-time reconciliation, or manual verification
- **WHEN** the shopper starts checkout
- **THEN** the Worker creates the Stripe Checkout Session using the resolved current active Stripe Price
- **AND** hosted Checkout displays the same amount and currency as the Worker Store Offer evidence.

#### Scenario: Cart contains stale price snapshot

- **GIVEN** `StoreCart` contains an older browser-safe price snapshot
- **WHEN** checkout start is requested
- **THEN** the Worker ignores the stale browser price snapshot for payment authority
- **AND** validates current Store Offer, stock, feature gate, Stripe Price mapping, and Product Environment policy before creating checkout.

#### Scenario: Replacement Price is ambiguous

- **GIVEN** more than one active Stripe Price matches the requested variant
- **WHEN** checkout start is requested
- **THEN** the Worker rejects checkout with catalog drift
- **AND** no hosted Checkout Session is created.

### Requirement: Price propagation has visible shopper-safe states

The system SHALL provide clear browser-safe UI states while dynamic price propagation is pending or failed.

#### Scenario: Price is being checked

- **WHEN** the frontend is waiting for a Store Offer read
- **THEN** the UI shows pending price copy such as `Checking price`
- **AND** it does not show an authoritative amount until the Worker confirms one.

#### Scenario: Price check fails

- **GIVEN** the Worker Store Offer read fails or returns non-buyable catalog drift
- **WHEN** the storefront renders price state
- **THEN** the UI shows checkout-unavailable copy
- **AND** checkout controls remain disabled or fail closed.

### Requirement: Store listing offer work follows visible demand

The system SHALL defer Store listing price hydration and Store Offer reads until the corresponding Store Item approaches the viewport.

#### Scenario: Store listing first renders

- **WHEN** Store contains cards below the configured visibility margin
- **THEN** those cards preserve a stable pending price frame in server-rendered HTML
- **AND** their price islands do not hydrate
- **AND** their Store Offer reads do not begin.

#### Scenario: Store Item card approaches the viewport

- **WHEN** a card enters the tested visibility margin
- **THEN** its price island hydrates and resolves the browser-safe capability state
- **AND** an enabled Product Environment reads the fresh Worker Store Offer for that Store Item
- **AND** the label resolves to Worker-confirmed price or the existing fail-closed unavailable state.

#### Scenario: Store Item detail or checkout route loads

- **WHEN** a route has one first-viewport Store Offer price surface
- **THEN** that single surface may hydrate eagerly
- **AND** it continues to treat the Worker Store Offer as price and readiness authority.

### Requirement: Disabled Store capability prevents per-card offer fan-out

The system MUST resolve browser-safe native checkout capability once per Store listing session before starting per-item Store Offer work.

#### Scenario: Native checkout is disabled

- **GIVEN** the Worker capability response reports that native checkout is disabled for the Product Environment
- **WHEN** Store listing price surfaces resolve
- **THEN** the browser reuses one deduplicated capability result
- **AND** no Store Offer read starts for listing cards
- **AND** each price surface shows the existing browser-safe checkout-unavailable state without a static fallback amount.

#### Scenario: Native checkout is enabled

- **GIVEN** the Worker capability response reports that native checkout is enabled
- **WHEN** visible Store Item cards resolve prices
- **THEN** the deduplicated capability result permits fresh Store Offer reads only for those visible cards
- **AND** checkout start still revalidates Store Offer, stock, feature gate, Stripe Price mapping, and Product Environment policy.

#### Scenario: Store listing session ends or capability read fails

- **WHEN** the last Store listing price island unmounts on route exit or the shared capability read rejects
- **THEN** the listing-lifetime capability promise and result are cleared
- **AND** the next Store listing visit or explicit refresh performs a new capability read
- **AND** checkout start never reuses the listing presentation result as authority.

### Requirement: Store listing failures are bounded

The system SHALL prevent one Store Offer failure from becoming a full-list request or retry storm.

#### Scenario: Expected disabled or unready state is handled

- **WHEN** the Worker encounters an expected browser-safe disabled, unavailable, or catalog-readiness state
- **THEN** it returns the established fail-closed capability or Store Offer contract rather than an unhandled 5xx response
- **AND** internal provider, D1, flag, and configuration details remain undisclosed.

#### Scenario: Visible Store Offer read fails

- **WHEN** one visible card receives a network failure or handled non-buyable response
- **THEN** that card shows checkout-unavailable copy
- **AND** the browser does not automatically retry the read during the same mount and visibility cycle
- **AND** below-margin cards remain unfetched.

### Requirement: Store Offer batching is evidence-gated

The system SHALL retain per-visible-item Store Offer reads unless post-deferral evidence proves that they miss the Store performance gate.

#### Scenario: Visibility deferral meets the Store gate

- **WHEN** the enabled Store listing satisfies its request, error, hydration, and scroll budgets after visibility deferral
- **THEN** no batch Store Offer endpoint or collection controller is added.

#### Scenario: Visibility deferral misses the Store gate

- **WHEN** repeatable profiling attributes the remaining miss to per-item Store Offer scheduling or island overhead
- **THEN** the design and commerce requirements are updated before batching is implemented
- **AND** any batch contract remains `no-store`, fail-closed, bounded in item count, browser-safe per item, and subject to checkout-start revalidation.

