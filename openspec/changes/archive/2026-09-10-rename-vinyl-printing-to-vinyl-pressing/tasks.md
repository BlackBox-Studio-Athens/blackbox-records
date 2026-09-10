## 1. Prepare and Rename Current Services Language

- [x] 1.1 Before implementation, archive the completed `add-services-inquiry-email-delivery` change with its implementation-accurate `Vinyl Printing` requirement; do not rewrite completed or archived artifacts to describe this future rename.
- [x] 1.2 Update the Services title and supporting copy to `Vinyl Pressing`, correct the Sveltia id hint, and preserve content id `vinyl-printing`; verify the card title still projects the matching inquiry preselection value.
- [x] 1.3 Update frontend service enums, recipient/detail maps, fallback draft output, form prompts, and focused tests; verify `vinyl@blackboxrecordsathens.com`, field labels, validation, title-based preselection, and submission behavior remain unchanged.
- [x] 1.4 Update the Worker canonical service enum, recipient/detail maps, provider tag `vinyl-pressing`, visible email output, and focused application/HTTP tests; normalize only exact legacy input `Vinyl Printing` to `Vinyl Pressing` before strict validation and verify every downstream value is canonical while other unknown values remain rejected.
- [x] 1.5 Update current operational docs and language/source-contract checks to the canonical visible term; exclude completed/archived OpenSpec history and the preserved section id from replacement.

## 2. Regenerate Contracts

- [x] 2.1 Run `pnpm generate:api`; verify source generation updates `apps/backend/openapi/public-openapi.json` and `packages/api-client/src/generated/**` instead of hand-editing generated files.
- [x] 2.2 Run focused API-client and OpenAPI contract tests; verify `Vinyl Pressing` is present, `Vinyl Printing` is absent from the generated/public enum, and no request/response shape or field limit changes.

## 3. Verify Final Language and Behavior

- [x] 3.1 Run a scoped current-language audit over active source, current requirement language, generated artifacts, and operational docs; verify `Vinyl Printing` remains only in the exact legacy normalization/test and completed/archived history, while `vinyl-printing` remains only as the stable content section id or historical artifact.
- [x] 3.2 Run focused frontend and backend Services inquiry tests for canonical and exact legacy submissions, then `pnpm test:unit`, `pnpm check`, and `pnpm build`; verify all required repository gates pass.
- [x] 3.3 Use Browser Use on `/services/` at desktop and 390 pixels; verify the Vinyl Pressing card, card-to-form preselection, option label, details prompt, fallback summary, focus, layout, and console cleanliness.
