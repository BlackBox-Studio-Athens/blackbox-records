# Ubiquitous Language

This glossary is the project-level source for commerce, checkout, stock, shipping, and hosting language. GSD plans, test
names, public interfaces, UI copy, ADRs, and debug artifacts should use these canonical terms unless a plan explicitly
records a terminology change here first.

## Storefront And Catalog

| Canonical term           | Meaning                                                                                                                             | Aliases to avoid              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Artist**               | Editorial content entry for a label artist or band in the Astro content collection.                                                 | band record                   |
| **Release**              | Editorial music release entry, usually tied to an Artist and optionally projected into the Storefront.                              | album record                  |
| **Distro Entry**         | Editorial distro catalog entry for non-release shop inventory that can become a StoreItem.                                          | merch entry, distro item      |
| **Storefront**           | Shopper-facing static `/store/` experience owned by Astro.                                                                          | shop, storefront app          |
| **StoreItem**            | Shopper-facing sellable item identity assembled from release or distro content.                                                     | product, shop item            |
| **StoreItemOption**      | The sellable option under a StoreItem, such as a vinyl color or format, that maps to a Variant.                                     | SKU option, product option    |
| **Variant**              | Backend sellable unit connected to stock, Stripe price mapping, checkout, and order state.                                          | SKU, price item               |
| **Stripe Price Mapping** | Backend-only mapping from Variant to Stripe Price ID used by the Worker when creating Checkout Sessions.                            | frontend price id, product id |
| **ItemAvailability**     | Backend-owned availability state for a StoreItemOption, including checkout eligibility and stock-facing status.                     | availability blob             |
| **StoreOffer**           | Worker-read aggregate that combines StoreItem, StoreItemOption, ItemAvailability, Stock, and Stripe mapping for checkout readiness. | offer, checkout offer         |

## Checkout And Payment

| Canonical term            | Meaning                                                                                                                     | Aliases to avoid                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Checkout Request**      | Public shopper API input containing app-owned item identity plus the approved Shipping Locker Snapshot.                     | payment payload                 |
| **StartCheckout**         | Worker application action and public API path that validates checkout input and creates the Stripe Checkout Session.        | create checkout, start payment  |
| **ReadCheckoutState**     | Worker application action and public API path that reports backend-known checkout status to the browser.                    | payment status check            |
| **Checkout Session**      | Stripe Checkout Session created by the Worker and mounted through embedded Checkout.                                        | payment session                 |
| **Embedded Checkout**     | Stripe.js embedded Checkout UI mounted by the static checkout shell from a Worker-returned client secret.                   | hosted payment form             |
| **Local stripe-mock API** | Local official `stripe-mock` process/proxy used to validate Stripe SDK request shape without a real Stripe account.         | fake Stripe, test Stripe        |
| **Mock Checkout Panel**   | Local frontend mock handoff panel used when `PUBLIC_CHECKOUT_CLIENT_MODE=mock`. It is not Stripe Embedded Checkout.         | fake payment page               |
| **Stripe Access Gate**    | Deferred real Stripe validation requiring test keys, real Price IDs, webhook secret, products/prices, and sandbox evidence. | Stripe blocker, payment blocker |
| **CheckoutOrder**         | D1 order row tracking checkout session identity, item/variant identity, payment state, and lifecycle timestamps.            | order row, payment row          |
| **Stripe Webhook**        | Verified Stripe event route that is the authoritative paid/non-paid signal for CheckoutOrder and stock mutation.            | callback, payment notification  |
| **pending_payment**       | Canonical CheckoutOrder state after checkout starts and before a terminal Stripe outcome.                                   | open, waiting                   |
| **paid**                  | Canonical CheckoutOrder state after a verified paid Stripe signal.                                                          | complete, successful            |
| **not_paid**              | Canonical non-paid CheckoutOrder state for cancelled, expired, or unpaid sessions.                                          | failed, unpaid                  |
| **needs_review**          | Canonical CheckoutOrder state for ambiguous or unsupported payment events requiring operator attention.                     | error state, manual review      |

## Stock Operations

| Canonical term                  | Meaning                                                                                               | Aliases to avoid           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------- |
| **Stock**                       | D1 source-of-truth quantity record for a Variant, including online checkout-facing quantity.          | inventory                  |
| **OnlineStock**                 | Conservative checkout-facing quantity exposed from Stock and allowed to be lower than physical stock. | available stock, web stock |
| **StockChange**                 | D1 ledger entry for a known stock movement delta recorded by an operator or checkout webhook.         | adjustment                 |
| **StockCount**                  | D1 recount entry used when an operator records a physical count instead of a known delta.             | inventory count            |
| **Operator**                    | Staff user authenticated by Cloudflare Access on the protected operator hostname.                     | admin, staff               |
| **Protected Operator Hostname** | Access-protected operational surface referred to as `ops.<managed-zone>` until provisioned.           | admin site, back office    |

