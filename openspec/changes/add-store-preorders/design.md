# Design

## Context

Motivation: see proposal.md. Visual reference: the approved canvas at https://claude.ai/artifact/MbxNJAgbRi6mdcN6ifSUTN. Where the canvas and this document differ, this document is binding.

Verified in source on `4a4595af`: `main` at `df2ceae0` plus the two commits of the unarchived change `show-low-stock-notice`, which touch several of the files named here and are described as they now stand:

- **Stock is the only quantity authority.** Triggers, the domain and the paid guard keep online quantity at or below physical quantity, and effective stock is `min(quantity, onlineQuantity)` minus pending-payment lines. A pre-order with zero physical copies cannot be expressed, so expected copies are recorded as stock.
- **`restockPlanned` and `showLowStock` are the end-to-end templates** for a per-variant stock flag; `set-show-low-stock.ts` and its route are the freshest example, beside `setRestockPlanned`: migrations `0025` and `0026`, `domain/commerce/repositories/stock-repository.ts`, three row mappers, `application/commerce/stock/set-restock-planned.ts` and `set-show-low-stock.ts`, `interfaces/http/stock/register-internal-stock-routes.ts` (routes `restock-plan` and `low-stock-notice`, hypermedia actions `set-restock-planned` and `set-show-low-stock`), the ordered path list in `interfaces/http/stock/internal-contracts.ts`, `pnpm generate:api`, `packages/api-client/src/test/msw-handlers.ts`, `apps/staff/src/lib/backend/internal-stock-api.ts` (`setRestockPlanned`, `setShowLowStock`) and `apps/staff/src/components/stock/StockOperationsApp.tsx` (`handleRestockPlannedChange`, `handleShowLowStockChange`, the shared `StockFlagSwitch`). Both flags are written by `setStockFlag` in `d1-operator-stock-repository.ts`.
- **Public reads.** `read-store-offer.ts` builds the Store Offer (`ready`, `sold_out`, `catalog_drift`) through `readyOffer`; `readers/store-listing-price-reader.ts` builds the listing projection from one raw SQL read in `prisma-store-offer-snapshot-repository.ts`. Both already see the `Stock` row, and both add the optional `lowStockQuantity` to ready records through `readLowStockQuantity` (`domain/commerce/stock-availability.ts`). `public-commerce-services.ts` wraps stock in an effective-stock adapter that spreads the record, so new stock fields flow through.
- **Order lines** are built in `checkout/start-checkout.ts` (the `validatedLines.push` block, which already holds `currentStock`), inserted by `infrastructure/persistence/d1-checkout-stock-hold-repository.ts`, and read by `prisma-order-state-repository.ts` and `interfaces/http/routes/d1-paid-checkout-finalization-repository.ts`. Stripe line items are rebuilt field by field, so a new line field cannot reach Stripe.
- **Paid deliveries** use `PaidOrderDelivery` with closed kinds, `UNIQUE(orderId, kind)` and a SQL `CHECK` on `kind`; the 15-minute cron drains five rows per run through `orders/run-paid-order-delivery-schedule.ts`. SQLite cannot alter a `CHECK`, so a repeatable notice needs its own table.
- **Web.** Store cards are static placeholders filled by the shell-mounted connector `StoreListingPricePresentation.ts` on Store routes; for a stocked item with `lowStockQuantity` it already fills the availability slot with `Only N left` (state `low_stock`), and `StoreItemPurchaseActions.tsx` already shows the same notice as a tab fused to Add To Cart. `StoreDistroSearch.tsx` owns Store search and filtering through `data-distro-search-hidden`. `StoreItem` already carries `releaseDate`. `store-cart` may import only `ui-foundation` and `web-platform`. The cart checkout review and order summary read cart lines from StoreCart, not fresh offers. The return page reads `CheckoutState`, which carries no line data. The home page has no Worker read today.
- **Open changes on the same capabilities:** `clarify-store-sold-out-presentation` (availability states, purchase control geometry; implemented, not archived), `alphabetize-distro-by-band`, `fix-mobile-cart-scrolling`, `show-release-editorial-details`, `smooth-homepage-hero`, `show-low-stock-notice` (the opt-in "Only N left" notice, `Stock.showLowStock` and migration `0026`; implemented, not archived).
- **A migration is not being applied.** `prisma/migrations/20260917120000_staff_order_pagination/migration.sql` is a folder. Wrangler 4.141 discovers `<migrations_dir>/*.sql` only (no `migrations_pattern` is configured) and the test pool's `readD1Migrations` keeps names ending in `.sql`. The primary checkout's Local D1 had 25 applied migrations and no `CheckoutOrder_createdAt_id_idx` when checked; migration `0026` now belongs to the low-stock change.

