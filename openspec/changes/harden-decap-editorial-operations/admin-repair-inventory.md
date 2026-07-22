# Decap admin DOM repair inventory

Task 1.7 baseline captured from required worktree HEAD `c9cedf906aefa57e6d41fba76fe2033097121b9b` on July 22, 2026. This is evidence only: no runtime or test behavior changes are included.

## Method and scope

- `apps/web/public/admin/init.js` was read in full and audited for Decap-rendered selectors, generated class fragments, visible-text heuristics, element-order assumptions, DOM mutations, observers, event hooks, and delayed retries.
- Current executable coverage was traced through `scripts/smoke-cms-local.ts`, `scripts/smoke-uat-static.ts`, and `apps/backend/test/scripts/smoke-uat-static.test.ts`.
- The list-field trigger inventory reuses the task 1.5 evidence in `collection-field-matrix.md`; it does not re-audit field/schema ownership here.
- Seven Decap-markup-dependent records are present. None has a focused unit or browser regression that forces its repaired failure. Three have partial smoke coverage, one has source-presence coverage only, and three have no behavioral assertion.

## R1 — Reload saved singleton-to-singleton route transitions

- **Source:** `reloadOnSavedSingletonRouteChange()` and supporting route helpers, `apps/web/public/admin/init.js:109-149`; invoked by the shared controller at `:506-535`.
- **Exact dependency:** hash shape `#/collections/<collection>/entries/<entry>`; `document.body.innerText`; case-insensitive visible text `CHANGES SAVED`; previous and next singleton route keys; full-page `window.location.reload()`.
- **Defect repaired:** commit `1492dd27` records that Decap could present stale singleton editors after authentication or route changes. This branch reloads when navigation moves directly between two supported singleton entries after Decap reports saved state.
- **Triggers:** transitions among `home/home-site`, `about/about-site`, `services/services-site`, `newsletter/newsletter-site`, and `settings/settings-site`. A transition through a non-singleton route clears the route key and does not reload.
- **Lifecycle assumptions:** the controller must have observed the old singleton first; Decap must render the English `CHANGES SAVED` text before the hash/DOM callback evaluates the new route; route navigation must preserve the current document.
- **Failure if Decap changes:** changed hash grammar or save-state copy prevents reload, allowing stale editor state to survive. A coincidental `CHANGES SAVED` body string can cause an unnecessary reload. The repair has no stable Decap API signal.
- **Current coverage:** Local CMS Smoke opens Home then About in one page (`scripts/smoke-cms-local.ts:593-627`), so the route shape is exercised. It never creates a saved state or asserts a reload. No unit test covers the text heuristic, route-key state, or reload branch.

## R2 — Detect empty singleton loads and show recovery guard

- **Source:** expectations and active-route matching at `apps/web/public/admin/init.js:73-126`; DOM/state heuristics at `:151-188`; guard removal/recovery storage cleanup at `:190-286`; delayed guard synchronization at `:288-314`.
- **Exact dependency:** native `input`, `textarea`, and `select` values; `document.body.innerText`; editor-chrome regex `Writing in ... collection`; visible count text `<number> sections`; hard-coded expected content substrings and minimum section counts; app-owned guard selector `[data-blackbox-cms-empty-guard="true"]`.
- **Defect repaired:** commit `1492dd27` records that failed remote singleton loads could silently become default empty forms and risk publishing blanks over live content. The guard warns the editor and offers local draft/cache cleanup followed by reload.
- **Triggers:** the five singleton routes above. Expected sentinels are Home `Fine music on record.`, About `The Label`, Services `Tour Booking`, Newsletter `Join the Collective`, and Settings `Blackbox Records`; Home/About/Services require at least one visible section. `distro-page/distro-page-site` is a fixed file collection but is not guarded.
- **Lifecycle assumptions:** Decap renders editor chrome and native controls first; populated values arrive within 1.5 seconds after an empty reading; section summaries use English plural text; `document.body` remains the active mount; storage names include one of the broad cleanup tokens.
- **DOM/event/timing mutations:** sets/removes `document.documentElement.dataset.blackboxCmsEmptySingleton`; appends/removes a fixed alert section; binds its recovery button click; waits 1,500 ms before showing it; deletes matching local/session storage keys and IndexedDB databases, resolving `success`, `error`, or `blocked`, then reloads.
- **Failure if Decap changes:** custom/contenteditable controls, renamed editor chrome/count copy, delayed value hydration, or changed singleton content can cause a false warning or miss an empty form. Broad storage-token matching can clear unrelated CMS-local draft stores. Missing `document.body` prevents the warning from rendering.
- **Current coverage:** Local CMS Smoke checks loaded Home/About values and section counts, rejects `0 sections`, and asserts the guard is absent on the healthy path (`scripts/smoke-cms-local.ts:438-555`, `:652-671`). Baseline evidence records four passing Home/About checks in `baseline.md:11-22`. No test forces an empty load, waits for the 1.5-second guard, clicks recovery, checks storage deletion, or covers Services, Newsletter, Settings, or the unguarded Distro Page singleton.

