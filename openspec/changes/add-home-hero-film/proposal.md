# Proposal

## Why

The owner prepared a 29.5-second montage of BlackBox sessions (`blackbox_website_intro_v5_sharp_HQ.mp4`) for the Home hero, in the spirit of footage-led label sites such as A Thousand Arms. Home currently shows one still photograph. The footage carries a burned-in BlackBox Studio logo in about half its shots; the owner requires that this logo never appear on the site.

## What Changes

- Home's hero plays a silent, looping film over the existing CMS still, reusing the prepared-film profile from the Sidus and Afterwise backdrops (H.264, CRF 20, 24fps, silent, fast-start, 2000k maxrate).
- Two prepared files: a 9:16 centre crop for portrait screens, where a full-viewport cover crop shows only the middle quarter of a 16:9 frame, and a landscape crop for wider screens. Both exclude the studio logo with a margin, proven against its measured bounding box.
- Brightened grayscale is baked into the files, keeping the Monochrome Owns The Page rule without a runtime filter.
- The film follows the approved Home motion rules: muted and inline, playing only while at least half the hero is in view and the tab is visible, and paused during a shell music session. The owner removed the visible pause/resume control after UAT review. Reduced motion, data saving, a failed source and refused autoplay keep the still.
- The still remains the hero's eager, high-priority image and the film waits for it to load.

## Capabilities

### Modified Capabilities

- `app-shell-and-player`: the homepage hero adds a film over the still, and its bounded render work allows that film to play only while the hero is in view.

## Impact

- `apps/web/src/components/editorial/HomeHero.astro`, `HomeHeroLoader.tsx` (renamed from `MottoWordCycleLoader.tsx`), new `home-hero-film.ts`.
- `apps/web/src/pages/index.astro` and new prepared assets in `apps/web/src/pages/_assets/home-hero/`.
- `apps/web/src/styles/global.css` hero rules.
- No content schema, CMS, commerce, routing or player-state change. The source file stays outside Git.
