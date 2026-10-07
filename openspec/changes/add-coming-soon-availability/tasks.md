# Tasks

## 0. Prerequisite

- [x] 0.1 Archive `clarify-store-sold-out-presentation` with spec sync (`pnpm openspec -- archive clarify-store-sold-out-presentation`), after confirming with the user; its stale listing MODIFIED block was dropped because the baseline already held a newer version. Verify that `openspec/specs/commerce-checkout` and `openspec/specs/staff-workspace` now contain "Sold Out copy reflects confirmed online depletion", "Purchase status is clear without duplicate messaging" and "Staff control per-item restock intent".

## 1. Zero-stock state in the Worker

- [x] 1.1 Add migration `0031_stock_zero_stock_state.sql`:
  - add `Stock.zeroStockState` (CHECK, default `sold_out`) and `Stock.expectedMonth` (`YYYY-MM` CHECK);
  - map `restockPlanned=1` to `coming_soon`;
  - drop `restockPlanned`.

  Update `schema.prisma`, regenerate the Prisma client, and map the fields through the stock, operator stock, snapshot, finalization and listing repositories. Verify with `pnpm test` on the D1 repository worker tests, including a migrated row that had `restockPlanned=1`.

- [x] 1.2 Change `classifyStoreStockAvailability` and its labels:
  - states `stocked | coming_soon | repressing | sold_out | unavailable`;
  - labels Coming Soon / Repressing / Sold Out / Unavailable;
  - add `readExpectedMonth(state, stock, today)` using the Europe/Athens passed-month rule from `preorder.ts`.

  Verify with classifier unit tests: depletion per choice, positive stock ignores the choice, pause and missing records give unavailable, and the month is suppressed once passed.

- [x] 1.3 Carry `availabilityState` and optional `expectedMonth` through the listing projection, and `availability.state` plus `expectedMonth` through the non-ready Store Offer. Update `public-contracts.ts`, then run `pnpm generate:api`. Verify with the `store-listing-price-reader`, `store-offer-reader`, `checkout-use-cases` and `listing-price-presentation.worker` tests, including the privacy assertion that no zero-stock choice or alert count leaks.
- [x] 1.4 Replace the internal `restock-plan` PATCH with `/stock/zero-stock-state` (revision-checked; rejects a passed or malformed month; Sold Out clears the month), plus its hypermedia action, operation and log names. Return `zeroStockState`, `expectedMonth` and `availabilityAlertCount` in stock detail, and accept the choice in Item Setup's opening stock. Regenerate the internal OpenAPI and client. Verify with the `internal-stock-routes`, `stock-use-cases`, `internal-setup-routes.worker` and `opening-stock.worker` tests.

## 2. Staff controls

- [x] 2.1 Replace the Restock planned switch in `StockOperationsApp.tsx` and `ItemSetupApp.tsx` with "When sold out online, show" (Coming Soon / Repressing / Sold Out), an optional month input for the first two, and the "N shoppers waiting" count. Update the internal stock API client. Verify with the `StockOperationsApp`, `ItemSetupApp` and `internal-stock-api` tests (save, clear on Sold Out, stale revision, count display).
- [x] 2.2 Rewrite the Release stage help text in `ContentFields.tsx` and the pre-order control copy so that stage means music only and the zero-stock state means physical copies. Verify the staff content-field test or snapshot asserts the new text.

## 3. Shopper vocabulary on every surface

- [x] 3.1 Add `apps/web/src/platform/lib/availability-copy.ts` (the platform module, the only place the store, cart, checkout and editorial modules can all import), exported through its `project.json` boundaries, with the label map, `expectedMonthText`, `availabilityTone` and `isNotifiable`; unavailable and unknown states have no label (price only, no Buy). Update `ReleaseBadge` in `packages/content-model/src/release-status.ts`. Verify with a unit test for every state, an unknown state and month formatting.
- [x] 3.2 Store cards: `StoreListingPricePresentation.ts` uses the shared map, shows "Expected Month YYYY" beside the status, applies Store Blood tone only for Sold Out, shows no chip and no Buy for unavailable or unknown states, and never shows a pre-order badge or Pre-order button on a zero-stock card. Verify with `StoreListingPricePresentation.test.ts`, plus the pre-order-at-zero card case.
- [x] 3.3 Item page, cart and checkout: `StoreItemPurchaseActions.tsx`, `StoreOfferPriceDisplay.tsx`, `StoreCartDrawer.tsx` and the checkout offer status take label and tone from `availability.state` and show the expected month under the control. Verify with their tests. None of them may contain Out of Stock or Currently Unavailable.
- [x] 3.4 Releases: `release-presentation.ts` derives physical badges from the offer state (`{Format} Coming Soon/Repressing/Sold Out/available`, none when unavailable), announced editions read `{Format} Coming Soon`, future digital dates read "Out {date}", there is no physical badge before the offer arrives, and `releaseStage` is removed from the entry and from `ReleaseCard.astro`. Verify with `ReleaseCatalogPresentation.test.ts`, `ReleaseStoreLink.test.tsx` and `shell-page-snapshot.test.ts`.
- [x] 3.5 Update `DESIGN.md` and the `global.css` state selectors (`data-store-listing-availability-state`, purchase tone classes) for the new states. Verify with `page-frame-css.test.ts` and the button typography assertions.
- [x] 3.6 Update the e2e specs that pin labels: `store-preorders`, `store-item-preorders`, `store-cart`, `release-merchandising` and `international-order-item`. Add a Coming Soon card with an expected month and a Repressing item page. Verify with `pnpm test:e2e e2e/<spec>.spec.ts` for each spec.

