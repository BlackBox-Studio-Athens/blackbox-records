# Player received review

Reviewer thread: `01a12561-133f-7500-b99a-bbd5b0743583`.
Review source: complete report supplied in the module assignment, also retained in `.codex-artifacts/simplification/06-player-review.result.json`.

What this change does: The `player` module derives validated listening sources, renders shared Listen controls and the decorative equalizer, and supplies iframe and presentation helpers to the persistent shell. This read-only review found three bounded simplifications. No files, task records, graphs, or generated outputs were changed.

Module **6/29: player**. Ownership: `apps/web/src/components/music`. Task record: `openspec/changes/simplify-main-site-modules`; the parent can retain this report as `reviews/player.md`. Shared verification and task updates remain with the verification thread.

The assumed runtime is one active player session per browser document. The iframe helper has a default cache limit of six frames, and provider warm-up has three fixed origins. I found no source-backed reason to claim a material performance improvement or to introduce another abstraction.

**Source identity**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD at opening and closing checks: `3355c335226838f996efb5536f55271f819a3e14`.
- Committed player directory tree: `391af5965664d4415f9021a4cb8159287e111b75`.
- Player directory SHA-256 fingerprint: `8d7279caec446c77cf27391dc85b8533e1699c0a21c9cdce36c7e8b91194cadd`.
- Closing fingerprint captured at `2026-10-10T10:47:23Z`. All 15 owned files matched their opening SHA-256 hashes, and Git reported no player changes.

The directory fingerprint hashes UTF-8 records of `relative/path<TAB>lowercase-sha256`, sorted lexicographically by path and joined with LF, without a trailing LF. It includes the eight source files, six test files, and `project.json`.

Other modules had existing edits throughout the review: `web-content-files`, `@blackbox/api-client`, and `@blackbox/content-model`. The imported provider implementation remained unchanged; the content-model barrel was read from the current working tree. Relevant closing hashes were:

- `packages/content-model/src/music.ts`: `45dc560b3f0ad3bad58569b3812d12a89c55bb6f38bdbdb9bbc51b9786328017`.
- `packages/content-model/src/index.ts`: `cabea7872a431a97eed8b5236d1cf4a9c5ae98dac2f27d69214bd95f337a1a70`.

Recheck these identities before implementation, especially the import closure supporting finding 2.

**Should fix**

1. **Remove the private cross-origin option that every caller disables.** [player-provider-warmup.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/music/player-provider-warmup.ts:25), lines 25–26 and 31–40.

   **What this is:** Provider intent adds preconnect and DNS-prefetch links before the shopper opens an embed. The private `appendHeadLink` helper accepts a `useCrossOrigin` switch.

   **Problem and proof:** Its only two calls pass literal `false`. The helper is not exported, and the assignment at lines 37–39 therefore cannot execute through any current caller. The production shell calls the public warm-up function through [shell-player-session-controller.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/player-shell/shell-player-session-controller.ts:177), lines 177–182; that public function exposes no cross-origin option.

   **Smallest change:** Remove the fourth argument from both calls, remove `useCrossOrigin` from the private signature, and delete the three-line conditional assignment. Keep link creation, preconnect-before-DNS ordering, the existing-link query, the missing-head guard, and the timing of `warmedOrigins.add` exactly as they are.

   **Behavior and coverage to retain:** Links must continue to omit a cross-origin attribute. Keep all four tests in [player-provider-warmup.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/music/player-provider-warmup.test.ts:45): exact ordered links, already-warmed origins, links already present in the document, and a document without a head. The last case deliberately still records the origin as warmed; changing that would alter current behavior.

   **Focused check:** Run the owned warm-up test through `pnpm test apps/web/src/components/music/player-provider-warmup.test.ts`, or cover it with `pnpm test player`.

   **Expected reduction:** About **3 production lines**, one unused private parameter, and one unreachable branch. If skipped, there is no established shopper defect; the helper continues advertising an unused capability.

2. **Delete the unused Astro configuration mock from the music tests.** [music.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/music/music.test.ts:4), lines 4–9.

   **What this is:** The suite tests provider conversion, derived player data, and the committed Release fixtures. It registers a mock supplying `base` and `site` for `astro:config/client`.

   **Problem and proof:** The suite imports Node filesystem/URL helpers, Vitest, the content-model package, and `./music`. [music.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/music/music.ts:1) imports only content-model provider builders. The current content-model barrel and its local import closure contain no Astro configuration dependency; the package dependencies are Zod, Portable Text toolkit, and country data. The test configuration uses the React Vite plugin and `setup-reject-network.ts`, neither of which imports this configuration module. The mocked values have no consumer in this suite, and `vi` has no other use in the file.

   **Smallest change:** Delete the `vi.mock('astro:config/client', ...)` block and its separating blank line, then remove `vi` from the Vitest import. Keep every test, assertion, URL fixture, and frontmatter helper.

   **Behavior and coverage to retain:** Preserve the Bandcamp and Tidal acceptance/rejection cases, nonblank source identity/title checks, provider ordering, invalid-source null results, and all three committed Release fixture checks. This removes setup only; it does not remove regression coverage. The official [Vitest mock API documentation](https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/vi.md) describes mocks as substitutions for imported modules. Context7 supplied version 4.1.6 documentation; the repository declares Vitest 4.1.11.

   **Focused check:** Run `pnpm test apps/web/src/components/music/music.test.ts`. Reconfirm the current import closure first if another thread changes content-model or test configuration.

   **Expected reduction:** About **6 test lines**, one mock registration, and the unused `vi` import binding. If skipped, the test continues suggesting that player derivation depends on Astro site configuration.

