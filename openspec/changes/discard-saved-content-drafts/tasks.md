# Tasks

## 1. CMS Route

- [x] 1.1 Update the CMS mutation guard to permit native `discard-draft` POSTs while retaining the existing revision and authorization checks; verify the backend smoke route accepts a current revision and rejects a stale one.

## 2. Staff Editor

- [x] 2.1 Add the confirmed `Discard saved changes` action with revision-pair and clean-editor gating; verify the action is absent or disabled for records without a live/draft pair and while the editor is dirty.
- [x] 2.2 Reload the native record and workspace summary after a successful discard; verify the editor shows the live content and preserves the existing failure/conflict behavior.

## 3. Coverage and Documentation

- [x] 3.1 Extend the backend and browser smoke fixtures for successful discard, unchanged public content, stale revision rejection, and editor reload; verify both focused smoke commands pass.
- [x] 3.2 Clarify the four discard/history behaviors in the content workspace and publication documentation; verify the documented distinction matches the staff UI.

## 4. Validation

- [x] 4.1 Run OpenSpec validation, focused staff checks, `pnpm validate:editor`, and the required full `pnpm validate` gate; verify all required summaries pass.