## R3 — Replace generic login with branded DecapBridge auth surface

- **Source:** `getLoginButton()` and `syncAuthLoginSurface()`, `apps/web/public/admin/init.js:316-347`; invoked by the shared controller at `:506-535`.
- **Exact dependency:** scans every `button`; collapses whitespace in `textContent`; accepts only exact lowercase `login` or `sign in with decapbridge`; assumes `loginButton.parentElement` is the correct insertion point.
- **Defect repaired:** commit `430e7a37` records that UAT could settle on a generic Decap login shell while smoke passed loading copy. The repair renames the action, adds non-technical social-sign-in guidance, and exposes readiness markers.
- **Triggers:** any `/admin/` state that renders the accepted login-button text, including direct entry URLs before authentication.
- **Lifecycle assumptions:** the button is a real `<button>`, its text is English and available after a child-list mutation, and its parent can accept a helper before the button.
- **DOM mutations:** adds `data-blackbox-cms-auth-button`; replaces button text, `aria-label`, and title with `Sign in with DecapBridge`; inserts `.blackbox-cms-auth-helper`; sets `data-blackbox-cms-auth="ready"` and `window.__BLACKBOX_ADMIN_AUTH_READY__`. Styling depends on `admin.css:683-719`.
- **Failure if Decap changes:** different copy, localization, non-button controls, shadow DOM, or a changed wrapper leaves the generic surface unenhanced and the readiness marker unset. Existing helper markup is not reparented if Decap replaces the login wrapper later.
- **Current coverage:** UAT Static Smoke recognizes the data hook, text, or global marker and rejects a generic login-only terminal state (`scripts/smoke-uat-static.ts:438-492`, `:934-969`). Its helper unit tests reject generic `Login` and accept the enhanced state (`apps/backend/test/scripts/smoke-uat-static.test.ts:145-201`). Local CMS Smoke deliberately accepts either enhanced text or generic `Login` when clicking (`scripts/smoke-cms-local.ts:636-649`), so it does not enforce this repair. No test verifies helper insertion, exact guidance, attributes, parent ordering, or safe no-op when the button is absent.

## R4 — Expose unlabeled remove controls in sortable list rows

- **Source:** `enhanceListItemActionButtons()`, `apps/web/public/admin/init.js:356-391`; invoked by the shared controller at `:506-535`.
- **Exact dependency:** generated class fragments `[class*="ListItemTopBar"]`, ancestor `[class*="SortableListItem"]`, and button class substring `TopBarButton`; at least two matching buttons; last-button ordering; target button must have empty combined `aria-label`, title, and text.
- **Defect repaired:** commits `0c7753cc` (`fix(cms): expose remove controls in section rows`) and `073b7c7f` (`refactor(cms): normalize decap control grid`) establish that Decap list-row removal existed as an unlabeled/hidden action. The current narrowed repair labels only an unlabeled last action in a sortable row.
- **Triggers:** any Decap list widget that renders the qualifying shape. Current candidate fields are Home `sections`, dormant Journey `paragraphs`/`stats`; About `sections`, Story `paragraphs`, Contact `items`, Stats `items`; Services `sections`, service `items`/`bullets`, Process `steps`; Artists `profile_links`/`videos`; Releases `formats`/`credits` (`collection-field-matrix.md:43-64`, `:80-94`, `:109-125`, `:219-224`, `:245-248`). The selector is route-agnostic and can run on existing or new entry editors.
- **Lifecycle assumptions:** Decap preserves generated class-name fragments, places remove last after another top-bar button, leaves that action entirely unlabeled, and emits child-list mutations when rows appear.
- **DOM mutations:** marks the target with `data-blackbox-section-row-action="remove"`; sets `aria-label`/title `Remove section`; appends visible `Remove` text. Presentation also depends on generated-class and data-hook CSS at `apps/web/public/admin/admin.css:537-626`.
- **Failure if Decap changes:** renamed classes or changed button order makes the repair disappear. A different unlabeled final action can be mislabeled and styled as removal. Native labels added by Decap make the repair no-op, which is safe but leaves current CSS behavior dependent on Decap's replacement affordance.
- **Current coverage:** no unit, Local CMS Smoke, UAT Static Smoke, or committed Browser Use assertion references `ListItemTopBar`, `SortableListItem`, `TopBarButton`, the injected data hook, or visible `Remove` label. Task 15.9 already plans removal where native list controls can replace it.

