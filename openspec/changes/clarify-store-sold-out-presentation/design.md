# Design

## Context

- Store Offers already contain `availability.label`, but `StoreItemPurchaseActions.tsx` discards it for non-ready results. The Worker labels missing stock and some paused states Sold Out.
- The detail page has Back to Store, a static add-to-cart hint that ignores fresh offer state, and an adjacent price component that also emits an unavailable heading.
- `WebsiteChanges.tsx` owns global review. `ContentApp.tsx` already calls revision-checked `discard-draft`.
- Editor review checks busy/save/conflict state, not whether anything changed. Shell/Overview review links are always active. Global discovery compares saved revisions to accepted publication state through sparse cursor pages.
- Staff thumbnails are private prepared derivatives. The supplied hosted page redirected to Google sign-in, so the Disintegration failure's cause remains unverified.
- `ItemPriceEditor.tsx` contains the reported checkbox and handles initial price setup and price changes.

## Goals / Non-Goals

**Goal:** Small corrections in existing flows, with truthful state and readable controls.

**Non-goals:** New availability enums, bulk discard infrastructure, global polling/counts, a media-delivery redesign, new cart readiness logic, or a site-wide button redesign.

## Decisions

### 1. Reuse the Worker label

Keep response shape, existing status fields, null-price behavior, and eligibility. Correct label selection:

| Evidence                                                                                | Label                                |
| --------------------------------------------------------------------------------------- | ------------------------------------ |
| Missing availability                                                                    | Currently Unavailable                |
| Availability available with canBuy false                                                | Currently Unavailable                |
| Existing effective stock exhausted, with availability sold_out or available/canBuy true | Sold Out                             |
| Missing stock, or non-buyable availability with positive effective stock                | Currently Unavailable                |
| Catalog drift / ready                                                                   | Existing Checkout Paused / Available |

An available/canBuy-false record is a pause and takes precedence. Reuse the effective-stock adapter already injected by `public-commerce-services.ts`, including hold accounting. Read it once when classification needs it; retain early exits for missing availability or an explicit pause.

Render the returned label as text, without comparing English strings to decide eligibility or style. All resolved non-buyable labels use the same inactive treatment. Network failures retain neutral local copy. No new reason enum or generated-client changes are needed because Sold Out adds no distinct behavior.

### 2. One purchase message

The purchase action owns the non-buyable message in the detail purchase area. Suppress a successfully resolved non-ready price headline only where it sits next to that action. Keep feedback in standalone price/summary uses, including the compatibility route's mobile Order Summary. Retain price-request error feedback and purchase disclosures; preserve loading geometry. Gate both the detail add-to-cart hint and the compatibility route's recovery instruction on readiness. A fresh non-ready result or failed refresh must not restore an enabled action from an older snapshot.

Use the shared components on detail and compatibility routes. Existing checkout consumers of the Worker label inherit corrected text; do not redesign cart checkout. Reuse Back to Store / Continue Shopping instead of adding Browse records.

Use square geometry, a thin full border, charcoal fill, existing compact UI display type, off-white text, and a minimum 44px height. Keep resolved disabled text at 4.5:1 contrast and announce it politely from the purchase region. Artwork and listening stay visible. No motion or image generation is needed; satisfy applicable Impeccable shape approval before UI implementation.

The supplied `C:/Users/SVall/.codex/worktrees/catalog-wide-listening/blackbox-records/docs/design-inspiration.md` informs the treatment: PW's artwork-first restraint, LISTEN-2/5's border/charcoal studies, and the selected In player control's readable disabled state. Keep amber and equalizer bars music-only. These references do not approve an entire button family.

### 3. Discard from the global list

Add a per-entry Discard saved changes action in `/review/`, independent of publication selection and completeness. Reuse existing eligibility: live and draft revisions, no pending publication, and current revision.