## Shipping And Fulfillment

| Canonical term               | Meaning                                                                                                                                       | Aliases to avoid                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **BOX NOW Locker**           | Shopper-selected Greek BOX NOW locker used for v1 delivery.                                                                                   | pickup point, parcel locker      |
| **Shipping Locker Snapshot** | Minimal persisted locker data: `locker_id`, `country_code`, and `locker_name_or_label`.                                                       | locker payload, BOX NOW response |
| **BOX NOW Test Locker**      | Local/test locker snapshot from the BOX NOW FAQ: `locker_id = 4`, `country_code = GR`, `locker_name_or_label = ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234`. | fake locker, default locker      |
| **Greece-Only Shipping**     | Phase 9 shipping boundary: `country_code = GR` and no non-Greece delivery path in this milestone.                                             | domestic shipping, EU shipping   |
| **Manual Fulfillment**       | v1 operator handoff through the BOX NOW partner portal after payment.                                                                         | fulfillment automation           |
| **BOX NOW Credentials**      | Partner/API credentials that belong only in Worker runtime secrets or out-of-band operator tooling.                                           | public locker config             |

## Relationships

- A Release or Distro Entry can project into a StoreItem.
- A StoreItem exposes one or more StoreItemOptions.
- A StoreItemOption maps to a backend Variant.
- A Variant owns Stock and exposes OnlineStock to checkout.
- A Variant can have one Stripe Price Mapping, but Stripe Price IDs never belong in frontend payloads.
- StartCheckout reads a StoreOffer and creates a Checkout Session only when ItemAvailability, OnlineStock, Stripe
  mapping, and Shipping Locker Snapshot are valid.
- Local stripe-mock API validates Stripe SDK request shape. The Mock Checkout Panel validates local browser handoff.
  Neither satisfies the Stripe Access Gate.
- Stripe Webhook events update CheckoutOrder and are the only paid-signal path that may decrement Stock.
- Phase 9 Greece-Only Shipping requires a BOX NOW Locker before payment and persists only the Shipping Locker Snapshot.
- Manual Fulfillment uses paid CheckoutOrder data and the Shipping Locker Snapshot without storing raw BOX NOW payloads
  or credentials.
- Cloudflare Pages serves the Static Astro Frontend. The Worker Backend owns dynamic commerce, D1, Stripe, webhooks, and
  protected operator APIs.
- GSD Source Of Truth chooses the Current Plan. Validation Evidence either completes that plan or records a Deferred
  Gate without pretending the gate passed.

## Example Dialogue

- "StartCheckout must reject the request until a valid Shipping Locker Snapshot is present."
- "The checkout return screen should call ReadCheckoutState and show the selected BOX NOW Locker from CheckoutOrder."
- "A Stripe Webhook paid transition decrements OnlineStock once through StockChange."
- "The Static Astro Frontend must not receive BOX NOW Credentials or Stripe secret keys."
- "07-16 is a Deferred Gate until the Stripe Access Gate can be satisfied."
- "Run Browser Use Validation for rendered checkout UI; DevTools MCP is fallback-only."

## Flagged ambiguities

- **StoreItem vs Variant:** StoreItem is the shopper-facing item; Variant is the backend sellable unit that stock and
  Stripe mapping attach to.
- **Variant vs Stripe Price:** Variant is app-owned. Stripe Price is an external payment mapping owned by the Worker.
- **Stock vs OnlineStock:** Stock is the D1 source-of-truth record; OnlineStock is the conservative checkout-facing
  quantity.
- **Checkout Session vs CheckoutOrder:** Checkout Session is Stripe-owned; CheckoutOrder is the Worker/D1 record.
- **BOX NOW Locker vs Shipping Locker Snapshot:** BOX NOW Locker is the selected pickup point; Shipping Locker Snapshot
  is the minimal persisted data.
- **Mock vs Stripe test mode:** Local stripe-mock and Mock Checkout Panel are no-secret development tools. Stripe test
  mode requires a real Stripe account, keys, Price IDs, and webhook secret.
- **Sandbox:** Say `Cloudflare sandbox Worker`, `Stripe test mode`, or `Pages preview` instead of bare "sandbox."
- **Manual Fulfillment vs fulfillment automation:** Phase 9 allows manual partner-portal work only. Automated shipment
  creation is out of scope.
- **Cloudflare Pages vs Worker Backend:** Pages serves static frontend assets. The Worker owns all dynamic commerce
  behavior and secrets.
