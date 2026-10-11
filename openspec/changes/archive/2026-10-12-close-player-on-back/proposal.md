# Close the open player on Back

## Why

The label reported from an Android phone: "Όταν πατάς listen, και ανοίγει το bandcamp δεν δουλεύει το back key." The player modal opened by Listen never creates a history entry, and popstate routing never closes it. On PRD, with the player open on `/artists/`, Back switched the page behind it to `/releases/` while the modal stayed open, so Back looked broken. On a page opened directly, Back leaves the site. Bandcamp's embed adds no history entries on load or on play, so the fix belongs to the shell.

## What changes

- Opening the player modal from Listen or the floating player's Open adds one history entry at the page's own URL. Existing section and overlay history state is kept on that entry.
- Back from that entry closes the modal with its close semantics: it minimizes a session the listener has interacted with and stops one they have not. The page beneath keeps its URL, content, scroll position and any open release overlay, because the shell does not route the unchanged URL again.
- The modal's Close or Minimize control, Escape and the backdrop close through that entry, so the next Back navigates instead of doing nothing.
- Forward onto the entry reopens a minimized player. A history jump past the entry to another page closes the player and routes as before.

## Scope

Public web shell only. Embed URLs, provider tabs, the floating player and Stop are unchanged. The cart drawer has the same Back problem and the phone menu closes but also navigates; both are deferred to a follow-up that can reuse this pattern. The bare play triangle in the Bandcamp embed is Bandcamp's own rendering; the label chose to keep the big-cover layout (see design).

## Acceptance

With the player open, browser Back (and therefore Android's Back key, which traverses history when the page has no close watcher) closes it with Close semantics. The URL, page content and scroll position stay as they were, and the next Back navigates. After Close, Minimize, Escape or the backdrop, one Back navigates. Back inside a release overlay closes only the player. Unit tests, the player-continuity Playwright spec, strict OpenSpec validation and `pnpm validate` pass. A browser pass covers a 390px phone viewport with the real Bandcamp embed.