Load the current entry when discard is chosen, name it in the existing confirmation pattern, and submit that revision's `_rev` to the existing endpoint. On success refresh the list and remove the entry from saved review selection; the next review rebuilds its comparison normally. Cancel writes nothing; conflict or failure retains the entry and uses existing recovery. Never-published entries stay editable and are not deleted. Disable repeated discard submission while the operation is pending.

This avoids a second bulk-operation workflow. Removing selection remains distinct from discarding a saved draft; existing navigation/autosave protections still govern editor buffers.

### 4. Disable review by scope

- **Editor:** Enable for unsaved differences or saved unpublished differences, subject to existing save/conflict guards. Autosave alone must not disable review. Reverting to the accepted values leaves no reviewable change; reuse existing comparison/normalization rather than raw object identity or dirty flags alone.
- **Global shell/Overview:** Share unfiltered discovery through the existing staff query cache. Request normal bounded pages and stop after the first page containing a change; follow sparse continuations before declaring empty. Do not request one source entry per page or scan separately for each button. Neither recent drafts nor a filtered/first page establishes global emptiness.
- **Selection/confirmation:** Preserve selection and validation guards; empty or actually unchanged comparisons cannot advance. New unpublished entries count as changes.

Use disabled buttons rather than faded clickable links, with No changes to review feedback for known-empty state. Loading is Checking changes; failure has a retry path and is not treated as empty. Direct `/review/` remains valid. Keep pending-publication recovery reachable.

Use `changedPublicationFields` and `publicationValueKey` from the existing content-model package for comparisons, with the same publishable input shape as publication review. Include slug, list order, rich-text formatting, media identity and descriptions; exclude transport enrichment. New records count as changes even when incomplete. Matching saved revisions are a cheap unchanged shortcut, but must not hide unsaved editor differences. Do not change accepted revision IDs or publication history to make a button look unchanged.

Reuse a successful discovery result across shell and Overview. A save that establishes a changed entry can mark presence true immediately; discarding or publishing an entry invalidates the result and coalesces one follow-up read. Reuse existing focus recovery. No per-keystroke discovery, separate query client, interval polling, or global counter is needed.

### 5. Diagnose thumbnails before choosing a fix

Reproduce the supplied release list and trace Disintegration's `cover_image` through workspace media enrichment, `staffThumbnailUrl`, and the private derivative request. Distinguish missing reference, key resolution, missing derivative, authorization, and image-load failure. Fix the observed shared cause with one representative fixture, never a title-specific exception.

If only derivatives are absent, use existing preparation tooling for those objects. Preserve private 96px/40KiB derivatives and fixed placeholders: no original-image fallback or transformation on GET. Hosted preparation follows existing Free-tier rules. Identifying missing derivatives is diagnosis, not completion: verify the reported artwork after repair, or leave that acceptance task explicitly incomplete.

Reported route: `https://staff.blackboxrecordsathens.com/content/?collection=releases&returnTo=%2Fstock%2F%3Farea%3Dall&area=all&sort=title`.

### 6. Clear price confirmation

Use `Apply this price to the live shop` for fixed prices and `Apply these pricing settings to the live shop` for pay-what-you-want. Keep the item and proposed values visible, existing Set price / Change price actions, required checkbox, and backend confirmation payload. This does not approve item publication or checkout launch.

## Risks / Trade-offs

- The legacy offer status remains broad; display the corrected label without treating its text as authority. Deploy corrected Worker labels before the consuming frontend.
- Holds can temporarily exhaust effective stock; Sold Out does not mean permanently out of print.
- Proving no global changes can take longer than finding one draft. Use the existing request bounds and cancel superseded reads; incomplete discovery must not report empty.
- The hosted thumbnail cause is unverified behind sign-in. Record whether the remedy is code or derivative preparation before implementation.

## Migration Plan

No schema/data migration. Verify each slice locally and use normal code promotion. Any derivative preparation is separate from code deployment. Preserve unrelated ongoing preview work.
