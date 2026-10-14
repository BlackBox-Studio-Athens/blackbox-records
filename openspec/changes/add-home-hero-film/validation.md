# Validation

Base commit `54132b781722ec9077bcc29b0401b7997376e423` on `main`, uncommitted. Product Environment: Local only. Rows: Shell/player/routing (hero, shell navigation, music-session pause) and Boundaries/tooling (OpenSpec). CMS, commerce and release rows do not apply: no content schema, checkout or hosted change.

## Media

- Source `D:/Pictures/blackbox/blackbox_website_intro_v5_sharp_HQ.mp4` (1920 × 1080, 30fps container with mixed 24p/25p cadence, 29.5 s) stays outside Git.
- Studio logo measured across all 885 frames: x 79–216, y 59–216 inclusive, present in 315 frames; no other overlay. Landscape `crop=1664:936:256:144` clears it by 39 px, portrait `crop=608:1080:656:0` by 439 px. All-frame top-left maximum projections and contact sheets of both outputs show no logo (`.codex-artifacts/hero-video/watermark-bbox.json`, contact sheets). Acceptance captures at every width show none either.
- `home-hero-intro-landscape.mp4`: 4,175,373 bytes, 1664 × 936, 708 frames, 29.5 s, SHA-256 `149f2d278f4c887b695fd8ba1052af9b0f267665a92550ec59e13d1a05a69002`.
- `home-hero-intro-portrait.mp4`: 2,017,888 bytes, 608 × 1080, 708 frames, 29.5 s, SHA-256 `5f938ea49edc7a599e8196e478a5e1d4d78714d990f7c792bc5081a8e8d914e0`.
- Both: H.264 High, yuv420p, 24fps, no audio stream, moov before mdat, bt709. Grade `hue=s=0,eq=gamma=1.45:contrast=1.08` with flat chroma. To meet the byte ceilings the files needed `hqdn3d=1.5:1.5:3:3` and CRF 26 (landscape) / 25 (portrait) instead of the Sidus CRF 20. Cadence: `mpdecimate` plus motion-compensated `minterpolate` to 24fps; two sampled runs of consecutive high-motion frames show no warping (real-time playback of the whole loop was watched only in captures, not frame by frame), and the posterized red-smoke shot near 20.8 s matches the graded source.
- The loop seam has no black or duplicate frame, but the source's exposure jump at the wrap remains (landscape SSIM 0.81).
- Commands, probes and hashes: `.codex-artifacts/hero-video/{evidence.json,encode.log,ffprobe-*.json}`. Pre-implementation colour/grayscale probes: `.codex-artifacts/hero-video/probes/`.

## Checks

- `pnpm test` for `home-hero-film.test.ts` and `_home-hero-media.test.ts`: passed.
- `pnpm test:e2e e2e/home-hero-film.spec.ts`: 3 passed in `chromium-desktop` and `chromium-mobile` (landscape playback, pause/resume, out-of-view and music-session pause, shell navigation round trip with sentinel intact, reduced motion with no film request, phone portrait crop with a 44 px control and no overflow). Summary: `.codex-artifacts/e2e/summary.json`.
- Real Chrome and Firefox playback at 320, 390, 768, 1440 and 2560 px (Firefox at 390 and 1440): correct file per orientation, playing, no console errors, no horizontal overflow. Captures: `.codex-artifacts/hero-video/acceptance/`.
- `pnpm build:web` then `pnpm performance:bundles`: Home eager graph 103,096 Brotli bytes against the 108,544-byte budget, no diagnostics. The build ships both films as hashed `_astro` assets.
- `pnpm openspec -- validate add-home-hero-film --type change --strict`: valid.
- `pnpm validate` passed in `local` mode (final run pointer in ignored artifacts). The first run failed `@blackbox/web:typecheck` on the `disableremoteplayback` attribute spelling; fixed to Astro's `disableRemotePlayback`.

## Not verified

- Physical iOS/Android devices, Safari/WebKit decoding and low-power autoplay refusal.
- UAT/PRD delivery; no hosted environment was touched.
- The working tree also holds another session's uncommitted `streamline-agent-harness` changes; this change does not touch them.
