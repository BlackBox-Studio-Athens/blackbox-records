## Context

`/store/` renders 81 canonical cards but only `/store/distro/` exposes server-derived Distro format discovery. Both `StoreItemCard` and page-variant `DistroCard` server-render `StoreOfferPriceDisplay` as `client:visible`; the component starts at `Checking price`, shares a four-request queue, and calls the authoritative Store Offer endpoint once per card. UAT Store Offer reads reconcile Stripe and measured roughly 1.8–4.5 seconds, making 81 listing reads visibly slow despite healthy capability, CORS, and UAT price data.

The existing `consolidate-distro-into-store` change classifies `Clothes` as Merch, but no current canonical item is `Clothes`. Its category navigation and sitemap still expose an empty Merch page. That predecessor remains unarchived, so this change must apply only after its acceptance/archive and modify its capability contract rather than invent a second category model.

## Goals / Non-Goals

**Goals:**

- Give All an honest Distro browse handoff with the same server-derived group names and counts as Store Distro.
- Render listing prices from one fast, browser-safe presentation read instead of 81 authoritative Stripe-reconciling reads.
- Keep Store Offer and checkout authority in the Worker; never publish Stripe IDs, stock, checkout eligibility, or a browser-owned amount.
- Remove redundant card actions and make release commerce copy describe an item-specific shop link.
- Make Merch appear automatically when `Clothes` has items and disappear cleanly when it has none.

**Non-Goals:**

- Do not duplicate the Distro catalog inside All, add Store filters/tabs, or change Distro physical-type grouping.
- Do not add a merch source kind, D1 field, Stripe metadata, separate inventory, placeholder product, or manual category count.
- Do not change Store Item detail, cart, checkout, stock, scheduled reconciliation, or provider mutation policy.
- Do not cache presentation data in the browser or CDN beyond the explicit initial `no-store` response policy.

## Decisions

### All exposes a Distro handoff, not a second Distro projection

`/store/` will render a compact Distro panel before its ordinary deduplicated All grid. The panel derives the Distro introduction, total, format names, and counts from the same Distro collection/grouping helpers used by `/store/distro/`; each format link is a base-aware ordinary link to the canonical `/store/distro/#distro-group-*` target.

This avoids rendering the 79 Distro items twice, preserves All's one-card-per-canonical-Store-Item invariant, and keeps no-JavaScript behavior ordinary. It also avoids ambiguous placement for Store Items that belong to both BlackBox Releases and Distro.

Alternative considered: group and filter the All grid in place. Rejected because shared Release/Distro membership makes a unique All placement ambiguous and would introduce a second catalog/search state for the same items.

### Listing prices use a snapshot-backed presentation endpoint

Add one read-only public endpoint for the current listing-price projection. It returns a bounded list of browser-safe records: canonical `storeItemSlug`, a presentation state, and a formatted price only when the current `StoreOfferSnapshot` is fresh and active. Missing, stale, or unusable snapshots return an explicit non-price presentation state. The response must use `Cache-Control: no-store` initially.

The endpoint reads snapshots only. It does not reconcile Stripe, return `canCheckout`, availability, stock, Stripe Price IDs, mapping IDs, provider payloads, or internal errors. Store Item detail still reads the authoritative Store Offer, and checkout still revalidates Worker/D1/Stripe authority before session creation.

Alternative considered: retain four-at-a-time per-card Store Offer reads. Rejected because a 81-card collection serializes slow Stripe reconciliation into roughly 21 visible batches. Static Astro or Decap prices are also rejected because they would violate price authority and go stale after a provider change.

### One shell-owned loader updates plain listing placeholders

Collection cards will emit plain, accessible price placeholders with a Store Item slug rather than 81 Astro React islands. A single `storefront-catalog` entrypoint, mounted by the persistent app shell on Store collection routes, fetches the listing-price projection once and updates current placeholders. It reruns after shell HTML replacement and clears/reloads presentation state when shell snapshots are cached or restored.

This covers direct documents and shell-managed navigation while retaining a closed module boundary: app shell mounts a provided catalog entrypoint, not catalog internals. The existing detail-price component is narrowed to the authoritative detail use case; listing queue/capability behavior is removed rather than retained as a second path.

Alternative considered: add one `client:load` island per collection page. Rejected because shell snapshot application inserts `mainHtml` with `innerHTML` and does not hydrate new Astro islands, leaving navigation-dependent islands inert.

### Merch is a conditional presentation facet

`Clothes` remains the only source signal for Merch. A shared derived “discoverable categories” view will show `Merch` in Store navigation and sitemap only when its collection has at least one canonical item. With zero Merch items, `/store/merch/` is a base-aware redirect to `/store/`; `merch` remains a reserved Store segment.

When a valid Distro `Clothes` item is published, its existing Store Item, availability, stock, price snapshot, Distro membership, and Merch membership automatically make Merch navigable and indexable. No authored navigation data or duplicate commerce identity is added.

Alternative considered: keep an empty Merch shelf or add a coming-soon product. Rejected because neither helps a shopper browse present inventory and both suggest a catalog surface that does not exist.

### Cards communicate one destination

Because collection cards are already one canonical Store Item link, their inner `View Item` / `View in Store` action copy will be removed. The native release commerce label becomes `Shop release`, while external release links remain `Buy merch` to preserve their distinct destination and link attributes.

## Risks / Trade-offs

- [A price snapshot is stale or missing] → Render a clear non-price state, never a guessed amount; Store Item detail and checkout remain authoritative.
- [Shell cache restores a prior rendered price] → Sanitize listing price placeholders in snapshots and run the single loader after each Store collection activation.
- [Listing price response grows with catalog size] → Return only compact current projection fields; current 81-item response is bounded. Add pagination or route-specific projection only after measured need.
- [A zero-item Merch bookmark is opened] → Use a base-aware ordinary redirect to Store while retaining the reserved route segment.
- [Distro group content changes] → Derive All handoff counts and targets from the existing grouping helper during each static build; do not copy counts into content or navigation JSON.

## Migration Plan

1. After `consolidate-distro-into-store` is archived, add the snapshot projection read seam, public route, OpenAPI contract, generated client, and Worker/API tests with no provider mutation.
2. Replace listing islands with placeholders and mount the one catalog-owned loader through the app shell; retain detail Store Offer reads.
3. Add the All Distro handoff, conditional Merch discovery/redirect/sitemap behavior, and CTA copy cleanup.
4. Validate exact direct and shell-navigated Store routes, UAT first-viewport price readiness, no repeated per-card Store Offer requests, Distro format targets, zero and populated Merch cases, and existing checkout authority tests.
5. Deploy through normal UAT/PRD static and Worker pipelines. Roll back by reverting the change; no D1 or provider migration is required.

## Open Questions

None. The initial endpoint intentionally uses `no-store`; a later cache policy requires separate freshness evidence.
