# Player Stop e2e correction

**Completed narrow correction; checkpoint acceptance remains pending.** Same original fresh module 6 implementer `01a1263d-5cf0-7cd2-8995-04aed53dddca`, existing `main` checkout. HEAD before/after: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`. The completed player implementation was not redone.

## Cause and exact change

The preserved [diagnosis](player-stop-diagnosis.md) established that the confirming WebKit touch was dispatched **3382.766 ms** after the first Stop action, beyond the existing **3000 ms** confirmation window. The existing expiry correctly re-armed Stop instead of destroying the iframe. A timely real touch succeeded. Stop UI/controller/test and the original e2e spec matched pre-edit hashes; no production fix was justified.

Only the Stop interaction in `e2e/player-continuity.spec.ts` changed:

- For mobile, `stop.tap({ trial: true })` prepares normal actionability/scroll/stability without dispatching input, then the test measures and checks the button rectangle before arming.
- The first real press remains the existing `press(stop, isMobile)`.
- After the retained `Stop?` and iframe-count-1 assertions, mobile confirmation uses `page.touchscreen.tap` at the already measured button center. Desktop confirmation retains the existing click path.

This removes a second locator's scroll/stability preparation from the confirmation window. The diagnostic and current surface show the same fixed-size target in armed/unarmed states. No force option, synthetic dispatch, clock manipulation, arbitrary sleep, retry, skip or product/config change was introduced.

All original assertions remain: `Stop?`, first-press iframe count **1**, confirmed iframe count **0**, hidden Open player, every navigation/history check and iframe/document identity check. The **180000 ms** case timeout, **60000 ms** Store route wait, default **30000 ms** assertion timeout and product expiry remain unchanged. Machine verification reconstructs the complete original spec by removing only the preflight additions and restoring only the confirming interaction; the result matches the saved original byte content after line-ending normalization.

## Focused acceptance

`pnpm openspec:guard` passed before patching. The corrected **original** case ran through the normal published admission harness:

```text
pnpm test:e2e e2e/player-continuity.spec.ts -g 'player survives shell navigation, minimize/reopen and history; Stop destroys it' --project=webkit-mobile --project=chromium-mobile --project=chromium-desktop --retries=0
```

**Exit 0: 3 passed, 0 failed, 0 skipped, 0 flaky, 0 retries**, 44.3 seconds. WebKit mobile: 11.498 s; Chromium mobile: 18.165 s; Chromium desktop: 17.283 s. Only this original case was selected. Earlier diagnostic cases are not counted as acceptance. Scoped ESLint, Prettier, diff checks and source/history integrity also passed.

The exact selected/final manifest contains **1699 records**, including checkpoint source/config/data, deletion markers and protected historical artifacts. All records match before/after the run; compared with the pre-correction capture, only the authorized e2e file changed. The archived failed trace, screenshot, error context, diagnosis evidence, canonical player implementation/raw history, old blocked checkpoint note and shared task bytes remain unchanged.

- Spec before SHA-256: `08f09a45390ed9af7e238985056ece72e121fb87f01b7a33559736a585196f3b`.
- Spec after SHA-256: `79a9a8d4bef1dc64e4149f95793ccded54f9f2ab831d437eed224d4e4d5953d1`.
- Selected/final source/config SHA-256: `fdab033d37da9bff47b9e47209f1f09c431da9c5ca876fa4125706a09dd1a7aa`.

[Machine handoff](../../../../.codex-artifacts/simplify-main-site-modules/player-stop-correction/summary.json) links the exact selection, project results, individual config hashes, preservation checks and environment. [Archived runner report](../../../../.codex-artifacts/simplify-main-site-modules/player-stop-correction/browser-result/summary.json), [command log](../../../../.codex-artifacts/simplify-main-site-modules/player-stop-correction/browser.log), `selected.json`, `final.json` and `correction.diff` remain in the dedicated ignored evidence folder. The aggregate hashes sorted repository-relative path/tab/hash records joined by LF without a trailing LF. Reuse this three-project result only while actual covered source/config inputs match.

## Files, resources and remaining acceptance

Actual repository edits: **one e2e file plus this dedicated note**. Production net change: **0 lines**. E2e net change: **+5 lines**. Deleted files: **0**. Markdown and ignored evidence are excluded from code totals. The original module 6 reduction/history remains unchanged.

No Local stack was running at entry. The standard harness started and stopped its own temporary Astro server; no Worker or hosted/provider service was used, and no other owner was stopped. Final resources: **0/3 validation slots held, port 4321 free, Chrome free, no Local stack/Worker running**, and no temporary browser session retained. Resource receipt: `player-stop-correction/resources.txt` in the ignored evidence folder.

The verifier still owns remaining cart/browser and normal Local commerce acceptance, strict evidence and shared task updates. Final global/package/type gates remain mandatory. This passing correction is not whole-checkpoint acceptance. No graph refresh, shared config change, commit, push, release or provider mutation occurred. Real provider playback remains unverified.
