# Phase 6: Static Storefront Slice - Context

**Gathered:** 2026-04-20
**Status:** Planning complete

<domain>
## Phase Boundary

Phase 6 turns `/shop/` into a native storefront inside the static Astro site. It consumes the architecture frozen in Phase 5.1 and does not require the frontend itself to move to Workers.

</domain>

<decisions>
## Implementation Decisions

### Storefront model
- **D-01:** Use one unified `CatalogItem` projection over `releases` and `distro`.
- **D-02:** Keep the `CatalogItem` projection separate from editorial collections.
- **D-03:** `artists` remain editorial/navigation entities, not sellable entities.

### Offer state
- **D-04:** Phase 6 uses a temporary `VariantSnapshot` adapter that matches the future backend contract.
- **D-05:** The storefront contract must stay stable so later Worker-backed and D1/Stripe-backed reads do not force route or component rewrites.
- **D-06:** The static storefront must not depend on direct browser access to Stripe or D1.

### Route contract
- **D-07:** Static storefront routes are:
  - `/shop/`
  - `/shop/[slug]/`
  - `/shop/[slug]/checkout/`
- **D-08:** Release pages with mapped shop entries route to canonical shop pages.
- **D-09:** Legacy `fourthwall_url`, `merch_url`, and `shop_collection_handle` are no longer the canonical routing model.

### Asset and content reuse
- **D-10:** Release-derived shop entries reuse release cover image, summary, title, and artist relationship.
- **D-11:** Distro-derived shop entries reuse distro image, summary, title, and existing metadata.
- **D-12:** Do not duplicate editorial media or summaries into commerce storage.

</decisions>

<specifics>
## Specific Ideas

- Build the storefront around a stable `CatalogItem` plus `VariantSnapshot` UI contract.
- Let the first native shop be visually real and navigable before backend and Stripe integration land.
- Keep all frontend data shapes backend-agnostic so the Worker can slot in later without redesign.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/05.1-commerce-domain-architecture-and-source-of-truth-research/05.1-RESEARCH.md`
- `src/content.config.ts`
- `src/lib/catalog-data.ts`
- `src/pages/shop/index.astro`

</canonical_refs>

<code_context>
## Existing Code Insights

- `releases` already reference `artists`, which makes release-derived shop entries straightforward.
- `distro` already carries editorial media and summary fields but currently points to Fourthwall URLs.
- `/shop/` is still a redirect route and has no native collection or PDP contract yet.
- The app shell already owns top-level navigation and must remain the frontend shell.

</code_context>

<deferred>
## Deferred Ideas

- Worker-backed live variant reads
- checkout session creation
- webhook verification
- authoritative order lifecycle state

</deferred>

---

*Phase: 06-native-storefront-slice*
*Context gathered: 2026-04-20*
