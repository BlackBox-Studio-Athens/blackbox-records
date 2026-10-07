# Design

## Context

See proposal.md for the motivation. Current mechanics this change builds on:

- **Classifier.** `classifyStoreStockAvailability` (`apps/backend/src/domain/commerce/stock-availability.ts`) is shared by the listing reader and the Store Offer reader. It returns `stocked | sold_out | out_of_stock | unavailable` from `ItemAvailability`, `Stock.onlineQuantity` and `Stock.restockPlanned`. Labels live in `storeStockAvailabilityLabels`.
- **Pre-order.** It is a `Stock` column group (`preorderStartedAt`, `preorderShip*`) and is reported only while the item is `stocked`. Ship Estimate wording exists three times: web `platform/lib/preorder-estimate.ts`, staff `preorder-preview.ts`, and backend `application/email/ship-estimate-format.ts`.
- **Store Offer.** The union has a `catalogStatus: 'sold_out'` branch whose `availability.label` currently carries Sold Out, Out of Stock or Currently Unavailable. The item page picks its tone by comparing that label with the string "Sold Out".
- **Shopper copy.**
  - Web keeps four copies of the availability strings: `STORE_LISTING_PRICE_COPY`, the inline map in `release-presentation.ts`, `STORE_ITEM_PURCHASE_ACTION_COPY` and `STORE_OFFER_PRICE_DISPLAY_COPY`.
  - `ReleaseBadge` in `packages/content-model/src/release-status.ts` types the release badges.
  - Releases derive "{Format} coming later" from `edition.kind === 'announced' || releaseStage === 'upcoming'`.
- **Scheduled job.** `scheduled()` calls `COMMERCE_RUNTIME.runPaidOrderDelivery`, which drains paid-order deliveries and then Ship Estimate notices. Both use leased D1 rows (`PreorderEstimateDelivery` pattern: status, attemptCount ≤ 5, nextAttemptAt, leaseUntil).
- **Email quota.** Resend Free allows 100 emails a day and 3,000 a month, shared by UAT and PRD on one team. Order email must not be starved.
- **Module boundaries.**
  - `stock` (application) depends only on `commerce-domain` and `backend-platform`.
  - `orders` already depends on `stock`, `commerce-persistence`, `email-application` and `resend-integration`, and owns the scheduled entry.
- **Unarchived prerequisite.** `clarify-store-sold-out-presentation` is complete but unarchived. Its added commerce-checkout and staff-workspace requirements are what this change modifies.

## Goals / Non-Goals

**Goals:**

- One typed availability state from the Worker to every surface, with one web copy module and no tone decided by string matching.
- Notify me that reuses the existing leased-delivery pattern and the scheduled entry, with no new Cloudflare binding, module or dependency.

**Non-Goals:**

- Pre-orders at zero stock and deposits. Pre-order keeps needing an expected quantity.
- Consolidating the three Ship Estimate formatters. That is noted as follow-up work, not part of this change.
- Newsletter Topic or Broadcast delivery for alerts, unsubscribe pages, double opt-in, Turnstile and per-IP rate limiting. The newsletter form sets the precedent.
- Notify me on Store cards, Releases or Distro search. Those link to the item page.
- Merch-specific editorial "coming soon" without a Store Item.

## Decisions

### 1. Replace `restockPlanned` with an enum, not a second boolean

`Stock.zeroStockState TEXT NOT NULL DEFAULT 'sold_out' CHECK IN ('coming_soon','repressing','sold_out')` plus `Stock.expectedMonth TEXT NULL` (`YYYY-MM`, CHECK on its format).

Reasons:

- A second boolean (`firstPressing`) would allow contradictory combinations.
- The enum is exactly the staff question: "when sold out online, show…".
- The classifier maps depletion straight to the column value.

Migration:

1. Add the columns.
2. `UPDATE ... SET zeroStockState='coming_soon' WHERE restockPlanned=1`.
3. Drop `restockPlanned` (Prisma table rebuild; history is preserved).

Coming Soon, not Repressing, is the migration target. It is the least specific true claim ("more is on the way"), so no item is relabelled as a repress by accident. It also fixes PRD's Anarchotribal vinyl at deploy, the only PRD row with the flag. UAT rows follow the same rule.

Alternative considered: keep `restockPlanned` and only change the label. Rejected because it cannot tell a first pressing from a repress, and the user chose the full model.

### 2. Public contract: replace `out_of_stock` instead of aliasing it

- `availabilityState` becomes `stocked | coming_soon | repressing | sold_out | unavailable`. Both projection records and the non-ready Store Offer gain an optional `expectedMonth`.
- The Store Offer's `catalogStatus: 'sold_out'` branch keeps its discriminator for compatibility. Its `availability` gains a `state` field (`coming_soon | repressing | sold_out | unavailable`) beside `label`. Web tone and the Notify me eligibility read `state`.
- `expectedMonth` is suppressed once the Europe/Athens month has passed. This reuses the pre-order "month estimate has passed" helper in `domain/commerce/preorder.ts`.
- The only consumer is our own web build, regenerated from the same OpenAPI document.
- Deployment order is Worker, then Pages (the `deploy-uat` job). For minutes in between, an old web build sees an unknown state; `availabilityCopy[state]` is undefined, so it shows an empty status. The new web build treats unknown states like `unavailable`: price only, no status and no Buy (spec), so future additions degrade cleanly.

