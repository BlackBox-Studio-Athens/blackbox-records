# Store collection follow-up verification

Base source: `f63601ed581e612713b8062c8d3989e5731c5c18`, with this change's uncommitted implementation on `main`. Existing edits to AGENTS.md and docs/agent-reference.md were preserved. Product Environment: Local. No hosted mutation, deployment, price change, publication or checkout launch was performed.

## Implementation checks

- Backend reader/detail/HTTP suites: 93 passing tests. Real D1 repository suite: 4 passing tests, including one bulk listing query, parity with effective checkout holds, ignored paid/not-paid order lines, missing records, restock intent and pause precedence. API-client suite: 8 passing tests.
- Frontend focused suites: 28 passing tests. Shell suite: 192 passing tests. Coverage includes all availability states, older/unknown response values, failed requests, cached snapshot sanitation, cancellation, single-request activation and card layering.
- Backend and web type checks passed. Strict OpenSpec and module/commerce boundary checks passed. The shared domain classifier is registered in the manifest; no ownership exception was added.
- Combined `pnpm validate` passed in Local mode: checks in 76 seconds and tests in 193 seconds, running concurrently. A final run after marking task completion retains the matching final-tree fingerprint in the ignored evidence pointer below.
- Local public runtime was rebuilt from the final UI implementation. A rebuild while the server held its output directory failed with a Windows directory lock; restarting the task-owned Local stack resolved it. The initial combined validation stopped on formatting in three new frontend test hunks; those hunks were formatted before rerunning.

## Native Chrome observations

Browser bootstrap succeeded through the extension in the blackbox profile. All and Distro collections rendered current prices and Sold Out labels; stocked items had no extra label. A Local-only fixture showed Out of Stock and Currently Unavailable, then both changed fields were restored and their original values verified. Currently Unavailable is fallback feedback for paused/missing availability, not a normal inventory label.

At 1366px, hit testing resolved artwork, title, artist, format, price and empty Listen-row space to the native item link, while Listen resolved only to its button. Item navigation reached the existing detail URL; Control-click opened that URL in a new tab. Keyboard order moved from the card link to Listen and back with a visible card outline. Listen opened its player dialog without changing the Store URL. A prepared alternate artwork image still appeared on card hover/focus. No browser console errors were recorded.

Distro navigation issued one listing-prices request and no per-card Store Offer requests. The active Coverflow card displayed price and Sold Out below Listen, within the reserved stage and above the following section. Mobile 390px Grid and 200%-equivalent reflow (683px layout at 2x scale) had no horizontal overflow. Browser keyboard shortcuts did not change Chrome zoom, so the latter check used explicit emulation rather than claiming native browser zoom. Provider audio playback was not asserted; shell lifecycle behavior is covered by the existing passing shell suite. Local Merch has no populated collection; the shared card implementation and category tests cover its reuse.

Screenshot: `.codex-artifacts/store-availability-desktop.png`. Runtime/build logs: `.codex-artifacts/store-local-stack.log`. Final `pnpm validate` source fingerprint, summary path and status are recorded in `.codex-artifacts/store-availability-final.json`, outside the tracked tree so retaining final evidence does not invalidate it. Completion requires a passing Local summary with matching before/after fingerprints.
