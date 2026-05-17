# Ubiquitous Language

This glossary is the project-level source for commerce, checkout, stock, shipping, hosting, validation, and planning
language. GSD plans, test names, public interfaces, UI copy, ADRs, and debug artifacts should use these canonical terms
unless a plan explicitly records a terminology change here first.

## Storefront and Catalog

| Canonical term             | Meaning                                                                                                                               | Aliases to avoid              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Artist**                 | Editorial content entry for a label artist or band in the Astro content collection.                                                   | band record                   |
| **Release**                | Editorial music release entry, usually tied to an Artist and optionally projected into the Storefront.                                | album record                  |
| **Distro Entry**           | Editorial distro catalog entry for non-release shop inventory that can become a StoreItem.                                            | merch entry, distro item      |
| **Storefront**             | Shopper-facing static `/store/` experience owned by Astro.                                                                            | shop, storefront app          |
| **StoreItem**              | Shopper-facing sellable item identity assembled from release or distro content.                                                       | product, shop item            |
| **StoreItemOption**        | The sellable option under a StoreItem, such as a vinyl color or format, that maps to a Variant.                                       | SKU option, product option    |
| **Variant**                | Backend sellable unit connected to stock, Stripe price mapping, checkout, and order state.                                            | SKU, price item               |
| **Stripe Price Mapping**   | Backend-only mapping from Variant to Stripe Price ID used by the Worker when creating Checkout Sessions.                              | frontend price id, product id |
| **ItemAvailability**       | Backend-owned availability state for a StoreItemOption, including checkout eligibility and stock-facing status.                       | availability blob             |
| **StoreOffer** (updated)   | Worker-read aggregate that combines StoreItem, StoreItemOption, ItemAvailability, OnlineStock, and Stripe Price Mapping for checkout. | offer, checkout offer         |
| **Artist Profile Link**    | Optional editorial link rendered on an Artist detail page, such as official site, social, or listening profile.                       | artist CTA, random link       |
| **Artist Video**           | Optional editorial video embed or link rendered on an Artist detail page without owning music-player session state.                   | artist media blob             |
| **Distro Format Group**    | Display grouping for Distro Entries by physical format, such as 12-inch vinyl, 7-inch vinyl, CDs, Clothes, or Tapes.                  | product category, SKU group   |
| **Release Feature Banner** | Editorial feature area on the Releases page that promotes the latest Release before the catalog grid.                                 | hero product, promo card      |
| **Homepage News Module**   | Homepage section backed by News entries that replaces the former Latest Releases homepage module.                                     | updates block                 |

## Checkout and Payment