## Goals / Non-Goals

**Goals:**

- One derived source of truth for "is this a pre-order, and what do we tell the shopper", shared by every reader.
- No change to payment, stock arithmetic, holds or the paid guard.
- Thin, independently verifiable slices with disjoint file ownership.
- Fix the unapplied order index migration before adding new migrations.

**Non-Goals:**

- Deposits, deferred capture, Stripe consent or custom Stripe text.
- A scheduler. Status is computed from the date at read time.
- A separate pre-order allocation or a second quantity.
- Refund or cancellation tooling.
- Refreshing cart snapshots against the Worker before checkout start.

## Decisions

### 1. Pre-order lives on the `Stock` row as four nullable text columns

`preorderStartedAt` (ISO-8601 UTC instant), `preorderShipMonth` (`YYYY-MM`), `preorderShipPart` (`early`, `mid`, `late`), `preorderShipDate` (`YYYY-MM-DD`). Pre-order is on when `preorderStartedAt` is not null; then exactly one of month or date is set. Column `CHECK`s enforce the part values and that combination.

`preorderStartedAt` is also the **cycle key**. It is written when a pre-order starts, kept across estimate edits, and cleared when the pre-order ends. It is declared `String?` in Prisma and copied verbatim, so equality never depends on date formatting. Alternative considered: a separate `Preorder` table. Rejected: one pre-order per variant at a time needs no second table, and every reader already loads the `Stock` row.

### 2. One pure domain module decides status

`apps/backend/src/domain/commerce/preorder.ts`, exported through the domain `index.ts`:

```ts
export type PreorderShipEstimate =
  | { kind: 'month'; month: string; part: 'early' | 'mid' | 'late' | null }
  | { kind: 'date'; date: string };
export type StockPreorder = { shipEstimate: PreorderShipEstimate; startedAt: string };
export type ShopperPreorder = { shipEstimate: PreorderShipEstimate | null };

athensToday(now?: Date): string                      // 'YYYY-MM-DD' in Europe/Athens
parsePreorderShipEstimate(value: unknown): PreorderShipEstimate   // throws on malformed input
stockPreorderFromColumns(row): StockPreorder | null   // shared by the three stock row mappers
isPreorderOpen(preorder, today): boolean              // month: true; date: date > today
deriveShopperPreorder(preorder, today): ShopperPreorder | null
samePreorderShipEstimate(a, b): boolean
latestShipEstimate(estimates): PreorderShipEstimate | null
```

`deriveShopperPreorder` returns `null` when there is no pre-order or an exact date has arrived, and `{ shipEstimate: null }` when a month estimate is in the past (withheld). `latestShipEstimate` returns `null` when the list is empty or any entry is `null`; a month sorts as its last day, parts as day 10, 20 and 31. `StockRecord` gains `preorder: StockPreorder | null` beside `restockPlanned` and `showLowStock`.

Alternative considered: a cron that flips a status column. Rejected: it adds a job and a window where the stored status is wrong.

### 3. Public contract

```ts
PublicShipEstimate = { kind: 'month'; month: string; part: 'early' | 'mid' | 'late' | null } | { kind: 'date'; date: string }
PublicStorePreorder = { shipEstimate: PublicShipEstimate | null } | null
```

- `PublicStoreOffer`, `ready` branch only: required `preorder: PublicStorePreorder`, beside the optional `lowStockQuantity`. A pre-order with no copies left reads Sold Out or Out of Stock through the existing branches.
- `PublicStoreListingPrice`, both branches: required `preorder: PublicStorePreorder`, independent of `availabilityState`; the ready branch keeps its optional `lowStockQuantity` beside it. `preorderStartedAt` is never exposed.
- `GET /api/store/listing-prices` accepts optional `scope=preorders`. It then returns the same record shape for items with a shopper-visible pre-order only, using the same single query with `WHERE stock."preorderStartedAt" IS NOT NULL`, driven by a partial index on that column (created in migration 0028). The home page and release pages use this narrowed read so that their per-view cost is a handful of rows instead of the whole catalog. Store collections keep the full read.
- `CheckoutState`: required `preorder: { shipEstimate: PublicShipEstimate | null } | null`, the latest estimate across the order's pre-order lines, or `null` when the order has none.

