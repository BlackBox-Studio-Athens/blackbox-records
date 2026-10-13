# Proposal

## Why

Ouranopithecus' Anarchotribal is out digitally, but its vinyl has not arrived yet, so the Store says "Out of Stock". The label wants it to say Coming Soon. Today, zero stock can only read Sold Out or Out of Stock (Restock planned), so "first pressing on the way" cannot be expressed without opening a pre-order and taking payment. The same item also reads differently on each surface: Releases shows "Vinyl coming later" while the Store card and item page show "Out of Stock". Shopper research (Baymard, independent label and record stores) favours a few explicit words that say whether a gap is temporary or permanent, an expected month when known, and an email-only Notify me option in place of a dead end.

## What Changes

- **BREAKING (public API):** `availabilityState` loses `out_of_stock` and gains `coming_soon` and `repressing`: `stocked | coming_soon | repressing | sold_out | unavailable`. Records in the two new states can carry an optional `expectedMonth` (`YYYY-MM`). The unavailable Store Offer carries the same state and month, so the item page no longer keys its tone on a label string.
- **Staff:** the Restock planned switch is replaced by one per-variant choice, **When sold out online, show**: Coming Soon, Repressing or Sold Out (default Sold Out). It comes with an optional Expected month, in protected stock detail and Store Item setup. The migration turns existing Restock planned items into Coming Soon, which is the least specific "more is on the way" promise. That puts PRD's Anarchotribal vinyl on Coming Soon at deploy.
- **One shopper vocabulary** (Title Case) across Store cards, the Store item page, Releases, the Home pre-order showcase, cart and checkout: Buy (with Only N left), Pre-order, Coming Soon, Repressing, Sold Out. The expected month appears only while that month has not passed. "Out of Stock", "Currently Unavailable" and any shopper "Unavailable" label are retired: a missing stock record counts as zero stock, and a technical selling pause shows the price with no status. A pre-order whose copies run out closes for shoppers but stays open for staff until Copies arrived, so paid orders keep Awaiting Stock.
- **Releases:** physical badges follow the format's availability state. "{Format} coming later" becomes "{Format} Coming Soon"; that covers an announced edition with no Store Item and a native edition in the coming_soon state. "Album upcoming" becomes "Out {date}". "Physical availability unconfirmed" is removed: the badge is simply absent until an offer is read.
- **Release stage describes music only.** Staff help text and Releases derivation stop treating Upcoming as "physical edition upcoming". The physical side comes from the Store state. An album that is out digitally lists as Latest release on its artist page.
- **New: Notify me.** On a Store item page in the Coming Soon or Repressing state, a shopper can leave an email with an explicit one-off consent and no account. The Worker stores one pending alert per variant and email. When the variant becomes buyable or opens a stocked pre-order, the scheduled job sends one transactional email under a daily budget that leaves room for order email. The alert is then deleted. Staff see the waiting count in stock detail.

## Capabilities

### New Capabilities

- `store-availability-alerts`: shopper Notify me requests for Coming Soon and Repressing variants; consent, storage, retention, delivery trigger, sending budget and staff count.

### Modified Capabilities

- `store-listing-price-presentation`: availabilityState enum, zero-stock classification by staff intent, optional expectedMonth, unified card labels.
- `commerce-checkout`: Store Offer non-buyable state, labels and tone on the item page, cart and checkout. This supersedes "Sold Out copy reflects confirmed online depletion" and "Purchase status is clear without duplicate messaging" from `clarify-store-sold-out-presentation`.
- `staff-workspace`: the zero-stock choice and Expected month replace "Staff control per-item restock intent" from `clarify-store-sold-out-presentation`.
- `store-catalog-categories`: card status beside price uses the new states.
- `store-preorders`: zero-stock wording for pre-order items and items without stock records, and the card scenario beside a disabled Pre-order.
- `release-catalog-presentation`: physical badges follow the format state; Coming Soon replaces "coming later"; Release stage is music-only.
- `project-language`: canonical availability terms.

## Impact

- **Backend:**
  - D1 migration on `Stock`: add `zeroStockState`, add `expectedMonth`, drop `restockPlanned`. New `AvailabilityAlert` table.
  - Shared classifier, listing and offer readers.
  - Public contract and OpenAPI, with a new public POST route.
  - Internal stock PATCH replaces `restock-plan`.
  - The scheduled job gains an alert drain. New shopper email template.
- **Generated clients:** `pnpm generate:api` for the public and internal clients.
- **Staff:** stock detail, Item Setup and the Release stage help text.
- **Web:**
  - One shared availability-copy module replaces four copies.
  - Store card presenter, item purchase actions and price display, cart chip, Releases presentation, showcase and artist page split.
  - Notify me form on the item page.
- **Specs and tests:** about 25 unit and integration tests and 5 e2e specs pin the old strings. `DESIGN.md` and `global.css` state selectors.
- **Ordering:** `clarify-store-sold-out-presentation` is complete but unarchived. Its deltas must be synced into the baseline before this change's deltas apply.
- **Free tier:** Resend Free has 100 emails per day, shared with order email, so alerts are capped per day. D1 and cron use stays within the existing jobs. No new provider, dependency or Cloudflare binding.