Alternative considered: keep `out_of_stock` as an alias of `coming_soon`. Rejected because no external consumer exists and an alias keeps the retired term alive.

### 3. One web availability vocabulary module

- Add `apps/web/src/components/store/availability-copy.ts` (store module public API). It exports the state→label map, an `expectedMonthText('2026-11') → 'Expected November 2026'` helper, `isNotifiable(state)` and `availabilityTone(state)`.
- The card presenter, item purchase actions, price display, cart chip, checkout status and `release-presentation.ts` import it instead of keeping their own strings.
- `ReleaseBadge` in content-model changes to:
  - the digital badges: `Digital out now`, `Out ${string}`, plus the existing pre-order badges;
  - `${Format} ${'available' | 'Coming Soon' | 'Repressing' | 'Sold Out'}`. An unavailable offer has no physical badge.

  `Album upcoming`, `coming later` and `Physical availability unconfirmed` are deleted.

- Releases physical derivation:
  - An announced edition (format, no Store Item) reads `{Format} Coming Soon` statically, since no offer exists to read.
  - A native edition reads its offer state.
  - Before the offer read completes there is no physical badge. Today's "unconfirmed" text is dropped.
  - `releaseStage` leaves `ReleasePresentationEntry`; `data-release-stage` is removed from `ReleaseCard.astro`.

### 4. Release stage becomes music-only

- Only the derivation and the staff help text change. The CMS schema, `release_date` refinement and artist-page split (`splitReleaseCatalogByAvailability`) keep their current rule: music is out when stage ≠ upcoming and the date has passed.
- Help text: "Upcoming means the music is not out yet. Physical copies are managed in Selling: pre-order, stock and the zero-stock state."
- A data step asks staff to set Released on any PRD release whose music is out but whose stage is still Upcoming (expected: Anarchotribal, if set). This goes through normal Content Publication, not a migration, so drafts stay private.

### 5. Availability Alerts reuse the leased-delivery pattern

**Table.** A new D1 table `AvailabilityAlert`:

| Column                        | Notes                  |
| ----------------------------- | ---------------------- |
| `id`                          |                        |
| `variantId`                   |                        |
| `email`                       |                        |
| `consentCopyVersion`          |                        |
| `consentedAt`                 |                        |
| `status`                      | `pending` or `sending` |
| `attemptCount`                | at most 5              |
| `nextAttemptAt`, `leaseUntil` |                        |
| `createdAt`, `updatedAt`      |                        |

Indexes:

- Unique `(variantId, email)` with a lower-cased, trimmed email, so a repeat request is idempotent.
- `(status, nextAttemptAt, createdAt)`.

No `delivered` state: a delivered row is deleted, which keeps address retention minimal.

**Request route.** `POST /api/store/items/{storeItemSlug}/availability-alerts` with `{ email, consent: true }`, in the public commerce routes.

1. Resolve the canonical variant through the existing Store Offer reader.
2. Require a `coming_soon` or `repressing` state.
3. Insert or ignore the row.
4. Return the same `202`-style success either way.
5. Enforce the per-variant cap (2,000 pending) with a provider-safe retryable `503`.

The response is `no-store`. Hypermedia: the non-ready Store Offer advertises an `availability-alert` link only when eligible, following existing `apiLink` usage.

**Drain.**

- `drainDueAvailabilityAlerts` runs inside `runPaidOrderDeliverySchedule`, after the paid-order and Ship Estimate drains. It is orchestrated in `orders`, which already has every needed dependency, so no new module or boundary edge is needed.
- Domain rules live in `commerce-domain` (`availability-alerts.ts`):
  - due when the variant classifies `stocked`;
  - expiry at 12 months;
  - backoff schedule;
  - the daily budget constant `AVAILABILITY_ALERT_DAILY_BUDGET = 40`.
- The D1 repository lives in `commerce-persistence`. It selects pending rows joined to current `Stock`/`ItemAvailability` and pending holds, using the same effective-stock rule as the listing reader, oldest first, limited by the remaining daily budget.
- The budget counts sends per Europe/Athens day in a small `AvailabilityAlertSendDay(day PK, sentCount)` row. This is cheaper than scanning logs and survives restarts.
- Each send uses `sendTransactionalEmail`, so UAT recipients route to the managed sink, with `purpose: 'availability_alert'` and `idempotencyEntityId: alert.id`. The row is deleted on success.

**Why 40 a day.** Ordinary paid-order traffic is far below 60 emails a day on the shared team, so 40 leaves headroom. A release with 120 waiting shoppers is notified within 3 days, oldest first. Alternative considered: Resend Broadcast to a per-item Segment, which uses marketing quota instead of transactional. Rejected for now: it creates Resend Contacts (the spec forbids that, keeping addresses out of the newsletter system) and needs Segment lifecycle management.

