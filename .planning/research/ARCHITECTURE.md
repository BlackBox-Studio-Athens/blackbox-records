# Architecture Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration  
**Domain:** Sandbox implementation architecture for native commerce  
**Researched:** 2026-04-19  
**Confidence:** HIGH

## Recommended Architecture

The right architecture for this milestone is a narrow extension of the current Astro storefront, not a second application. The existing Astro pages, app shell, and content collections remain the canonical browsing surface. Cloudflare Workers adds the server boundary that GitHub Pages could not provide, and D1 adds the minimum SQL state required for inventory and orders.

## Brownfield Integration Points

The repo already has the right surfaces for the first commerce slice:
- `src/pages/store/index.astro` is the canonical native store entry, while `src/pages/shop/index.astro` becomes a compatibility redirect.
- `src/config/site.ts` and distro card/link helpers previously resolved `/shop/` to Fourthwall and now need to preserve only external Fourthwall links, not native store paths.
- `src/content/distro/*.json` already provides the editorial product presentation layer.
- The app shell already owns top-level navigation, so the native store routes should fit inside the same shell-managed experience instead of creating a separate storefront shell.

## New / Changed Layers

### 1. Worker Runtime Layer

Purpose:
- host server endpoints for Checkout Session creation, webhook verification, and trusted session retrieval
- keep secrets and D1 access server-only
- preserve static prerendering for the rest of the site where practical

Key constraints:
- use on-demand routes only where server execution is required
- keep handlers thin because Workers Free CPU limits are tight
- do not disturb the current production GitHub Pages deployment during sandbox work

### 2. Catalog Projection Layer

Purpose:
- join Astro distro editorial content to Stripe product/price state for the curated sellable subset

Responsibilities:
- Astro content remains the presentation and editorial layer
- Stripe product/price data supplies sellable title/price/currency truth
- the join key must be explicit and stable

What not to do:
- do not recreate pricing authority in Astro content
- do not let the browser fetch Stripe secrets or internal catalog joins directly

### 3. Checkout Flow Layer

Purpose:
- turn a product-detail `Buy Now` action into a server-created Checkout Session and mount embedded Checkout on a dedicated route

Responsibilities:
- create a single-item Checkout Session on the server
- return the `client_secret` needed by the embedded Checkout client
- render in-site return/retry states without treating them as authoritative payment truth

Current Stripe integration implications:
- use `ui_mode: embedded`
- provide `return_url` when redirects are allowed
- consider `redirect_on_completion: if_required` to keep card success in-page while still supporting redirect-based methods if enabled

### 4. D1 Order And Inventory Layer

Purpose:
- store only the operational state BlackBox needs to fulfill paid orders and keep stock correct

Responsibilities:
- represent orders with the approved minimal states: `pending_payment`, `paid`, `closed_unpaid`, `needs_review`
- store inventory counts
- attach the thinnest approved BOX NOW metadata for paid Greek orders
- enforce idempotent updates so paid inventory decrement happens once

What not to do:
- do not let the browser write this data
- do not add reservation logic
- do not turn D1 into a second product catalog

### 5. BOX NOW Shipping Gate

Purpose:
- add the approved Greece-only locker selection step before payment

Responsibilities:
- gate the native checkout flow to Greece only
- capture locker choice before session creation
- persist only `locker_id`, `country_code`, and `locker_name_or_label`
- keep fulfillment manual in the partner portal

What not to do:
- do not introduce non-Greece shipping in this milestone
- do not add automated shipment creation yet

## End-to-End Data Flow

1. Shopper lands on native `/store/` collection route inside the existing app shell.
2. Shopper opens a product detail page built from Astro editorial content plus Stripe-backed sellable data.
3. Shopper presses `Buy Now`.
4. Checkout route enforces the Greece-only BOX NOW gate and captures locker choice before payment.
5. Front end calls a Worker endpoint to create a single-item Checkout Session.
6. Worker creates the Session in Stripe sandbox, using the selected product/price plus pre-payment shipping context, and returns the `client_secret`.
7. Embedded Checkout mounts on the dedicated in-site checkout route.
8. Shopper completes payment. Return UX may render based on session retrieval, but it is not authoritative.
9. Stripe sends webhook events to the Worker endpoint.
10. Worker verifies the webhook signature, retrieves the Checkout Session details it needs, applies idempotent D1 state changes, and decrements inventory only after confirmed payment success.
11. Operator uses Stripe Dashboard plus D1 inspection for manual reconciliation and BOX NOW partner-portal fulfillment.

## Build Order Recommendation

1. Runtime and secret plumbing
2. Native store entry and catalog projection
3. Embedded checkout session creation and mount
4. Webhook-backed order and inventory state
5. Greece-only locker step
6. End-to-end sandbox verification

This order keeps the highest-risk trust boundaries ahead of the lower-risk shipping and review work.

## Sources

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)
- [Stripe embedded Checkout build guide](https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=embedded-form)
- [Stripe custom success / redirect behavior](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form)
- [Stripe checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=embedded-form)

---
*Research completed: 2026-04-19*
