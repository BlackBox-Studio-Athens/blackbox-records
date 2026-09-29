# Validation

Base commit: `4c74fab2cf39200e7ebaf7c1be87b0e34fcf84dd` (change uncommitted in worktree `image-load-performance-d14bc8`).
Product Environment: Local. Static build served with `astro preview --root .` on `http://127.0.0.1:4400/blackbox-records/` (started and stopped for this run).

## Repository gates

- `pnpm validate`: PASSED, `mode: local`, `scope: all`, 140.3 s. Summary `.codex-artifacts/validation/2026-09-29T13-29-47-993Z-15484/summary.json`; before/after fingerprint `fc7a08aaccd19e4f092071c944f7e1c5d21276b534a93c2fcccd772157612ed2`. This note was written after the run, so the tracked source tree differs only by OpenSpec notes.
- `pnpm openspec -- --allow-worktree validate reveal-first-screen-images --type change --strict`: valid.

## Browser acceptance (Acceptance row: Shell/player/routing)

Tools: Chrome DevTools MCP (`mcp__devtools__*`, own visible Chrome, Slow 4G throttling, viewport emulation) for timing and state; Claude in Chrome was used for the first pass but its window reported `visibilityState: hidden`, so clicks and transitions stalled and its timing was not used. Timing runs were only valid while the page was fronted; a backgrounded page throttles `requestAnimationFrame` to about 5 fps and inflates every transition to over 1.5 s.

- Hover Store on Home (no click): requests for `/store/`, its JS chunks and the four eager cards (three under `/assets/catalog/releases/`, one `_astro/*.webp`) fire at hover time. Click Store: no new requests for those four images; `every(eager img complete && naturalWidth > 0)` is true. The first Store frame is 4/4 complete.
- Releases hover (release and artist card): the overlay fragment (`/app-shell-overlay/...`) and the lead image fetch at hover. Overlay opens with the lead image `loading="eager"`, no `fetchpriority`, complete; no image request after the click. The preloaded srcset candidate equals the displayed `currentSrc` for the same viewport.
- Slow 4G, warmed link (Releases): 3/3 eager images complete at swap; veil reveal starts about 190 ms after click, no pop-in.
- Slow 4G, cold click (Store, no hover): HTML arrives at about 1.35 s; the veil reveal begins about 370 ms later with 0/4 images decoded (the 300 ms cap held, images filled in afterwards). Expected pop-in for an unwarmed link, no hang.
- History back/forward across sections: same document (marker retained), titles and eager images correct, 25 to 66 ms swap at 130 fps, no console errors.
- Reduced motion: only script emulation (`matchMedia('(prefers-reduced-motion: reduce)')` overridden in page; the shell reads it at call time). Section links, back and forward all work, veil opacity stays 0.
- Player continuity: Bandcamp embed loaded (Listen on Releases). Dispatching a synthetic pointerdown on the embed wrapper marked interaction, then Minimize. The same iframe element stayed connected through Store, Artists, About and history back/forward; mini-player visible on About; Open player and Stop player worked. No play was started inside the provider embed.
- Mobile (375x812, touch emulation): menu toggle, tap Store and Releases, release card tap opening the overlay, back and forward all work. Eager images are complete, overlay lead image is complete, no horizontal overflow (`scrollWidth` equals `innerWidth`), no console errors. Tapping does not pre-warm through hover.
- Console: page error hooks (`error`, `unhandledrejection`, `console.error`/`warn`) recorded nothing on every run. The only non-2xx request was `/api/store/listing-prices` 404, expected because no Worker runs on the static preview.

## Not verified

- Native OS-level `prefers-reduced-motion` emulation (not available in either browser tool).
- Real touch events (devtools clicks and synthetic touch pointer events only).
- Slow 3G or hosted (UAT/PRD) behavior; provider playback; `pnpm test:app-shell` separately (covered by `pnpm validate` affected app-shell tests).