The slice that changes a contract repairs the typed fixtures it breaks by hand; the gate agent runs `pnpm generate:api` once after the run's slices finish.

### 4. The purchase path is untouched

`start-checkout.ts` validates and holds stock exactly as today. The only addition is the snapshot in decision 5. `stripe-checkout-gateway.ts` is not edited.

### 5. Order lines snapshot what the shopper was shown

`CheckoutOrderLine` gains the same four columns. At checkout start a line whose variant has a shopper-visible pre-order stores the stock row's `preorderStartedAt` and the derived estimate (estimate columns null when withheld). `CheckoutOrderLineRecord` and `CheckoutSessionLineItem` gain optional `preorder?: { startedAt: string; shipEstimate: PreorderShipEstimate | null } | null`. The snapshot is immutable.

### 6. Awaiting stock is derived, not stored

A paid order is awaiting stock when one of its lines has a `preorderStartedAt` equal to the `preorderStartedAt` of that variant's stock row and that pre-order is still open. Ending a pre-order, or an exact date passing, releases its orders without a write. A later pre-order of the same variant has a new cycle key, so shipped orders are never flagged again.

The order list cannot compare two tables in a Prisma filter. It first reads the open cycles (`SELECT ... FROM "Stock" WHERE "preorderStartedAt" IS NOT NULL`, filtered with `isPreorderOpen`), then filters `lines: { some: { OR: [{ variantId, preorderStartedAt }] } }` with `status: 'paid'`. No open cycle returns an empty page without a query. Ceiling: D1 allows 100 bound parameters, about 40 simultaneous pre-orders; mark it with a `ponytail:` comment.

### 7. Staff command

`PATCH /api/internal/variants/{variantId}/stock/preorder`, operationId `setStockPreorder`, body `SetStockPreorderBody { expectedRevision: number | null; shipEstimate: PreorderShipEstimate | null }`, response `InternalStockDetail`, errors as `setRestockPlanned` and `setShowLowStock` (400, 404, 409). `InternalStockState` gains `preorder: { shipEstimate; startedAt; open: boolean } | null` beside `restockPlanned` and `showLowStock`; the hypermedia action goes beside `set-restock-planned` and `set-show-low-stock`, and the path after `low-stock-notice` in the ordered list.

- A non-null estimate starts a pre-order when none is open (new `preorderStartedAt`), or edits the estimate of the open one (cycle key kept). A stored pre-order whose exact date has arrived (today or earlier) counts as not open, so a new estimate starts a new cycle.
- `null` ends the pre-order and clears all four columns. Copies arrived and switching the pre-order off are the same call.
- A month before the current Athens month, or a date on or before the Athens date, is rejected with 400.
- An estimate equal to the stored one returns the current state without a write.
- The write is revision-checked like `setRestockPlanned` and `setShowLowStock` (both go through `setStockFlag`), creates a zero-quantity row when stock was never recorded, and never touches quantities or the ledger.

### 8. Estimate-changed notice

New table `PreorderEstimateDelivery`: the `PaidOrderDelivery` lifecycle columns without `kind`, plus `variantId`, `shipMonth`, `shipPart`, `shipDate`, `sequence INTEGER NOT NULL DEFAULT 1` and `UNIQUE(orderId, variantId)`.

- **Enqueue** in the same `db.batch` as the stock write, guarded by `changes() = 1` as `initializeOpeningStock` does: one `INSERT ... SELECT` over paid orders with a line on this variant and cycle, `ON CONFLICT(orderId, variantId) DO UPDATE` setting the new estimate, `sequence + 1`, `status = 'pending'`, zero attempts and a due time. Only an estimate edit of an open pre-order enqueues. Starting a pre-order matches no line.
- **Ending** a pre-order deletes that variant's pending rows in the same batch.
- **Drain** in `run-paid-order-delivery-schedule.ts` after the paid deliveries, with whatever remains of the five-row budget. Lease, five attempts, 24 hours and `needs_review` mirror paid deliveries. The email idempotency entity is `<row id>-<sequence>`. The function keeps returning the paid-delivery results; notices are logged as `preorder_estimate_notice_schedule_outcome`.

