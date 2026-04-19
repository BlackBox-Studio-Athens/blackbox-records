# Stack Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration
**Domain:** Brownfield Astro storefront adding low-volume native commerce
**Researched:** 2026-04-06
**Confidence:** HIGH

## Recommendation

Keep the existing Astro 5 storefront and app-shell/content architecture, but add an adapter-backed runtime for the commerce routes that cannot run on static GitHub Pages. The recommended implementation target is Astro with a portable Node runtime, Stripe as the authoritative catalog/pricing/payment system, and Supabase limited to inventory and order lifecycle state.

The planning bias should stay conservative. Use Stripe Checkout embedded page mode instead of building a custom payment form. Keep all privileged writes server-side. Keep BOX NOW integration thin in v1, focused on locker selection capture and low-volume fulfillment readiness instead of a full shipping platform build.

## Brownfield Baseline

- Existing stack: Astro 5, static output, React-powered persistent shell, content collections, Decap CMS, GitHub Pages
- Existing commerce pattern: `/shop/` and product links redirect to Fourthwall
- Existing deployment constraint: no server runtime in production today
- Existing editorial model: Astro collections plus Decap CMS must remain intact

## Recommended Core Technologies

| Technology | Role | Why it fits | Confidence |
|------------|------|-------------|------------|
| Astro 5 + current app shell | Storefront shell and content architecture | Minimizes brownfield churn and preserves working site behavior | HIGH |
| Astro adapter-backed runtime | Enables checkout-session creation, webhook routes, and trusted server logic | Astro’s current on-demand rendering docs allow adding an adapter and opting individual routes out of prerendering | HIGH |
| `@astrojs/node` style runtime target | Recommended runtime family for portability | Portable Node hosting keeps the future deployment surface less vendor-specific than a platform-specific edge runtime | MEDIUM |
| Stripe Checkout Sessions (`ui_mode: embedded_page`) | Embedded payment UI | Lowest PCI/maintenance burden while keeping checkout inside the site | HIGH |
| Stripe Products / Prices | Catalog and pricing authority | Prevents duplicated catalog administration and keeps pricing in Stripe where checkout already lives | HIGH |
| Supabase Postgres + server-side access only | Inventory and order lifecycle state | Narrow operational footprint, good fit for low volume, but only if writes stay server-owned | HIGH |
| BOX NOW widget/custom locker flow | Locker selection for Greek shipping | Official docs expose locker `locationId` plus widget/custom integration paths that fit low-volume operations | MEDIUM |

## Runtime Options Considered

### Option A: Astro Node runtime on a managed Node host

**Pros**
- Highest portability among the realistic options
- Closest fit to Astro’s standard server-route model
- Easy mental model for Stripe webhooks and server-only secrets
- Keeps the whole storefront in one runtime shape instead of splitting a separate API service

**Cons**
- Likely introduces a baseline monthly hosting cost above zero
- Requires replacing or augmenting the current GitHub Pages deployment path

**Recommendation**
- Preferred for Phase 1 decision work, subject to actual host pricing and operational review

### Option B: Astro on a platform-specific edge/runtime adapter

**Pros**
- Potentially lower idle cost
- Managed deployment ergonomics can be simpler

**Cons**
- Lower portability
- Higher risk of runtime-specific constraints around libraries, webhook handling, or future moves

**Recommendation**
- Keep as a comparison option in Phase 1, but not the default recommendation

### Option C: Keep GitHub Pages for the site and add a separate API service

**Pros**
- Smaller immediate change to the brochure deployment
- Could keep the public site mostly as-is

**Cons**
- Splits the architecture and deployment story early
- Adds cross-origin/session complexity and another surface to operate
- Reduces the benefit of keeping the commerce experience “native” inside Astro

**Recommendation**
- Only use if host/runtime constraints make a single Astro runtime impractical

## What Not To Use

- Static-only GitHub Pages as the final commerce runtime
- Custom card collection UI instead of Stripe Checkout
- Browser-side writes to Supabase inventory or paid-order state
- Reservation logic in v1
- A second catalog authority inside Astro content files
- A heavyweight fulfillment/admin suite before the low-volume flow is proven

## Roadmap Implications

- Phase 1 must decide adapter/runtime, deployment model, secret handling, and Stripe API version/terminology policy
- Phase 2 can target a first thin slice around native catalog display and embedded checkout session creation
- Phase 3 should establish webhook-authoritative order/payment/inventory flow before shipping or launch cutover
- BOX NOW fulfillment should stay thin in v1 to match low volume and maintenance goals

## Sources

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe embedded Checkout guide](https://docs.stripe.com/payments/accept-a-payment?payment-ui=checkout&ui=embedded-form)
- [Stripe handling payment events](https://docs.stripe.com/payments/handling-payment-events)
- [BOX NOW API Manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)

---
*Research completed: 2026-04-06*
