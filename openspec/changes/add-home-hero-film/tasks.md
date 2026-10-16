# Tasks

Tags: `[Claude]` contains UI work; `[Codex]` is media preparation without UI.

## 1. Prepared film

- [x] 1.1 [Codex] Measure the studio logo's bounding box across all source frames and prove each delivered crop excludes it by at least 32 source pixels.
- [x] 1.2 [Codex] Encode the brightened grayscale portrait (608 × 1080, under 2 MiB) and landscape (native crop, under 4 MiB) loops with the prepared-film profile; record ffprobe, hashes, seam check and commands in `.codex-artifacts/hero-video/`.
- [x] 1.3 [Codex] Add the byte-ceiling test `apps/web/src/pages/_home-hero-media.test.ts`.

## 2. Hero

- [x] 2.1 [Claude] Add `<home-hero-film>` with a unit-tested play decision; register it from the renamed Home loader island.
- [x] 2.2 [Claude] Render the hero film first (owner-approved 16 October 2026 revision): mark film capability before first paint, select the orientation source while parsing with autoplay/preload="auto", hide the still until playback or the 2.5-second safety net, retain immediate no-JavaScript/no-motion/failure fallback and the current frame during orientation swaps, and preserve automatic pause rules. The hero has no manual pause control.
- [x] 2.3 [Claude] Pass the prepared files from `index.astro`.
- [x] 2.4 [Claude] Cover hero film playback and automatic pause rules, reduced-motion still fallback, orientation selection and shell continuity; record the 16 October 2026 film-first checks (home-hero-film 7/7 on dev and built preview, frame recording, no reduced-motion film request and stalled-film fallback) in validation.md. The logo exclusion is proven in 1.1.

## 3. Acceptance

- [x] 3.1 [Claude] Browser checks at 320, 390, 768, 1440 and 2560 px; inspect the result against the probes.
- [x] 3.2 [Claude] Record the decision in DESIGN.md and run `pnpm validate`; write `validation.md`.