Alternative considered: a fourth `PaidOrderDelivery` kind. Rejected: the kind `CHECK` and `UNIQUE(orderId, kind)` would need a table rebuild and still allow only one notice per order.

### 9. Emails

- `PaidOrderEmailLineItem` gains optional `preorder`. The shopper confirmation states the estimate under each pre-order line and adds one paragraph. The ops email changes its title, label and action list to a hold when any line is a pre-order.
- New template and sender for the estimate-changed notice.
- Wording is produced by `application/email/ship-estimate-format.ts`.

### 10. Wording is one table, implemented three times

Backend email, web and staff cannot share source without new boundary allowances. Each implements this table in about fifteen lines and asserts the same sample strings in its own test.

| Input                                    | Text                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| month `2026-10`, no part                 | `around October 2026`                                                                |
| month `2026-10`, part early / mid / late | `around early October 2026` / `around mid October 2026` / `around late October 2026` |
| date `2026-10-20`                        | `on 20 October 2026`                                                                 |
| release date, short                      | `16 Oct 2026`                                                                        |

Badges (`preorderBadges({ releaseDate, shipEstimate, today })`):

| State                             | Badges                                             |
| --------------------------------- | -------------------------------------------------- |
| before the release date           | `Pre-order · out 16 Oct 2026`                      |
| on or after it, month estimate    | `Out now`, `Pre-order · ships around October 2026` |
| on or after it, exact date        | `Out now`, `Pre-order · ships 20 Oct 2026`         |
| on or after it, estimate withheld | `Out now`, `Pre-order`                             |
| no release date                   | the pre-order badge alone                          |

"Before the release date" is checked in the browser with the UTC-day rule of `isReleaseOutNow` (`lib/release-feature.ts`).

### 11. Web surfaces

All shared pre-order CSS lands once in slice W1 (class contract in the appendix). Component layout uses Tailwind utilities inside the component, as the surrounding code does. Later slices do not edit `global.css`, except W13 for hero layering; visual corrections found in the browser pass go to one correction slice at the end.

`AppShellRoot` imports `StoreListingPricePresentation.ts` statically, so that file is part of the eager shell graph (96 KiB Brotli budget). It may import the wording helper and nothing else new. Islands for the home page and release pages import nothing from cart or checkout presentation.

- **Wording helper:** `apps/web/src/platform/lib/preorder-estimate.ts`, a `web-platform` export. It exports the `ShipEstimate` type structurally, `shipEstimateText`, `preorderBadges`, `preorderChipText` and `latestShipEstimate`.
- **Cards:** `StoreItemCard.astro` adds `data-store-release-date` (ISO date) on the availability placeholder, a hidden `data-store-listing-release-status` span reading `Out now`, a hidden span with `data-store-listing-preorder` and class `store-item-card__preorder`, and `data-store-card-buy-label="Buy"` on the button. The connector writes the pre-order badge text into the pre-order span and un-hides it, sanitize empties and hides it, and the availability slot keeps its existing behaviour (it is not used for the pre-order badge, because a pre-order can also be sold out or scarce). The connector also sets the release status, marks the card root with `data-store-preorder`, labels the button `Pre-order` with class `preorder-action`, restores the right label after "Added", and dispatches `blackbox:store-listing-applied` on `document`. `sanitizeStoreListingPricePlaceholders` resets all of it. A pre-order that is sold out keeps the existing Sold Out or Out of Stock status and still carries `data-store-preorder`. The low-stock notice is unchanged: a stocked pre-order whose record carries `lowStockQuantity` still shows `Only N left` exactly as the low-stock change defines it.
- **Filter:** `StoreDistroSearch.tsx` counts cards with `data-store-preorder` on mount and on the applied event. With at least one, the toolbar shows a toggle `Pre-orders` with the count (`aria-pressed`). On, it filters like search and artist do, and the three-note strip is shown. `#preorders` in the URL starts with the filter on. With none, there is no toggle and an active filter turns off.
- **Cart:** `CartLineItemSnapshot` gains optional `preorder?: { shipEstimate } | null`, validated by a local zod schema and optional so stored carts still parse. `createCartLineItemSnapshotFromWorkerOffer` copies `offer.preorder`. The purchase control reads `Pre-order`, uses `preorder-action`, and replaces the hint; the low-stock tab above it (`store-low-stock-purchase`) is unchanged.
- **Cart drawer and checkout review:** the line chip reads the pre-order text. A shared `PreorderCartNotice` (in `store-cart`, exported) shows the heading, the two-step rail and one sentence when any line is a pre-order. Checkout review reuses it above the delivery summary.
- **Store Item page:** `StoreOfferPriceDisplay` takes `releaseDate` and `preorderFacts`; when the ready offer is a pre-order it renders the facts panel under the price. Partner links and the release's singles are static markup in `pages/store/[slug]/index.astro`, shown whenever the source release has them.
- **Return page:** with `checkoutState.preorder`, the paid view reads `Pre-order confirmed` and the fulfilment step names the estimate.
- **Listing reader:** `readPublicStoreListingPrices(signal, options?)` takes `{ scope: 'preorders' }` for the narrowed read.
- **Home:** `StorePreorderShowcase.tsx` (`web-store`) mounts with `client:idle`, so the section is inserted below the fixed hero before the shopper scrolls. It makes one narrowed listing read; with at least one stocked pre-order it fetches the static `preorder-showcase.json` (built by `pages/preorder-showcase.json.ts` from release-sourced Store Items: slug, title, artist, option, store path, release date, cover URL, first clip id, artist photo URL) and renders the section. With none it renders nothing. The YouTube iframe (`youtube-nocookie.com`, autoplay) is created only when the shopper presses Play.
- **Release pages:** `ReleaseStoreLink.tsx` (`web-editorial`, `client:idle`) renders the native Store link. Server output is today's `Shop release` link; after one narrowed listing read it becomes `Pre-order` with the badges when the item is a stocked pre-order. External merch links stay static.

