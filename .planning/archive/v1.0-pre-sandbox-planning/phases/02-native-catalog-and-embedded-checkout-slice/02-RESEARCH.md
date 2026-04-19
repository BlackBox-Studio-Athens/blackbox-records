# Phase 2: Native Catalog And Embedded Checkout Slice - Research

**Researched:** 2026-04-19
**Domain:** Native storefront slice planning for Astro + Cloudflare Workers + Stripe embedded Checkout
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- The first native commerce slice is a hand-picked distro subset, not the full current catalog.
- This hand-picked subset is the slice intended to be exercised against Stripe sandbox in the future sandbox milestone, but this current milestone remains planning-only and does not implement or integrate sandbox yet.
- Do not plan Phase 2 around all distro items, release-tied merch, or a mixed all-product launch.
- The native storefront should use a collection page plus a product detail page, not a card grid that jumps directly to checkout.
- `/shop/` is the native transactional entry point for this slice.
- The exact route shape below `/shop/` is at the agent's discretion during planning, but the flow must clearly support collection browsing and a separate product detail step.
- Existing `/distro/` content remains a relevant editorial/catalog surface; Phase 2 should not assume the editorial distro section disappears just because `/shop/` becomes native.
- The MVP checkout posture is single-item `buy now`, not a cart.
- Embedded checkout should live on a dedicated in-site checkout route rather than in a modal, sheet, or direct grid-card embed.
- The intended shopper flow is Shopify-like in the broad product sense: collection -> product detail -> buy now -> dedicated checkout route.
- Phase 2 should plan clear cancel/return behavior from that dedicated checkout route, but those pages must not become payment authority.
- Astro distro content remains the presentation/editorial layer for the first slice.
- Stripe-backed sellable data provides the authoritative product/price information joined into that presentation layer.
- Do not make Astro content collections the sellable catalog authority for price or transactional state.
- Do not introduce browser-side writes to D1 order or inventory state in this phase.

### the agent's Discretion
- Exact route naming under `/shop/`
- Exact method for mapping Astro distro entries to Stripe products/prices
- Exact product-card and product-detail information density
- Whether `/distro/` links into `/shop/` directly or stays loosely cross-linked
- Exact copy tone and visual treatment before the later UI-SPEC locks it

### Deferred Ideas (OUT OF SCOPE)
- Full catalog launch across all distro items
- Release-merch-first or mixed multi-collection launch
- Cart support in Phase 2
- Modal or sheet-based embedded checkout
- Direct checkout from grid cards without a product detail page
- Inventory mutation, reservation logic, or paid-order authority in this phase

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hand-picked store collection presentation | CDN/Static | Frontend Server | Astro should keep the storefront browse experience close to the existing distro/editorial surfaces while rendering sellable data projections safely. |
| Product detail presentation | Frontend Server | CDN/Static | Product detail routes can be server-rendered or hybrid-rendered so they can join Astro presentation with Stripe-backed sellable fields. |
| Stripe-backed price and sellable metadata projection | Frontend Server | API/Backend | The site should never author price truth locally; server-side projection joins Stripe data into the storefront. |
| Checkout Session creation | Frontend Server | — | Stripe secret usage must stay server-side. |
| Embedded Checkout mount | Browser/Client | Frontend Server | Browser mounts Stripe-provided embedded Checkout using a client secret fetched from a server route. |
| Cancel/return routing and status messaging | Frontend Server | Browser/Client | Shopper-facing states live in-site, but must defer payment truth to webhook logic planned later. |

</architectural_responsibility_map>

<research_summary>
## Summary

Stripe’s current documentation strongly supports the Phase 2 flow the user chose: a dedicated in-site checkout route using Checkout Sessions with `ui_mode: embedded`, created server-side and mounted client-side with Stripe’s embedded Checkout flow. The most important current API constraint is that embedded Checkout uses `return_url` and `redirect_on_completion`; `success_url` and `cancel_url` are not valid for embedded sessions. This means the dedicated checkout route and return/cancel state planning should be built around either `redirect_on_completion: if_required` or `never`, not around the older hosted Checkout page semantics.

