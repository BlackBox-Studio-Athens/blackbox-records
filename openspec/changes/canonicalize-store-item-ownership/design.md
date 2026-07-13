## Context

The current projection independently turns three Releases and 79 Distro records into 82 Store Items. `release:caregivers` and `distro:chronoboros-caregivers-vinyl` describe one physical vinyl edition, so they currently create two Store Items, variants, readiness rows, stock buckets, and provider projections. The intended catalog has 81 physical sellable editions.

Editorial content must remain free of CMS-authored commerce controls. Store Item ownership therefore belongs at the code-owned projection boundary, while Stripe remains Price Authority and D1 remains operational authority.

## Goals / Non-Goals

**Goals:**

- Give every physical sellable edition one Store Item owner, slug, and current standard variant.
- Let a non-owning Release link to the owner's Store Item.
- Reject ambiguous catalog identity before artifacts are emitted.
- Make Store Offer combinations coherent in TypeScript and the public schema.
- Migrate `Caregivers` without discarding historical provider or order evidence.

**Non-Goals:**

- A PIM, `CatalogItem`, database relationship redesign, or CMS commerce fields.
- General multi-variant support.
- Changing Stripe Price Authority or D1 stock authority.

## Decisions

1. Add one code-owned Release-to-Distro relation table at the Store Item projection boundary. Each row contains only `{ releaseId, distroId, storeItemSlug }`; the relation type makes Distro the canonical owner, so an independent `ownerKind` cannot contradict it. This is smaller and safer than commerce fields in editorial content.
2. For a related edition, the Distro projection uses the relation's Store Item slug, the Release projection is omitted, and Release commerce lookup resolves the same Distro-owned Store Item. For `Caregivers`, the relation is `caregivers` → `chronoboros-caregivers-vinyl` → `caregivers-vinyl`; the current variant remains `variant_caregivers-vinyl_standard`.
3. A single validation pass builds the complete projection and rejects missing relation endpoints, repeated Release or Distro endpoints, reserved or duplicate Store Item slugs, duplicate variant IDs, duplicate source tuples, non-bijective inventory matches, and unresolved cross-source physical duplicates. Provider, availability, and stock generators consume only that validated projection.
4. Model the application and HTTP Store Offer as a union discriminated by `catalogStatus`:
   - `ready`: available, `canCheckout: true`, non-null price.
   - `sold_out`: sold out, `canCheckout: false`, null price.
   - `catalog_drift`: unavailable, `canCheckout: false`, null price.

   Existing response fields remain; their literal combinations become constrained. This avoids a new response shape while preventing contradictory states in code and generated clients.

5. The Distro Inventory Source continues to supply the `Caregivers` Desired Price of 2000 cents. Runtime amount and currency still come from the resolved Stripe Price.

## Risks / Trade-offs

- [Changing the canonical source can orphan operational rows] → Preserve the canonical slug and variant, update their source ownership, and retire only the duplicate operational identity after dependency checks.
- [A future shared edition may need Release ownership] → Add that case only when real data requires it; the current relation deliberately represents only the approved Distro-owned case.
- [A stricter public union can expose existing contradictory fixtures] → Update fixtures through the same constructors and fail the contract tests until every branch is coherent.

## Migration Plan

1. Add the relation and projection validation; prove the generated catalog has 81 unique Store Items and one `Caregivers` variant.
2. Regenerate Desired Catalog State and Product Projections from the canonical Distro owner at 2000 cents.
3. Update the canonical `caregivers-vinyl` option's source to the Distro record. Retire duplicate `chronoboros-caregivers-vinyl` availability, stock, mapping, and snapshot rows only after checking references; do not delete provider objects, order rows, or historical evidence.
4. Dry-run catalog reconciliation before any environment-scoped apply. Roll back by restoring the prior projection and seed rows; no schema rollback is required.

## Open Questions

None.
