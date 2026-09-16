## 1. Shared private rendering

- [x] 1.1 Add the public reader seam and private published-context renderer; verify public and CMS builds and render parity.
- [x] 1.2 Add authenticated bounded preview POST and isolation; verify invalid input, origin, identity, concurrent drafts, and no-write tests.
- [x] 1.3 Replace field previews with responsive live iframe preview; verify debounce, cancellation, stale failures, scrolling, and all collection contexts.

## 2. Focused workspace

- [x] 2.1 Implement focused selection and responsive editing with unsaved protections; verify keyboard and mobile flows.
- [x] 2.2 Move publication summary/history to the top with bounded refresh; verify pending/live/failure behavior.
- [x] 2.3 Improve copy, image guidance, semantic colors, and pointer states; verify contrast and required fields.

## 3. Verification and guidance

- [x] 3.1 Update CMS design and operating guidance, including preview limitations and local resource evidence.
- [x] 3.2 Pass unit tests, check, public build, canonical CMS build/no-KV guard, and local browser review at 390/768/1280/1600 px.

## 4. Preview recovery and staff performance follow-up

- [x] 4.1 Reproduce first-load asset failure and unchanged-HTML retry; gate readiness on assets, preserve last successful rendering, and verify stale-event/authentication handling.
- [x] 4.2 Remove non-edit debounce, deduplicate request-local preview reads, and cap concurrent reads at four; measure identical fixtures before and after.
- [x] 4.3 Load Items/Stock search, selected stock, and history independently with isolated errors and fresh-stock mutation guards; profile remaining staff flows.
- [x] 4.4 Update guidance and evidence, pass required checks and canonical CMS build, deploy UAT, and verify within a bounded hosted pilot.

## 5. Cross-browser reliability and simpler staff workspace

- [x] 5.1 Reproduce Firefox CSP failure and verify explicit-origin policy in Firefox and Chromium with blocked external assets/scripts/forms.
- [x] 5.2 Add authenticated bounded, redacted diagnostics with request/release correlation and error-only disclosure.
- [x] 5.3 Add default-closed remembered desktop preview, narrow Edit/Preview tabs, no hidden requests, and preserved editing/focus/scroll.
- [x] 5.4 Make Content the staff landing page, clarify navigation icons, remove redundant backoffice copy, and retain essential operational guidance.
- [x] 5.5 Add both browsers to release gates, pass required builds/tests and responsive review, update evidence, deploy and verify UAT.

## 6. Publishing reliability and backoffice guidance

- [x] 6.1 Dispatch accepted publications immediately, bind CI before validation, report terminal failures, and test reconciliation and identity guards.
- [x] 6.2 Expose top-bar refresh with single-flight, visible-only bounded polling and useful failed-state guidance.
- [x] 6.3 Trace preview generations, verify successive newsletter edits in both browsers, and report unresolved reproduction honestly.
- [x] 6.4 Create the living backoffice design reference with twelve research sources and three proposed improvements per workspace.
- [x] 6.5 Pass required checks and browser review; verify release acceptance, recover the existing publication, and deploy/verify UAT only when gates permit.

6.5 completed with the successful UAT release run 35071291241 for code commit 923251cc4b99d83db1049ccf9475c03581dacdf0. The failed publication status correction and UAT verification are recorded in validation.md. PRD was not promoted.
