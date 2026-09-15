## Context

The user approved Layout A, dark semantic colors, live split preview, and visual review only. The combined CMS Worker already serves Astro on demand. Public pages are static and query collections through shared readers.

## Goals / Non-Goals

Render unsaved editorial changes with actual public templates while keeping requests private, bounded, and free of writes. No autosave, preview persistence, transactions, browsing, new hosting, or experimental Astro Container API.

## Decisions

- A public content-reader module re-exports Astro collection reads. The CMS build aliases it to a request-scoped reader using AsyncLocalStorage. This preserves public behavior and avoids duplicate page templates or globally mutable draft state.
- An authenticated same-origin POST renders shared public pages. Validate editorial input and identities, resolve published revisions and private media, and overlay only the selected draft. Bound reads and payload sizes; cache only published context briefly inside the existing CMS object.
- Use sandboxed iframe HTML with scripts, navigation, embedded players, and submissions disabled. Keep styles/fonts/crops; refresh after 750 ms, cancel outdated requests, retain scroll and visibly stale last-successful output.
- Desktop starts with preview closed and remembers the browser preference; opened preview is 45/55 editor/preview. Below 1100 px use Edit/Preview tabs; section navigation remains collapsible. A searchable selector replaces the record column while editing.
- Publication summary uses existing status/time fields, an anchored desktop popover and mobile Sheet. Poll pending work every 15 seconds while visible for at most two minutes. Errors remain actionable.
- Reuse installed primitives and CSS Grid. Blue actions/selection, amber pending/unsaved, green live, red failure, always with text. Preserve publication permissions and Items handoff.

## Risks / Trade-offs

- CMS and deployed public code may differ: label environment and explain the code basis without claiming exact live parity.
- Invalid or missing content: show an actionable preview failure and retain the previous rendering as outdated; never fall back to repository drafts.
- Worker Free limits: local operation measurements and bounded input, reads, and refresh. No KV or sessions.
- Sharing public templates expands the CMS bundle: canonical CMS build and public build must both pass; browser parity verifies styling and media.

## Migration Plan

No data migration. Deliver through the existing release workflow after local checks; rollback uses the previous code artifact. The approved reliability/performance follow-up includes UAT deployment.

## Reliability and performance follow-up

Initial preview, view changes, and manual refresh run immediately; only editorial changes wait 750 ms. Each response loads a new isolated iframe generation, checked for stylesheet and image readiness before replacing the last successful frame. Failed or superseded generations cannot report success or overwrite newer output. Manual refresh retries assets even for identical HTML. Preserve scroll and actionable authentication/asset errors.

Preview reads share a request-local promise map and a four-read concurrency limit. Pagination and validation remain ordered; published revisions and independent media resolve concurrently without changing budgets or authority. Items/Stock initial search and selected stock start independently; history has separate loading/error state and does not delay fresh stock. Mutations remain disabled without a fresh matching stock record. Further staff optimizations require measured evidence.

The measured distro detail path originally scanned its entire collection (237 reads). Direct selected-entry lookups now resolve only validated unsaved input and its referenced media/artist; full collection requests retain published surrounding entries. Shared templates and the public reader API remain unchanged.

## Firefox CSP and workflow refinement

The Firefox reproduction loads the same meta CSP into a sandboxed srcdoc iframe: Chromium attaches the stylesheet, Firefox does not. The policy now names the validated CMS origin explicitly for styles, images and fonts. Keep the header and meta policy derived from one function; preserve the sandbox and deny script/connection/form/frame activity. Browser tests use the real policy, including negative resource tests, in Chromium and Firefox.

The desktop toolbar owns Show preview / Hide preview. Only the desktop preference persists, never drafts. Narrow screens start in Edit and retain tabs. Hiding cancels work, reopening immediately refreshes current content. Root and logo lead to Content. Use Lucide icons for distinguishable navigation/actions, and remove repeated private/save/debug explanations. UAT has one Test environment badge. Preview caveats live in an information popover; operational field guidance and publication state remain visible.

Preview responses expose X-Preview-Request-Id and X-Release-SHA. Existing structured logs record render outcome/timing/read counts. Parent UI sends at most one report per failed generation to POST /_emdash/preview-diagnostics, authenticated at editor role with same-origin and request-marker checks. Strict 4 KB schema, ten reports/minute/identity, bounded 1000-identity in-memory map, no retry or persistence. Server and client redact query strings/private media paths; no draft HTML, credentials or arbitrary exception dumps. CSP directive is included only when a browser event was observed; early pre-load violations may have no directive. Diagnostics never block editing.
