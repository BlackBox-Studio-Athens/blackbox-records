## Context

See proposal.md - Why. Home builds its chapters at render time. `index.astro` calls `preorderShowcaseItems(readOpenPreorders())`; `readOpenPreorders()` returns the projection commerce pushed. The projection lists only open pre-orders (`deriveOpenPreorderProjection`), so a closed pre-order leaves Home. Price and ship estimate come from that projection; the accepted content snapshot supplies release, artist, cover, clips and the prepared video list.

`StorePreorderShowcase.tsx` renders every chapter as a pre-order: the Sea action, `preorderBadges`, the shipping line, the pre-order terms link and the All pre-orders link are fixed.

Constraints that shape the approach: Home must have its chapters in its first HTML response and make no browser read to decide them; Cloudflare stays on Free, so the projection identity must not change on stock counts; the content flag is private until Content Publication; `DESIGN.md` already defines the ordinary Buy and static Sold out looks.

## Goals / Non-Goals

**Goals**

- A staff-controlled release can stay on Home with its existing media after its pre-order closes.
- The purchase block always reflects the offer state in the pushed projection.
- Existing pre-order behavior, push triggers and cache rules do not change.

**Non-Goals**

- No automatic expiry of a featured chapter.
- No chapters for Coming Soon, Repressing, paused or unavailable items.
- No new video preparation: a release without a prepared clip keeps today's photo or sleeve fallback.
- No change to the Store, Releases page or cart.

## Decisions

**1. A staff switch, stored on the release.** Add an optional boolean `show_on_home` to the release content schema (`createReleasesContentSchema`), default false. Alternative: keep a closed pre-order automatically for N days. Rejected: an arbitrary cutoff, and staff said they want to decide. Alternative: a hard-coded list beside `preparedClips`. Rejected: needs a code release for each change.

**2. The renderer reads the flag; commerce reads the offer.** Commerce has no content and the renderer has no live offers, so each side supplies what it owns. Home joins the accepted release data (flag, order by release date) with the projection (offer state and price).

**3. Extend the existing projection instead of adding a second push.** Add a `homeOffers` list (slug, availability `stocked | sold_out`, price text or null) for ready release-sourced items that are not on an open pre-order. `items` keeps its meaning, so a projection without `homeOffers` stays valid and renders as an empty list. Alternative: a separate projection and endpoint. Rejected: a second push path, store and purge rule for the same trigger set. Alternative: list only flagged slugs. Rejected: commerce does not know the flag.

**4. Identity stays stable.** The identity hashes slugs, availability and price text only, like today. Stock counts, order data and provider identifiers are never included. A purge happens when an item enters or leaves the list, flips between stocked and sold out, or changes price, which is rare and already covered by the Free-tier rule.

**5. One chapter model with an offer state.** `buildPreorderShowcaseCandidates` and `StorePreorderShowcaseItem` gain an offer state (`preorder | stocked | sold_out`). `StorePreorderShowcase` derives from it: the action (Sea Pre-order, Buy link with `buttonVariants` Buy styling, or a static status), the badge row (`preorderBadges` only for pre-order; a muted Out now otherwise), the shipping line (pre-order only), the terms link text and the closing link. Media, Listen, Watch full video and the film choreography are untouched. The component and file names keep their `Preorder` prefix; renaming is outside this change.

**6. Buy label by format.** The action label reuses the format detection the component already has (`/vinyl|\blp\b/i` on the option) and the release-edition rules for CD and cassette; an unknown format reads Buy.

**7. Order and anchor.** Chapters sort open pre-orders first (by the existing order), then featured releases by release date, newest first, with slug as the tie-break. The section id `preorders` and the Store `#preorders` link stay so existing links and shell logic keep working. The hidden heading stays Pre-orders while every chapter is a pre-order (so existing region labels keep working) and reads Featured releases otherwise.

**8. Locked switch in staff.** The editor already knows whether the Store Item has an open pre-order (the Pre-order control's `preorder.open`). The Show on Home switch uses it to render on and locked, so staff never see an off switch on a release that Home is already showing.

**9. Ownership.** Content schema, commerce projection and renderer validation are non-UI work (Codex). The Home presentation, the staff switch and their tests are UI work (Claude). The projection shape is the contract between them and lands first.

## Risks / Trade-offs

- [A switched-on release whose offer is not stocked or sold out silently has no chapter] → The switch text and the staff Home line say a chapter appears only while the item is in stock or sold out; a task adds that line.
- [Sold-out chapters stay indefinitely] → Intended. Staff turn the switch off; Sold out is truthful and the Store link remains.
- [The projection grows with the number of stocked releases, and the renderer rejects a projection above its bounds (`homeOffers` is limited to 150 entries) as a whole, pre-orders included] → It carries three small fields per item and no counts. Task 4.2 measures the payload on the current catalog before release; raise the bound or page the list before the catalog nears the limit.
- [Older stored projections lack `homeOffers`] → The validator treats a missing list as empty, so deploy order (renderer first, then commerce) cannot break Home.
- [A price shown from the projection can lag a live change] → Unchanged from pre-orders: the Store Item page read stays the authority, and a price change pushes a new projection.

## Migration Plan

1. Deploy the renderer validation and Home logic with the optional `homeOffers` field; behavior is unchanged while the list is empty.
2. Deploy commerce deriving and pushing `homeOffers`.
3. Add the content schema field and the staff switch; publish content with Afterwise switched on.
4. Verify on UAT: Afterwise keeps its chapter with Buy vinyl; switching it off removes the chapter after publication.
   Rollback: turn the switch off, or redeploy the previous commerce build; renderers ignore a missing list.

## Open Questions

- Whether a Coming Soon or Repressing release should keep a chapter with its static status. This change omits it; it can be added later as a third offer state without changing the rest.