| Canonical term                 | Meaning                                                                                                                          | Aliases to avoid                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **StoreCart** (updated)        | Client-held cart concept for Storefront clients, currently stored in browser storage and never authoritative for commerce state. | browser cart state, cart authority          |
| **CartDraft** (updated)        | StoreCart payload containing one or more intended checkout lines before the Worker validates them through StartCheckout.         | cart order, pending order                   |
| **CartLine**                   | One intended cart entry for a StoreItemOption and Variant plus a requested CartQuantity.                                         | line item, basket row                       |
| **CartLineItemSnapshot** (new) | Client-held identity and display snapshot copied into a CartLine for rendering and checkout routing.                             | StoreCart item, product snapshot, item blob |
| **Primary Line Item** (new)    | Compatibility projection of the first CartLineItemSnapshot when single-line checkout UI still needs one representative item.     | item, primary item, first item              |
| **CartQuantity**               | Shopper-requested quantity for one CartLine that the Worker must validate against OnlineStock before checkout.                   | item count, stock quantity                  |
| **Checkout Request** (updated) | Public shopper API input containing app-owned item identity, requested CartQuantity, and the approved shipping-mode data.        | payment payload                             |
| **StartCheckout**              | Worker application action and public API path that validates checkout input and creates the Stripe Checkout Session.             | create checkout, start payment              |
| **ReadCheckoutState**          | Worker application action and public API path that reports backend-known checkout status to the client.                          | payment status check                        |
| **Checkout Session**           | Stripe Checkout Session created by the Worker and exposed to the shopper as a hosted Checkout redirect URL.                      | payment session                             |
| **Hosted Checkout**            | Stripe-hosted payment page reached from the static checkout shell through the Worker-returned `checkoutUrl`.                     | embedded checkout, hosted payment form      |
| **Local stripe-mock API**      | Local official `stripe-mock` process/proxy used to validate Stripe SDK request shape without a real Stripe account.              | fake Stripe, test Stripe                    |
| **Mock Checkout URL**          | Local-only Checkout URL returned when `PUBLIC_CHECKOUT_CLIENT_MODE=mock`; it is not real Hosted Checkout.                        | fake payment page                           |
| **Stripe Access Gate**         | Real Stripe test-mode validation gate now satisfied for sandbox UAT; live-mode production launch remains separate.               | Stripe blocker, payment blocker             |
| **Native Checkout Gate**       | Worker-owned runtime feature gate for enabling or disabling native checkout before Checkout Session creation.                    | frontend checkout flag                      |
| **Feature Gate**               | Worker-evaluated runtime capability switch that does not replace environment isolation or own secrets.                           | feature toggle, browser flag                |
| **CheckoutOrder**              | D1 order row tracking checkout session identity, item/variant identity, payment state, and lifecycle timestamps.                 | order row, payment row                      |
| **Stripe Webhook**             | Verified Stripe event route that is the authoritative paid/non-paid signal for CheckoutOrder and stock mutation.                 | callback, payment notification              |
| **pending_payment**            | Persisted CheckoutOrder state after checkout starts and before a terminal Stripe outcome.                                        | open, waiting                               |
| **paid**                       | Persisted CheckoutOrder state after a verified paid Stripe signal.                                                               | complete, successful                        |
| **not_paid**                   | Persisted non-paid CheckoutOrder state for cancelled, expired, or unpaid sessions.                                               | failed, unpaid                              |
| **needs_review**               | Persisted CheckoutOrder state for ambiguous or unsupported payment events requiring operator attention.                          | error state, manual review                  |

## Stock Operations

| Canonical term                  | Meaning                                                                                               | Aliases to avoid           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------- |
| **Stock**                       | D1 source-of-truth quantity record for a Variant, including online checkout-facing quantity.          | inventory                  |
| **OnlineStock**                 | Conservative checkout-facing quantity exposed from Stock and allowed to be lower than physical stock. | available stock, web stock |
| **StockChange**                 | D1 ledger entry for a known stock movement delta recorded by an operator or checkout webhook.         | adjustment                 |
| **StockCount**                  | D1 recount entry used when an operator records a physical count instead of a known delta.             | inventory count            |
| **Operator**                    | Staff user authenticated by Cloudflare Access on the protected operator hostname.                     | admin, staff               |
| **Protected Operator Hostname** | Access-protected operational surface referred to as `ops.<managed-zone>` until provisioned.           | admin site, back office    |

## Shipping and Fulfillment

| Canonical term               | Meaning                                                                                                                                  | Aliases to avoid                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Shipping Mode**            | Explicit Phase 9 choice between manual-address fulfillment and automated BOX NOW fulfillment via `boxnow-js`.                            | implicit default, maybe later           |
| **Order Shipping Address**   | Greek delivery address plus any required recipient/contact data used for non-automated BOX NOW shipment creation.                        | full BOX NOW payload, locker payload    |
| **BOX NOW Locker**           | Shopper-selected Greek BOX NOW locker used only if the automation/locker flow is chosen.                                                 | default shipping input, parcel locker   |
| **Shipping Locker Snapshot** | Minimal persisted BOX NOW-specific locker data for an approved automation path: `locker_id`, `country_code`, and `locker_name_or_label`. | universal shipping state                |
| **BOX NOW Test Locker**      | Local/test locker snapshot used only for the current locker-first prototype branch.                                                      | default locker, final shipping mode     |
| **Greece-Only Shipping**     | Phase 9 shipping boundary: Greece only and no non-Greece delivery path in this milestone.                                                | domestic shipping, EU shipping          |
| **Manual Fulfillment**       | Operator handoff through the BOX NOW partner portal using Worker-owned paid order state and the chosen shipping-mode data.               | fulfillment automation                  |
| **BOX NOW Credentials**      | Partner/API credentials that belong only in Worker runtime secrets or out-of-band operator tooling.                                      | public locker config                    |
| **BOX NOW Reopen Gate**      | Future-only gate for full BOX NOW portal/API integration after access exists and the user explicitly reopens the work.                   | active shipping blocker, portal blocker |
| **Stripe Product Tax Code**  | Stripe Tax product classification used for tax calculation; physical shipped goods use `General - Tangible Goods (txcd_99999999)`.       | product category guess, tax preset      |

