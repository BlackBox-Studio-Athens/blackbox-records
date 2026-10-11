# Tasks

## 1. Implementation

- [x] 1.1 Add `shell-first-screen-images` with `preloadEagerImages` and `waitForEagerImages` (300 ms cap). Preload from section and overlay `prefetchHref` only.
- [x] 1.2 Await first-screen images after scroll and before the page-enter transition in section navigation and cached-page restoration.
- [x] 1.3 Make Release, Artist and News overlay lead images `loading="eager"` without high fetch priority; keep `priority` on full pages.

## 2. Verification

- [x] 2.1 Extend shell unit tests for preload on intent, no click-path preload, bounded wait, already-decoded images and image failure. `pnpm test:changed --scope web` passes.
- [x] 2.2 Extend `apps/web/scripts/check-image-markup.ts` for the release, artist and news overlay fragments. `pnpm --filter @blackbox/web build` passes, including `image-markup:check`.
- [x] 2.3 Browser acceptance on Local: hover then click a section link and overlay on desktop and mobile, with reduced motion and a throttled network. Confirm no image pop-in for warmed links, the veil never holds beyond about 300 ms, the persistent player continues, and the console is clean. Evidence and limits (reduced motion via script override, synthetic touch) in `validation.md`.
- [x] 2.4 Run `pnpm validate` and strict OpenSpec validation on the final tree. See `validation.md`.
