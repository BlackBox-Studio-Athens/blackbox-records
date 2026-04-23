# Pitfalls Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration  
**Domain:** Sandbox implementation pitfalls for Astro + Workers + Stripe + D1  
**Researched:** 2026-04-19  
**Confidence:** HIGH

## Primary Risks

### 1. Sending the wrong embedded Checkout request shape

**Risk**
- carrying forward the stale `embedded_page` wording into actual API calls

**Why it matters**
- current Stripe docs use `ui_mode: embedded`
- the milestone should normalize the docs and code to the current API shape

**Prevention**
- treat Stripe’s current docs as authoritative
- keep the request contract centralized in the `StartCheckout` server route

### 2. Letting the browser become authoritative

**Risk**
- using return pages as payment truth
- letting browser code write D1 stock or order state

**Why it matters**
- it breaks the trust boundary that the whole migration is built around

**Prevention**
- verified webhooks own paid transitions
- browser only reads safe projections and triggers server endpoints
- D1 writes stay server-only

### 3. Overloading Workers with unnecessary dynamic work

**Risk**
- turning too much of the site into Worker-rendered pages
- doing heavy data work inside request handlers

**Why it matters**
- Workers Free has limited CPU per request
- the site already has a good static baseline that should be preserved

**Prevention**
- keep brochure and editorial routes prerendered where practical
- keep server work focused on checkout, session retrieval, and webhooks

### 4. Duplicating catalog ownership

**Risk**
- keeping sellable price truth in both Stripe and Astro content

**Why it matters**
- creates drift and operator confusion

**Prevention**
- Astro content owns editorial presentation
- Stripe owns sellable name/price/currency truth for checkout purposes
- use an explicit join key for the curated subset

### 5. Missing idempotency in the webhook path

**Risk**
- duplicate webhook delivery or concurrent handling causes double stock decrement or conflicting order states

**Why it matters**
- Stripe retries webhooks and checkout success can be observed more than once

**Prevention**
- store order state in D1 with an idempotent transition strategy
- make stock decrement conditional on first successful paid transition
- route oversell or mismatch cases to `needs_review`

### 6. Expanding shipping scope too early

**Risk**
- adding non-Greece shipping, fuller BOX NOW data capture, or automation in the sandbox milestone

**Why it matters**
- shipping complexity grows faster than storefront complexity

**Prevention**
- keep the milestone Greece-only
- persist only `locker_id`, `country_code`, and `locker_name_or_label`
- keep fulfillment manual

### 7. Letting sandbox work mutate production behavior

**Risk**
- changing `/store/` or the `/shop/` compatibility redirect in a way that unintentionally affects the live GitHub Pages path before go-live review

**Why it matters**
- the user explicitly wants a sandbox milestone before production launch work

**Prevention**
- keep production cutover out of scope
- document the deployment split clearly
- require a separate go-live milestone for live traffic change

## Phase Mapping

| Pitfall | Phase that should address it |
|---------|------------------------------|
| Wrong Stripe embedded request shape | Phase 7 |
| Browser becomes authoritative | Phases 7 and 8 |
| Worker runtime too dynamic | Phase 5 |
| Duplicate catalog ownership | Phase 6 |
| Missing idempotency | Phase 8 |
| Shipping scope creep | Phase 9 |
| Sandbox/prod drift | Phase 5 and Phase 10 |

## Sources

- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)
- [Stripe embedded Checkout build guide](https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=embedded-form)
- [Stripe custom success / redirect behavior](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form)
- [Stripe checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=embedded-form)

---
*Research completed: 2026-04-19*