**Nice to have**

3. **Return one presentation object instead of duplicating its six-field shape.** [player-session-ui.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/music/player-session-ui.ts:29), lines 29–48.

   **What this is:** The function translates session flags into dismissal labels, loading state, mini-player visibility, and truthful ready copy.

   **Problem and proof:** The idle branch and active branch construct the same six properties separately. Their difference can be expressed directly by including `hasSession` in the existing readiness, loading, and provider-label conditions. The production caller, [shell-player-view-state.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/player-shell/shell-player-view-state.ts:21), supplies either the idle input at lines 23–27 or active-session flags at lines 41–48. The shell consumes the resulting loading and dismissal fields for visible copy and accessible state.

   **Smallest implementation:** Remove the separate idle return and retain the existing result shape:

   ```ts
   const isReadyToMinimize = hasSession && isLoaded && hasEmbedInteraction;

   return {
     closeActionAriaLabel: isReadyToMinimize ? 'Minimize player' : 'Close player',
     closeActionLabel: isReadyToMinimize ? 'Minimize' : 'Close',
     isLoading: hasSession && !isLoaded,
     isMiniPlayerVisible: Boolean(status === 'minimized' && isReadyToMinimize),
     miniPlayerStatusLabel: hasSession && providerLabel ? `Player Ready · ${providerLabel}` : 'Player Ready',
     openPlayerActionLabel: OPEN_PLAYER_ACTION_LABEL,
   };
   ```

   **Equivalence proof:** When `hasSession` is false, readiness, loading, and mini-player visibility remain false, both dismissal labels remain Close, and the status remains `Player Ready` regardless of supplied flags or provider text. When `hasSession` is true, each expression reduces to its current active-session expression. A read-only in-memory comparison of the current and proposed expressions covered **144 representative input combinations with zero differences**: all three Boolean flags, all allowed/omitted statuses, and absent, empty, normal, whitespace, and separator-containing provider labels. This comparison was not a test-runner execution against compiled production code.

   **Behavior and coverage to retain:** Keep the exported types, constant, all six result fields, exact visible and accessible labels, and the requirement for both load and interaction before minimizing. Retain every owned UI and state-machine test, plus shell view-state and surface tests. If this candidate is implemented, add one focused assertion that a no-session input with stale loaded/interacted/minimized flags and a provider label still returns the neutral idle result; existing direct UI tests do not cover that combination.

   **Focused checks:** Run `pnpm test player`; have the verification thread cover the shell view-state/controller consumers and the existing player continuity browser spec.

   **Expected reduction:** About **11 production lines** and one duplicate result construction, without a new helper or abstraction. If skipped, the two result shapes remain separate maintenance points. This is a smaller implementation, not a demonstrated performance improvement.

**Ideas rejected after tracing the callers and tests**

- **Replace default-provider selection with the first matching provider.** The current Map keeps the last provider for a repeated ID. A simple `.find` would select the first one. Current builders produce unique providers, but the exported helper accepts an arbitrary `PlayerProvider[]`; the shorter form does not preserve that interface's existing behavior.
- **Remove iframe caching, recency updates, pruning, or detached-frame checks.** These helpers are exported, and the tests independently exercise cached iframe identity, reattachment, cache ordering, eviction order, and protection of the active embed. The shell also synchronizes an existing session into its frame host. Removing this machinery would weaken supported lifecycle behavior.
- **Collapse load and interaction into one ready flag, or remove idle/unknown-event guards.** Loaded-but-uninteracted dismissal must destroy the session; loaded-and-interacted dismissal may minimize it. The machine tests also deliberately preserve idle and unknown events as no-ops. Type declarations do not justify changing those runtime results.
- **Remove `includePlayerData` or always put provider attributes on the trigger.** `ReleaseCard.astro` intentionally puts provider attributes on the containing card at lines 121–128 and passes `includePlayerData={false}` to its triggers at lines 221, 235, and 339. Click and prefetch intent resolve the card before the trigger. The option is actively used.
- **Delete apparently repetitive iframe, provider, UI, or committed-content tests.** Cached resolution does not replace the direct exported marking-helper check; absent identity/title checks protect separate data reads; shell integration and pure presentation tests exercise different seams. The three Release fixture checks protect actual authored URLs. No complete test deletion was justified.
- **Alter the equalizer, labels, SVG structure, styles, or motion.** The five bars are consumed by position-specific CSS selectors and finite/reduced-motion rules. Surface tests assert their count and decorative accessibility attributes. Those are observable contracts, and design changes are outside this task.

