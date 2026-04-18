# Phase 2: Native Catalog And Embedded Checkout Slice - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Plan the smallest native in-site store slice that proves product browsing and embedded checkout entry inside the BlackBox site, without inventory mutation, reservation logic, or browser-side authoritative writes.

</domain>

<decisions>
## Implementation Decisions

### First sellable slice
- **D-01:** The first native commerce slice is a hand-picked distro subset, not the full current catalog.
- **D-02:** This hand-picked subset is the slice intended to be exercised against Stripe sandbox in the future sandbox milestone, but this current milestone remains planning-only and does not implement or integrate sandbox yet.
- **D-03:** Do not plan Phase 2 around all distro items, release-tied merch, or a mixed all-product launch.

### Store structure and route posture
- **D-04:** The native storefront should use a collection page plus a product detail page, not a card grid that jumps directly to checkout.
- **D-05:** `/shop/` is the native transactional entry point for this slice.
- **D-06:** The exact route shape below `/shop/` is at the agent's discretion during planning, but the flow must clearly support collection browsing and a separate product detail step.
- **D-07:** Existing `/distro/` content remains a relevant editorial/catalog surface; Phase 2 should not assume the editorial distro section disappears just because `/shop/` becomes native.

### Checkout entry and shopper flow
- **D-08:** The MVP checkout posture is single-item `buy now`, not a cart.
- **D-09:** Embedded checkout should live on a dedicated in-site checkout route rather than in a modal, sheet, or direct grid-card embed.
- **D-10:** The intended shopper flow is Shopify-like in the broad product sense: collection -> product detail -> buy now -> dedicated checkout route.
- **D-11:** Phase 2 should plan clear cancel/return behavior from that dedicated checkout route, but those pages must not become payment authority.

### Catalog and presentation ownership
- **D-12:** Astro distro content remains the presentation/editorial layer for the first slice.
- **D-13:** Stripe-backed sellable data provides the authoritative product/price information joined into that presentation layer.
- **D-14:** Do not make Astro content collections the sellable catalog authority for price or transactional state.
- **D-15:** Do not introduce browser-side writes to D1 order or inventory state in this phase.

### the agent's Discretion
- Exact route naming under `/shop/`
- Exact method for mapping Astro distro entries to Stripe products/prices
- Exact product-card and product-detail information density
- Whether `/distro/` links into `/shop/` directly or stays loosely cross-linked
- Exact copy tone and visual treatment before the later UI-SPEC locks it

</decisions>

<specifics>
## Specific Ideas

- The first slice should feel like an MVP, not a full commerce platform.
- The user explicitly prefers the simpler `single-item buy now` posture over introducing a cart in the first slice.
- The desired shopper experience is broadly Shopify-like: straightforward collection browsing, a proper product page, and a dedicated checkout step rather than a modal or forced direct-buy grid.
- The current repo already has a curated distro layer and distro cards; the future native shop should reuse that editorial sensibility rather than replacing it with a generic catalog feel.
- Because the repo’s current requirements still contain stale `embedded_page` wording and Supabase references, downstream planning should treat Phase 1 context/research as authoritative wherever those older docs conflict.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and milestone constraints
- `.planning/ROADMAP.md` — Phase 2 scope, success criteria, and UI workflow requirement
- `.planning/REQUIREMENTS.md` — Catalog and checkout requirements; where this file conflicts with Phase 1 context on Stripe terminology or D1 ownership, prefer the newer phase context until Phase 1 execution normalizes the docs
- `.planning/STATE.md` — Current milestone position and open blockers

### Prior-phase locked decisions
- `.planning/phases/01-runtime-and-guardrails/01-CONTEXT.md` — Locked runtime, D1, secret-boundary, and cutover decisions that Phase 2 must inherit
- `.planning/phases/01-runtime-and-guardrails/01-RESEARCH.md` — Runtime/platform and Stripe terminology research that affects checkout-route planning

### Current repo integration points
- `AGENTS.md` — Repo constraints and app-shell expectations
- `src/pages/shop/index.astro` — Current external shop redirect route to be replaced by native shop behavior later
- `src/config/site.ts` — Existing shop URL/link resolution logic that still treats `/shop/` as external
- `src/components/app-shell/AppShellRoot.tsx` — App-shell navigation ownership, including the store nav item
- `src/pages/distro/index.astro` — Existing curated distro listing and grouping UX
- `src/components/cards/DistroCard.astro` — Existing distro card presentation surface
- `src/lib/catalog-data.ts` — Existing distro entry loading/grouping helpers
- `src/content.config.ts` — Distro collection schema, including current Fourthwall URL field
- `src/lib/admin/decap-config.ts` — Current Decap CMS distro fields and Fourthwall assumptions
- `src/content/navigation/shop.json` — Current top-level shop nav entry
- `src/content/releases/*.md` — Existing release merch links that may point to `/shop/`

### External product/payment references
- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create) — Server-created Checkout Session contract and current `ui_mode` semantics
- [Stripe embedded Checkout quickstart](https://docs.stripe.com/checkout/embedded/quickstart) — Embedded Checkout route shape and client-secret-return flow
- [Stripe products and prices model](https://docs.stripe.com/products-prices/overview) — Catalog authority model for Products and Prices

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/distro/index.astro`: Already provides grouped editorial catalog browsing for distro items.
- `src/components/cards/DistroCard.astro`: Existing visual card surface for distro items, useful for the first shop collection view.
- `src/lib/catalog-data.ts`: Existing helper layer for loading and grouping distro collection entries.
- `src/components/app-shell/AppShellRoot.tsx`: Already applies special treatment to the `/shop/` nav item inside the app shell.

### Established Patterns
- `/shop/` currently exists as a top-level route, but is still implemented as a redirect to Fourthwall.
- `src/config/site.ts` currently rewrites `/shop/` to an external `shopUrl`, so native shop planning must account for undoing that assumption.
- The repo already distinguishes editorial content from transactional destinations; distro entries carry descriptive presentation fields while pointing outward via `fourthwall_url`.
- The persistent app shell owns top-level section navigation, so the native shop entry must respect that routing model instead of bypassing it.

### Integration Points
- Replacing `src/pages/shop/index.astro` is the obvious route-level transition point for the native collection entry.
- Updating `src/config/site.ts` is required for `/shop/` to stop behaving like an external link.
- Distro schema and Decap config are likely transition points for replacing `fourthwall_url` assumptions with Stripe-aware planning later.
- Existing release and navigation content already reference `/shop/`, which makes `/shop/` the right canonical native store entry point.

</code_context>

<deferred>
## Deferred Ideas

- Full catalog launch across all distro items
- Release-merch-first or mixed multi-collection launch
- Cart support in Phase 2
- Modal or sheet-based embedded checkout
- Direct checkout from grid cards without a product detail page
- Inventory mutation, reservation logic, or paid-order authority in this phase

</deferred>

---

*Phase: 02-native-catalog-and-embedded-checkout-slice*
*Context gathered: 2026-04-19*
