# Tasks

## 1. Worker

- [x] 1.1 Add `Stock.showLowStock` (default false) with an additive migration and regenerated Prisma client; map it through stock, operator stock, finalization and listing repositories.
- [x] 1.2 Add `readLowStockQuantity` beside the shared availability classifier: a count only for stocked items with the switch on and effective stock 1–5.
- [x] 1.3 Add optional `lowStockQuantity` to the ready listing-price record and ready Store Offer; regenerate the public OpenAPI document and client types.
- [x] 1.4 Add the revision-checked protected `low-stock-notice` PATCH, stock-detail field and hypermedia action; regenerate the internal OpenAPI document and client types.

## 2. Staff

- [x] 2.1 Add the Show copies left switch beside Restock planned in stock detail, sharing one switch component, plus the internal API client method.

## 3. Storefront

- [x] 3.1 Show "Only N left" in the Store card status slot while keeping Buy, and above Add To Cart on the item page, styled as a static Store Blood status: the card chip's box on cards and a tab fused to Add To Cart on the item page.

## 4. Acceptance

- [x] 4.1 Cover the classifier, readers, D1 repository, staff client, card presenter and item purchase state with focused tests, and the card in `e2e/store-cart.spec.ts`.
- [x] 4.2 Run strict OpenSpec validation and `pnpm validate` on the final tree; record evidence in validation.md.
- [x] 4.3 Repair the stale button typography assertion and include its global stylesheet in the test cache inputs; verify locally and through the UAT release checks.

## 5. Release

- [x] 5.1 Fast-forward `main`, follow the Release BlackBox run through the UAT D1 migration (`0026_stock_show_low_stock.sql`), Worker and Pages deploys, and check the UAT public API and Store. Staff confirm the Show copies left switch on one scarce item. Closed 2026-10-12: released through ordinary runs; migration 0026 is live in UAT and PRD, and UAT staff used Show copies left on Disintegration (redesign-home-preorder-showcase validation, 5 October).
- [x] 5.2 Promote the verified UAT candidate through the PRD acceptance gates (user-triggered) and confirm the notice on PRD. Promoted in PRD release `047c3ae4`. Not observed on PRD: no item has Show copies left enabled (listing read 2026-10-12), so the notice appears on first staff use; CI's store-cart spec covers the card.
- [x] 5.3 Sync delta specs and archive this change only after PRD acceptance. Archived 2026-10-12.
