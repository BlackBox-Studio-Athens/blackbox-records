# Phase 6: Native Storefront Slice - Context

**Gathered:** 2026-04-20
**Status:** Planning complete

<domain>
## Phase Boundary

Phase 6 creates the first native `/shop/` experience without depending on D1 or Stripe. It defines one shared shop-facing projection over existing editorial content and uses a fixture-backed offer adapter so the storefront contract exists before local commerce state and checkout integration arrive.

</domain>

<decisions>
## Implementation Decisions

### Shop model
- **D-01:** Use one unified shop projection over `releases` and `distro`.
- **D-02:** Keep the shop projection separate from editorial collections; do not add temporary price or stock fields to `artists`, `releases`, or `distro`.
- **D-03:** `artists` remain editorial/navigation entities, not first-class sellable entities.
- **D-04:** The shop projection is the canonical read model consumed by `/shop/`, `/shop/[slug]/`, and release-to-shop links.

### Projection rules
- **D-05:** Release-derived shop entries use the release entry as the content source and inherit artist linkage from `release.artist`.
- **D-06:** Distro-derived shop entries use the distro entry as the content source and do not infer artist linkage unless it is explicitly modeled later.
- **D-07:** Canonical shop slugs come from stable content identities:
  - release-derived entries default to `release.id`
  - distro-derived entries default to `distro.id`
- **D-08:** Existing `fourthwall_url`, `merch_url`, and `shop_collection_handle` are legacy references only; they are not the canonical native shop routing model for this phase.

### Offer state
- **D-09:** Offer state is fixture-backed in Phase 6.
- **D-10:** Fixture data may carry price label, availability state, CTA state, and related shop-only metadata.
- **D-11:** The UI-facing offer contract must stay stable so Phase 6.1 and later Stripe work can swap implementations without reshaping the storefront.

### Route contract
- **D-12:** The native store routes are:
  - `/shop/` for the collection view
  - `/shop/[slug]/` for the product detail view
  - `/shop/[slug]/checkout/` for the pre-checkout handoff shell that Phase 7 will later activate
- **D-13:** Release pages with a mapped release-derived shop entry route to `/shop/[slug]/`.
- **D-14:** Releases without a mapped native shop entry do not invent a fallback native PDP in this phase.

### Asset and content reuse
- **D-15:** Release-derived shop entries reuse release cover image, release summary, title, and artist relationship.
- **D-16:** Distro-derived shop entries reuse distro image, summary, title, and existing metadata.
- **D-17:** Do not duplicate editorial media or summaries just to satisfy the first native shop slice.

### the agent's Discretion
- exact helper/module layout for the shop projection layer
- exact CTA disabled-state copy for the pre-checkout shell
- exact visual treatment of release-derived versus distro-derived metadata rows

</decisions>

<specifics>
## Specific Ideas

- Add a dedicated shop projection helper alongside the existing catalog helpers instead of mixing shop concerns into generic collection loaders.
- Treat the projection layer as the seam between editorial content and later commerce state sources.
- Let the first native shop be visually real and navigable, even though checkout wiring comes later.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 6 goal, success criteria, and 7-plan breakdown
- `.planning/REQUIREMENTS.md` - CATA requirements
- `.planning/STATE.md` - milestone position and current sequence
- `.planning/PROJECT.md` - milestone context and key decisions
- `src/content.config.ts` - current content schemas for artists, releases, and distro
- `src/lib/catalog-data.ts` - existing catalog helper layer that the shop projection can sit beside
- `src/pages/shop/index.astro` - current redirect baseline to be replaced

</canonical_refs>

<code_context>
## Existing Code Insights

- `releases` already reference `artists`, which makes release-derived shop entries straightforward.
- `distro` already carries editorial media and summary fields but currently points to Fourthwall URLs.
- `/shop/` is still a redirect route and has no native collection or PDP contract yet.
- The app shell already owns top-level navigation, so the native store must fit the existing shell rather than replace it.

</code_context>

<deferred>
## Deferred Ideas

- live D1-backed inventory reads
- Stripe-backed price authority
- checkout-session creation and embedded Checkout mount
- order lifecycle state and BOX NOW shipping logic

</deferred>

---

*Phase: 06-native-storefront-slice*
*Context gathered: 2026-04-20*
