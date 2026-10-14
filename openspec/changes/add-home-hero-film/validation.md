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

## UAT release

- Committed as `51c556b856c0f06c1ec03723787a1a1b99e9e451` and pushed to `main` with the earlier unpushed `54132b78` (email branding), which the owner approved releasing together. PRD was not promoted.
- [Release run 38619803357](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38619803357): every `deploy-uat` step passed, including deployed-release verification, the UAT static smoke and "Require UAT to still serve this run". The first attempt of e2e shard 4 failed `release-merchandising.spec.ts:525` in Firefox (the Music player dialog did not open after a Store Item document round trip), a path this change does not touch; it passed 3/3 locally in Firefox and the re-run of the failed shard passed, so the run concluded `success`. Logs: `.codex-artifacts/hero-video/uat-run-e2e4-failed.log`.
- UAT (`https://blackbox-records-web-uat.pages.dev/`) is behind Cloudflare Access; the agent's connected Chrome was not signed in, so the hosted hero was not viewed by the agent. Owner review on UAT remains the hosted visual acceptance.

## UAT review revision

The owner found the first grade dark and hazy on UAT. The gamma lift flattened blacks and the approved still-photo shade (up to 92% black) sat over already dark footage. Revisions:

- Grade `hqdn3d=1:1:2:2,hue=s=0,curves=master='0/0 0.06/0.03 0.2/0.26 0.45/0.62 0.75/0.9 1/1',unsharp=5:5:0.5` on Codex's unchanged crop/cadence intermediates. Landscape CRF 27, 3,870,044 bytes, SHA-256 `081db032c6827badc03d0819e370ca27e36472ced1c129045f06f79fff2f0a14`; portrait CRF 26, 1,873,449 bytes, SHA-256 `a50a5f778bb3b0c8a51ab82f667b0e738c5acb968209e1be805eeb60eced4865`. Crops are unchanged, so the logo proof still holds.
- A hero containing the film (`:has(.homepage-hero-section__film)`) gets a lighter shade that darkens only the header band, the tagline side and the bottom edge. Reduced-motion still and both film sizes checked: `.codex-artifacts/hero-video/regrade/`.
- The UAT review banner is now one 24 px line whose explanation truncates first (previously wrapped to about 80 px on phones); its text and the release marker check are unchanged.
- Phones upright and sideways (Chrome on a Pixel 7 profile, WebKit on an iPhone 13 profile): the portrait crop plays upright, rotating swaps to the landscape crop and back and keeps playing, and both fill the screen with `object-fit: cover`. The sideways hero used to exceed a 412 px screen (450 px), pushing the pause control off screen; a short-landscape rule trims its padding so it fits. A `@phone` e2e test covers the rotation. Captures: `.codex-artifacts/hero-video/mobile/`.

## Second UAT review revision

- The owner removed the hero's pause/resume button. The controller keeps automatic pausing (half out of view, hidden tab, music session) and the still for reduced motion and data saving. This leaves no manual pause for a loop longer than five seconds (WCAG 2.2.2), recorded as the owner's decision in design.md.
- The motto cycle runs a tad faster: first hold 1.2 s, holds 2.3 s, scrub 1.1 s (was 1.5 / 2.8 / 1.4 s).
- `pnpm test:e2e e2e/home-hero-film.spec.ts` (4 passed) and `e2e/home-motto.spec.ts` (5 passed).
- Release run [38630630150](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/38630630150) for `1c4cc649`: all checks and suites passed; the first `deploy-uat` smoke saw the new `global` stylesheet 404 about 14 s after the Pages upload (the hash changed with this commit). Re-running the job redeployed the same build and every step passed, so the run concluded `success`. Log: `.codex-artifacts/hero-video/uat-deploy-failed.log`.
