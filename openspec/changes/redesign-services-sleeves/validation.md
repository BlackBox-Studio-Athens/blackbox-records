# Validation

## Source and environment

- Prepared on `main`, source SHA `5d08dcee94e03595f697acf34fa8a0cb21b33580`, with this change uncommitted beside unrelated uncommitted Store work.
- Product Environment: Local. The full Local stack on 4321 serves an earlier compiled renderer (`apps/backend/dist-public`) and was left running, so rendered checks used this tree's Astro dev server on side port 4331 with an override Playwright config in `.codex-artifacts/services-sleeves/`. The stack shows the new page only after its renderer is rebuilt.

## Repository checks

- `pnpm openspec:guard`: passed in the primary checkout.
- `pnpm test apps/web/src/pages/_section-page-identity.test.ts`: passed (`web-pages:test`).
- `pnpm build:web`: passed, including `image-markup:check` with `services-tile__image` (three images, first eager, one high-priority image), cache policy, brand font, route isolation and eager bundle budgets. Log: `.codex-artifacts/services-sleeves/build-web.log`.
- `pnpm openspec -- validate redesign-services-sleeves --type change --strict`: passed.
- `graphify update .`: completed after the code batch.
- `pnpm validate`: passed in `local` mode, `.codex-artifacts/validation/2026-10-08T22-18-55-266Z-31228-998d17/summary.json`; matching before/after fingerprint `18ddeb8d75b1974399ed2dad36f0cb38f86469dc324ce202cc6c5b9b733780df` (20 dirty files, including the unrelated Store work); it formatted only `apps/web/src/pages/services/index.astro`.

## Browser acceptance

- `e2e/catalog-video-contact.spec.ts` (`-g "demo|footer links"`) passed 14 of 14 on the side-port site in `chromium-desktop` and `firefox-desktop`: demo selection during form commit, the single exact `Share your demo` link with a 44px target, submit, success, Send another, shell sentinel across footer navigation and back, no overflow at 390px, and footer flow at 320–1440px. Report: `.codex-artifacts/services-sleeves/summary.json`.
- `.codex-artifacts/services-sleeves/browser-pass.cjs` at 1440px and 390px: three equal tiles share one row at 1440px (347px each, square 345px images) and stack at 390px; every `Ask about …` link, the Demos link and `Start an inquiry` set the Service select to the matching value; the form panel is centred (0px offset); labels are sentence case in `rgb(199, 137, 151)`; one `Share your demo` link; no horizontal overflow; the success panel replaces the framed form instead of nesting inside it. Screenshots: `services-1440.png`, `services-390.png`, `services-success-1440.png` and `services-success-390.png` beside the script.

## Not verified

- Player playback continuity was not exercised: no shell, routing or player code changed, and the shell sentinel check covers navigation continuity. Starting the real Bandcamp embed would play audio on the user's machine.
- Hosted UAT/PRD rendering and the stack's compiled renderer remain unverified until promotion or a renderer rebuild.
