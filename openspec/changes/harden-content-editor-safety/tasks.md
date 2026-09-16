## 1. OpenSpec and shared validation

- [x] 1.1 Record the successful previous UAT release in the prior preview change and mark its remaining deployment verification task complete.
- [x] 1.2 Add structured `CmsContentIssue` output beside the existing Zod validation helper while preserving `validateCmsContent` callers.
- [x] 1.3 Tighten required text and required nested string values without rejecting existing optional blank values; add focused content-model tests.
- [x] 1.4 Add the staff `ContentValidation` adapter for serialized editorial data, path indexing, touched/submit visibility, and first-error focus.

## 2. Content editor safety and validation UI

- [x] 2.1 Add a visible Discard changes toolbar action, saved/new record confirmation behavior, focus restoration, and guarded back/collection navigation.
- [x] 2.2 Thread validation state through `ContentFields` and all collection field helpers, including native controls, rich text, nested rows, and compact submission summary.
- [x] 2.3 Add semantic invalid attributes and external error props to relationship and image pickers; keep picker return context and existing required behavior.
- [x] 2.4 Group long forms with installed shadcn FieldSet/FieldLegend/FieldGroup primitives without hiding required or invalid fields.
- [x] 2.5 Block Save, Publish, and Preview requests for invalid data while preserving server conflict, media, relationship, and permission errors.

## 3. Design reference and browser coverage

- [x] 3.1 Add the second research round and selected/deferred workspace ideas to `docs/backoffice-design.md` with source links and decision states.
- [x] 3.2 Extend the Content browser fixture for discard, invalid field focus/errors, nested values, picker errors, blocked requests, and preview recovery.
- [x] 3.3 Run Chromium and Firefox coverage at narrow and wide layouts, including keyboard focus, reduced motion, contrast, and responsive editor/preview behavior.

## 4. Required verification and delivery

- [x] 4.1 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm build:staff`, preview policy tests, and both Content browser fixtures.
- [ ] 4.2 Validate the OpenSpec change strictly, review the final diff, and deploy/verify UAT only after all required checks pass.
