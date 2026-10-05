# Showcase data and media delivery

Local delivery for task 1.2 in the authorized `home-preorder-scene/blackbox-records` worktree, based on `bec08e205c5f31a181fc39bdb50d4f05f86a5a28`. This note covers the scoped delivery files; final integrated source fingerprints and validation belong in the parent acceptance record.

- Each projected clip now has nullable `backgroundVideoUrl`. Only accepted official video ID `MOA5YZDOR6A` receives the compiled local MP4 and its existing poster. Matching does not depend on artist slug or clip title. Other clips retain their accepted ID/title with null native media and an actual still or plain backdrop; the UI never repeats a sleeve as its poster.
- Covers and photographs still come from accepted catalog image objects. Existing `largestImageWidth` caps WebP requests at 1200px for covers and 1800px for photographs without upscaling smaller sources. A 340px sleeve at DPR2 needs 680px, below the cover ceiling. The photo ceiling reuses the existing hosted width ladder; a hard-coded 2048px request would fail for larger originals. No additional artwork fields or image profiles were introduced.
- Editorial response/cache ownership and fresh commerce authority are unchanged. Checks generated no hosted transforms or provider requests.

## Native asset

`apps/web/src/pages/_assets/video-posters/sidus-embrace-the-void-loop.mp4` is imported with `?url` beside the existing poster, so Vite supplies the compiled asset URL rather than embedding the video in JSON or JavaScript.

| Property  | Delivered value                                                    |
| --------- | ------------------------------------------------------------------ |
| Bytes     | 777,248; below the 900,000-byte regression budget                  |
| SHA-256   | `9fcbe9e81098efd9e5c95faa1d4cac809bbfe1559347ba40ae1ec68c2e1366ef` |
| Video     | H.264, yuv420p, 1280 × 536, 24fps, 270 frames                      |
| Duration  | 11.25 seconds                                                      |
| Audio     | None                                                               |
| Container | MP4 with fast-start metadata                                       |

The authorized reviewed input remains unchanged: `C:/Users/SVall/.codex/visualizations/2026/10/02/01a0fd0b-2cff-7363-a14e-9668c2245584/sidus-canvas-loop.mp4`, 859,594 bytes, 12 seconds, SHA-256 `33463b3f6c54246fed9e7d0275bb8c5b9f14a2ef62227efb672c6fbf236fa48c`.

The input ends on colored hair and begins on a wide grayscale aerial shot. Boundary inspection confirmed an abrupt restart. The local derivative starts 0.75 seconds into the input and crossfades its final 0.75 seconds into the input's opening 0.75 seconds, preserving forward motion across the wrap. It uses libx264, preset slow, CRF25, no audio and `+faststart`. Boundary contact sheets are retained locally in `.codex-artifacts/media-delivery/sidus-loop-boundary.png` and `sidus-loop-smooth-boundary.png`. The full downloaded original was not modified or shipped.

Deliberate ceiling: one reviewed exact-ID mapping. Prepare and review another small clip before adding its mapping; no uploader, binding or generic media subsystem is needed for this delivery.

## Scoped verification

- `pnpm openspec:guard --allow-worktree`: passed.
- `pnpm test web-pages src/pages/_preorder-showcase.test.ts`: passed. Covers accepted clip additions/replacements/removal, exact-ID mapping despite renamed title/artist, unrelated same-title fallback, source-object image projection with large/small/missing photos, unchanged cache-header ownership and the native asset byte budget.
- `pnpm test storefront-catalog src/lib/preorder-showcase.test.ts`: passed. Covers canonical editorial projection, optional native-map delivery, unmapped/legacy-map fallback, source ordering, metadata/Listen and missing-source rejection.
- `ffprobe`: verified the delivered properties above and no audio stream. Local boundary-frame inspection confirms the smooth wrap.

An initial combined two-file test invocation selected no tests because the second path became a filter for the first module; the separate commands above replace that invalid invocation. New endpoint assertions were observed failing against the previous projection before implementation.

The parent owns the optional nullable UI schema field, playback integration, browser/device acceptance, final `pnpm validate`, strict OpenSpec validation, task checkboxes and Graphify refresh. This scoped evidence does not claim those checks or hosted acceptance.
