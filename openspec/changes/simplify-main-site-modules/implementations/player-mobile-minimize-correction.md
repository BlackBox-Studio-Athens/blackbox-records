# Player mobile Minimize correction

**Completed bounded diagnostic and test-only correction; final/checkpoint acceptance remains with the verifier.** Same module6 implementer `01a1263d-5cf0-7cd2-8995-04aed53dddca`, existing `main`, HEAD `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`. The verifier explicitly released browser/runtime/validation resources before this work. Original module6, Stop and Minimize diagnosis histories remain unchanged.

## Failure, diagnostic and correction

The preserved [original failure](../../../../.codex-artifacts/simplify-main-site-modules/final-high-retry-01/shell-player-browser/) touched the fixture while the lazy player controls mounted, replacing the fallback header and shifting the iframe down 32 px. The shell also schedules initial Close focus at that mount. The [read-only diagnosis](player-mobile-minimize-diagnosis.md) established that overlap, but its trace did not contain native DOM events. No source-backed cleanup production regression was established.

**Exactly one passive native diagnostic** copied this case into ignored evidence and ran through the repository's `pnpm test:e2e` harness in Chromium mobile. It kept the provider fixture HTML, all original actions/assertions, 90000 ms case deadline and 30000 ms expect deadline. An init script attached passive parent/fixture pointer, touch, click, focus and blur listeners; a mutation observer recorded controls/geometry, and a zero-delay observation sampled active element in the next task after window blur. It did not change input, product state, clocks or provider behavior. The ignored config retained the published Chromium mobile settings, selected one case, set zero retries and retained the passing trace/screenshot.

The diagnostic **passed once**, with zero retries, skips or flaky results (`11630.844 ms` harness duration). It recorded 104 events. Full controls mounted **116.1 ms before** fixture touch; their initial Close focus occurred **91.7 ms before** touch. Trusted fixture touchstart/touchend/click were received. Parent window blur saw the active iframe at +2.7 ms and the next-task sample still saw it at +18.1 ms; the dismissal label became Minimize at +21.9 ms. This supports waiting for the actual controls and their initial focus before fixture input. **The archived failure was not reproduced, and its exact native event-loss mechanism remains unproven.** Passive instrumentation can affect scheduling; this is neither a flakiness claim nor an old-tree reproduction. No additional diagnostic/retry was run and no production fix was justified.

The only normal test edit is at [the original fixture press](../../../../e2e/player-continuity.spec.ts:130):

```ts
// The lazy controls replace the loading header and focus Close when they mount.
await expect(modal.getByRole('button', { name: 'Bandcamp', exact: true })).toBeVisible();
await expect(modal.getByRole('button', { name: 'Close player', exact: true })).toBeFocused();
```

The same real fixture press and Minimize press follow these preconditions. No existing assertion or action was replaced. There are no sleeps, forced/synthetic events, new helpers, retries, timeout increases, skips, product changes or shared config changes. Exact byte comparison confirms that removing these three lines restores the diagnosis-captured spec, including the earlier Stop correction and every visibility/iframe/footer/Menu/landscape/navigation/history/identity check. Stop confirmation and expiry semantics remain unchanged.

## Focused checks and retained evidence

| Check                       | Command / selection                                                                                                                                                                                                                                                        | Result                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Guard                       | `pnpm openspec:guard` before diagnostic preparation and before original-spec implementation                                                                                                                                                                                | Both exit 0                                                            |
| Passive diagnostic          | `pnpm test:e2e .codex-artifacts/simplify-main-site-modules/player-mobile-minimize-correction/minimize-diagnostic.spec.ts --config .codex-artifacts/simplify-main-site-modules/player-mobile-minimize-correction/playwright.diagnostic.config.ts --project=chromium-mobile` | Exit 0; 1 pass; retry 0                                                |
| Corrected **original** case | `pnpm test:e2e e2e/player-continuity.spec.ts --project=chromium-mobile --project=webkit-mobile --project=chromium-desktop --grep 'on phones the floating player leaves the page end and the Menu reachable; landscape fits the embed' --retries=0`                         | Exit 0; **3 passed**, 0 skips/unexpected/flaky/retries; `18869.809 ms` |
| Changed-test lint           | `pnpm exec eslint e2e/player-continuity.spec.ts`                                                                                                                                                                                                                           | Exit 0                                                                 |
| Changed-test format         | `pnpm exec prettier --check e2e/player-continuity.spec.ts`                                                                                                                                                                                                                 | Exit 0                                                                 |
| Scoped diff                 | `git diff --check -- e2e/player-continuity.spec.ts`                                                                                                                                                                                                                        | Exit 0                                                                 |

