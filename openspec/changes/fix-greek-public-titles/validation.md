# Greek public-title repair evidence

## Authorization and identity

On 18 October 2026 the owner selected existing Inter for Greek titles and explicitly authorized Sol high full-access implementation, scoped commit/push, UAT and exact-candidate PRD delivery. The replacement worker's rollout turn_context confirms model `gpt-6.1-sol`, effort `high`, sandbox `danger-full-access`, approval `never`; thread `01a14bd1-38d0-7e83-b578-fc01a44d1217`. The earlier restricted worker did not implement the repair.

Initial local main: `d8bbaa6f6d41e0cf3c6271ec14c636877dc40c10`; remote main: `0dd1b6445aff462e1025053e634b7c18545b8858`. The sole unpublished source difference is shipping-email commit `ed215ad4`; it must remain local. Release candidate identity and workflow evidence will be appended after publication.

## Local acceptance

- Existing UI utils export supplies one Unicode Greek predicate; the marked whole title uses self-hosted Inter 600. Existing display assets, font subsets, preload, swap, body credits, prices and controls remain unchanged.
- Affected module tests pass through final validation: ui-foundation, store-cart, checkout-web, web-artists, web-editorial, web-store, web-pages and their affected dependencies. The existing Services source assertion now recognizes the conditional class without losing its shared-title contract.
- `pnpm validate`: PASS, 62 tasks for 48 projects including dependencies, mode `local`; `.codex-artifacts/validation/2026-10-17T21-52-43-881Z-53076-943b55/summary.json`. Final before/after fingerprint `8e9e333f6cea2f791feb2185846783aef6789753daed311270dd31d49614158c`, equal, sourceChanges empty. The wrapper reran after the two test-fixture edits made during its first pass.
- `pnpm build:web`: PASS, including route isolation, image/font/cache contracts and runtime bundle budgets. `.codex-artifacts/greek-store-font-20261018/build-web.log`.
- Strict OpenSpec validation and `git diff --check`: PASS. Graphify refreshed once after the source batch; `.codex-artifacts/greek-store-font-20261018/graphify-update.log`.
- All 25 unrelated tracked/untracked files remain byte-identical to `.codex-artifacts/greek-store-font-20261018/preservation-before.json`.

## Browser acceptance

Seven production-preview checks passed without skips or retries in 82.2 seconds. Command: `BLACKBOX_E2E_PREVIEW=1 pnpm test:e2e e2e/store-formats.spec.ts e2e/store-cart.spec.ts e2e/store-crate.spec.ts -g 'Greek|Store listing cards' --project=chromium-mobile --project=chromium-desktop --project=firefox-compact --project=webkit-mobile --workers=1`. Evidence: `.codex-artifacts/greek-store-font-20261018/browser-fonts.log` and `browser-fonts-summary.json`.

- Chromium verifies actual platform fonts for Ατελές το ον, Ατοπια and Blues & Ντέρτια at 320/390/430/1440px: every rendered glyph uses custom Inter, weight 600, source case, original responsive 20–24px size. The long Greek Extended/decomposed stress probe also renders entirely in custom Inter. Latin Disintegration keeps Veneer 900.
- Long text fits without horizontal overflow. The prior listing-scale check retains artist links, source case, long-title wrapping and simulated 200% reflow. Screenshots: `.codex-artifacts/e2e/store-typography/greek-*.png`.
- Store-to-item-to-Store shell navigation retains the shell sentinel and Greek styling. Rendering classes do not change navigation or player state; the full CI shell/player suite remains a separate release gate.
- Chromium, Firefox and WebKit verify mixed-title cart and checkout Inter 600. Chromium and WebKit verify the CD bin and Grid round trip. Initial dev checks found missing capabilities in the new checkout fixture, a phone Filter-sheet step and Vite dependency-cache reloads; corrected fixtures pass against production output.

Selected acceptance rows: public presentation/shell and release/environment. Commerce checks cover presentation only; no payment, catalog, stock, content publication or provider mutation is part of this repair. Physical-phone appearance and real payment/provider behavior are not established.

## Hosted baseline

UAT and PRD both initially report release 619, source `5dfced7e07982773e04abc600ea4302161597e62`, push run `39063788148`. UAT content publication `555fb5b5-930a-47f7-99ad-2ad9ae2b3eb6`, snapshot `d85a501260604993dd6d147abbf0068b1cb8fbe667c5023fe1b778ceda910cd8`; PRD publication `0e2a6ba1-45c3-4273-8e0b-ab9f2eab1b95`, snapshot `844ced625b39d32bd2c472ca2d524c7f329a85cd39c62decf0269155cb8bfd2c`. PRD native checkout enabled is true; preserve it. The PRD Pages mirror redirects to the apex.
