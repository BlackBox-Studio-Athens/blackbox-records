# Validation

Product Environment: Local. Source: `981c610d` plus this change's working tree.

## Repository gates

- `pnpm validate`: passed, `mode: local`, run `2026-10-07T11-16-16-638Z-30916-b7a689`, fingerprint `10608709…deb8a5` unchanged before and after (16 files). Summary: `.codex-artifacts/validation/2026-10-07T11-16-16-638Z-30916-b7a689/summary.json`. The first run failed in `workspace:test-runner` because `release:watch` (commit `981c610d`) was not classified in `feedback-policy.json`; it is now an operational command.
- `pnpm openspec -- validate add-home-swipe-rows --type change --strict`: valid.
- Unit: `swipe-row-dots.test.tsx` (current-card calculation, including a row that does not scroll; dots markup) and `home-swipe-row-css.test.ts` (fade only inside `@supports (animation-timeline: view())` and reduced-motion `no-preference`, longhands only): 7 passed.

## Build and bundle

- `npx astro build --root .` in `apps/web`, then `npx tsx scripts/check-runtime-bundle-graphs.ts`: Home eager graph 105,931 Brotli bytes. It failed the 105,472-byte budget by 459 bytes; the island chunk `swipe-row-dots.*.js` is 1,729 bytes, 795 Brotli. The owner approved a 104 KiB Home budget (106,496 bytes); the check then passed. Other routes are unchanged.
- Built CSS keeps `animation-timeline: view(inline)` inside `@supports (animation-timeline:view())` with the reduced-motion media query.
- Follow-up: push run 37687568781 failed `pnpm build:web` because the image-markup slot table still held the pre-row Home News width (356 px at 390). Chromium on the built fixture paints the swipe-row card image at 291.55 px at 390 (344.66 at 1440; News index 356 and 347.33), matching the card `sizes` (291.56 px), so the Home phone slot is now [291, 295]. `pnpm --filter @blackbox/web build` reproduced the failure; `tsx scripts/check-image-markup.ts` then passed.

## Acceptance rows

Shell/player/routing applies, because Home islands must hydrate after shell navigation. CMS, commerce and release rows do not apply: no content, Worker or checkout change.

- `pnpm test:e2e e2e/home-swipe-rows.spec.ts`: 6 passed in Chromium and Firefox, three consecutive runs. It covers 390 px swiping, dot tap to card two aligned to the gutter, the last dot at the row end, no horizontal page overflow, dots after shell navigation from About with the sentinel intact, the fade in Chromium and full opacity in Firefox and under reduced motion, and 1280 px grids without dots. The first Firefox run exposed a test race (only one dots island awaited); the spec now waits for both.
- `pnpm test:e2e e2e/home-preorders.spec.ts`: 42 passed. `e2e/shell-navigation.spec.ts`: 17 passed. Earlier failures in both came from the reused background dev server: Vite answered `504 (Outdated Optimize Dep)` for `ServicesInquiryForm.tsx`, identically with this change stashed, and its dev toolbar covered the mobile player button. Restarting the server cleared the first; the harness-owned server, which disables the toolbar, cleared the second.
- Browser observation (Chromium, 390 px, Local dev): News cards 82% and Artists cards 74% of the row with the next card visible; Home height 3,229 px, from 5,464 px; neighbouring cards dimmed; dots match the approved ReUI style A.

## Decisions and comparison

Owner choices from rendered drafts and the interactive comparison (https://claude.ai/artifact/VUQeroBw3SEfJEUayBpUCt): native rows (option 1), dot style A, keep the fade, desktop unchanged. Comparison measurements are in `design.md`.

## Not verified

- Real iOS Safari and Android devices. Safari 26's scroll-timeline fade and the touch feel were not observed on hardware; WebKit is not installed for Playwright here.
- Hosted UAT/PRD rendering.