**Inspected ownership and connected scope**

Every owned source and test was read in full: **405 production lines**, **833 test lines**, plus **36 metadata lines**. No nested module roots or generated sources were found inside the player directory.

| Owned file                                 | Lines | SHA-256 prefix |
| ------------------------------------------ | ----: | -------------- |
| `MusicEqualizer.tsx`                       |     9 | `0e44eb20fcef` |
| `MusicStreamingServiceListenTrigger.astro` |    60 | `a8bd50b3c8d9` |
| `music.ts`                                 |    33 | `0149a1e5208f` |
| `player-iframe-session.ts`                 |   123 | `6d59c3f0d0d1` |
| `player-provider-data.ts`                  |    42 | `e9f8ef10e250` |
| `player-provider-warmup.ts`                |    41 | `082801109020` |
| `player-session-machine.ts`                |    47 | `4bc954217a35` |
| `player-session-ui.ts`                     |    50 | `70b80d1acffb` |
| `music.test.ts`                            |   212 | `3f4da9498005` |
| `player-iframe-session.test.ts`            |   222 | `d3a7ea73bf38` |
| `player-provider-data.test.ts`             |   114 | `483e0fa28819` |
| `player-provider-warmup.test.ts`           |   113 | `122b5ac626a3` |
| `player-session-machine.test.ts`           |   116 | `47ec63b46531` |
| `player-session-ui.test.ts`                |    56 | `6a922c296907` |
| `project.json`                             |    36 | `56aa658a250a` |

Connected reads covered the shell player controller, frame host, view-state adapter, machine-state adapter, modal-open resolver, iframe blur interaction, and their tests; `ShellPlayerSurface` and its tests; click/prefetch intent helpers; and the player wiring, host, loading, and accessibility portions of `AppShellRoot`.

I also inspected listening call sites in Release cards/details, Artist details, Store cards, Coverflow controls, the preorder showcase, Store Item detail, and the retained demo; Release/Distro derivation in `catalog-data.ts`; content-model provider parsing and current exports; private-preview referrer handling; equalizer CSS; test configuration/network setup; the Store Item listening-context assertions; the three Release URL fixtures; and `e2e/player-continuity.spec.ts`. Reads outside player ownership were bounded to compatibility and regression evidence.

The module's closed boundary metadata permits `ui-foundation`, `web-platform`, and the content-model root interface. All eight declared entrypoints remain intact in the proposals. No change to `project.json` is needed.

**Graph evidence and limitations**

Both required graphs were used before substantive source investigation. The initial Graphify query used the existing graph with budget **2500** and reported truncation. Narrow `explain` queries resolved the relevant connections for iframe resolution, the reducer, presentation derivation, provider-data reads, warm-up, editorial player derivation, and the shared trigger. Behavior conclusions use current source and tests, rather than inferred graph edges.

CodeGraph supplied current source and caller relationships. Where it omitted callback-only test bodies, barrel/configuration files, or trimmed caller sections, bounded exact reads filled the gaps. No owned-source gap remains. The Graphify file timestamp changed externally from `10:02:25Z` to `10:44:51Z` during the review; this thread did not refresh it. The player source hashes remained unchanged. No graph was initialized or enriched, and no paid API or hosted/provider mutation was used.

**Verification handoff**

The implementation and verification threads should independently revalidate the selected findings, run `pnpm test player`, and cover affected shell consumers with the repository's scoped app-shell checks. If finding 3 is selected, the existing `pnpm test:e2e e2e/player-continuity.spec.ts` should verify minimize/reopen/Stop, iframe identity through navigation, Back behavior, and phone continuity. Final repository validation remains with the persistent verification thread under feedback-policy.

The browser spec substitutes local provider fixtures and explicitly leaves real embed focus/tap handling unverified. Its success must not be recorded as proof of real provider playback.

**Verdict:** Completed read-only review. Findings 1–3 are concrete candidates for independent implementation; no must-fix behavior finding is asserted by this report.

**Lean:** Approximately **20 lines possible**—14 production lines and 6 test-setup lines—with all existing tests retained.

**Not checked:** Test-runner execution, browser execution, real provider playback, and performance profiling. The review made no files or task updates, and it does not establish implementation or release acceptance.