### 12. Staff surfaces

- **Selling tab:** new `apps/staff/src/components/stock/PreorderControl.tsx` rendered under the existing Restock planned and Show copies left switches (`StockFlagSwitch`): switch, `About a month` / `Exact date`, month and part selects or a native date input, `Save pre-order`, `Copies arrived`, and the read-only "What shoppers see" list from `preorder-preview.ts`. `StockOperationsApp.tsx` adds one handler modelled on `handleRestockPlannedChange` and `handleShowLowStockChange`.
- **Orders:** an `Awaiting stock` checkbox in the toolbar (`awaitingStock=true` in the URL, allow-listed in `staff-navigation.ts`), a chip on list rows, a banner and per-line estimate in detail. Read-only.
- **Release editing:** `partner_links` rows (label, URL) beside Singles.

### 13. Partner store links

`partner_links: z.array(z.object({ label: requiredText, url: httpsUrl })).optional()` on releases, registered in `prepareCatalogSchema` as an optional `json` field like `singles`. Static, editorial, no commerce authority.

### 14. Order index migration

`0027_checkout_order_created_at_id_index.sql` creates the index with `IF NOT EXISTS`; the folder is deleted; a tooling test asserts every entry in `prisma/migrations` is a flat `NNNN_name.sql` with unique numbers consecutive from 0001 (0026 is `0026_stock_show_low_stock.sql` of the low-stock change); the order search worker test asserts the index exists. Pre-order migrations are 0028 to 0030.

### 15. Assumptions recorded for review

- The home section lists release-sourced Store Items that are stocked pre-orders. Distro pre-orders appear in the Store only.
- A sold-out pre-order stays under the Store Pre-orders filter with its Sold Out status; it is not on the home page.
- Partner links and singles show on the Store Item page whenever the release has them, not only during a pre-order.
- Estimate notices share the existing five-per-run budget, paid deliveries first.

## Risks / Trade-offs

- [An exact date ends the pre-order even if copies are late] → Staff copy says so; month is the default; staff can change the date before it arrives.
- [A month passes and nobody updates it] → The estimate is withheld, the item stays a pre-order, and the staff block shows it.
- [Cart snapshot is stale at checkout] → The Worker snapshot on the order line and the confirmation email state the truth. Not refreshed in the browser; revisit if shoppers report it.
- [Estimate changes while a shopper is paying] → That order keeps the estimate it was shown and gets no notice for this change. It is notified on the next change.
- [Home and release pages add one Worker request and one D1 read per view] → They use the narrowed read, which touches only items on pre-order through a partial index: a handful of rows against several hundred for the full projection, `no-store`, no writes. This stays inside the Free allowances at this site's traffic; if Worker requests become the concern, remember an empty result in `sessionStorage` for the session.
- [Shell JavaScript budget] → The connector lives in the eager shell graph. It gains only the wording helper; `pnpm performance:bundles` is part of final acceptance.
- [Notice bursts] → Five sends per 15 minutes shared with paid deliveries: 50 waiting orders take about 2.5 hours. No new job or binding.
- [Three wording implementations drift] → Each test asserts the same sample strings from decision 10.
- [`MODIFIED` deltas overlap the unarchived sold-out change] → This change's deltas contain that change's text. Archive it first. The unarchived low-stock change only ADDS requirements to the same capability; this change's exposure scenario names its `lowStockQuantity`, and migration `0026` must land before this change's `0027` to `0030`.
- [Contract fields are required] → A consumer deployed before the Worker ignores them; a consumer deployed after reads them. Deploy the Worker first.