The current repo already has an editorial distro surface that can be reused as the visual basis for the first sellable slice. `src/pages/distro/index.astro`, `DistroCard`, and `catalog-data.ts` already provide grouping, card presentation, and content loading. The cleaner architecture is therefore not to replace Astro content with Stripe catalog pages, but to define a projection layer where a hand-picked subset of Astro distro entries is mapped to Stripe product/price identities and rendered as native `/shop/` collection/detail experiences. This preserves the current site character while keeping Stripe authoritative for sellable name/price/currency.

For the MVP flow, a single-item `Buy Now` path is the correct constraint. Stripe Checkout’s embedded form already contains its own order summary; the host page should therefore keep any local summary compact and complementary, not build a second fake cart. The planning recommendation is to define three planning artifacts in this phase: a first-slice catalog spec, a Checkout Session contract, and a shopper-flow/state contract. These are the minimum documents needed before sandbox implementation.

**Primary recommendation:** Plan Phase 2 around a `/shop/` curated collection -> product detail -> dedicated embedded checkout route, using Astro distro entries as presentation shells and Stripe Products/Prices as sellable truth, with `redirect_on_completion: if_required` as the default embedded Checkout posture unless a later sandbox constraint requires `never`.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | `^5.18.0` | Existing storefront framework | Already in repo and aligned with the brownfield migration shape. |
| `@astrojs/cloudflare` | implementation-time compatible release | Cloudflare runtime adapter | Required for the runtime chosen in Phase 1. |
| `stripe` | implementation-time stable release | Server-side Checkout Session creation | Official SDK for session creation and later webhook verification. |
| `@stripe/stripe-js` | implementation-time stable release | Client-side embedded Checkout bootstrap | Official browser integration for Stripe embedded Checkout. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `DistroCard` and catalog helpers | repo-local | Collection and product presentation baseline | Use for the first slice instead of inventing a new card/grid language. |
| Existing app shell routing | repo-local | Top-level route ownership | Use to preserve the native section-routing model around `/shop/`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Astro content as presentation + Stripe truth | Stripe-only catalog pages | Reduces editorial reuse and weakens CMS continuity. |
| Dedicated checkout route | Modal or sheet checkout | Feels compressed, complicates return/cancel semantics, and fights the app shell. |
| Single-item buy now | Cart-first MVP | Adds more state, UX, and contract complexity than the MVP needs. |

**Installation:**
```bash
pnpm add stripe @stripe/stripe-js
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
Astro content (distro entries)
  -> curated hand-picked subset selection
    -> server-side projection layer
      -> Stripe product + price lookup
        -> /shop/ collection view
          -> /shop/[product] detail view
            -> POST checkout-session route
              -> Stripe Checkout Session (ui_mode: embedded)
                -> /shop/checkout/[session-or-product-context]
                  -> return/cancel/waiting states
```

### Recommended Project Structure
```text
.planning/phases/02-native-catalog-and-embedded-checkout-slice/
├── 02-CATALOG-SLICE.md
├── 02-CHECKOUT-CONTRACT.md
├── 02-SHOPPER-FLOW.md
└── 02-UI-SPEC.md
```

### Pattern 1: Editorial shell + sellable projection
**What:** Keep Astro distro entries as the content/presentation shell, while attaching Stripe product and price truth through a server-side mapping/projection layer.
**When to use:** Brownfield editorial sites that want native commerce without duplicating transactional truth into the CMS.
**Example:**
```ts
// Planning shape only:
// Astro entry fields -> display shell
// Stripe product/price IDs -> sellable truth
// merged into /shop/ list and detail views
```

### Pattern 2: Dedicated embedded Checkout route
**What:** Trigger server-side session creation from the product detail page, then mount embedded Checkout on a dedicated route or dedicated stateful view.
**When to use:** Single-item buy-now flows that need a clean back stack and clear return/cancel handling.
**Example:**
```ts
// Server creates Checkout Session with:
// mode: "payment"
// ui_mode: "embedded"
// return_url: ".../shop/return?session_id={CHECKOUT_SESSION_ID}"
// redirect_on_completion: "if_required"
```

### Pattern 3: Thin host-page summary around embedded Checkout
**What:** Let Stripe render its own primary payment UI and order summary while the site page adds only lightweight contextual product identity.
**When to use:** Embedded Checkout flows where the site should still feel branded but should not duplicate checkout logic.
**Example:**
```text
Checkout page
  left/main: Stripe embedded form
  right/secondary: compact product identity card
```

