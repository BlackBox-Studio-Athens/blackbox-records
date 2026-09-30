# Tasks

## 1. Desktop Releases interaction

- [x] 1.1 Apply route-scoped desktop CSS for steady artwork and frames, always-visible View release, and independent Listen feedback; verify the diff and run the existing Releases layout test.
- [x] 1.2 Verify desktop at 1024px and 1440px, keyboard focus, reduced motion, Listen and player-overlay continuity, 390px mobile, and artist discography in Chrome's blackbox profile; record Local browser evidence, using a temporary Upcoming fixture if the catalog has none.
- [x] 1.3 Run strict OpenSpec validation and pnpm validate on the final tree; retain source-bound validation evidence in ignored artifacts.

The approved plan resolves the CSS approach, so a separate design document is omitted. Desktop uses the existing hover/fine-pointer media query; image crop, mobile behavior, shared controls, and artist discography remain on their current contracts. Only Local verification is included.