**Email.** Content goes in `application/email/availability-alert-email.ts`, following `preorder-estimate-email.ts`:

- Subject: `{Title} is available` or `{Title} is on pre-order`.
- Body: one line, the item link and the Ship Estimate if shown. No price or count.
- Footer: a sentence saying this was a one-off alert and the address has been deleted.

**Staff count.** The stock detail read returns `availabilityAlertCount` (a count query only).

### 6. Staff controls

The Restock planned switch becomes a three-option segmented control or `NativeSelect`, labelled "When sold out online, show", with an optional month input (`type="month"`) shown for Coming Soon and Repressing. It appears in stock detail and Item Setup.

The internal PATCH `/api/internal/variants/{variantId}/stock/restock-plan` is replaced by `/stock/zero-stock-state` with body `{ revision, zeroStockState, expectedMonth|null }`, revision-checked like its predecessor. Operation and log names change from `restock_plan` to `zero_stock_state`. The internal OpenAPI document and staff client are regenerated.

### 7. Notify me UI

Approved styles (owner review, 7 October 2026, `/demo/coming-soon-styles`): statuses A4 with smaller icons (dashed neutral edge, 14px lucide `Disc3` / `RotateCw`, explanatory line), Notify me B4 (ghost text action "Email me when it lands" with a `Mail` icon), Releases detail action C2 (underlined text link with `ArrowRight`). Sold Out keeps the solid Store Blood edge on every surface; cards and Releases badges use dashed chips for Coming Soon and Repressing without icons.

- Notify me lives in the Store item page's purchase island (`StoreItemPurchaseActions.tsx`) under the disabled status control, so it reads the same offer without a second request. A plain `<form>` holds:
  - an email input;
  - an unticked consent checkbox ("Email me once when this can be bought or pre-ordered.");
  - a submit button.
- Validation, error association and the inline status pattern are copied from the newsletter form.
- Visual direction goes through the Impeccable shape and approval gates during apply. It follows the monochrome hard-edged language and adds no icons or urgency.
- Bundle budget (maintainer-approved, 8 October 2026): Store item routes get a 104 KiB eager budget (`storeItemEagerGraphBudgetBytes`; every other route keeps 102 KiB). The status and Notify me measured 105,966 bytes eager before they moved to the on-demand `StoreItemPurchaseStatus` module and 103,004 after, so the common stocked path stays small.

## Risks / Trade-offs

- [Unarchived prerequisite] This change's commerce-checkout and staff-workspace deltas MODIFY requirements that `clarify-store-sold-out-presentation` adds. → Archive that change, syncing its specs, before this change's specs are synced. Task 0.1.
- [Public contract break during deploy] An old Pages build briefly meets new states. → Worker-first deploy; an empty status for minutes is acceptable. The new web build shows unknown states as price only.
- [Shared email quota] A popular release could exhaust Resend Free alongside order email. → Fixed daily budget, order email drains first, and the remainder waits. Logs record `availability_alert_budget_exhausted`.
- [Abuse] There is no Turnstile, like the newsletter form, so someone could enqueue many addresses for one variant. → Unique per variant and email, a 2,000 per-variant cap, and the daily send budget, so the worst case is delayed alerts, not quota exhaustion.
- [Personal data] Addresses sit in D1 until delivery or 12 months. → They never leave the alert table or appear in logs, and rows are deleted on delivery, on final failure or at expiry. `docs/commerce-operations.md` documents this.
- [Restock-then-sellout race] A variant could become stocked and sell out between scheduled runs, so some shoppers are never alerted. → Accepted: runs every 5 or 15 minutes, and alerts stay pending for the next orderable window.
- [Mislabelled items after migration] Every Restock planned item becomes Coming Soon, including real represses. → The release task lists UAT/PRD rows with the flag (PRD: only Anarchotribal) for staff to confirm.

## Migration Plan

1. Archive `clarify-store-sold-out-presentation` (specs sync).
2. Implement and validate locally, then commit locally. Pushing auto-releases UAT, so push only when the user asks.
3. UAT release:
   - Migrations `0031_stock_zero_stock_state.sql` and `0032_availability_alert.sql`, then the Worker, then Pages.
   - Check `/api/store/listing-prices` for the new enum.
   - Staff set one item to Coming Soon with a month and to Repressing.
   - Request Notify me, add stock, and confirm the sink receives one alert.
4. PRD promotion through the existing gates. Confirm Anarchotribal vinyl reads Coming Soon on the Store, item page and Releases.
5. Rollback:
   - The migration is not reversible in place: re-adding `restockPlanned` would need `restockPlanned = zeroStockState != 'sold_out'`.
   - Roll back by redeploying the previous Worker only together with a down-migration script kept in the change folder.
   - The alert tables are additive and can stay.

## Open Questions

- Exact alert email wording and subject casing can be finalised with the template snapshot during apply. Specs fix only the content rules.
