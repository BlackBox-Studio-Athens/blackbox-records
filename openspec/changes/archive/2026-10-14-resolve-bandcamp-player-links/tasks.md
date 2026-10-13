## 1. Shared recording model

- [x] 1.1 Add validated immutable Bandcamp page and recording values and reuse them for canonical player construction.
- [x] 1.2 Preserve legacy and iframe inputs and support official versioned and album-plus-track embeds with focused tests.

## 2. CMS lookup

- [x] 2.1 Add authenticated bounded lookup and isolated Worker dispatch without publication side effects.
- [x] 2.2 Test Ethos/Hail metadata, fallback, disagreement, invalid input, redirects, size limits and timeout/error behavior.

## 3. Staff editing

- [x] 3.1 Add automatic lookup and explicit field states with Retry, Revert and Clear; reject stale results.
- [x] 3.2 Guard autosave, review, navigation and unload for unresolved input without storing raw text.
- [x] 3.3 Test replacement preservation, races, editor switching and save guards.

## 4. Acceptance

- [x] 4.1 Run focused tests, strict OpenSpec validation, Graphify update and final pnpm validate; record source-bound evidence.
- [x] 4.2 Verify Local staff editing, preview and draft publication, plus Ethos player loading/playback and relevant shell continuity; record any unavailable acceptance separately.

## 5. Review and local commit

- [x] 5.1 Review connected callers and remove repeated embed parsing, redundant request bookkeeping and the SSR assertion that cannot exercise effects.
- [x] 5.2 Reset the editor after saved-draft discard so the Bandcamp field displays the restored source, with a browser regression.
- [x] 5.3 Verify the reviewed source and commit locally without pushing or deploying.

## 6. Hosted provider failure

- [x] 6.1 Reproduce PRD's Ethos failure without editing content and compare Local and isolated hosted fetch responses.
- [x] 6.2 Recognize Bandcamp's successful-status challenge document, preserve safe actionable feedback and emit sanitized failure diagnostics; add regression coverage.
- [x] 6.3 Validate and commit the failure-handling correction locally; record the unresolved hosted URL-only limitation.
- [ ] 6.4 Resolve the provider access restriction before claiming PRD URL-only acceptance. Blocked: Bandcamp challenges the hosted request source; no supported alternative has been established.
