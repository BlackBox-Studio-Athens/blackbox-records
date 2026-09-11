## Context

See [proposal.md](proposal.md). Store Items already carry `sourceKind` and `sourceId`. `ReleaseDetailContent.astro` resolves the source artist and uses `buildEmbeddedPlayerData` with `MusicStreamingServiceListenTrigger.astro`; the shell handles its delegated trigger attributes. Distro's current schema has no embedded-player fields or release relationship.

## Goals / Non-Goals

**Goals:** Reuse verified editorial identity and the existing custom player from the Store Item purchase context.

**Non-Goals:** A second player, autoplay, new streaming providers, Distro media research, fuzzy release matching, new sellable formats, or making Store Item routes into shell section routes.

## Decisions

1. **Resolve at build time from the existing source.** For `sourceKind === 'release'`, read the referenced release by `sourceId`, resolve its artist with existing catalog helpers, and build player data exactly as the release detail does. Keep the data page-local; do not add provider URLs to StoreCart, checkout payloads, Stripe catalog projections, or backend contracts. A missing required release is a content/build error, not a title-based fallback.
2. **Render the existing standalone trigger.** Render `MusicStreamingServiceListenTrigger` as a real button only when the provider list is nonempty. Pass the same release identity and display title as the release page so the shell can reuse the active session. Do not mount a page-local iframe or force playback based on iframe load. Use existing lifecycle semantics for provider switching and Stop.
3. **Use real editorial links.** Render the related release path and artist path through base-aware helpers. Existing delegated overlay navigation handles ordinary in-site clicks; direct/new-tab URLs remain valid full pages. Missing optional artist relations yield no artist link, not a guessed profile or unrelated roster link. Unsupported listening data simply omits Listen.
4. **Keep listening beside identity and the sellable option clear.** Reuse the recognizable Releases Listen treatment near the Store Item title/artist before the long description, with restrained source-release/artist links. Keep Listen secondary to Add to Cart and avoid a separate media panel or purchase-summary block. Release-wide formats remain editorial metadata and must not resemble variant selection. The purchase-information child owns the title/artist/exact option/price/Add to Cart hierarchy, mobile ordering, new purchase summaries, legal links, and quieter Back to Store link; its wording approval or completion is not a dependency for listening. Integrate into whichever current item layout exists and preserve that hierarchy if already implemented. Share applicable template presentation evidence when both changes are implemented together.
5. **Respect document boundaries.** Playback survives supported same-document section/overlay changes only. Entering another Store Item document, checkout, reload, or a new tab can terminate the iframe. Adding Listen does not change that rule or promise background persistence across document navigation. A Store Item with no supported source remains a valid purchasable page with no extra actions.

## Risks / Trade-offs

- Reusing a title instead of identity could open the wrong music → use the exact source release ID and existing provider validation.
- Third-party embeds may fail or be blocked → preserve the current player error/dismissal behavior and keep purchase controls usable.
- Source formats can be confused with the item being purchased → keep option labeling in the purchase block and make editorial context visually secondary.
- Concurrent Store Item gallery changes → integrate into the current template without altering gallery data or primary image handling.

## Migration Plan

No schema, database, or provider migration. Implement the source-backed actions, verify current release/Distro fixtures and direct/base-path routes, then exercise the existing player and overlays on desktop/mobile with Browser Use. Use the existing static deployment flow when authorized; rollback removes the new triggers/links only. Apply the required Impeccable visual gates before UI implementation; no visual redesign is approved by this proposal.
