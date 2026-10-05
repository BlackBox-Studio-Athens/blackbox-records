# Tasks

Each group from 2 to 30 is one slice for one delegated implementer (Sonnet 5.5, high effort, at most four at once). The orchestrator briefs, reviews and commits only. "Owns" lists every file the slice may edit; `prisma:generate` outputs are included for the slice that runs it, while the generated API outputs (`apps/backend/openapi/**`, `packages/api-client/src/generated/**`) belong to the gate agent, which runs `pnpm generate:api` once per run. Runs and their order are in design.md, Appendix C. Paths starting with `BE/` are under `apps/backend/src/`, `WEB/` under `apps/web/src/`, `STAFF/` under `apps/staff/src/`. Every check command names one target and writes its output to a file; no pipes.

## 1. Preparation

- [x] 1.1 Every UI slice brief tells its implementer to load the `impeccable` skill and follow its setup and gates, with the approved canvas as the shape approval; the gate outcomes reported by the implementers are recorded in `validation.md`. Verify the first UI slice report states them.
- [x] 1.2 Record the base commit and the open changes on the same capabilities in `validation.md`, and confirm `pnpm openspec -- validate add-store-preorders --type change --strict --allow-worktree` passes.

## 2. B0 Order index migration (run 1, backend agent, first commit)

Owns: `apps/backend/prisma/migrations/0027_checkout_order_created_at_id_index.sql` (new), the folder `apps/backend/prisma/migrations/20260917120000_staff_order_pagination/` (delete), `apps/backend/test/scripts/migration-files.test.ts` (new), `BE/infrastructure/persistence/prisma/order-search.worker.test.ts`.

- [x] 2.1 Add migration 0027 with `CREATE INDEX IF NOT EXISTS "CheckoutOrder_createdAt_id_idx" ON "CheckoutOrder"("createdAt", "id");` and delete the folder-style migration. Verify with a new assertion in `order-search.worker.test.ts` that `PRAGMA index_list("CheckoutOrder")` contains the index: `pnpm test commerce-persistence`.
- [x] 2.2 Add `migration-files.test.ts`: every entry in `prisma/migrations` is a file named `NNNN_snake_case.sql`, numbers are unique and consecutive from 0001 through the last file (0026 is `0026_stock_show_low_stock.sql` of the low-stock change, 0027 the new index migration). Verify it fails when a folder is present and passes now: `pnpm test backend-tooling`.

## 3. B1 Stock pre-order state (run 1, backend agent, second commit)

Owns: `apps/backend/prisma/migrations/0028_stock_preorder.sql` (new), `apps/backend/prisma/schema.prisma`, `BE/generated/prisma/**`, `BE/domain/commerce/preorder.ts` and `preorder.test.ts` (new), `BE/domain/commerce/index.ts`, `BE/domain/commerce/repositories/stock-repository.ts`, `BE/infrastructure/persistence/prisma/prisma-stock-repository.ts`, `BE/infrastructure/persistence/prisma/d1-operator-stock-repository.ts`, `BE/interfaces/http/routes/d1-paid-checkout-finalization-repository.ts`, every backend or script file that builds a `StockRecord` literal (find them with `rg -n "restockPlanned" apps/backend scripts`), `UBIQUITOUS_LANGUAGE.md`.

