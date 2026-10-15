## Context

The player and shell sheets already push marked entries at the current URL. Store cannot import app-shell internals. Detail overlays share the underlying document and must retain its viewport.

## Decisions

Move the existing marker primitives to web-platform and retain the player module as a compatible consumer. Page-local surfaces register their same-URL marker transitions with the existing shell popstate dispatcher, after player and sheet handling and before route changes. Unregister when their page unmounts. Explicit closes traverse Back rather than leaving an empty entry.

The module-boundary baseline is synchronized with the new native public export as required by repository ownership policy; its delta records that resulting requirement as modified so later archival replaces the synchronized text.

Crate retains its existing serialized digging record. Forward restores that record. Artists keeps its current live selection, and full video keeps its current chapter and returns focus to Watch. Anchor jumps remain native.

Device/browser Back restores the Crate's saved Grid viewport. The explicit Grid control retains its existing return-to-the-item-in-hand behavior while consuming the same history entry.

Rapid Back/Forward may return to a page before a pending snapshot replaces it. The existing section navigator must abort that pending swap even when the destination is already rendered, or the stale swap can replace the page after Forward has restored its URL.

## Risks and validation

Nested player/sheet/surface markers must dismiss in reverse order. Browser regressions cover unchanged background content and offsets, Forward, and explicit close followed by route Back. Unit checks cover the marker transitions and shared scroll behavior.
