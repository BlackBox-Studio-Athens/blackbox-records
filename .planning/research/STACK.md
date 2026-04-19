# Stack Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration  
**Domain:** Brownfield Astro storefront implementing sandbox-native commerce  
**Researched:** 2026-04-19  
**Confidence:** HIGH

## Recommendation

Use the existing Astro 5 storefront and React app shell, add the official Cloudflare adapter for on-demand routes, deploy sandbox traffic to Cloudflare Workers, and store operational state in D1. Keep Stripe as the authority for product, price, checkout, and payment state, and keep BOX NOW thin and Greece-only.

This milestone should not chase a generic full-stack rebuild. The practical stack additions are small:
- `@astrojs/cloudflare` for the runtime adapter
- Cloudflare Workers bindings for secrets and D1
- Stripe server SDK for Checkout Session creation and webhook verification
- Stripe.js plus the embedded Checkout client integration on the dedicated checkout route
- D1 access layer for minimal order and inventory state

## Brownfield Baseline

- Existing runtime: Astro 5.18 with `output: static`, React 19 app shell, Tailwind 4, Decap CMS, GitHub Pages
- Existing commerce behavior: `/shop/` and distro links hand off to Fourthwall
- Existing architectural constraint: app-shell routing and content collections should remain intact
- Existing dependency baseline does not yet include the Cloudflare adapter or Stripe libraries

## Recommended Core Technologies

| Technology | Role | Why it fits | Confidence |
|------------|------|-------------|------------|
| Astro 5 + existing app shell | Storefront shell and routed UI | Preserves working brownfield behavior and approved UI contracts | HIGH |
| `@astrojs/cloudflare` | Astro adapter for Worker runtime | Astro supports adding an adapter and opting specific pages/endpoints out with `prerender = false` | HIGH |
| Cloudflare Workers Free | Sandbox server runtime | Low-ops and low-cost fit for low request volume, with server routes and secrets support | HIGH |
| Cloudflare D1 | Inventory and order lifecycle store | Narrow SQL state store colocated with Workers and sufficient free-tier headroom for low volume | HIGH |
| Stripe Checkout Sessions + embedded Checkout | Payment surface | Lowest-maintenance PCI posture and current docs use `ui_mode: embedded` | HIGH |
| Stripe Products / Prices | Catalog and pricing authority | Keeps sellable catalog administration in Stripe instead of duplicating it in Astro content | HIGH |
| Stripe CLI + Stripe sandboxes | Local and remote sandbox validation | Official testing path for webhook forwarding and isolated Stripe test data | HIGH |
| BOX NOW locker selection + manual partner portal fulfillment | Greece-only shipping path | Meets the approved MVP without overbuilding automation | MEDIUM |

## Platform Notes

### Astro + Cloudflare

Astro’s on-demand rendering docs still recommend starting from the default static posture and opting only the required routes out with `prerender = false`. That matches this repo: keep brochure/content routes as static as possible and make only commerce pages/endpoints live.

### Workers Free and D1 Free

As of 2026-04-19, Cloudflare Workers Free includes `100,000` requests per day and `10 ms` CPU time per request. D1 Free includes `5 million` rows read per day, `100,000` rows written per day, and `5 GB` storage. For the projected low order volume, those limits are a reasonable sandbox starting point, but the implementation should keep request handlers thin and avoid unnecessary server rendering work.

### Stripe embedded Checkout

Current Stripe docs use:
- `ui_mode: embedded`
- `return_url` when redirects are enabled
- optional `redirect_on_completion: if_required` if card payments should stay in-page and only redirect for redirect-based methods

That means the repo should stop carrying `embedded_page` as if it were the value to send. The milestone can still describe the flow as an embedded page, but the API request shape should use the current `embedded` enum.

## What To Add

- Cloudflare adapter and Worker deployment config
- Worker bindings for D1 and secrets
- Stripe server SDK
- Stripe.js and the embedded Checkout client integration
- Thin D1 data-access helpers for orders and inventory
- Testing scripts and verification notes for Worker + Stripe sandbox flows

## What Not To Add

- A custom card form or custom payment element flow
- Browser-side writes to D1-backed inventory or paid-order state
- Cart or multi-item checkout in this milestone
- Reservation logic in this milestone
- A second sellable catalog admin surface in Astro/Decap
- Automated BOX NOW fulfillment in this milestone

## Sources

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Astro deploy guide](https://docs.astro.build/en/guides/deploy/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)
- [Stripe sandboxes](https://docs.stripe.com/sandboxes)
- [Stripe CLI](https://docs.stripe.com/stripe-cli/use-cli)
- [Stripe embedded Checkout build guide](https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=embedded-form)
- [Stripe checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=embedded-form)

---
*Research completed: 2026-04-19*
