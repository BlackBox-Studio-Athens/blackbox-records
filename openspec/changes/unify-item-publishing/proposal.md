# Proposal

## Why

A label member lost a price change twice. An item offers four separate commit actions: Publish changes (Details tab only), Publish item to shop, Change price and Save stock change. A typed price stays in the form until its own button is pressed, the header still says the changes are saved, and publishing afterwards offers to discard it. On items that are for sale, Publish changes also leaves the checkout listing stale until the separate shop publication runs.

## What Changes

- One Publish changes action on both item tabs, counting every change that is not live: saved details and photos, and the staged price.
- A typed price is saved as an EmDash draft through the `blackbox-editorial` plugin (plugin KV with compare-and-set), visible to every member on any device and in Review changes. It is never Price Authority and never public content.
- Publishing an item runs one reviewed sequence: the existing authorized price command first, then the existing item publication (checkout projection plus website) for items on sale, or content publication otherwise. The first sale is a checkbox in the same review.
- Stock stays an immediate operation, labelled as such and excluded from publishing.
- The separate Publish item to shop and Change price buttons leave the item editor.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-item-management`: one publish action per item, staged EmDash price drafts, reviewed price command.
- `staff-workspace`: review discovery includes items whose only change is a price draft; shop activation is approved in the item review.
- `emdash-editorial-operations`: the editorial plugin stores price drafts.

## Impact

Staff item editor, price and selling components, publication review, workspace discovery, the EmDash editorial plugin and the CMS request guard. No database migration, public API change, commerce command change or new dependency beyond the official shadcn `item` and `empty` primitives. Existing price, stock, publication and checkout safeguards are unchanged.