## Hosting, Validation, and Planning

| Canonical term                      | Meaning                                                                                                                                                                              | Aliases to avoid                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Application Module** (new)        | Explicitly declared functional module in this monorepo, with one responsibility, a provided interface, hidden internals, and named dependencies.                                     | area, bucket, random folder              |
| **Provided Interface** (new)        | The only surface another Application Module may import or call directly.                                                                                                             | public random file, any exported symbol  |
| **Internal Implementation** (new)   | Files and types inside an Application Module that must not be imported across module boundaries.                                                                                     | accessible internals, deep import target |
| **Required Dependency** (new)       | Another Application Module or Named Interface that a module is explicitly allowed to depend on.                                                                                      | incidental import, convenient shortcut   |
| **Named Interface** (new)           | An explicitly documented secondary module surface beyond the root provided interface; use `api.ts` for secondary consumer APIs and `spi.ts` only for provider-implemented contracts. | deep import, helper path                 |
| **SPI Entrypoint** (new)            | A `spi.ts` Named Interface that defines a contract implemented by another module, such as repository or gateway contracts.                                                           | default ports folder, adapter interface  |
| **Infrastructure Adapter** (new)    | Module-owned infrastructure implementation of an SPI or external SDK boundary, exposed through its module interface or kept internal.                                                | per-module adapters pattern              |
| **Module Canvas** (new)             | The planning document that records one Application Module's responsibility, owned paths, interfaces, dependencies, events, tests, and migration status.                              | module note, rough sketch                |
| **Closed Module** (new)             | An Application Module whose internals are not meant to be imported across module boundaries.                                                                                         | normal module, default bucket            |
| **Open-Temporary Module** (new)     | A legacy Application Module that is temporarily allowed broader internal coupling while a closing slice is planned.                                                                  | permanent exception, shared mess         |
| **Split-Pending Module** (new)      | A residual Application Module whose current owned paths are still too broad and must be reduced in later slices.                                                                     | catch-all forever, misc module           |
| **Boundary Manifest** (new)         | The one repo machine-readable file that future lint and graph tooling reads for module ownership, dependencies, entrypoints, and statuses.                                           | loose note, optional spreadsheet         |
| **Root-First Entrypoint** (new)     | The rule that every module should expose one obvious root import target before introducing any secondary named interface.                                                            | random export path, deep import default  |
| **Compatibility Facade** (new)      | A temporary forwarding surface that keeps old import paths alive after a boundary split; disallowed by the current Phase 12 decisions.                                               | harmless alias, migration convenience    |
| **Directory-First Ownership** (new) | The rule that modules own directories or stable file groups by default, with only a short explicit exception list.                                                                   | file-by-file micromanagement             |
| **Static Astro Frontend** (new)     | Prebuilt Astro site served by Cloudflare Pages or GitHub Pages rollback without owning dynamic commerce authority.                                                                   | frontend app, Pages backend              |
| **Worker Backend** (new)            | Cloudflare Worker that owns dynamic commerce APIs, D1, Stripe, webhooks, secrets, and protected operator APIs.                                                                       | backend app, Pages Functions             |
| **Cloudflare Pages** (new)          | Canonical static deployment target for the Static Astro Frontend.                                                                                                                    | production backend, Pages Functions host |
| **GitHub Pages Rollback** (new)     | Legacy rollback deployment target for the Static Astro Frontend.                                                                                                                     | primary GitHub Pages site                |
| **Current Plan** (new)              | Active GSD phase or milestone plan that defines the work being executed now.                                                                                                         | latest idea, current doc                 |
| **GSD Source of Truth** (new)       | Planning artifact set that decides the Current Plan, accepted decisions, blockers, and required evidence.                                                                            | notes, scratch plan                      |
| **Validation Evidence** (new)       | Recorded proof that a plan's required checks or acceptance criteria passed, including blockers when a gate cannot pass yet.                                                          | test output, proof, evidence blob        |
| **Deferred Gate** (new)             | Explicitly recorded external or environment-dependent gate that cannot pass yet and must not be reported as complete.                                                                | blocker, postponed check                 |
| **Browser Use Validation** (new)    | Rendered UI verification performed with the native Codex Windows app Browser Use plugin.                                                                                             | browser check, DevTools validation       |

