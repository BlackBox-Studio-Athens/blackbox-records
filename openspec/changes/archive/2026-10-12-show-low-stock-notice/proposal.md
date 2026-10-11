# Show copies left on scarce Store items

## Why

The label wants shoppers to see a clear "x copies left" notice when an item is nearly gone, and to choose per item whether that notice appears. The Store already says Sold Out and Out of Stock, but a stocked item looks the same with one copy left as with fifty.

## What changes

- A per-variant **Show copies left** switch sits beside Restock planned in the protected stock detail, which the item editor's Price & stock tab also shows. It is stored as `Stock.showLowStock` and defaults to off for new and existing items. Writes are revision-checked and leave quantities and the stock ledger unchanged.
- When the switch is on, the item is stocked, and its effective available-to-buy-online stock is between 1 and 5, the Worker adds an optional `lowStockQuantity` to the ready listing-price record and to the ready item Store Offer. Every other item still receives no stock count.
- Store collection cards show "Only N left" in the status slot beside the price, and Buy stays available. The item page shows the same notice above Add To Cart.
- On cards the notice keeps the status chip's exact box and differs from Sold Out only by its Store Blood fill. On the item page it is a 28px tab fused to the top edge of Add To Cart, sharing its width, square 1px edge and display type. It never animates: no dot or pulse, following the rule against fake urgency. It is status text, not a control.

## Scope

Additive D1 migration `0026_stock_show_low_stock.sql`, one protected internal PATCH (`/api/internal/variants/{variantId}/stock/low-stock-notice`), one optional public field on two existing responses, and the regenerated API types. EmDash content gains no commerce field. Checkout, cart storage, holds and stock authority are unchanged. The threshold (5) is fixed in the Worker.

## Acceptance

With the switch on and three copies online, the Store card and the item page read "Only 3 left" and Buy and Add To Cart remain available. With the switch off, with six copies, or at zero, no count appears and existing statuses are unchanged. Focused backend, staff and web tests, the store-cart Playwright spec, strict OpenSpec validation and `pnpm validate` pass.