## R5 — Add accessible, stateful preview-toggle copy

- **Source:** `getPreviewToggleButton()`, `ensurePreviewToggleContent()`, `syncPreviewToggleButtonState()`, and `isPreviewPaneVisible()`, `apps/web/public/admin/init.js:349-462`.
- **Exact dependency:** an already-enhanced app data hook or a Decap `<button title="Toggle Preview">`; generated classes containing `PreviewPaneFrame`, `PreviewPaneContainer`, and `ControlPaneContainer`; pane geometry wider than 120 px as the visibility signal.
- **Defect repaired:** commit `2495ec45` (`refactor(cms): tighten preview toggle footprint`) added explicit Open/Hide copy, visible state, and accessible pressed state around Decap's icon control. Current design/spec also requires one understandable keyboard-accessible preview control while preserving editor width.
- **Triggers:** any editor state where Decap renders its preview toggle. The custom preview subset registered in this file is Home, About, Services, Artists, Releases, Distro, and News (`apps/web/public/admin/init.js:1137-1156`), but the DOM selector itself is not collection-limited.
- **Lifecycle assumptions:** title text remains `Toggle Preview`; a pane width above 120 means visible; Decap's click changes layout within 60 ms; app-added children survive Decap rerenders; child-list mutations keep synchronization running.
- **DOM/event/timing mutations:** appends label/status spans; adds data state/labels; replaces aria label, pressed state, and title; binds one click listener through `data-preview-toggle-click-bound`; resynchronizes 60 ms after click; sets `data-blackbox-cms-preview` on `<html>`. Styling depends on `admin.css:364-456`.
- **Failure if Decap changes:** changed title/class names or shadow DOM prevents discovery; changed pane geometry or responsive layout reports the wrong state; a slower transition leaves stale labels; Decap replacing the button loses the listener and app children until a later observed child mutation.
- **Current coverage:** no test or smoke asserts button discovery, Open/Hide copy, aria state, status chip, 120 px threshold, post-click resync, or the CSS data hooks. UAT's `__BLACKBOX_ADMIN_READY__` marker does not prove this controller ran.

## R6 — Auto-collapse the preview once per browser tab

- **Source:** session key/state at `apps/web/public/admin/init.js:4-6`, `:55-71`; `schedulePreviewCollapse()` at `:464-504`.
- **Exact dependency:** existing-entry hash regex `#/collections/<collection>/entries/<entry>`; R5 toggle and preview-pane selectors; real pane width; programmatic click behavior; sessionStorage key `blackbox-cms-preview-auto-collapsed`.
- **Defect repaired:** the original admin integration and `2495ec45` establish the current intent: entry editors should start with preview collapsed so editing width is available, while editors can reopen it through the repaired toggle.
- **Triggers:** the first qualifying existing-entry route per tab/session when a visible preview pane and toggle are present. New-entry routes do not match the regex. Later existing entries remain as the user left them because the session flag is shared across collections.
- **Lifecycle assumptions:** Decap mounts the pane/toggle within one of the scheduled attempts or causes later body child mutations; programmatic toggle click is equivalent to user activation; collapse completes within 90 ms.
- **Timing workaround:** schedules attempts at 0, 50, 140, 280, 450, and 700 ms; guards concurrent clicks; verifies after 90 ms; removes the session flag when collapse did not succeed so a later mutation can retry.
- **Failure if Decap changes:** changed route/title/classes/geometry or slower transitions leave preview open; a wrong visibility reading can click the toggle in the wrong direction; attribute-only layout changes may not trigger another controller pass; sessionStorage blocking causes repeated collapse attempts across editor mutations.
- **Current coverage:** UAT `cms_assets` only verifies that downloaded `init.js` contains the session-key string (`scripts/smoke-uat-static.ts:536-558`). No unit or browser smoke asserts initial collapse, one-per-tab behavior, user reopen, retry timing, or failure recovery.

