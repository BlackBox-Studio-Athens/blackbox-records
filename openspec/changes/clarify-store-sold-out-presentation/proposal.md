# Proposal

## Why

Make unavailable Store Items clear and recognizable, and remove four small sources of friction in staff review and selling. Reuse existing labels, draft operations, review discovery, and thumbnail delivery.

## What Changes

- Correct Worker availability labels and show purchase state in the selected compact control. Share its 224 × 54 px desktop footprint and responsive mobile width across enabled and disabled states; distinguish Sold Out from Out of Stock with a subtle tone change.
- Add a per-item Restock planned switch to protected stock operations and Store Item setup. It defaults to false for new and existing items. At zero available-to-buy-online stock, shoppers see Out of Stock when restock is planned and Sold Out otherwise; Releases and Distro share the rule.
- Remove adjacent duplicate purchase headings and contradictory add-to-cart instructions; retain standalone summary feedback, existing navigation, and listening.
- Add Discard saved changes to eligible entries in the global Review changes list.
- Disable Review changes controls visually and functionally when their scope has no changes, including the distinction between saved drafts and unsaved edits.
- Diagnose and repair missing staff thumbnails, including the reported Disintegration release, through the existing private derivative path.
- Replace the live-price checkbox wording with Apply this price to the live shop, preserving the current confirmation gate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commerce-checkout`: Accurate, non-duplicated purchase status.
- `staff-workspace`: Discard from global review, meaningful review-control disabled states, working compact artwork, and per-item restock intent.
- `staff-item-management`: Clear live-price confirmation wording.

## Impact

Existing Worker label selection, shared Store purchase/price components, protected stock operations, Store Item setup, staff review/editor controls, thumbnail resolution or preparation, and price-editor copy. Add one `Stock.restockPlanned` field with a false default, an additive migration, a protected internal stock operation, and regenerated internal API types. No shopper Store Offer field, dependency, cart-checkout redesign, or commerce authority change.

The existing change identifier is retained for continuity. The five requested improvements remain independently implementable slices.
