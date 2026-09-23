## Context

The staff Content editor already uses Zod-backed collection schemas, native form controls, shadcn `Field` primitives, an `AlertDialog`, searchable relationship selection, and an image `Sheet`. Server-side `validateCmsContent` is authoritative, but it currently returns formatted strings and the editor only surfaces a rich-text validation result. The existing preview pipeline accepts the editor payload independently of field-level UI state.

## Goals / Non-Goals

**Goals:**

- Reuse Zod 4.5.4 and the existing content schemas to produce one structured validation result for staff feedback and server compatibility.
- Make invalid fields visible, focusable, and actionable before Save, Publish, or Preview.
- Make discard recovery obvious without adding a second draft storage system.
- Use existing shadcn primitives to improve long-form hierarchy and picker error states.

**Non-Goals:**

- No new validation library, API endpoint, database migration, autosave, interactive preview browsing, or commerce workspace redesign.
- No arbitrary maximum lengths or changes to optional blank content compatibility.

## Decisions

1. **Keep Zod as the validation authority.** Add `CmsContentIssue` and a structured helper beside `validateCmsContent`. The existing function continues returning path-prefixed strings for backend callers. Required text schemas become trimmed, non-empty values; optional blank values retain their current accepted representation.

2. **Validate the serialized editorial shape.** The staff helper validates `editorialWriteData(data)`, so native image metadata cannot create a client/server disagreement. It indexes issues by dot path, including numeric array indexes, and provides the first path for focus. Server-side media existence, relationship existence, permissions, and revision checks remain authoritative.

3. **Use touched-or-submit visibility.** Content fields report blur/touch state locally. The first Save attempt reveals all current issues, focuses the first invalid control, and shows one compact summary. `noValidate` prevents browser-specific bubbles while native type and required attributes remain available to assistive technology.

4. **Keep preview subordinate to validity.** `ContentPreview` receives a boolean validity signal. Invalid data cancels pending work and sends no request; the last successful frame stays in place with an outdated label. Once valid, the existing 750 ms edit debounce and immediate open/context-refresh behavior continue unchanged.

5. **Use the existing discard dialog.** A visible secondary toolbar button opens the current `AlertDialog`. Saved records reload their server revision; new records clear the temporary editor and return to the list. The back arrow and collection changes use the same guard. The overflow menu keeps only actions that do not duplicate discard.

6. **Group without hiding errors.** Wrap existing fields in `FieldSet`, `FieldLegend`, and `FieldGroup` sections. Keep sections open and use `FieldError` beside inputs, selects, checkboxes, rich text, relationship pickers, image pickers, and nested rows. No new component package is added.

7. **Research only informs this slice.** Add a second dated round to `docs/backoffice-design.md` using Sanity, Contentful, Payload, and shadcn Field/Combobox/Sheet/AlertDialog references. Record three ideas per workspace, select Content and the image picker error-state refinement for this change, and leave Items, Stock, and Orders as proposals.

## Risks / Trade-offs

- **Existing content may contain empty required strings.** → Run the full public/content fixture checks and preserve blanks only for fields explicitly optional; report any real fixture failure before changing the schema further.
- **Schema paths and rendered control paths can diverge.** → Keep explicit path metadata in the field helper and map only known paths; leave unmappable server errors in the top alert.
- **A validation result can be stale during a fast edit.** → Recompute from current React data on every render and use the same result for action guards and preview activation.
- **A new record has no server revision to reload.** → Treat it as a local discard path and clear only its temporary session state after confirmation.

## Migration Plan

Run the OpenSpec guard, update the follow-up change artifacts and design reference, implement the shared/client validation and UI changes, then run unit, type, build, policy, and browser checks. Deploy through the existing UAT workflow after all checks pass. Rollback is the previous code artifact; no data migration is involved.
