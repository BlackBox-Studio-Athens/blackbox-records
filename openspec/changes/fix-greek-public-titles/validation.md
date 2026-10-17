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

## Scoped publication and UAT acceptance

Candidate `8fc2f7bcfcb1ea080f8851d0fd4a5d65f095edda` contains exactly the 29 repair paths on remote parent `0dd1b644`. Local implementation commit `37a44a01` and integration merge `2cd2b5a7` preserve the existing main checkout. A temporary Git index prepared the scoped candidate without changing branches/worktrees, rewriting history or force pushing. `ed215ad4` is not an ancestor of the published candidate; all 42 shipping-email paths remain local. `.codex-artifacts/greek-store-font-20261018/release-scope.json` and `source-preservation.json` prove scope and identical local/candidate repair files. No backend, migration, Staff, package, catalog, workflow, font asset or font declaration changed in the candidate.

Final precommit validation: PASS, `.codex-artifacts/validation/2026-10-17T21-58-48-102Z-41628-fe9e25/summary.json`; equal before/after fingerprint `f402accde3d25312a8150945dee07ed4af52c75b604d2280fd39cad54b9a9e5c`, sourceChanges empty, formatted empty.

[UAT run 39073262087](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/39073262087) succeeded on workflow attempt 1, all 12 jobs including the full public/browser/Staff suites, deployment and static smoke. All new Greek tests passed on their first try. Two checks in untouched files used the configured retry: WebKit withdrawal review (`e2e/withdrawal.spec.ts:3`) and Chromium phone legal-guarantee reminder (`e2e/international-order-checkout.spec.ts:213`). Their first failures remain unexplained; green CI does not establish zero flakiness. Logs and job identities: `.codex-artifacts/greek-store-font-20261018/uat-ci.log` and `uat-workflow.json`.

Authenticated Chrome confirms UAT release 620, exact candidate SHA/run, unchanged accepted publication/snapshot. At desktop size Greek titles are Inter 600/24px and Latin Disintegration remains Veneer 900/24px. At the measured 391px CSS viewport Greek titles are Inter 600/20px without overflow. Actual glyph reports for Ατελές το ον (12), Ατοπια (6), Blues & Ντέρτια (14), and its item H1 (15) contain only custom `Inter-SemiBold`. Normal Store-item navigation preserves the original uppercase H1 treatment and source title; console error log is empty. The viewport helper did not resize the tab, so acceptance uses a verified CDP metrics override, cleared during cleanup. Independent `verify-worker uat` passes for both the Worker entry and Store Durable Object and confirms checkout remains closed.

[PRD promotion 39073753200](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/39073753200) was dispatched only after UAT feature/identity acceptance and all 12 successful jobs. Final PRD outcome and preservation checks are recorded below after completion.

## PRD acceptance and completion

Promotion 39073753200 succeeded on attempt 1. The live apex serves release 620, source `8fc2f7bcfcb1ea080f8851d0fd4a5d65f095edda`, originating UAT run `39073262087`. Independent `verify-hosted prd` passes the Worker entry, Store Durable Object, hosted release, review-marker and redirected former Pages-origin checks. Evidence: `.codex-artifacts/greek-store-font-20261018/prd-workflow.json` and `prd-hosted-verify.log`.

Authenticated Chrome verifies the three reported production titles using only custom `Inter-SemiBold`, with glyph counts 12/6/14; the mixed-title item H1 also uses only Inter (15 glyphs), retaining uppercase display and 28px phone size. The compact Store measures 391px CSS width, Inter 600/20px and no horizontal overflow; desktop measures 1441px, Inter 600/24px and no overflow. Latin Disintegration retains custom Veneer (14 glyphs), weight 900 and 24px. The shell item link and Back work normally, with no console errors. All viewport/CDP overrides are cleared, both task-owned browser tabs closed, and the local test server stopped by its runner. `.codex-artifacts/greek-store-font-20261018/prd-hosted.json` records these observations.

The post-promotion PRD content object equals the recorded baseline, including publication `0e2a6ba1` and snapshot `844ced62`. The complete public capabilities response is unchanged (including native checkout enabled, pricing/tax disclosure and delivery bands). The public listing-price/availability projection is byte-equivalent after JSON serialization, SHA-256 `163e8f32f93ca690930fb39205e2624a43e064e255529f5a1c46a2e6fd38fc25`. UAT capabilities also remain unchanged/checkout closed. No content publication, catalog/stock/price write, payment or hosted setting change was issued. Evidence: `hosted-preservation-before.json` and `hosted-preservation-after.json` in the task artifact directory. This is public projection preservation, not a complete D1 row audit.

All 25 unrelated file hashes remain unchanged and shipping-email behavior remains unpublished. Completion documentation is scoped to this change; final integrated-tree validation summary/fingerprint, exact source and evidence commits, hosted observations and preservation results are recorded in `.codex-artifacts/greek-store-font-20261018/delegated-result.json`. The receipt distinguishes completed deployment from dispatch. Remaining limits are the untested physical phone/payment-provider flows and the two unrelated CI tests that needed retry, detailed above. No required font-repair or release task remains.
