# App-shell received review

Reviewer thread: `01a1259f-6a1c-7473-95fd-07e397a664a9`.
Reviewer refresh turn: `01a1260f-3d8e-72d2-9b63-9ce4b9313cb9`.
Immutable source: [.codex-artifacts/simplification/13-app-shell-review-refresh-01.result.json](../../../../.codex-artifacts/simplification/13-app-shell-review-refresh-01.result.json).
Raw source SHA-256: `51a71334f69526f8db8d7b83e4a71fefae52c73747472b7c56af705f82b0c5fa`.

The complete received review follows. Its historical check recommendations are preserved; the execution release assigns shared acceptance and task updates to the verifier.

---

**Module 13/29 app-shell: updated read-only review completed.** Findings 1–6 remain supported by current source and consumers. Finding 7 remains partially actionable; its Coverflow assertion deletion is obsolete. No additional deletion is justified in the new crate snapshot or portal code.

The [original immutable report](C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/simplification/13-app-shell-review.result.json) retains detailed proof for unchanged code. This report replaces its recommendations for the current tree. No repository files, reports, OpenSpec records, tests, generated output, or graphs were written. No checks or provider operations were run.

**Current scope and identity**

Work stayed in the existing `main` checkout. HEAD advanced from `86309d1baa5bf5ef21bdf467e6f10a53c80963df` at refresh capture to `54844bd258e2054beee5e951b9b597e13fab50db` at close; the reviewed owned bytes remained stable.

- Original module fingerprint: `8a748625abd20e5b96fc68015ba576632c4f50c26b7746ade8cee33d0f3fa1a9`. Reconstructing all original files from the original HEAD reproduced this fingerprint exactly.
- Current module fingerprint: `86f6a25084dd681b00f6439a2f5a048ea27fab8ba873661696bafad10ab9af8e`.
- Current selected caller/dependency fingerprint, 26 existing files: `da753002c1a3decfeb0ca01576d973f42954837d00bc021fbf76d8a564c45bc7`.
- All 91 owned files remained unchanged between captures at **13:50:48 and 14:01:44 UTC**. All 26 selected connected files matched their inspection captures at close. Owned Git status was clean.

Fingerprints use SHA-256 over ordered `repository-relative path + NUL + file SHA-256 + newline` records; the current inventories are path-sorted.

The complete inventory remains **45 production files, 45 tests, and project.json**, with no added/deleted owned files, nested project roots, or generated sources. Current source/test totals are **5,633 production lines and 6,584 test lines**.

| Owned area                                                    | Production |  Tests |
| ------------------------------------------------------------- | ---------: | -----: |
| Root component, routing, scroll facade and listing activation |          4 |      5 |
| `dom/`                                                        |          8 |      8 |
| `navigation/`                                                 |         15 |     15 |
| `overlay/`                                                    |          4 |      4 |
| `player-shell/`                                               |          8 |      8 |
| `store-cart/` bridge                                          |          1 |      1 |
| `view/`                                                       |          5 |      4 |
| **Total**                                                     |     **45** | **45** |

Exactly three owned files differ from the original review. Each was inspected completely, including CodeGraph omissions:

| Current file                                                                                                                                                          | Lines | SHA-256                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | ------------------------------------------------------------------ |
| [navigation/shell-page-snapshot.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/navigation/shell-page-snapshot.ts:1)           |   348 | `a2da74f1bcb42ac16992c8aa52c4a0275212250d6ce9356ad40848b66e21295a` |
| [navigation/shell-page-snapshot.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/navigation/shell-page-snapshot.test.ts:1) |   888 | `d40c41cb23ea6b6c45a507d86f24954fec5f357d6373b3640a72d4670aafc0af` |
| [view/ShellPortalOutlets.tsx](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/view/ShellPortalOutlets.tsx:1)                       |   156 | `eb8fd73f199980219eaa2ada2fcc0ac77bed1bf6883ec656e4220d183e60aa5e` |

The other 88 owned files match the original inspected bytes exactly. Their full prior inspection is reused.

[project.json](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/project.json:1) is unchanged: the boundary is closed, its sole export is `AppShellRoot.tsx`, and its dependencies remain player, store-cart, checkout-web, storefront-catalog, ui-foundation, web-platform, web-artists, web-store and web-editorial. The content-model workspace interface remains `.`. The crate remains inside web-store; it creates no new app-shell ownership or dependency permission.

**Actionable findings, with prior numbering retained**