### Anti-Patterns to Avoid
- **Mirroring Stripe prices into Astro content as source of truth:** This creates editorial/transactional drift.
- **Building a cart-shaped UI without cart requirements:** This overbuilds the MVP and muddies the buy-now flow.
- **Using hosted Checkout semantics for embedded Checkout:** Embedded sessions use `return_url` and `redirect_on_completion`, not `success_url`/`cancel_url`.
- **Treating `/distro/` and `/shop/` as identical routes:** The repo already gives them different editorial meanings; planning should preserve that distinction unless there is a clear benefit in merging later.

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment iframe orchestration | Custom embedded payment frame or custom card form | Stripe embedded Checkout | Stripe already manages the prebuilt payment UI and payment-method complexity. |
| Product price authoring in CMS | Custom price fields in Astro content | Stripe Products and Prices | Prevents pricing drift and keeps catalog truth with the payment system. |
| Store-card redesign from scratch | Entirely new ecommerce card system | Evolved `DistroCard` direction | Existing editorial cards already fit the site’s visual language. |
| Success/cancel URL semantics from hosted Checkout | `success_url` / `cancel_url` contract | `return_url` + `redirect_on_completion` + in-page completion handling | Embedded Checkout has a different contract. |

**Key insight:** The fastest safe MVP is not a custom storefront engine; it is a careful join between existing Astro presentation and Stripe’s prebuilt checkout primitives.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Planning against stale Stripe terminology
**What goes wrong:** The design or route contract assumes `ui_mode: embedded_page` or hosted-Checkout redirects.
**Why it happens:** Project docs still contain older wording that predates the current official API reference.
**How to avoid:** Treat the current official Stripe API docs and Phase 1 research as authoritative.
**Warning signs:** Specs mention `success_url` or `cancel_url` for embedded Checkout.

### Pitfall 2: Duplicating the order summary
**What goes wrong:** The site builds a faux cart summary beside or around embedded Checkout that competes with Stripe’s own order summary.
**Why it happens:** Teams imitate hosted-store patterns without checking what the embedded form already provides.
**How to avoid:** Keep host-page summary compact and identity-oriented, not line-item-heavy.
**Warning signs:** Planning docs call for subtotal/tax/shipping breakdown outside Stripe in Phase 2.

### Pitfall 3: Letting `/shop/` become a generic catalog clone of `/distro/`
**What goes wrong:** The native shop loses the curated/editorial character the site already has.
**Why it happens:** Planning treats `/shop/` as a blank ecommerce route instead of a BlackBox-native continuation of the distro layer.
**How to avoid:** Reuse the visual language and selectively curated subset posture from existing distro surfaces.
**Warning signs:** Plans describe a marketplace-style grid, filters, or volume-first catalog behaviors.

### Pitfall 4: Sneaking cart semantics into the MVP
**What goes wrong:** Quantity, multiple line items, or cart persistence appear in the first slice despite not being required.
**Why it happens:** “Shopify-like” gets misread as “full cart flow” instead of “clear browse-detail-checkout structure.”
**How to avoid:** Keep the MVP explicitly single-item and buy-now only.
**Warning signs:** Plans mention cart badges, cart state, add-to-cart, or mini-cart UI.

</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Embedded Checkout Session shape
```ts
// Planning-oriented server contract example
const sessionConfig = {
  mode: "payment",
  ui_mode: "embedded",
  line_items: [{ price: "price_xxx", quantity: 1 }],
  return_url: "https://example.com/shop/return?session_id={CHECKOUT_SESSION_ID}",
  redirect_on_completion: "if_required",
};
```

### Compact embedded checkout mount direction
```ts
// Planning-oriented client shape
// 1. fetch clientSecret from server route
// 2. initialize embedded Checkout
// 3. mount inside dedicated checkout container
```

### Astro presentation joined with Stripe-backed price data
```ts
// Planning shape only:
// distroEntry.title / summary / image => presentation
// stripeProduct.name / stripePrice.unit_amount / currency => sellable truth
```

</code_examples>

## Validation Architecture