## Relationships

- A Release or Distro Entry can project into a StoreItem.
- A StoreItem exposes one or more StoreItemOptions.
- A StoreItemOption maps to a backend Variant.
- A Variant owns Stock and exposes OnlineStock to checkout.
- A Variant can have one Stripe Price Mapping, but Stripe Price IDs never belong in frontend payloads.
- A StoreCart can hold a CartDraft with one or more CartLines.
- A CartLine contains a CartLineItemSnapshot and a CartQuantity.
- A Primary Line Item is derived from the first CartLineItemSnapshot and exists only for single-line compatibility.
- StartCheckout reads StoreOffer data and creates a Checkout Session only when ItemAvailability, OnlineStock, Stripe
  Price Mapping, Native Checkout Gate, and the chosen shipping-mode data are valid for the requested CartLine or
  CartLines.
- The Worker must validate every CartLine and CartQuantity before checkout; StoreCart and CartLineItemSnapshot are not
  price, stock, payment, or order authority.
- Every Application Module exposes a Provided Interface and hides its Internal Implementation.
- Required Dependencies must target another module's Provided Interface or Named Interface, never an arbitrary internal
  path.
- The Boundary Manifest is the tooling input; `MODULES.md` and Module Canvases are the human review surfaces.
- Closed Modules reject cross-module internal imports by default.
- SPI Entrypoints are the only approved shape for provider-implemented contracts; do not add generic `ports/` or
  `adapters/` directories without an explicit Boundary Manifest exception.
- Open-Temporary Modules require explicit exit criteria in their Module Canvas before execution begins.
- Root-First Entrypoints are the default import target; Compatibility Facades are not the default migration strategy.
- Local stripe-mock API validates Stripe SDK request shape. The Mock Checkout Panel validates local client handoff.
  Neither satisfies the Stripe Access Gate.
- Stripe Webhook events update CheckoutOrder and are the only paid-signal path that may decrement Stock.
- Phase 9 Greece-Only Shipping now requires an explicit Shipping Mode.
- Manual Fulfillment uses paid CheckoutOrder/payment-tooling data plus the chosen shipping-mode data without storing raw
  BOX NOW payloads or credentials.
- If automation is reopened, the implementation must route through `boxnow-js`.
- Local signed-fixture evidence may validate a prototype handoff shape. Current manual BOX NOW scope is closed; full
  portal/API evidence belongs only to the BOX NOW Reopen Gate.
- Cloudflare Pages serves the Static Astro Frontend. The Worker Backend owns dynamic commerce, D1, Stripe, webhooks,
  secrets, and protected operator APIs.
- GSD Source of Truth chooses the Current Plan. Validation Evidence either completes that plan or records a Deferred
  Gate without pretending the gate passed.

## Example Dialogue