## R7 — Observe Decap rerenders and re-run every repair

- **Source:** `startEntryEditorPreviewController()`, `apps/web/public/admin/init.js:506-535`.
- **Exact dependency:** `window.hashchange`; `document.body`; a body-subtree `MutationObserver` limited to `childList` mutations; one `requestAnimationFrame` before running R1-R6 synchronization.
- **Defect repaired:** Decap is a client-rendered single-page editor whose login, toolbar, list rows, form values, and preview pane arrive or change after initial script execution. This controller is the shared mechanism that makes the DOM repairs find late-rendered targets.
- **Triggers:** every hash change and every descendant addition/removal under the body for the lifetime of the admin document; one immediate run after setup.
- **Lifecycle assumptions:** `document.body` exists when setup runs and is not replaced; relevant Decap changes include a child-list mutation; repeated callbacks are cheap enough; one animation frame is sufficient before inspection.
- **Failure if Decap changes:** attribute-only/class-only updates are invisible because attributes are not observed; replacing `<body>` strands the observer; frequent mutations can queue repeated animation frames and R6 timer batches; there is no disconnect or debounce. If setup fails, R1-R6 receive no shared lifecycle updates.
- **Current coverage:** Local and UAT smokes execute the admin runtime indirectly, but no assertion proves hash listener registration, observer options, immediate run, animation-frame ordering, attribute-change behavior, or safe repeated invocation. The UAT readiness marker is set before `window.initCMS()` and controller startup (`apps/web/public/admin/init.js:1158-1162`), so it cannot prove this record completed.

## Adjacent manual-init timing seam — audited, not counted as Decap DOM-dependent

`registerWhenReady()` polls every 30 ms for `window.CMS`, `window.createClass`, `window.h`, and `window.initCMS`, then removes the app-owned `.blackbox-cms-boot`, registers previews, sets readiness globals, calls `window.initCMS()`, and starts R7 (`apps/web/public/admin/init.js:652-669`, `:1137-1165`). `apps/web/src/pages/admin/index.astro:34-53` enables manual init, loads the pinned CDN runtime, then appends `init.js`.

This is a CDN/global-load timing workaround, not a selector against Decap-rendered markup. It has no timeout or failure state: missing globals poll forever and leave the branded boot screen indefinitely. UAT smoke can detect a stuck loading surface (`scripts/smoke-uat-static.ts:934-969`), but no unit controls the polling clock or missing-global path.

## Audited exclusions

- `toArray()`, `toObject()`, `toText()`, `titleCase()`, and `createElementFactory()` normalize preview data or create app-owned preview markup; they do not inspect Decap-rendered DOM.
- `resolveAssetUrl()` depends on Decap's `getAsset` return shapes and media paths, not rendered markup. It belongs to the media/preview tasks, not this DOM repair count.
- Preview component bodies and `CMS.registerPreviewTemplate()` calls use the supported extension API. Their app-owned class names are preview styling hooks, not generated-class repair selectors.
- Removing `.blackbox-cms-boot` targets markup owned by `index.astro`, not Decap. It is covered with the adjacent timing seam above.

## Coverage baseline and key gaps

| Coverage class | Count | Records | Current evidence |
| --- | ---: | --- | --- |
| Focused regression | 0 | none | No test forces the repaired defect on the pinned Decap runtime. |
| Partial smoke | 3 | R1, R2, R3 | Singleton healthy/transition routes and hosted auth terminal state only. |
| Source-presence only | 1 | R6 | UAT fetches `init.js` and checks the session-key token. |
| No behavioral assertion | 3 | R4, R5, R7 | List action, preview-toggle behavior, and lifecycle wiring are unasserted. |

Highest-risk gaps are generated list-row classes/button order (R4), preview classes/title/geometry/timing (R5-R6), English editor text/native-control heuristics and untested recovery deletion (R1-R2), and the unbounded child-list observer/timer fan-out (R7). Current `pnpm test:cms-admin` runs only `apps/web/src/lib/admin` builder/config tests (`package.json:87`) and does not execute `public/admin/init.js`.
