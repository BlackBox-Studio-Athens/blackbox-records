# Validation

## Source and scope

- Base source: `5613ff1339291b477b35a67c852c83ef8855c0e1`, branch `codex/remove-desktop-release-hover`.
- Implementation changes only `apps/web/src/styles/global.css`: route-scoped desktop interaction rules, with no API, JavaScript, content, or dependency changes.
- Product Environment: Local. The shell/player acceptance row applies. CMS, publication, commerce authority, and software-release acceptance are outside this change.

## Checks

- `pnpm test apps/web/src/pages/_releases-page-layout.test.ts` passed through `web-pages:test`.
- Strict guarded OpenSpec validation passed.
- `pnpm validate` passed, including app-shell tests, package checks, formatting, and architecture checks. The final run is repeated after completing these tracked notes; its source SHA, matching before/after fingerprints, status, and summary path are retained in `.codex-artifacts/smoke/local/release-hover/2026-09-30/final-validation.json`.
- `pnpm build:web` passed, including route isolation and runtime bundle checks.
- Graphify was refreshed once with local AST extraction after the CSS change; architectural navigation and CodeGraph source/caller evidence from the unchanged base were reused.

## Browser acceptance

Chrome's blackbox profile passed artwork, frame, View release, independent Listen, keyboard focus, reduced-motion, touch layout, and artist-release checks. Desktop targets were 1024px and 1440px, and the touch target was 390px; Chrome reported 1024px, 1441px, and 391px respectively. No horizontal page overflow was observed.

The catalog has no Upcoming entry. A temporary DOM fixture reused the existing Upcoming artwork classes to verify hover/focus and reduced motion, then was removed by reload. No content was authored or published.

The local production preview passed actual Listen interaction, disabled In player status, minimize, release-detail overlay, reopen, and Stop. The same iframe DOM node and source remained across the overlay and reopen. Stop removed the iframe and restored Listen. Browser overrides and fixtures were cleared, and playback was stopped. Detailed observations and the CSS fingerprint are in `.codex-artifacts/smoke/local/release-hover/2026-09-30/evidence.json`.

Astro dev failed to fetch the lazy ShellOverlayPanel module under the local base path. Player and overlay acceptance therefore used the production build; that preview produced no new console errors. The dev-only module loading issue remains outside this CSS change. The preview is available at `http://127.0.0.1:4321/blackbox-records/releases/`.