## Migration Plan

1. Local: migrations 0027 to 0030 apply with the normal Local start. `prepareCatalogSchema` adds `partner_links`.
2. Each slice lands behind its own gate (`pnpm validate`), committed locally. Nothing is pushed by this change.
3. Hosted, through the existing release process and its separate confirmations: apply D1 migrations, run `cms:catalog-schema`, deploy the Worker before the web and staff builds.
4. Rollback: the columns and the table are additive. An older Worker ignores them. Ending every pre-order restores the previous shopper behaviour without a deploy.

## Appendix A: class contract (slice W1, `apps/web/src/styles/global.css`)

Tokens: `--preorder-accent: #2d766a` (borders, fills), `--preorder-accent-active: #4ca999` (text on dark), `--preorder-accent-surface: rgba(45, 118, 106, 0.16)`. Sea green is the complement of Store Blood. Outline only on badges; no green fill on resting controls.

| Selector                                                                                                                                  | Purpose                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `.store-item-card__preorder`                                                                                                              | card pre-order badge in its own element (the availability slot is untouched), Sea green outline, readable text                   |
| `.store-item-card__release-status`                                                                                                        | the neutral `Out now` badge beside it                                                                                            |
| `.preorder-action`                                                                                                                        | primary button with a 3px Sea green inset base; Sea green fill on hover and focus-visible                                        |
| `.preorder-badge`                                                                                                                         | the same outline badge outside cards (cart chip, facts, home, release)                                                           |
| `.preorder-facts`                                                                                                                         | facts list with a Sea green outline                                                                                              |
| `.preorder-notice`, `.preorder-rail`, `.preorder-rail__step`, `.preorder-rail__step--later`                                               | "ships together" notice and its two-step rail                                                                                    |
| `.preorder-edge`                                                                                                                          | 2px Sea green top edge for a panel (return page)                                                                                 |
| `.store-preorder-filter`, `.store-preorder-filter__count`                                                                                 | the toggle in the Store toolbar                                                                                                  |
| `.store-preorder-notes`                                                                                                                   | the three-note strip                                                                                                             |
| `.home-preorders`, `__menu`, `__item`, `__stage`, `__poster`, `__poster-photo`, `__poster-cover`, `__play`, `__frame`, `__facts`, `__buy` | home section: menu, stage, grayscale artist backdrop with the cover in front, play control, video frame, facts strip, price band |

Rules: existing Veneer sizes only; 44px minimum targets; text contrast at least 4.5:1; the purchase control keeps the 224 x 54 px desktop footprint and full width on mobile; no new motion beyond the existing button transition, and none under reduced motion.

## Appendix B: copy