- [x] 3.1 Add migration 0028 with the four nullable text columns, the `CHECK`s of design decision 1 and the partial index `"Stock_preorderStartedAt_idx"` on `"preorderStartedAt"` where it is not null; mirror the columns in `schema.prisma` as `String?`; run `pnpm --filter @blackbox/backend prisma:generate`. Verify migrations apply in the worker tests: `pnpm test commerce-persistence`.
- [x] 3.2 Add `domain/commerce/preorder.ts` exactly as design decision 2 and export it from the domain `index.ts`. Cover: Athens date across midnight and DST, month current/passed, exact date before/on/after, malformed input, `latestShipEstimate` ordering and nulls. Verify: `pnpm test commerce-domain`.
- [x] 3.3 Add `preorder: StockPreorder | null` to `StockRecord` beside `restockPlanned` and `showLowStock`; map it in the three stock row mappers through `stockPreorderFromColumns`, selecting the new columns wherever a column list is explicit (including `readStock` in the operator repository and the finalization repository's stock select). Add `preorder: null` to every `StockRecord` literal in backend tests and fakes. Verify, one command each: `pnpm test commerce-persistence`, `pnpm test public-commerce-http`, `pnpm test stock`, `pnpm test checkout-core`, `pnpm test orders`.
- [x] 3.4 Add Pre-order, Ship Estimate and Awaiting Stock to `UBIQUITOUS_LANGUAGE.md` with the definitions of the project-language delta. Verify the three terms appear once each.

## 4. W1 Tokens and styles (run 1)

Owns: `WEB/styles/global.css`, `DESIGN.md`, `DESIGN.json`, `PRODUCT.md`.

- [x] 4.1 Add the three `--preorder-accent*` tokens and every selector of design Appendix A to `global.css`, following the neighbouring Store availability, button and home section rules (the `low_stock` chip and `.store-low-stock*` rules stay as they are); honour the stated rules (outline badges, 3px base line with hover/focus fill, existing Veneer sizes, 44px targets, reduced motion). Verify existing style tests still pass, one command each: `pnpm test storefront-catalog`, `pnpm test web-layouts`, `pnpm test web-pages`, `pnpm test ui-foundation`, `pnpm test app-shell`.
- [x] 4.2 Document the accent, its allowed uses and the pre-order components in `DESIGN.md` and `DESIGN.json`, and add pre-orders to the Store description in `PRODUCT.md`. Verify the token values in the documents equal the CSS values.

## 5. W2 Wording helper (run 1)

Owns: `WEB/platform/lib/preorder-estimate.ts` and `preorder-estimate.test.ts` (new), `WEB/platform/project.json`.

- [x] 5.1 Implement `ShipEstimate`, `shipEstimateText`, `preorderBadges`, `preorderChipText` and `latestShipEstimate` per design decision 10, with no imports outside `web-platform`, and export the file in `project.json`. The test asserts every row of both wording tables, the withheld and no-release-date cases, and the UTC-day release rule. Verify: `pnpm test web-platform`.

## 6. B2 Offer contract (run 3)

Owns: `BE/application/commerce/checkout/types.ts`, `BE/application/commerce/checkout/read-store-offer.ts`, `BE/application/commerce/checkout/checkout-use-cases.test.ts`, `BE/interfaces/http/contracts/public-contracts.ts`, `BE/interfaces/http/routes/public-commerce-routes.test.ts`, `packages/api-client/src/test/msw-handlers.ts`, typed `PublicStoreOffer` fixtures in web tests (`WEB/components/store/*.test.*`, `WEB/components/store/checkout/*.test.*`, `apps/web/test/commerce/**`).

- [x] 6.1 Add `preorder` to the ready `StoreOffer`, beside `lowStockQuantity`, and set it in `readStoreOffer` from the stock record with `deriveShopperPreorder(…, athensToday(now))`, taking an optional `now`; every ready offer, including the variants listing, is built through `readyOffer`. Cover ready pre-order, withheld month, exact date reached, ordinary item, sold-out pre-order, and a pre-order that also carries `lowStockQuantity`. Verify: `pnpm test checkout-core`.
- [x] 6.2 Add `PublicShipEstimate` and `PublicStorePreorder` to the public contract on the ready branch only, and add `preorder: null` (or a pre-order where a test needs one) by hand to msw handlers and every typed offer fixture the new field breaks. Verify, one command each: `pnpm test public-commerce-http`, `pnpm test @blackbox/api-client`, `pnpm test checkout-web`, `pnpm test web-store`, `pnpm test commerce-web-integration`.

## 7. S1 Partner links schema (run 1)

Owns: `packages/content-model/src/schemas.ts`, `BE/cms/catalog-schema.ts`, `BE/cms/catalog-schema.test.ts`, `scripts/cms-content-schema.test.mjs`, `WEB/lib/content-files/content-snapshot.test.ts`.

- [x] 7.1 Add `partner_links` to the release schema as in design decision 13 and register it in `prepareCatalogSchema` beside `singles` and `clips` with the same type check. Cover a valid list, an empty label, a non-HTTPS URL and a release without the field. Verify, one command each: `pnpm test cms-runtime`, `pnpm test web-content-files`, `pnpm test scripts/cms-content-schema.test.mjs`.

## 8. W3 Store card markup (run 2)

Owns: `WEB/components/store/StoreItemCard.astro`, `WEB/layouts/StoreCollectionPage.test.ts`.

- [x] 8.1 Add `data-store-release-date` (ISO date, omitted without one) on the availability placeholder, the hidden `data-store-listing-release-status` span reading `Out now` with class `store-item-card__release-status`, a hidden span with `data-store-listing-preorder` and class `store-item-card__preorder`, and `data-store-card-buy-label="Buy"` on the button. No visible change without JavaScript. Verify with markup assertions in `StoreCollectionPage.test.ts`: `pnpm test web-layouts`.

## 9. B3 Listing contract (run 4)

Owns: `BE/domain/commerce/repositories/store-offer-snapshot-repository.ts`, `BE/infrastructure/persistence/prisma/prisma-store-offer-snapshot-repository.ts`, `apps/backend/test/integration/checkout/listing-price-presentation.worker.test.ts` (its worker test), `BE/application/commerce/checkout/readers/store-listing-price-reader.ts` and its test, `BE/interfaces/http/contracts/public-contracts.ts`, `BE/interfaces/http/routes/register-public-commerce-routes.ts`, `public-commerce-services.ts`, `BE/interfaces/http/routes/public-commerce-routes.test.ts`, `packages/api-client/src/test/msw-handlers.ts`, typed `PublicStoreListingPrice` fixtures in web tests (`WEB/components/store/StoreListingPricePresentation.test.ts`, `WEB/components/app-shell/**/*.test.*`).

- [x] 9.1 Select the four stock pre-order columns in the existing single listing query (beside `showLowStock`), carry them on the snapshot record's `stock`, and report `preorder` on both listing branches through `deriveShopperPreorder`, independent of `availabilityState` and beside the ready branch's `lowStockQuantity`. Add the pre-orders-only variant of the same query (`WHERE stock."preorderStartedAt" IS NOT NULL`), returning only records whose derived pre-order is not null. Keep one query per read. Cover stocked, sold-out, withheld, date reached, no stock row, a pre-order with `lowStockQuantity`, and the narrowed read. Verify, one command each: `pnpm test checkout-core`, `pnpm test commerce-persistence`, `pnpm test checkout-integration`.
- [x] 9.2 Add the field to both branches of `PublicStoreListingPrice` and the optional `scope=preorders` query to the listing route; update the field allow-list test so `preorder` is allowed (beside `lowStockQuantity`) and `preorderStartedAt` and quantities stay forbidden; repair msw handlers and typed listing fixtures by hand. Verify, one command each: `pnpm test public-commerce-http`, `pnpm test @blackbox/api-client`, `pnpm test web-store`, `pnpm test app-shell`.

## 10. W6 Cart field and purchase action (run 4)

Owns: `WEB/components/store/cart/store-cart.ts`, `store-cart.test.ts`, `WEB/components/store/checkout/StoreItemPurchaseActions.tsx`, `StoreItemPurchaseActions.test.tsx`, `apps/web/test/commerce/StorePurchaseFlow.test.ts`.

- [x] 10.1 Add optional `preorder` to `CartLineItemSnapshot` and its zod schema (local schema for the estimate shape), keeping carts stored without it valid. Verify with parse tests for old carts, valid and malformed pre-order data: `pnpm test store-cart`.
- [x] 10.2 Copy `offer.preorder` into the cart item in `createCartLineItemSnapshotFromWorkerOffer`; when the active cart item is a pre-order the control reads `Pre-order`, carries class `preorder-action`, and shows the hint of design Appendix B; the low-stock tab above the control (`lowStockLabel`, `store-low-stock-purchase`) is unchanged and still shows for a pre-order. Pending, unavailable and Added states are unchanged. Verify, one command each: `pnpm test checkout-web`, `pnpm test commerce-web-integration`.

## 11. S2 Partner links in staff (run 2)

Owns: `STAFF/components/content/ContentFields.tsx`, `ContentFields.test.tsx`, `STAFF/components/publication/PublicationComparison.tsx`, `PublicationComparison.test.tsx`, `scripts/test-content-workspace.mjs`, `docs/content-workspace.md`.

- [x] 11.1 Add `partner_links` rows (`Store name`, `Store link`) under Music & listening links after Singles, with the review label `Partner store links` (asserted in `PublicationComparison.test.tsx`). Verify add, edit, remove and field errors: `pnpm test staff-content`, then `pnpm test staff-publication`.
- [x] 11.2 Extend the release scenario in `scripts/test-content-workspace.mjs` beside its Singles steps (the script runs at release tier, so only keep it syntactically valid: `node --check scripts/test-content-workspace.mjs`) and document the field in `docs/content-workspace.md`.

## 12. B4 Staff pre-order command (run 2)

Ownership clarification from run 2 review: B4 also owns `BE/interfaces/http/stock/project.json` to declare the `commerce-domain` dependency already required by the approved module-boundaries delta. This is a dependency declaration, not an ownership exception or additional product behavior.

Owns: `BE/application/commerce/stock/set-stock-preorder.ts` (new), `BE/application/commerce/stock/index.ts`, `types.ts`, stock read use case files and `stock-use-cases.test.ts`, `BE/domain/commerce/repositories/operator-stock-repository.ts`, `BE/infrastructure/persistence/prisma/d1-operator-stock-repository.ts` and its worker test, `BE/interfaces/http/stock/register-internal-stock-routes.ts`, `internal-stock-services.ts`, `internal-contracts.ts`, `BE/interfaces/http/internal-stock-routes.test.ts`, `BE/interfaces/http/openapi/api-documents.worker.test.ts`, `apps/backend/test/integration/stock/**`, `packages/api-client/src/test/msw-handlers.ts`, typed `InternalStockDetail` fixtures in staff tests, `docs/commerce-operations.md`, `README.md`.

- [x] 12.1 Implement `setStockPreorder` (use case and repository method) per design decision 7, modelled on `setShowLowStock` and `setRestockPlanned` (`set-show-low-stock.ts`, and `setStockFlag` in the D1 repository): start, edit keeping the cycle key, end, new cycle after a passed date, no-op on an equal estimate, validation, revision conflict, zero-quantity row creation. Verify, one command each: `pnpm test stock`, `pnpm test commerce-persistence`.
- [x] 12.2 Add the route, `SetStockPreorderBody`, `InternalStockState.preorder` with `open` (beside `showLowStock`), the hypermedia action beside `set-restock-planned` and `set-show-low-stock`, and the path after low-stock-notice in the ordered list; repair msw handlers and typed staff stock fixtures by hand. Verify, one command each: `pnpm test operator-stock`, `pnpm test public-commerce-http`, `pnpm test stock-integration`, `pnpm test staff-platform`, `pnpm test staff-stock`.
- [x] 12.3 Document the staff procedure in `docs/commerce-operations.md` (enter expected copies as stock, start, change, Copies arrived, exact-date behaviour, recount on arrival) and add the operation where `README.md` lists stock operations. Verify every relative link added to the document resolves to an existing file.

## 13. W4 Listing connector (run 5)

Owns: `WEB/components/store/StoreListingPricePresentation.ts`, `StoreListingPricePresentation.test.ts`.

- [x] 13.1 Apply pre-order presentation from the projection per design decision 11: badges through the wording helper and the card's release date (the pre-order badge is written into the `data-store-listing-preorder` span and un-hidden, not into the availability slot), `data-store-preorder` on the card root, `Pre-order` label and `preorder-action` on the button (shown only when ready and stocked), the correct label after Added, and the `blackbox:store-listing-applied` event. The `low_stock` state and `Only N left` text stay as they are. `sanitizeStoreListingPricePlaceholders` clears every one of these. The file gains no import other than the wording helper. Cover pending, failed, missing item, older response without the field, sold-out pre-order, a stocked pre-order with `lowStockQuantity`, withheld estimate, before and after the release date, and snapshot sanitising. Verify: `pnpm test web-store`, then `pnpm test app-shell`.
- [x] 13.2 Give `readPublicStoreListingPrices` an optional `{ scope: 'preorders' }` that requests the narrowed projection; Store collection activation keeps the complete read. Verify the requested URL in both modes: `pnpm test web-store`.

## 14. W9 Store Item facts panel (run 4)

Owns: `WEB/components/store/StoreOfferPriceDisplay.tsx`, `StoreOfferPriceDisplay.test.tsx`, `WEB/pages/store/[slug]/index.astro`.

- [x] 14.1 Add `releaseDate` and `preorderFacts` props; when the ready offer is a pre-order render the facts list (`preorder-facts`) under the price with the rows of design Appendix B. Other uses of the component are unchanged. Pass both props from the Store Item page only. Cover before and after release, withheld, exact date, ordinary and non-ready offers. Verify: `pnpm test web-store`, then `pnpm test web-pages`.

## 15. B5 Order-line snapshot (run 2)

Owns: `apps/backend/prisma/migrations/0029_order_line_preorder.sql` (new), `apps/backend/prisma/schema.prisma`, `BE/generated/prisma/**`, `BE/domain/commerce/repositories/order-state-repository.ts`, `checkout-stock-hold-repository.ts`, `BE/application/commerce/checkout/types.ts`, `start-checkout.ts`, `checkout-use-cases.test.ts`, `BE/infrastructure/persistence/d1-checkout-stock-hold-repository.ts` and its worker test, `BE/infrastructure/persistence/prisma/prisma-order-state-repository.ts`, `BE/interfaces/http/routes/d1-paid-checkout-finalization-repository.ts`, `apps/backend/test/integration/checkout/**`.

- [x] 15.1 Add migration 0029 with the four columns on `CheckoutOrderLine`, mirror in `schema.prisma`, run `pnpm --filter @blackbox/backend prisma:generate`. Verify: `pnpm test commerce-persistence`.
- [x] 15.2 Snapshot the pre-order on each validated line in `start-checkout.ts` per design decision 5, persist it in the hold repository insert, and map it in both order line readers (every explicit column list included). The Stripe request stays byte-identical. Cover pre-order, withheld, ordinary and mixed carts, and that the gateway receives no new field. Verify, one command each: `pnpm test checkout-core`, `pnpm test commerce-persistence`, `pnpm test public-commerce-http`, `pnpm test checkout-integration`, `pnpm test orders`.

## 16. W5 Pre-orders filter and notes (run 6, runs e2e)

Owns: `WEB/components/store/StoreDistroSearch.tsx`, `StoreDistroSearch.test.ts`, `e2e/store-preorders.spec.ts` (new).

- [x] 16.1 Count `data-store-preorder` cards on mount and on `blackbox:store-listing-applied`; render the `Pre-orders` toggle with its count only when the count is positive; filter with the existing hidden attribute alongside search, artist and format; render the three notes while on; start on for `#preorders`; turn off when the count drops to zero; include it in Clear filters. Verify: `pnpm test web-store`.
- [x] 16.2 Add `e2e/store-preorders.spec.ts` with its own `page.route` stub of the listing projection: badges before and after the release date, the toggle appearing, filtering, the notes, keyboard operation, the `#preorders` entry, and no toggle when the stub has no pre-order; any 390px case sets the viewport inside the test, because the mobile Playwright project only runs routes, shell-navigation and store-cart. Verify: `pnpm test:e2e e2e/store-preorders.spec.ts`.

## 17. W7 Cart drawer (run 6)

Owns: `WEB/components/store/cart/PreorderCartNotice.tsx` and its test (new), `WEB/components/store/cart/StoreCartDrawer.tsx`, `StoreCartDrawer.test.tsx`, `WEB/components/store/cart/project.json`.

- [x] 17.1 Add `PreorderCartNotice` (heading, two-step rail, sentence; latest estimate across lines; `When it arrives` when withheld) and export it. In the drawer, pre-order lines show the pre-order chip text with `preorder-badge`, and the notice appears once above the delivery summary when any line is a pre-order. Verify: `pnpm test store-cart`.

## 18. B6 Awaiting stock (run 4)

Owns: `BE/domain/commerce/repositories/order-state-repository.ts`, `stock-repository.ts`, `BE/infrastructure/persistence/prisma/prisma-order-state-repository.ts`, `prisma-stock-repository.ts`, `order-search.worker.test.ts`, `BE/application/commerce/orders/internal-order-services.ts`, `register-internal-order-routes.ts`, order read use cases and `order-use-cases.test.ts`, every `StockRepository` fake (`rg -n "implements StockRepository" apps/backend`: `BE/application/commerce/stock/stock-use-cases.test.ts`, `BE/application/commerce/checkout/checkout-use-cases.test.ts`, `BE/application/commerce/orders/paid-checkout-reconciliation.test.ts`), `BE/interfaces/http/internal-order-routes.test.ts`, `STAFF/components/orders/order-fixtures.test-support.ts`.

- [x] 18.1 Add the open-cycle read to the stock repository and the awaiting filter to `listRecent` per design decision 6, with the `ponytail:` ceiling comment and the empty-cycles short circuit. Cover open, ended, date passed, re-pre-ordered variant, pagination and combination with search and notification filters. Verify, one command each: `pnpm test commerce-persistence`, `pnpm test stock`, `pnpm test checkout-core`.
- [x] 18.2 Compute `awaitingStock` for list, search and detail in the order services; add `awaitingStock` to `InternalCheckoutOrder`, `preorder` to current fulfilment lines, and `awaitingStock=true` to the search query; repair the staff order fixture by hand. Verify, one command each: `pnpm test orders`, `pnpm test public-commerce-http`, `pnpm test staff-orders`.

## 19. S3+S4 Staff stock client and pre-order control (run 3)

Owns: `STAFF/lib/backend/internal-stock-api.ts`, `STAFF/lib/backend/internal-stock-api.test.ts`, `STAFF/components/stock/PreorderControl.tsx` and test (new), `STAFF/components/stock/preorder-preview.ts` and test (new), `STAFF/components/stock/StockOperationsApp.tsx`, `StockOperationsApp.test.tsx`, `docs/backoffice-design.md`.

- [x] 19.1 Add `SetStockPreorderBody` and `setStockPreorder(variantId, body)` beside `setRestockPlanned` and `setShowLowStock`, same error handling. Verify request shape, success and 409: `pnpm test staff-platform`.
- [x] 19.2 Add `preorder-preview.ts` (wording table of design decision 10 and the "What shoppers see" rows for month, passed month, exact date and ended) and `PreorderControl` with the copy of design Appendix B, native selects and date input, labelled controls and keyboard operation. The month select offers the current Athens month and the following 17; a stored month that has passed stays selected with the passed-month warning. Verify: `pnpm test staff-stock`.
- [x] 19.3 Mount it under the existing Restock planned and Show copies left switches with a handler modelled on `handleRestockPlannedChange` and `handleShowLowStockChange` (revision, refresh after success or failure, 409 message, disabled while submitting or without fresh stock). Verify start, change, Copies arrived, conflict and validation error in `StockOperationsApp.test.tsx`: `pnpm test staff-stock`. Note the control in `docs/backoffice-design.md`.

## 20. W10 Partner links and singles on the Store Item page (run 5, runs e2e)

Owns: `WEB/pages/store/[slug]/index.astro`, `WEB/pages/_store-item-detail-gallery.test.ts` or a new sibling page test, `e2e/store-item-preorders.spec.ts` (new).

- [x] 20.1 Render partner links (`Outside Greece? Order <title> from …`, safe external links) under the purchase information and a `Singles` list reusing the release page's list markup, both static and only when the source release has them. Verify with page markup tests: `pnpm test web-pages`.
- [x] 20.2 Add `e2e/store-item-preorders.spec.ts`, covering the Store Item page only, with its own stub of a ready pre-order offer: facts panel, `Pre-order` control, partner links, singles, and the cart count after adding; the 390px case sets the viewport inside the test, because the mobile Playwright project only runs routes, shell-navigation and store-cart. Verify: `pnpm test:e2e e2e/store-item-preorders.spec.ts`.

## 21. B7 Checkout state summary (run 5)

Owns: `BE/application/commerce/checkout/types.ts`, `read-checkout-state.ts`, `reconcile-checkout-session.ts`, `checkout-reconciliation.test.ts`, `checkout-use-cases.test.ts`, `BE/interfaces/http/contracts/public-contracts.ts`, `BE/interfaces/http/routes/public-commerce-routes.test.ts`, `packages/api-client/src/test/msw-handlers.ts`, typed `CheckoutState` fixtures in `WEB/components/store/checkout/CheckoutReturnStatus.test.tsx`.

- [x] 21.1 Add `preorder` to `CheckoutState` from the order's line snapshots with `latestShipEstimate` (null without pre-order lines or without an order), add it to the contract, repair msw and the return-page fixtures by hand. Verify, one command each: `pnpm test checkout-core`, `pnpm test public-commerce-http`, `pnpm test checkout-web`.

## 22. W8 Checkout review (run 7)

Owns: `WEB/components/store/checkout/CheckoutOrderSummary.tsx`, `CheckoutOrderSummary.test.tsx`, `WEB/components/store/checkout/CheckoutOfferStatus.tsx`, `CheckoutOfferStatus.test.ts`.

- [x] 22.1 Show the pre-order chip on summary lines and `PreorderCartNotice` above the delivery summary in Review and Pay when any cart line is a pre-order; nothing changes otherwise. Verify: `pnpm test checkout-web`.

## 23. B8 Email content (run 3)

Owns: `BE/application/email/types.ts`, `ship-estimate-format.ts` and test (new), `paid-order-templates.ts`, `preorder-estimate-email.ts` (new, template and sender), `paid-order-email-previews.ts`, `paid-order-email.test.ts` and its snapshot, `email-application.test.ts`, `BE/application/email/index.ts`, `BE/application/commerce/orders/paid-order-delivery.ts`, `paid-order-delivery.test.ts`.

- [x] 23.1 Add `ship-estimate-format.ts` (wording table) and optional `preorder` on `PaidOrderEmailLineItem`, mapped from the order line snapshot in `toPaidOrderEmailInput`. Shopper confirmation and ops email follow design Appendix B when a line is a pre-order and are byte-identical otherwise. Verify: `pnpm test email-application`, then `pnpm test orders`.
- [x] 23.2 Add the estimate-changed template and `sendPreorderEstimateEmail` (purpose `preorder-estimate-changed`, caller-supplied idempotency entity, recipient routing like the shopper confirmation) and a preview entry for it and for a pre-order confirmation. Verify with tests and snapshots: `pnpm test email-application`.

## 24. S5 Orders awaiting-stock filter (run 7)

Owns: `STAFF/lib/staff-navigation.ts`, `staff-navigation.test.ts`, `STAFF/components/orders/internal-order-api.ts`, `internal-order-api.test.ts`, `order-workspace.ts`, `order-workspace.test.tsx`, `OrderWorkspace.tsx`, `OrderDetail.tsx`.

- [x] 24.1 Allow `awaitingStock=true` for `/orders/` in `staffTarget` and reject other values. Verify: `pnpm test staff-platform`.
- [x] 24.2 Add the filter to the API client, workspace state, URL sync and toolbar (`Awaiting stock` checkbox), the chip on list rows, and the banner and per-line estimate in detail, all read-only. Cover filter on/off, URL restore, pagination with the filter, access denial clearing it, and the empty state. Verify: `pnpm test staff-orders`.

## 25. W12 Home showcase island (run 6)

Owns: `WEB/components/store/StorePreorderShowcase.tsx` and test (new), `WEB/components/store/project.json`.

- [x] 25.1 Build the island per design decision 11: one narrowed listing read, then the static candidates file only when a stocked pre-order exists; menu with selection, stage with clip poster and Play, artist-photo poster, cover-only poster, facts strip, price and `Pre-order` link; renders nothing on empty or failed reads; the video frame is created only after Play. Props: the candidates URL and the Store URL. It imports nothing from cart or checkout presentation. Verify with stubbed fetches for each stage and the empty and failure cases: `pnpm test web-store`.

## 26. B9 Estimate notice outbox (run 3)

Owns: `apps/backend/prisma/migrations/0030_preorder_estimate_delivery.sql` (new), `apps/backend/prisma/schema.prisma`, `BE/generated/prisma/**`, `BE/domain/commerce/repositories/preorder-estimate-delivery-repository.ts` (new) and the repositories `spi.ts`, `BE/infrastructure/persistence/d1-preorder-estimate-delivery-repository.ts` and worker test (new), `BE/infrastructure/persistence/project.json`, `BE/infrastructure/persistence/prisma/d1-operator-stock-repository.ts` and its worker test.

- [x] 26.1 Add migration 0030 and the Prisma model per design decision 8, run `pnpm --filter @blackbox/backend prisma:generate`, and implement the repository (`claimDue`, `markDelivered`, `reschedule`, `markNeedsReview`, read for sending) modelled on the paid-order delivery repository; export it from the persistence module. Verify lease, retry and review transitions: `pnpm test commerce-persistence`.
- [x] 26.2 Enqueue inside the set-pre-order batch on an estimate edit of an open pre-order, upsert on a second edit, delete pending rows when the pre-order ends, and write nothing on start, no-op or conflict. Verify with worker tests covering paid, unpaid and other-cycle orders: `pnpm test commerce-persistence`, then `pnpm test stock-integration`.

## 27. W11 Return page (run 6)

Owns: `WEB/components/store/checkout/checkout-return-status-state.ts`, `CheckoutReturnStatus.tsx`, `CheckoutReturnStatus.test.tsx`.

- [x] 27.1 When the paid state carries `preorder`, use the title, detail and fulfilment step of design Appendix B and the `preorder-edge` class; every other state is unchanged. Cover with and without an estimate and an ordinary paid order. Verify: `pnpm test checkout-web`.

## 28. W14 Release Store link (run 7)

Owns: `WEB/components/editorial/ReleaseStoreLink.tsx` and test (new), `WEB/components/editorial/project.json`, `WEB/components/editorial/ReleaseDetailContent.astro`, `WEB/pages/releases/index.astro`, `WEB/pages/_releases-page-layout.test.ts`, `e2e/fixtures.ts`.

- [x] 28.1 Add `ReleaseStoreLink` (server output equals today's `Shop release` link; after one narrowed listing read a stocked pre-order becomes `Pre-order` with `preorder-action` and the badges) and mount it with `client:idle` for native Store links on the release detail and the Releases feature; external merch links stay as they are. Verify label switching, failure fallback and unchanged server markup: `pnpm test web-editorial`, then `pnpm test web-pages`.
- [x] 28.2 In `e2e/fixtures.ts`, make the listing-prices stub also match the narrowed URL with its query string and answer an empty list for `scope=preorders`, so existing specs stay free of console errors now that the Home and release pages issue that read. This slice runs no e2e (the run's e2e slot is W13's); 31.3 runs the existing specs.

## 29. B10 Notice drain (run 5)

Owns: `BE/application/commerce/orders/preorder-estimate-notice.ts` and test (new), `run-paid-order-delivery-schedule.ts`, `paid-order-delivery-processing.ts`, `BE/application/commerce/orders/index.ts`, `BE/paid-order-delivery-schedule.worker.test.ts`, `docs/commerce-operations.md`.

- [x] 29.1 Add `drainDuePreorderEstimateNotices({ limit })` (claim, load the paid order and line, send through `sendPreorderEstimateEmail` with entity `<row id>-<sequence>`, mark delivered, reschedule or needs review with the paid-delivery bounds) and call it from the schedule with the budget left after paid deliveries (`SCHEDULED_DELIVERY_LIMIT`, which this slice exports from `paid-order-delivery-processing.ts`), logging `preorder_estimate_notice_schedule_outcome`. The schedule's return value is unchanged. Verify budget sharing, order no longer paid, retry and review: `pnpm test orders`, then `pnpm test backend-runtime`.
- [x] 29.2 Document the notice in `docs/commerce-operations.md`: purpose, owner, the shared five-per-run budget, behaviour on provider failure and where needs-review rows are seen. Verify every relative link added to the document resolves to an existing file.

## 30. W13 Home section (run 7, runs e2e)

Owns: `WEB/lib/preorder-showcase.ts` and test (new), `WEB/project.json`, `WEB/pages/preorder-showcase.json.ts` (new), `WEB/pages/index.astro`, `WEB/styles/global.css` (hero layering rules only), `WEB/styles/homepage-hero-css.test.ts`, `e2e/home-preorders.spec.ts` (new).

- [x] 30.1 Add the candidate builder (release-sourced Store Items with slug, title, artist, option, store path, release date, first clip id; pure, image URLs passed in) and the static JSON endpoint, which resolves the optimised cover and artist photo URLs; keep it out of the sitemap. Verify: `pnpm test storefront-catalog`, then `pnpm test web-pages`.
- [x] 30.2 Mount `StorePreorderShowcase` between the hero and News with `client:idle`, extend the hero layering rules and their test to the new section, and add `e2e/home-preorders.spec.ts` with its own stubs: absent without pre-orders, present with one, clip stage with no provider request before Play, no-clip stage, link to `/store/#preorders`, shell navigation away and back, 390px (this case sets the viewport inside the test, because the mobile Playwright project only runs routes, shell-navigation and store-cart). Verify: `pnpm test storefront-catalog`, then `pnpm test:e2e e2e/home-preorders.spec.ts`.

## 31. Acceptance (delegated runs, orchestrator reviews the evidence)

- [x] 31.1 After every run a gate agent confirms: changed files are within the run's ownership, runs `pnpm generate:api` once when a slice of the run changed a contract (the generated API outputs are the gate's), and `pnpm validate` passes, reporting the summary path. The orchestrator reviews the reports, the diff and the summary, ticks the tasks, makes one local Conventional Commit per slice, and records the run in `validation.md`.
- [x] 31.2 Run `pnpm openspec -- validate add-store-preorders --type change --strict --allow-worktree`, `pnpm agent:check`, `pnpm validate` and `pnpm test:app-shell` on the final tree and record the summary path and source fingerprint.
- [x] 31.3 Run, one at a time, `pnpm test:e2e` for `e2e/store-cart.spec.ts`, `e2e/store-preorders.spec.ts`, `e2e/store-item-preorders.spec.ts`, `e2e/home-preorders.spec.ts`, `e2e/routes.spec.ts`, `e2e/shell-islands.spec.ts` and `e2e/shell-navigation.spec.ts`; run `pnpm email:previews` and inspect the pre-order confirmation, the hold email and the estimate notice.
- [x] 31.4 On the Local stack with the Stripe mock: start a pre-order with expected copies; Store badge and filter; buy it with an in-stock item; return page; Orders Awaiting stock; change the estimate and see one notice sent by the cron; Copies arrived releases the order; an exact date in the past reads as in stock; a sold-through quantity reads Sold Out. Record request IDs and observations.
- [x] 31.5 Browser pass at desktop and 390px (Store grid and filter, Store Item, cart, checkout review, return, home with and without a clip, release page) with keyboard focus and console checks; record observations and any screenshots for uncovered behaviour.
- [x] 31.6 If the browser pass finds visual defects, give one correction slice the list with screenshots (owns `WEB/styles/global.css` pre-order selectors and class usage in the pre-order components only), then repeat 31.2 and the affected part of 31.5. Record that none were found otherwise.
- [x] 31.7 Run `pnpm performance:bundles` if the feedback policy allows it locally and record the Home and app-shell graph sizes against the 96 KiB budget; otherwise record that the budget check is left to CI.

## 32. Finalization (handed over to Codex on 2 October)

- [x] 32.1 Continue the run table in design.md Appendix C from run 2, keeping its ownership and gate rules: implement each slice, run its checks, run `pnpm generate:api` once after a run that changed a contract, make `pnpm validate` pass, tick its tasks, make one local Conventional Commit per slice, and record the run in `validation.md`. Verify each run's validation summary reports `passed` with matching source fingerprints.
- [x] 32.2 Restore a working Prisma engine install so `pnpm --filter @blackbox/backend prisma:generate` runs without the scratch stand-in used in run 1 (the installed `@prisma/engines` package is empty on this machine). Verify by regenerating: the client in the tree must not change, then slices B5 and B9 generate normally.
- [x] 32.3 Complete group 31 (acceptance) and record its evidence in `validation.md`.
- [x] 32.4 Apply the commerce D1 migrations, authorized by the user in chat on 2 October: only after 32.3 passes, and from a tree that contains `0026_stock_show_low_stock.sql` through `0030_preorder_estimate_delivery.sql`. For UAT then PRD: record a D1 Time Travel bookmark (`pnpm --filter @blackbox/backend exec wrangler d1 time-travel info COMMERCE_DB --env <uat|prd>`), run `pnpm --filter @blackbox/backend d1:migrations:list:<env>`, then `d1:migrations:apply:<env>`, then list again and run `PRAGMA foreign_key_check` through `wrangler d1 execute COMMERCE_DB --env <env> --remote`. Verify nothing is pending afterwards and record bookmark, applied files and outputs in `validation.md`. Do not deploy, push or dispatch workflows; the deployed Worker ignores the additive columns until its own release.
- [x] 32.5 Record what remains for the user in `validation.md`: running `cms:catalog-schema` for `partner_links` per environment, the archive order (`clarify-store-sold-out-presentation`, then `show-low-stock-notice`, then this change), merging the low-stock branch before this one, pre-order content and expected copies per item, and any push or release. Verify the list is present.

## 33. Targeted code removal (authorized by the user on 2 October)

Owns: completed pre-order implementation and its affected tests/module declarations only; enumerate exact files before each editing pass. Excludes generated clients, migrations, unrelated product code and required consumers in unfinished slices. No implementation overlaps another slice's writes.

- [x] 33.1 After run 5, delegate a Sol 6.1 ultra backend removal pass. Trace both graphs and actual callers, then remove proven dead code, unnecessary wrappers and needless duplication without new abstractions or changes to behavior or module ownership. Run the affected focused checks and the normal combined validation, record source fingerprints and make a local Conventional Commit for any removals. Record evidence when no safe removal exists.
- [x] 33.2 After run 7 and before final acceptance, delegate Sol 6.1 ultra web/staff removal passes with disjoint exact ownership. Preserve the approved presentation, accessibility, player continuity and contracts; inspect actual usage before deleting code. Run affected focused checks and the normal combined validation, record source fingerprints and make local Conventional Commits for removals. Use Sol 6.1 ultra for needed review; record evidence when no safe removal exists.

## 34. Home no-video visual correction (approved 3 October)

- [x] 34.1 Match the supplied Home no-video HTML and replacement screenshot: continuous frame, numbered menu, cover over artist photo, release identity and Listen, four facts, summary and purchase band. Use existing release content and the shell player.
- [x] 34.2 Inspect the rendered no-video section at the reference desktop size and 390px; verify selection, Listen and Store navigation with the named Home suite. Retain a screenshot for the user.
- [x] 34.3 Record source-bound validation, strict OpenSpec and the updated Home bundle result. Leave the branch preview running for the user.

## 35. Home video reference refinement (approved 3 October)

- [x] 35.1 Match the supplied Home above-News export and screenshot for the video-selected state: video poster and centered Play, Official Videos choices, release identity and summary/purchase band, and the shared numbered menu/frame. The user clarified that video was intended. Preserve the accepted no-video composition, lazy provider loading and shell player continuity.
- [x] 35.2 Verify clip selection and Play, selection back to a no-video release, Store navigation and 390px using the named Home suite. Inspect the actual Local component with normal fonts and supplied reference assets through temporary browser fixtures; retain a screenshot and clear the fixtures afterwards.
- [x] 35.3 Record exact changed-path hashes, stable normal validation, strict OpenSpec and current Home/app-shell bundle sizes in ignored home-video evidence. Preserve Local data and leave the preview running.

## 36. Album release and physical pre-order clarification (approved 3 October)

- [x] 36.1 Match the supplied album-state references within the existing Store Item composition: show release and pre-order badges by the price, distinguish the album release from vinyl shipping, and use release-aware purchase hints. Reuse the UTC-day helper and existing format classification; missing dates remain unknown and non-vinyl items retain accurate wording. Preserve the existing Listen, singles, clips, Home layouts and Worker authority.
- [x] 36.2 Cover upcoming, released, same-day, missing-date and non-vinyl states, and fresh ordinary/unavailable offers. Verify Home, Store cards and Store Item with focused canonical checks; retain rendered screenshots for both album states with fixture provenance.
- [x] 36.3 Record final source-bound normal validation, strict OpenSpec, changed-path hashes and preview ownership in the change and ignored album-availability evidence. Preserve Local data and leave the owned preview running.
- [x] 36.4 Reconcile staff Release stage and Pre-order help as requested: keep the existing independent states and ending rules, explain that released music can still have physical copies on pre-order, and update the editorial operational owner.

## 37. Mixed cart drawer reference refinement (approved 3 October)

- [x] 37.1 Match the supplied mixed-cart HTML export at its native 440 × 960 size: 24px gutters, 72px artwork, 14px item grid gap, identity, price/quantity row, availability/Remove row, roomy list, Ships together rail, authoritative Items and BOX NOW delivery amounts, VAT/locker copy and the two actions. Preserve Close, focus, Undo and shell/player continuity; scope CSS to the cart.
- [x] 37.2 Verify mixed, pre-order-only, ordinary and withheld-estimate carts, quantity/removal/persistence, fresh-price/stock checkout gates and compact scrolling using focused module and named browser checks. Inspect normal-font native Chrome at 440px and 390px, normalizing the supplied scaled screenshot only for comparison. Keep visual fixtures isolated and Local data unchanged. Native Chrome established the reference geometry; after the app refresh removed that tool, normal-font canonical Chromium fixtures completed both final captures.
- [x] 37.3 Record final normal affected validation, strict guarded OpenSpec, fingerprints, source hashes, screenshots and preview ownership in ignored mixed-cart evidence. Preserve all accepted Home and album-availability work and leave the actual app preview usable.

## 38. Checkout Review and Pay reference refinement (approved 3 October)

- [x] 38.1 Match the supplied extracted Review and Pay export at its native 1280 × 880 canvas: desktop checkout header aligned to the 880px content, 3:2 bordered panels with a 16px gap, Review and Pay/Ready, the compact pre-order timeline and mixed-order explanation, Worker-quoted Items/delivery/Total charged today, VAT/locker/address explanation, support links, Continue to Payment and Stripe note. Match the 64px artwork, Veneer identities, combined Inter artist/format metadata, Bebas prices and ordinary/pre-order chips in Order Summary. Preserve optional quantity editing and email consent through Cart checkout and Ready/status disclosures.
- [x] 38.2 Verify ordinary, mixed, pre-order-only, unknown-estimate, empty, loading and failed states; preserve draft persistence, price/stock revalidation, eligibility, idempotency, canonical Stripe handoff and persistent shell/player. Run focused module and named Local mock browser checks, inspect normal fonts at 1280px and 390px, and keep reference fixtures separate from actual Local commerce.
- [x] 38.3 Record the final stable normal affected validation, strict guarded OpenSpec, source fingerprint/hashes, preserved baseline, rendered-font certification, screenshots and preview ownership in ignored review-pay evidence. Preserve the accepted Home, album and drawer work, leave the actual Local preview usable, and do not archive.

## 39. Pre-order Confirmed return reference refinement (approved 3 October)

Owns: return components/routes and scoped CSS, checkout-state read/type/schema and generated clients, their focused tests and return browser cases. Existing order reference formatting remains unchanged; mail renderers and transport belong to group 40.

- [x] 39.1 Match the supplied Return export at its native 1280 × 720 canvas: checkout-aligned header, centered 720px column, Order Status/Paid row, bordered card with a 2px Sea Green top rule, Veneer confirmation heading, payment/reference/email copy, immutable record/format and shipping facts, BOX NOW single-parcel/locker-before-dispatch row, estimate-change note, real published released-media links and outlined Continue Shopping. Extend only the canonical read-only status projection with shopper-safe paid snapshot details; preserve ordinary paid and all unresolved/error states, polling, cleanup, idempotency and shell/player ownership.
- [x] 39.2 Verify paid mixed and pre-order-only orders, missing estimates/details/media, delayed callbacks, failed/cancelled/expired/unavailable/missing-session responses and unchanged ordinary paid behavior with focused modules and named Local browser checks. Inspect normal fonts at 1280px and 390px, certify rendered fonts, retain isolated reference captures and actual Local previews, and preserve groups through 38.
- [x] 39.3 Freeze all owned tracked files and record current hashes, baseline preservation, focused check/capture provenance and preview ownership in ignored preorder-confirmed evidence. Hand the frozen source to group 40 for the mandatory combined final graph refresh, normal validation, strict OpenSpec and final source-bound evidence; do not run competing final checks while its mail batch is active.

## 40. Confirmation and estimate-change email reference refinement (approved 3 October)

Owns: paid-order-templates.ts, preorder-estimate-email.ts, existing mail frame/format helpers and mail tests. Excludes return/web/CSS, checkout-state contracts, order reference token, transport and commerce eligibility. The email owner completes shared documentation and final combined verification after group 39 freezes. Final-gate authorization also covers the minimal canonical reference ownership repair in commerce-domain, its callers, tests and boundary declarations; the return reader changes only its import and formatting. A separate authorized lint fix uses startsWith for the same case-sensitive HTTPS media prefix.

- [x] 40.1 Match the approved payment confirmation and estimate-change HTML/text references in `D:/Downloads/Emails · confirmation and estimate changed-html` using the existing mail rendering owners. Preserve paid/cycle eligibility, immutable order money/lines, escaping and reply address. Was (at order) identifies the estimate recorded when ordered; exactly two update paragraphs retain the one-parcel promise without an unsupported cause or direction. Preview Subject remains outside the emitted body.
- [x] 40.2 Run focused mail renderer checks for ordinary, mixed, pre-order-only and unknown estimates, immutable before/after estimates, escaping and text parity. Render and inspect both reference email previews without sending mail or changing catalog/stock/payment state. Inspect canonical normal fonts at native 476px and compact 390px; retain Subject captions outside the emitted documents and distinguish browser proof from unverified email-client support.
- [x] 40.3 After both owned code batches freeze, complete shared spec/design/task/evidence notes, run one final local AST-only Graphify refresh, final normal `pnpm validate`, strict guarded OpenSpec and diff-check, and record stable combined source fingerprint, exact hashes, logs, previews and material limitations. Preserve all prior work; no archive, commit, push or deployment.

## 41. Publication-aware showcase caching (approved 5 October)

Owns: public renderer/cache/publication tests, showcase endpoint and its response test, public gateway tests if needed, and content-publication/Free-tier operational documentation. Implement in the shared `codex/preorder-video-cache` worktree; the orchestrator owns task state and combined verification.

- [x] 41.1 Replace the endpoint-only no-store repair with reuse of the existing accepted-snapshot cache and publication invalidation for the showcase JSON. Preserve explicit no-store responses for content identity, errors, private previews and authoritative commerce. Keep storage bounded, preserve accepted-snapshot authority and reuse existing bindings without dependencies or paid infrastructure.
- [x] 41.2 Prove repeated reads reuse the response and publication changes, removes and replaces clips consistently with the release page. Cover conditional reads, publication purge/refresh and invalidation failure without leaking drafts or retaining an old response as current.
- [x] 41.3 Record focused source-bound checks and limitations, including the bounded operation cost and any unverified hosted cache propagation.

## 42. Store pre-order card reference fidelity (approved 5 October)

Owns: Store listing cards and their scoped styles, listing-price presentation where needed, focused card/browser checks and the corresponding Store design rules. The user-supplied 5 October screenshots supersede conflicting card typography rules for these pre-order lifecycle designs.

- [x] 42.1 Match the supplied card references: full square artwork, optional Listen above the compact uppercase title, plain artist/format text, left-aligned lifecycle badges and aligned bottom price/action. Check unreleased pre-order, released music with physical copies on pre-order, ended pre-order and unavailable copies; preserve the existing Sold Out/Out of Stock semantics and Worker authority.
- [x] 42.2 Verify month/exact-date and unknown estimate variants, long labels, ordinary cards, narrow screens and desktop with real fonts and canonical rendered captures. Preserve filters, card navigation, Buy/cart behavior and persistent listening.

## 43. Staff mobile usability and combined acceptance (approved 5 October)

Owns: Staff pre-order/Selling controls, their enclosing editor/shell and scoped Staff styles/tests. Fix additional Staff defects only when directly reproduced during the mobile check. The orchestrator owns shared OpenSpec notes, graph refresh and final validation.

- [x] 43.1 Make the pre-order and Selling workflows usable at 320px, 390px and 430px: stacked readable fields, reachable actions, month/exact-date and shopper previews, keyboard focus, validation/recovery and no document overflow. Preserve private autosave, explicit publication, immediate stock updates and desktop functionality.
- [x] 43.2 Inspect the shared Staff navigation, editor, stock and orders surfaces at mobile widths and correct reproduced clipping, overflow or inaccessible actions using existing components; preserve all core operations and record what was inspected.
- [x] 43.3 Integrate the three owned batches, inspect the supplied designs and rendered evidence, refresh the local graph once, run final affected validation and strict OpenSpec, and record exact source identity, checked states and remaining limitations. Keep the unrelated main-checkout epic untouched; do not deploy or archive.

## 44. Home official-video refinement (approved 5 October)

- [x] 44.1 Add `playsinline=1`, `rel=0`, `color=white`, explicit `controls=1` and `fs=1` to the existing click-start YouTube embed. Present the current clip as noninteractive text and keep native buttons for alternatives, preserving poster, keyboard Play, fullscreen, layout and iframe teardown on switching. Extend and pass the existing unit and scoped Home video/browser checks; record source-bound Local evidence with physical iPhone and live YouTube rendering limitations.
