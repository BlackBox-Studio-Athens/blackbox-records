# Home scroll scheduling repair

## Scope and source

The owner reports severe Home-only scrolling lag in Facebook Messenger and explicitly assigns implementation to Codex, with local commit, UAT delivery and later PRD promotion authorized. Baseline main is `416ef61f08472c3d70b66c986655cbc41fef33be`. Product changes are confined to the app-shell hero scroll connector; the approved fixed ghost, CSS opacity path, videos, typography, content and commerce are preserved.

The confirmed defect was direct event-time execution of the hero fallback despite the existing frame-batching contract. Scroll events now queue the existing single frame; resize invalidates geometry separately, and cleanup cancels pending scroll work. This establishes the scheduling repair, not a reproduced physical Messenger root cause.

## Focused regression

Four new cases failed against the original connector and passed after the patch: a scroll burst seeks the latest position once at frame time, scroll-before-resize and resize-before-scroll each retain one remeasurement, and disconnect cancels scroll work queued after initialization. Ordinary scrolling keeps the cached geometry. Existing threshold, fallback, hero replacement and off-Home cases also pass.

`pnpm test apps/web/src/components/app-shell/dom/shell-hero-scroll-progress.test.ts` passed app-shell, web-layouts and web-pages. Before/after logs are `.codex-artifacts/messenger-home-scroll/regression-before.log` and `regression-after.log`. `pnpm build:web` passed on the baseline and patched tree, including route isolation, asset checks and bundle budgets; the final build log is `.codex-artifacts/messenger-home-scroll/build-after.log`.

## Performance method

Use the existing production-static Local helper, `touch-home-input`, with `--home-showcase=empty --hero-fallback=forced --runs=3`. Both arms use Chromium 153.0.8010.12, 390×844, DPR 2, a coarse touch pointer without hover, 4× CPU, 150 ms latency and 200,000 bytes/s download. Each run opens a fresh context, records early input and settled first/repeat touch traversal, and retains all traces and outliers. The empty showcase isolates the shared hero path; the browser suite separately checks populated chapters.

Baseline evidence: `.codex-artifacts/runtime-performance/messenger-home-scroll-20261017/before.json`, with `treeUnchanged: true`, source hash `43ce8c3d1bee2b03320ba7d31e7199731c042922cc84af535d046d03098a3fd7` and build hash `089b6e799003ebe573dd0f1f57a3359048b4dab332cc9e31554fe53b22b614bb`. Final evidence: `after.json` in the same directory, also `treeUnchanged: true`, source hash `310d13066c807e9c186a2bec81687a046500ce16cfa8121cf5f0e4631aa4d53b` and build hash `fefa6e0f1f7de0c8420edc7fb36c9aa0afaff82013e292f42f9df7ab8188912f`. Every early/first/repeat raw trace is retained beside its report.

| Path     | First traversal frame-interval p95, runs (ms) | Repeat traversal p95, runs (ms) | Settled tasks at least 50 ms, first/repeat |
| -------- | --------------------------------------------- | ------------------------------- | ------------------------------------------ |
| Baseline | 33.2, 16.8, 33.3                              | 16.8, 16.8, 16.8                | 0/0/0 and 0/0/1                            |
| Patched  | 33.3, 16.8, 16.8                              | 16.7, 16.7, 16.8                | 0/0/0 and 0/0/0                            |

Repeat pacing is effectively unchanged in this emulation, and the first-traversal ranges overlap. Median measured style work decreased from 165.2 to 146.4 ms on first traversal and 118.3 to 102.0 ms on repeat, but three runs do not establish a device-level speedup. All four recorded media/veil opacity samples at 0/150/300/500 px are identical between arms, and no early console errors were recorded. Do not compare these samples to the earlier desktop DevTools probe or claim their callback timestamps measure visible device frames.

## Acceptance and limits

Selected acceptance rows are shell/player/routing and release/environment. Commerce, Staff, CMS and provider acceptance are not affected by this connector repair. Required final browser, validation and UAT evidence will be recorded here before completion.

No physical phone or Messenger browser is connected. The reported device-specific lag has not been reproduced here, and physical Messenger acceptance remains unverified. The earlier archived Android investigation likewise never supplied physical Messenger acceptance; its font-swap and synthetic-input findings are historical context rather than evidence for this patch. The owner subsequently authorized PRD software promotion; Content Publication and launch-setting changes remain outside scope.

## Browser checks and validation

The initial six-spec run passed 80 of 82 cases across Chromium desktop/phone, Firefox desktop/compact and WebKit phone. Firefox's international-delivery case failed before any country-trace request appeared in its trace, then passed a focused rerun; its exact initial cause is unconfirmed. The Chromium cancelled-swipe/subsequent-tap case failed twice with the patch and once with the original connector. Its fixture sent `touchEnd`, completing a flick, while the WebKit arm explicitly cancels. Changing that one fixture event to `touchCancel` preserves the named cancellation scenario, no-prefetch assertion and subsequent real tap. The corrected case passes in both Chromium and WebKit, plus three consecutive Chromium repeats. Thus all 82 selected cases have passing candidate evidence; the initial run itself remains recorded as failed. Initial and baseline failures/traces are retained under `.codex-artifacts/messenger-home-scroll/browser-initial`, `browser-recheck` and `browser-baseline`; successful focused logs are `browser-recheck.log`, `browser-cancel.log` and `browser-cancel-repeat.log`.

After the diagnostic baseline swap, the restored connector's bytes were asserted equal to the measured candidate (path-bound hash `c941029941fda14c6a664aab79397ed922b7c9f4a97fbd5fa09ba04ebe1df491`). Existing passing product checks remain applicable; the corrected browser fixture was checked separately. All task-owned Local servers and measurement browsers are stopped.

Repository checks passed in `.codex-artifacts/validation/2026-10-17T00-34-43-921Z-29556-a1ef08/summary.json` (`mode: local`, 35 tasks, equal before/after fingerprint `4fb9b69880eed2cfa9e4c96ccefe4e8229750fd948489bf728ca3ffd2c45c00b`, no source changes). This is superseded by the final check including the corrected browser fixture and complete evidence. An earlier check was invalidated when this evidence was edited during execution; its automatic rerun then rejected the unformatted table. The note was formatted before the passing run.

Graphify's local AST update completed. It reported existing SQL-parser availability and unrelated partial-extraction warnings; no semantic extraction or provider calls were made.

After correcting the browser fixture, `pnpm validate` passed all 35 selected tasks in `.codex-artifacts/validation/2026-10-17T00-43-34-868Z-31380-f8af26/summary.json`, with no source changes or automatic formatting. The final precommit summary and hosted release receipts are retained in `.codex-artifacts/messenger-home-scroll/completion.json`; documentation updates reuse only unchanged-code evidence and receive their own final validation.

## Hosted baseline

Before delivery, both environments serve release 613, candidate `c25b8692dbef6f13e594b5b0ceac1476257576af`, run `38982182645`. UAT's accepted publication is `555fb5b5-930a-47f7-99ad-2ad9ae2b3eb6`, snapshot `d85a501260604993dd6d147abbf0068b1cb8fbe667c5023fe1b778ceda910cd8`. PRD's accepted publication is `c9a9a757-d395-44ec-8bb0-d03f44d14d9a`, snapshot `49aeac2d9fbbe22a523db6f74d84f67cd5b3260b88b0d88d27e67073699e877d`. These were read from each actual hostname's release.json in the signed-in BlackBox Chrome profile. Delivery must retain the environment-owned content identities.
