# Tasks

Tags: `[Claude]` contains UI work; `[Codex]` is media preparation without UI.

## 1. Prepared film

- [x] 1.1 [Codex] Measure the studio logo's bounding box across all source frames and prove each delivered crop excludes it by at least 32 source pixels.
- [x] 1.2 [Codex] Encode the brightened grayscale portrait (608 × 1080, under 2 MiB) and landscape (native crop, under 4 MiB) loops with the prepared-film profile; record ffprobe, hashes, seam check and commands in `.codex-artifacts/hero-video/`.
- [x] 1.3 [Codex] Add the byte-ceiling test `apps/web/src/pages/_home-hero-media.test.ts`.

## 2. Hero

- [x] 2.1 [Claude] Add `<home-hero-film>` with a unit-tested play decision; register it from the renamed Home loader island.
- [x] 2.2 [Claude] Render the film and pause control in `HomeHero.astro`; style the fade-in and control placement.
- [x] 2.3 [Claude] Pass the prepared files from `index.astro`.
- [x] 2.4 [Claude] Add an e2e spec: muted playback, pause/resume, reduced motion keeps the still, portrait selection, music-session pause and shell navigation continuity (the logo exclusion is proven in 1.1).

## 3. Acceptance

- [x] 3.1 [Claude] Browser checks at 320, 390, 768, 1440 and 2560 px; inspect the result against the probes.
- [x] 3.2 [Claude] Record the decision in DESIGN.md and run `pnpm validate`; write `validation.md`.

## 4. Higher resolution

- [x] 4.1 [Codex] Upscale the logo-free crops 2× with three candidates and record provenance, comparisons, flicker proxies and encode probes in `.codex-artifacts/hero-video/upscale/`.
- [x] 4.2 [Claude] Choose the film-preserving upscale, ship AV1 with an H.264 fallback, raise the file ceilings and cover the AV1 fallback in e2e.