1. **Preserve: delete the duplicate idle scheduler.**

   Current locations: [shell-page-snapshot.ts:113–129](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/navigation/shell-page-snapshot.ts:113), [shell-surface-loader.ts:74–88](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/view/shell-surface-loader.ts:74), and [AppShellRoot.tsx:829](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/AppShellRoot.tsx:829).

   Both schedulers still use a 2,000 ms idle deadline, a 200 ms timer fallback, and corresponding cancellation. Current references still show one production snapshot-helper call and two surface-helper calls; the root already imports the reusable helper.

   Replace the mount call with `scheduleShellIdleTask(window, callback)`. Delete the snapshot-specific function, private type, constant and root import. Consolidate snapshot scheduler tests, now at lines 858–887, into the surface-loader suite. Retain explicit **default 2,000 ms**, custom 1,500 ms, fallback and cancellation coverage; update the lifecycle assertion at line 34. Preserve early island-markup capture and cancellation on unmount.

   Expected reduction: approximately **19 production lines and 28–32 test lines**. Focused checks: snapshot, surface-loader and document-lifecycle suites; cached restoration in shell-islands.

2. **Preserve: return the player view mapping once.**

   [shell-player-view-state.ts:21–60](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/player-shell/shell-player-view-state.ts:21) and its player presentation consumer are unchanged. Idle and active branches still duplicate the same five derived output fields.

   Select the existing idle or active input object for one `derivePlayerPresentationState` call, then return one object with conditional session identity fields. Keep optional provider/status fields omitted for idle input. Retain all eight outputs, empty-string defaults, provider labels, load/interaction rules and Close versus Minimize semantics. Keep every current view-state test.

   Expected reduction: approximately **14–18 production lines**, without a new helper. Focused checks: view-state and controller suites, including null, loading, loaded, interacted and minimized states.

3. **Preserve: remove four immediately repeated player setters.**

   [shell-player-session-controller.ts:207–224](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/player-shell/shell-player-session-controller.ts:207) still constructs `nextSession`, then calls four setters at lines 220–223 before `updatePlayerUiFromSession(nextSession)` repeats those same values at lines 122–125. The root still supplies React state setters, and the presentation/loading calculation is unchanged.

   Delete only lines 220–223. Keep session assignment, preference recording and the existing synchronizer in their current order. Retain the earlier title setter at line 331 for a pending frame host, and the load/error callback at lines 163–166: neither belongs to this proven duplicate block. Preserve iframe reuse, session retirement, trigger synchronization, history and focus behavior.

   Expected reduction: **four production lines and four setter calls per applied provider**. Focused checks: controller/view-state suites and player-continuity browser cases. No measured rendering or timing improvement is claimed.

4. **Preserve: delete unused internal return members.**

   Current source and references still support removing `hasCachedHtml` from [overlay-fragment-loader.ts:32–34,88](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/overlay/overlay-fragment-loader.ts:32), and only the returned `clearTimer` member from [shell-transition.ts:191](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/navigation/shell-transition.ts:191).

   `hasCachedHtml` has only the test call at overlay-loader line 44; production uses `getCachedHtml`. Replace that assertion with the expected HTML through the getter, retaining normalized lookup, request arguments, deduplication and failure coverage. Keep the transition's private timer function and its internal calls at lines 122 and 134.

   Expected reduction: **five production lines**, with meaningful cache coverage retained. Focused checks: overlay-loader, transition, cancellation and loading-indicator suites.

5. **Preserve: delete six unreachable server checks inside effects.**

   [AppShellRoot.tsx](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/AppShellRoot.tsx:472) still has the effect-entry guards at lines **473, 504, 524, 536, 556 and 568**. Its unchanged production mount is `AppShell.astro:12`, using `client:load`. React's current documentation confirms that effects run on the client and do not run during server rendering. [React useEffect documentation](https://react.dev/reference/react/useEffect)

   Delete only those six statements and vacated spacing. Retain every effect body, dependency list, catch, cancellation flag and cleanup. Keep render-time window checks at lines 199, 203, 223 and 225, plus standalone environment and private-preview validation.

   Expected reduction: **six executable lines**, approximately twelve lines with vacated spacing. Focused checks: app-shell suites and direct-load/portal/browser navigation cases.

6. **Preserve: avoid parsing an already classified Store activation again.**

   [AppShellRoot.tsx:606–618](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/AppShellRoot.tsx:606) still returns unless `kind === 'store'`, then reparses `pathname`. Both current callers remain unchanged: section navigation supplies kind/pathname from the same parsed route at lines 98–100 and 130–134; cached restoration does so at lines 48–51.

   Keep the kind guard and call `void preloadStoreDistroSearch().catch(() => undefined)` directly afterward. Adjust the code-splitting assertion at line 43 while retaining Store-only warm-up coverage. Preserve entrypoint route validation, category identities, warm-up order, loading generations and failure handling.

   Expected reduction: **one route normalization/classification per Store activation**; formatted line count may remain unchanged. Focused checks: section navigation, cached restoration, code splitting and listing activation.

