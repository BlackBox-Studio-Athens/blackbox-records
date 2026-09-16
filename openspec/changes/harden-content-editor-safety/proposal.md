## Why

The Content editor currently lets required or malformed values travel to Save and Preview, while the discard action is hidden in an overflow menu. Editors need field-level feedback and an obvious recovery path before they risk losing or publishing work.

## What Changes

- Add a visible, confirmation-based Discard changes action for saved and new records, including guarded back navigation and collection switching.
- Expose structured issues from the existing Zod-backed content schemas while preserving the current server validation API.
- Show validation beside every Content field and block Save, Publish, and Preview until the current data is valid.
- Add accessible invalid states and first-error focus to native fields, relationship pickers, image pickers, rich text, and nested rows.
- Group long Content forms with installed shadcn field primitives and keep required or invalid content visible.
- Update the backoffice design reference with a second research round and selected Content/Images improvements.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `emdash-editorial-operations`: Content editing exposes field-level validation, safe discard recovery, and accessible error feedback.
- `content-publishing`: Invalid editorial input cannot be saved, published, or sent to private preview.

## Impact

The shared `@blackbox/content-model` validation package, staff Content React components, relationship and image pickers, preview coordination, browser fixtures, unit tests, and `docs/backoffice-design.md` are affected. No new dependency, endpoint, database migration, commerce permission, or public rendering mode is required.
