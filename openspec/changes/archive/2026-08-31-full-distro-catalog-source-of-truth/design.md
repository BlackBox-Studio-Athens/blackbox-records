## Context

scripts/data/distro-inventory-source.json now contains 101 emitted rows, two rows marked as historical current-site-extra provenance, and one rejected duplicate record. Astro content and generated/provider artifacts are consumers, not competing authorities.

## Goals / Non-Goals

**Goals:**

- Keep one machine-validated inventory and pricing source.
- Make aliases, duplicates, exceptions, pricing, and artwork decisions explicit.
- Keep fixed and pay-what-you-want checkout behavior safe and provider-owned.

**Non-Goals:**

- Copying the inventory into design.md or another planning file.
- CMS-authored price/provider/stock controls.
- Live PRD cleanup, reset, or promotion.

## Decisions

### The JSON manifest is the only inventory authority

Every emitted item is one row with stable id, source artist/title, item type, source price, resolved price policy, release date, provenance flag, and aliases. Validation requires unique emitted IDs and normalized canonical identities.

rejectedDuplicateRows records source evidence that must not emit an item. Its duplicateOf value must resolve to one emitted canonical row. The Living Under Drones Knot On Knot? row resolves to Knot On Knot.

currentSiteExtra is provenance only. Exactly the approved Spinners and Wreckquiem rows use it; false does not create a second source hierarchy. Existing Astro content may supply editorial copy, corrected display casing, and images after identity matching, but cannot add an emitted item absent from the manifest.

### Matching preserves known decisions

Aliases normalize known spelling/casing differences before content creation. The manifest retains the accepted decisions for Magic Sleazeball Corrida, Hey Stealthy, Endless Searcher, Goodbye, Kings, Sadhus/Big Fish, One Leg Mary, We.own.the.sky, and the real Calf Vinyl 10-inch item.

One canonical row can map to one content entry. Validation rejects duplicate normalized artist/title/type identities, unapproved current content, dangling aliases, and emitted rejected rows.

### Pricing is a closed discriminated policy

The manifest has EUR-only pricing:

- numeric source price → fixed amount in minor units;
- ΕΣ → pay what you want with minimum 100, preset 500, maximum 10000;
- blank → format default: Vinyl 12-inch 2000, Vinyl 10-inch 2000, Vinyl 7-inch 1500, Tape 500, CD 1000.

Generated price types distinguish fixed and pay-what-you-want; impossible combinations are rejected before artifacts are written. Stripe maps them to unit_amount or custom_unit_amount. Checkout still sends only the authoritative Stripe Price ID, and paid amount comes from verified provider data.

### Artwork is evidence-backed

Matched repository artwork is reused. Missing or uncertain artwork goes through tools/artwork-fetcher. Generic fallback is allowed only for a recorded known-missing result, including the accepted Vagina Lips case unless later verified artwork replaces it.

### Rollout ownership ends at UAT proof

The implementation generated and validated artifacts, applied UAT state, and proved fixed and pay-what-you-want paid paths. PRD provider choice, cleanup, secrets, and live mutation remain in production-go-live-readiness. This completed change carries no PRD apply task.

## Risks / Trade-offs

- [Manifest and content diverge] → Fail generation/check when canonical identities or emitted membership differ.
- [Alias maps two items] → Reject non-unique normalized matches before creating content.
- [Custom price shape is malformed] → Use the closed generated price union and fail before Stripe apply.
- [Artwork cannot be found] → Require known-missing evidence before fallback.

## Migration Plan

Implementation and UAT proof are complete. Sync the durable requirements to main specs, validate, and archive. Future catalog edits modify the manifest once and regenerate projections; they do not update an OpenSpec row table.