7. **Partially preserve: trim the unused-spy assertion and unnecessary motion polling. Reject the retired Coverflow assertion proposal.**

   - [store-listing-price-activation.test.ts:59](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/store-listing-price-activation.test.ts:59) remains unchanged. Its spy is not passed to production until line 65, so this negative assertion cannot detect a duplicate direct-load read. Delete only that assertion; retain actual fetch counts, repeated readers and later fresh reads.
   - [shell-transition.test.ts:9–24](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/navigation/shell-transition.test.ts:9) remains unchanged. Awaiting warm-up installs `animate` before resolution, and the trigger then invokes it synchronously. Replace the retry wrapper with one direct trigger call; retain the pre-warm no-call assertion and final exact animation arguments.
   - **Reject as obsolete:** the former snapshot `Set` equality and duplicate Coverflow membership assertion no longer exist. The current [crate test at lines 343–449](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/navigation/shell-page-snapshot.test.ts:343) has distinct reset expectations. Retain it intact.

   Remaining expected reduction: approximately **five test lines**. Every meaningful behavior case remains. Focused checks: listing activation and transition suites.

**Current crate evidence and rejected simplifications**

The new snapshot sanitizer at lines 54–97 resets the crate root, switch buttons, bin choices, desk/navigation/end visibility, stage contents and attributes, rail, status/counter, hand marker and format selection. Connected `crate-switch.ts:16–85`, `crate-view.ts` mounting/rendering/history/cleanup spans, and StoreCrate server markup establish corresponding state writers. Snapshot preparation works on an inert copy before live teardown; calling the live controller's cleanup is not an equivalent replacement. Preserve these resets and the current crate test.

The updated PortalErrorBoundary no longer has the Coverflow-specific error callback. Preserve that concurrent removal, current error fallbacks, route keys, lazy imports and the existing scope selection: exact Distro pathname uses `distro`, other supported targets use `all`. Current Store collection markup supplies those targets; this review does not narrow their functionality.

Other original rejected ideas remain rejected:

- Keep abort/cancellation tokens and request identity checks; tests protect superseded requests and stale completion.
- Keep StoreCart payload validation, queued operations, persistence ordering and unavailable-storage handling.
- Do not replace the snapshot search-reset block wholesale with `sanitizeStoreSearchChrome`. The current helper still additionally hides preorder notes; although its Coverflow reset was removed, it remains behaviorally different.
- Keep the scroll facade, distinct history implementations, source-based loading/lifecycle tests, reduced-motion behavior, inertness, scroll resets and disconnected-target focus safeguards.

No speculative abstraction, visual change or additional crate-code deletion is recommended.

**Connected inspection and tool limits**

The original 19-file caller fingerprint was reproduced from the original HEAD. Seventeen connected files remain identical and their inspection is reused. `StoreListingPricePresentation.ts` changed and was inspected in full. The former `layouts/distro-coverflow.test.ts` was deleted outside ownership; its evidence is historical only.

New/current connected inspection covered StoreDistroSearch's props, format/search operations, mounting and teardown; StoreCrate and StoreDistroCatalog markup; crate-switch; relevant crate-view state/history/cleanup; StoreCollectionPage; the new store-crate layout test; and web-store boundary metadata. These eight additional paths join the eighteen surviving original paths in the 26-file current identity. Module 12 owns the complete crate implementation review; this review inspected its connected behavior only as needed for app-shell.

Both existing graphs were used. The Graphify query used budget **2,500** and truncated at 59 of 441 nodes. Complete focused explains resolved portal relationships (17 edges), shell sanitization (6) and crate reset (3). CodeGraph recognized the new owned sanitizer and crate wiring, but omitted imports, test bodies and some connected spans; exact bounded reads filled the relevant gaps. No missing owned-source inspection remains. External graph refresh/index movement occurred during concurrent work; this thread performed no refresh, initialization or enrichment. Graph output was not treated as exhaustive proof of new-code coverage.

**Verification and expected reduction**

Recommendations are unimplemented. A fresh implementer should independently confirm these source identities and accepted findings. Use the named focused suites or `pnpm test app-shell`; affected verification should include `pnpm test web-layouts` because the new crate layout test reads snapshot source. The persistent verifier owns shared checks and task updates under feedback-policy.

Browser acceptance should retain shell-navigation, shell-islands and player-continuity cases, including phone projects. For current integration, verify All/Distro/category navigation, cached Grid restoration, crate history restoration, lazy-load failure fallback, and the active player's identity/Listen state across route changes.

Estimated removable code is approximately **54–58 production lines** and **33–37 test lines**, with **zero file deletions**; final implementation should measure actual net reductions separately. These estimates exclude report text and unrelated formatting churn. The concurrent crate changes are already part of the baseline and are not counted as this review's savings.

**Not executed:** unit tests, validation, browser/visual checks, performance measurements or provider operations. Existing fixture-based player tests do not establish real provider playback. There is no unresolved owned-source or moving-source blocker at the closing identity.