- Purchase control: `Pre-order`. Hint: `We send it when the copies arrive. If the estimate changes we email you.`
- Facts panel: `Release date` / `16 Oct 2026` (before release) or `Release` / `Out now, released 9 Jun 2026`; `Expected to ship` / `Around October 2026`, `On 20 October 2026` or `To be confirmed`; `Payment` / `Charged in full today`.
- Partner links: `Outside Greece? Order <title> from <label>` with labels joined by `or`.
- Singles heading on the Store Item page: `Singles`.
- Cart notice: heading `Pre-order in this order`; steps `Today` / `Charged in full` and `Around October 2026` / `One parcel to your BOX NOW locker` (second step title `When it arrives` when withheld); sentence `Your whole order, in-stock items included, ships in one parcel when the pre-order arrives. If the estimate changes we email you.`
- Store filter: `Pre-orders`. Notes: `You pay today` / `Charged in full at order, like any other purchase.`; `We wait for the copies` / `Every item states when we expect to ship. If that changes, we email you.`; `One parcel` / `Your whole order is sent together by BOX NOW when the pre-order arrives.`
- Return page: title `Pre-order confirmed`; detail `Payment is confirmed and your pre-order is recorded.`; fulfilment `Your whole order is sent in one parcel when the pre-order arrives, expected around October 2026. We email you if that changes.` (without the estimate clause when withheld).
- Home: heading `Pre-orders`; link `All pre-orders` to `/store/#preorders`; menu note `Charged at order. Your whole order is sent in one parcel when the record arrives.`; stage button `Pre-order`; under it `Charged today · ships around October 2026`.
- Release pages: link label `Pre-order`.
- Shopper confirmation: under a line `Pre-order, expected to ship around October 2026`; paragraph `Your order includes a pre-order. Everything is sent in one parcel when it arrives, expected around October 2026. We email you if that changes.`
- Ops email: label `Order to hold`; title `Paid order · awaiting stock`; actions `Hold this order: it includes a pre-order.`, `Ship nothing until the pre-order copies arrive (expected around October 2026).`, `Send everything in one parcel.`, `Find it in Orders under Awaiting stock.`
- Estimate notice: subject `New ship estimate for your pre-order · <reference>`; label `Pre-order update`; title `Ship estimate changed`; rows `Order reference`, `Item`, `When you ordered`, `Now expected`; paragraph `Nothing else changes: everything is still sent in one parcel when the pre-order arrives. If you have a question, reply to this email.`
- Staff: switch `Pre-order` / `Take orders before the copies are on the shelf.`; `Copies: enter the number you expect as the stock quantity. Count the stock again when they arrive.`; `When it ships`; `About a month`, `Exact date`; `Any time in the month`, `Early`, `Mid`, `Late`; month help `Shoppers see "ships around October 2026". The pre-order stays open until you press Copies arrived.`; date help `Shoppers see the date. On this date the pre-order ends by itself.`; warning `Enter an exact date only when you are sure of it. It ends the pre-order whether or not the copies arrived.`; `What shoppers see`; `Save pre-order`; `Copies arrived` / `Ends the pre-order now. If the plant slips, change the estimate instead: every waiting order gets an email.`; passed month `This month has passed. Shoppers see Pre-order without a date until you update it.`
- Staff orders: `Awaiting stock`; detail banner `Awaiting stock. Hold this order until the pre-order copies arrive.`; line `Pre-order · ships around October 2026 (shown at order time)`.

## Appendix C: slices, ownership and order

Implementation, gate checks, fixes and acceptance runs use visible GPT-6.1-Sol chats at high effort, at most eight concurrently, as authorized by the user on 2 October 2026. Code review uses GPT-6.1-Sol at ultra effort. Fast processing is not used. The orchestrating session writes briefs, coordinates the chats, checks reports and evidence, and makes the local commits; it implements nothing.

One agent per slice. A slice edits only its files and, for the slice that edits `schema.prisma`, the `prisma:generate` outputs. A new file imported from another module is added to its module's `project.json` `metadata.boundaries.exports`. Backend slices may share a run only when they own no file in common; at most one slice per run edits `schema.prisma`, at most one edits `packages/api-client/src/test/msw-handlers.ts`, at most one edits `WEB/styles/global.css`, at most one runs e2e. W14 is the only slice that edits `e2e/fixtures.ts`. A test that fails in a file the slice does not own is re-run once after a short wait before it is reported. A slice that changes a contract does not run `pnpm generate:api`; it repairs msw handlers and typed fixtures by hand. UI slices load the `impeccable` skill and follow its gates; the approved canvas is the shape approval. After the slices of a run finish, one gate agent checks file ownership against `git status`, runs `pnpm generate:api` once when a slice changed a contract (the generated API outputs `apps/backend/openapi/**` and `packages/api-client/src/generated/**` are the gate's), runs `pnpm validate`, and reports the summary path; failures go to one fix agent with the same ownership, at most two rounds.

| Run | Slices                                       |
| --- | -------------------------------------------- |
| 1   | B0 + B1 (one agent, two commits), W1, W2, S1 |
| 2   | B4, B5, W3, S2                               |
| 3   | B2, B8, B9, S3 + S4                          |
| 4   | B3, B6, W6, W9                               |
| 5   | B7, B10, W4, W10 (e2e)                       |
| 6   | W5 (e2e), W7, W11, W12                       |
| 7   | W13 (e2e), W14, W8, S5                       |

Task groups in tasks.md carry each slice's files and checks.