## 4. Availability Alerts

- [x] 4.1 Add migration `0032_availability_alert.sql`, which creates the `AvailabilityAlert` table (unique `(variantId, email)`, status/attempt/lease columns) and `AvailabilityAlertSendDay`. Add domain rules in `commerce-domain` (due when stocked, 12-month expiry, backoff, `AVAILABILITY_ALERT_DAILY_BUDGET = 40`) and a D1 repository in `commerce-persistence`. Verify with unit tests for the rules and repository worker tests: idempotent insert, the 2,000 cap, a due selection that uses the effective-stock rule with pending holds, the budget counter per Athens day, and expiry deletion.
- [x] 4.2 Add a public `POST /api/store/items/{storeItemSlug}/availability-alerts` route (zod payload, eligibility via the Store Offer reader, the same success response for new and duplicate requests, `400`/`503` provider-safe errors, `no-store`) and the eligible-only `availability-alert` hypermedia link. Regenerate the public API. Verify with `public-commerce-routes.test.ts` cases: eligible, ineligible, invalid, duplicate, cap, and no address in logs.
- [x] 4.3 Add `availability-alert-email.ts`, with available and pre-order variants and an optional Ship Estimate, using the backend `ship-estimate-format`. Drain alerts in `runPaidOrderDeliverySchedule` after the order drains, through `sendTransactionalEmail` (sink routing, idempotency per alert), deleting on success or after the fifth failure. Verify with an email snapshot test and schedule tests: order email goes first, the budget stops sending, retry/lease behaviour, and a UAT recipient routed to the sink.
- [x] 4.4 Run Impeccable shape and approval for the Notify me form and the expected-month line, then build the form in the item purchase island: email field, unticked consent, inline status, and errors associated with their controls. Show it only when `isNotifiable(state)`. Verify with `StoreItemPurchaseActions.test.tsx` cases (hidden when not eligible, client validation, success status, retryable error) and an item-page step in `e2e/store-item-preorders.spec.ts` or a new `e2e/availability-alerts.spec.ts`.
- [x] 4.5 Document alert retention, the daily budget and staff count in `docs/commerce-operations.md`. Add `availability_alert_*` events to `docs/worker-observability.md`. Verify that `pnpm agent:check` passes.

## 5. Specs and acceptance

- [x] 5.1 Update the specs-pinning tests and fixtures not covered above (`local-mock-commerce-seed`, `msw-handlers`, `stripe-catalog-contract`). Run `pnpm openspec -- validate add-coming-soon-availability --type change --strict` and `pnpm validate` on the final tree. Record source-bound evidence in `validation.md`.
- [x] 5.2 Local browser pass with `playwright-cli` at 390px and desktop. Check:
  - the Store card shows Coming Soon with an expected month;
  - the item page shows Repressing with Notify me submitted;
  - the item page shows Sold Out with no form;
  - Releases shows Digital out now with Vinyl Coming Soon.

  Check keyboard use, 200% zoom and player continuity across these navigations. Record the observations in `validation.md`.

## 6. Release

- [ ] 6.1 Commit locally and push only on the user's instruction. Then follow the UAT release:
  - migrations 0031/0032, then the Worker, then Pages;
  - `/api/store/listing-prices` shows the new enum;
  - staff set one item to Coming Soon with a month and one to Repressing;
  - a Notify me request followed by a stock change delivers exactly one email to the UAT sink.
- [ ] 6.2 Before PRD promotion, list the PRD rows migrated from Restock planned (expected: only `anarchotribal-vinyl`) and the releases still marked Upcoming whose music is out. Staff confirm each zero-stock choice and publish Released where needed through Content Publication.
- [ ] 6.3 Promote to PRD through the existing gates (user-triggered). Confirm that Anarchotribal vinyl reads Coming Soon on the Store card, its item page and Releases.
- [ ] 6.4 Sync delta specs and archive this change only after PRD acceptance.
