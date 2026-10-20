# Public frontend

Read for presentation, navigation, player and metadata changes.

| Concern                      | Entry point                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Site/base configuration      | [astro.config.mjs](../apps/web/astro.config.mjs)                                                                                         |
| Layout, metadata and JSON-LD | [SiteLayout.astro](../apps/web/src/layouts/SiteLayout.astro)                                                                             |
| Persistent shell mounting    | [AppShell.astro](../apps/web/src/layouts/AppShell.astro)                                                                                 |
| Shell state/navigation       | [AppShellRoot.tsx](../apps/web/src/components/app-shell/AppShellRoot.tsx), [routing.ts](../apps/web/src/components/app-shell/routing.ts) |
| Overlay fragments            | [app-shell-overlay](../apps/web/src/pages/app-shell-overlay/)                                                                            |
| Styling and primitives       | [global.css](../apps/web/src/styles/global.css), [UI components](../apps/web/src/components/ui/)                                         |

- Keep the monochrome visual language unless the task changes it. Artist frames remain 3:4 with `object-fit: contain` over a blurred copy of the same photo (`.artist-photo-fill`), never black bars or a text scrim; names sit below the photo. Sources are ideally 1800 × 2400, at least 1200 × 1600, with headroom. Preserve the whole band photo.
- The shell owns player state, mobile navigation, scroll/focus resets and the transition veil. Page-local player state and body-swapping navigation require reconsidering persistence.
- The minimized player appears after iframe load and real embed interaction. Closing beforehand destroys the session; minimizing afterward retains it; Stop destroys it. The open modal owns one history entry at the page's own URL, so device and browser Back close it with these semantics without routing the page. Store Items and the Purchase and delivery, Privacy and Withdrawal pages swap `<main>` like sections (kinds `store-item` and `information`) so playback survives; checkout documents stay native. Full reloads, new tabs and non-shell navigation cannot preserve third-party iframe playback. Bandcamp embeds always render the house dark appearance; only the album or track ID comes from content.
- News links to `/news/` in the desktop header and phone Menu, between Services and the final Who we are; its footer visibility stays off. Releases are editorial; Store owns commerce browsing. Follow the [shell/player spec](../openspec/specs/app-shell-and-player/spec.md) and current Store specs for categories and legacy redirects.
- Store listings use the shell-mounted listing-price projection; item and checkout paths use authoritative offer reads. Keep prefetch changes deliberate.
- Local base-path defaults and hosted `/` differ. [Environment model](environment-model.md) and [catalog promotion](catalog-promotion.md) own target configuration. Pages serves the renderer's client assets and the read gateway (no route HTML, fail-closed), without business routes, persistence or provider secrets.
