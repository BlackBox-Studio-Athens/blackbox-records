# Design

## History entry, not CloseWatcher

The open player owns one history entry, the pattern detail overlays already use (`overlay/overlay-history.ts`). Opening pushes `{ ...history.state, __appShellPlayerModal: true }` at the current URL, synchronously in the Listen or Open click, so the entry carries user activation and Chrome does not treat it as skippable. Dismissal on that entry calls `history.back()` and lets popstate perform the close, as `closeOverlayWithHistoryBack` does.

- Rejected: `CloseWatcher`. Safari and Firefox lack it. It was also unclear whether Android's Back reaches a watcher in the page once focus is inside the cross-origin Bandcamp iframe, where it sits after the listener taps play. History traversal is top-level, so it works regardless of focus.
- Rejected: a native `<dialog>`, for the same focus concern, and because it would change the modal's markup and motion.

## Same-URL popstates skip routing

The entry shares its page's URL. Routing that URL again is harmful: a section scrolls to the top and focuses `main`, a non-section page re-applies its cached snapshot, and an overlay re-opens with focus moved. `routeShellPopStateNavigation` therefore handles the player first. `playerModalHistoryHref` holds the href of the player entry the shell is on, or null.

- Leaving the entry: close the modal if it is open. If the new URL is the entry's URL, stop; otherwise route, so a history jump past the entry to another page still lands there.
- Entering the entry (Forward): reopen a minimized session and stop. Without a session it only records the entry, so the following Back does not route the unchanged URL either.
- A reload on the entry keeps it in history, so `AppShellRoot` seeds the ref from `history.state` and the first Back still only steps off it.

Known limit: the modal does not trap focus, so a keyboard user can follow a header link behind the open modal. The entry then stays beneath the new page; Back returns to it with ordinary routing, and the next Back steps off it without routing.

## Play button

The label also noticed that the play control in the Bandcamp player looks wrong. It is a bare triangle over the cover because that is how Bandcamp draws its `artwork=big` layout over dark artwork. It looked identical in a plain Bandcamp iframe outside the site, with and without `transparent=true`, and with a light or dark `color-scheme` on the iframe. A darker box behind the triangle showed only over the light placeholder before the artwork loaded. On 2026-10-01 the label compared the real modal at 390px with Bandcamp's compact layout (`artwork=none`, a boxed play button, no cover in the player) and chose to keep the big cover. No code change.

## Deferred surfaces

The cart drawer also has no history entry: on PRD, Back with the drawer open on `/artists/` switched the page behind it to `/releases/` and the drawer stayed open. The phone menu closes on popstate but the same Back also navigates. The label chose to fix the player first; a follow-up can generalize the marker to those surfaces.