> **Dev:** "When the shopper adds two records, should the StoreCart become the order?"
> **Domain expert:** "No. The StoreCart only holds a CartDraft. The Worker creates a CheckoutOrder only after StartCheckout validates the CartLines."
> **Dev:** "Can the CartLineItemSnapshot carry the Stripe Price ID so the client can create checkout faster?"
> **Domain expert:** "No. A CartLineItemSnapshot is display and routing data only. StartCheckout reads StoreOffer and Stripe Price Mapping on the Worker."
> **Dev:** "Why do we keep a Primary Line Item if CartDraft supports multiple CartLines?"
> **Domain expert:** "It is a compatibility projection for single-line checkout UI. New cart work should reason in CartLines and CartQuantities."
> **Dev:** "Can local stripe-mock evidence close the Stripe Access Gate?"
> **Domain expert:** "No. It checks SDK request shape only; the Deferred Gate stays open until real Stripe test-mode evidence exists."

## Flagged Ambiguities

- **StoreCart vs browser storage:** Use StoreCart as the canonical client cart concept. Browser storage describes the
  current implementation only and should not become the domain term.
- **StoreCart vs CheckoutOrder:** StoreCart is a client convenience draft. CheckoutOrder is the Worker/D1 operational
  record created only after StartCheckout succeeds.
- **CartLineItemSnapshot vs StoreItem:** CartLineItemSnapshot is copied client-side display and routing data. StoreItem
  is the shopper-facing sellable item identity assembled from content.
- **CartLineItemSnapshot vs StoreOffer:** CartLineItemSnapshot must not imply authority for price, stock, payment, or
  checkout eligibility. StoreOffer is the Worker-read checkout authority.
- **Primary Line Item vs CartLine:** Primary Line Item is a compatibility projection from the first line. CartLine is
  the durable unit for multi-line cart and checkout work.
- **StoreItem vs Variant:** StoreItem is the shopper-facing item; Variant is the backend sellable unit that stock and
  Stripe mapping attach to.
- **Variant vs Stripe Price:** Variant is app-owned. Stripe Price is an external payment mapping owned by the Worker.
- **ItemAvailability vs OnlineStock:** ItemAvailability expresses checkout eligibility/status. OnlineStock is the
  checkout-facing quantity that constrains CartQuantity.
- **Stock vs OnlineStock:** Stock is the D1 source-of-truth record; OnlineStock is the conservative checkout-facing
  quantity.
- **Checkout Session vs CheckoutOrder:** Checkout Session is Stripe-owned; CheckoutOrder is the Worker/D1 record.
- **Order Shipping Address vs Shipping Locker Snapshot:** Order Shipping Address is the non-automated delivery data.
  Shipping Locker Snapshot is BOX NOW-specific metadata for an approved automation path only.
- **Mock vs Stripe test mode:** Local stripe-mock and Mock Checkout Panel are no-secret development tools. Stripe test
  mode requires a real Stripe account, keys, Price IDs, and webhook secret.
- **Sandbox:** Say `Cloudflare sandbox Worker`, `Stripe test mode`, or `Pages preview` instead of bare "sandbox."
- **Manual Fulfillment vs fulfillment automation:** Manual Fulfillment is the Phase 9 default baseline. Automated
  shipment creation requires an explicit decision and must route through `boxnow-js`.
- **Prototype evidence vs final Phase 9 contract:** The current locker-first local implementation is prototype evidence,
  not the only acceptable final Phase 9 outcome.
- **Local handoff evidence vs BOX NOW Reopen Gate:** Local mock checkout plus signed webhook fixtures prove a handoff
  shape. Current manual BOX NOW scope is closed; real portal/API evidence is future-only after access exists and the
  user explicitly reopens the work.
- **Cloudflare Pages vs Worker Backend:** Pages serves static frontend assets. The Worker owns all dynamic commerce
  behavior and secrets.
- **Feature Gate vs environment:** Feature Gates are runtime capability switches. Worker environments still isolate D1
  data, secrets, webhook endpoints, return origins, and release evidence.
- **CartQuantity vs OnlineStock:** CartQuantity is shopper intent. OnlineStock is the Worker/D1 checkout-facing stock
  value that constrains whether the requested quantity may proceed.