Chromium desktop applies because this case explicitly sets the 390 × 844 viewport and tests the mouse input path; its desktop project does not skip this case. All three original-case results have retry 0. The corrected case exercised initial minimize, floating-player/footer separation, reachable Menu Close and landscape embed/dismiss geometry. It uses local provider fixtures and does not establish real-provider playback. Unrelated previously passing browser selections were not rerun.

The dedicated note's first Prettier check required Markdown table alignment; native apply_patch corrected only the audit note, and its final formatting check passed. Both outputs are retained in `note-format-initial.log` and `note-format-final.log`.

Each canonical output was archived **before the next browser run**, and no list command overwrote a report. Ignored [evidence directory](../../../../.codex-artifacts/simplify-main-site-modules/player-mobile-minimize-correction/) contains:

- `pre-diagnostic-canonical/`: canonical output that existed before this turn's browser work, retained unchanged.
- `diagnostic-browser/`: diagnostic summary, trace, screenshot and inline native-event attachment; `native-events.json` and `diagnostic-analysis.json` retain decoded events and bounded interpretation.
- `corrected-original-browser/`: corrected original-case summary and runner state; `original-case.log` preserves the full runner output.
- `before.json`, `pre-acceptance.json`, `after.json`, `player-continuity.before.ts`: input hashes, exact baseline and line/byte comparisons. `handoff.json` records final integrity, commands and resource closeout; lint/format/resource logs remain alongside it.

## Source identity, accounting and lease return

The original spec SHA-256 was `79a9a8d4bef1dc64e4149f95793ccded54f9f2ab831d437eed224d4e4d5953d1`; final is **`27b2c92fd0764cabcebae1c6ff4c97c7298ae7c3f3db48ed32f9cdf1da8bb470`**. Final published `playwright.config.ts` hash remains `1cc6d0145212ed6347ee3b2ff5560cd029988400a5308ac905476115495c547f`. The 42 selected source/config/test inputs were unchanged from diagnosis before the patch; only the spec differs afterward. Their final aggregate is `d6df39e94f070e7b08f7c99b285dd4245a24c4dacd6adca0de25d0bba30e02ad`, identical before and after the corrected original-case run. All player production/test sources still match completed module6 evidence.

The retained admission-list snapshot covers 1672 currently existing paths, with final aggregate `179a4f9a9c11c1a92a40d04755223e264b3a348d52c5f5de03cfc153211f16bd`; five historical admission entries were already absent and are listed in `before.json`. This identity record supplements the verifier's complete final-tree capture. Aggregates use sorted repository-relative `path<TAB>sha256` records joined with LF, without a trailing LF.

**Additional delta relative to the Minimize diagnosis capture:** `e2e/player-continuity.spec.ts` changes from **187 physical / 170 nonblank** lines to **190 / 173**: **+3 physical, +3 nonblank test lines**, production **0**, deleted production/test files **0**. The dedicated audit note and ignored diagnostic scaffolding/evidence are excluded from code accounting. Earlier module6 and Stop accounting is preserved and must not be counted again.

The harness closed both temporary servers and all browser workers. Final published `pnpm local:status` reports **0/3 slots held**, checkout port **4321 free**, **Full Local stack not running**, and **Chrome lease free**. No owned session/process/server remains; no Worker was started or retained. **The verifier may resume browser/runtime/validation work.** No graph refresh, global validation, provider operation, shared task edit, commit or publication was performed. Old failed evidence and protected module6/Stop/diagnosis reports remain byte-identical. Remaining final-tree/global/Local/strict acceptance and task markers belong exclusively to the verifier.