- Plans in this phase should only generate planning artifacts, not code implementation.
- Validate artifacts by grepping for required route decisions, Stripe session fields, and deferred-scope exclusions.
- Use `pnpm check` as a conservative smoke command after execution, even though docs are the primary outputs.
- Treat any plan or artifact that introduces cart state, hosted-checkout semantics, or browser-side order writes as a validation failure.

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Embedded Checkout described as `embedded_page` in internal project wording | Current API reference uses `ui_mode: embedded` | observed in Stripe docs on 2026-04-19 | Phase 2 contracts should align to the current API reference. |
| Hosted Checkout success/cancel URL assumptions | Embedded Checkout relies on `return_url` plus `redirect_on_completion`, with optional in-page `onComplete` handling | current docs observed on 2026-04-19 | Shopper-flow planning must treat return/cancel differently for embedded sessions. |
| Astro/Cloudflare seen as “static plus redirect” | Astro on Cloudflare supports full-stack apps and on-demand APIs on Workers | current Astro docs observed on 2026-04-19 | `/shop/` can be planned as a true native route instead of a redirect handoff. |

**New tools/patterns to consider:**
- `redirect_on_completion: if_required` for embedded Checkout
- Server-created client-secret flow for embedded Checkout mount
- Hybrid editorial + Stripe projection rather than replacing the distro CMS model

**Deprecated/outdated:**
- `success_url`/`cancel_url` planning for embedded Checkout
- Treating Astro distro entries as the price authority
</sota_updates>

<open_questions>
## Open Questions

1. **How should the hand-picked subset be selected operationally?**
   - What we know: The user wants a curated MVP slice, not the full catalog.
   - What's unclear: Whether the selection is driven by explicit flags in content, a dedicated Phase 2 allowlist doc, or Stripe-side curation only.
   - Recommendation: Define the selection rule in a planning artifact first, then let later implementation choose the least brittle storage mechanism.

2. **Should return handling prefer `if_required` or `never` for the MVP?**
   - What we know: Embedded Checkout supports both, and the UI spec expects calm in-site return/cancel states.
   - What's unclear: Whether the MVP wants redirect-based payment methods enabled in the sandbox slice.
   - Recommendation: Default the planning contract to `if_required` and document `never` as an explicit alternative if payment-method scope is intentionally narrowed.

3. **How tightly should `/distro/` and `/shop/` be connected?**
   - What we know: `/distro/` is an existing editorial surface and `/shop/` becomes the transactional route.
   - What's unclear: Whether `/distro/` should deep-link to `/shop/` product pages, remain a separate editorial browse surface, or both.
   - Recommendation: Keep them conceptually distinct but cross-linkable in planning, then settle the exact cross-link strategy in the shopper-flow artifact.

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create) — checked current `ui_mode`, `return_url`, `redirect_on_completion`, and invalid hosted-only parameters
- [Stripe Checkout overview](https://docs.stripe.com/payments/checkout) — checked current distinction between Checkout page and Checkout elements/custom UIs
- [Stripe customize redirect behavior for embedded form](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form) — checked `if_required`, `never`, and `onComplete` behavior
- [Stripe products and prices overview](https://docs.stripe.com/products-prices/overview) — checked current catalog model framing
- [Astro deploy to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) — confirmed full-stack Astro + Workers posture

### Secondary (MEDIUM confidence)
- Local repo sources: `src/pages/distro/index.astro`, `src/components/cards/DistroCard.astro`, `src/config/site.ts`, `src/content.config.ts`, `src/components/app-shell/AppShellRoot.tsx`

### Tertiary (LOW confidence - needs validation)
- None
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Stripe embedded Checkout planning
- Ecosystem: Astro storefront routing, editorial catalog surfaces, Stripe Products/Prices
- Patterns: dedicated checkout route, projection layer, single-item buy-now flow
- Pitfalls: stale embedded terminology, cart creep, duplicate order summaries

**Confidence breakdown:**
- Standard stack: HIGH - official Stripe and Astro docs are clear on the runtime and embedded flow
- Architecture: HIGH - strongly grounded in the locked context and the current repo structure
- Pitfalls: HIGH - directly tied to official docs and current code patterns
- Code examples: MEDIUM - intentionally simplified for planning purposes
</metadata>
