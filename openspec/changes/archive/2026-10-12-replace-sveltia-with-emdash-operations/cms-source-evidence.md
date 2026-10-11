# Item Setup CMS source preparation

The CMS source adapter uses supported content REST through the bound service. Existing sources are selected by exact ID. New sources use an explicit slug, so a retry retrieves a committed source after a lost creation response. Matching content is reused; different content requires review and is never overwritten or published by this adapter.

The adapter forwards the Access assertion and same-origin mutation headers, excluding cookies and Authorization. Redirects are handled manually and rejected by status. Only an explicit GET 404 permits creation; authorization failures, malformed responses, and uncertain reads do not trigger a write. Read normalization covers expanded media references, integer booleans, and absent nullable fields.

Local Worker tests cover lost creation acknowledgement with one POST across replay, exact-ID selection, content conflict, authorization failure, redirect rejection, and malformed responses. The Worker runtime rejected `redirect: error` during the first focused run; the final implementation uses `manual` and rejects non-success responses. Installed EmDash source confirms ID-or-slug retrieval and explicit-slug creation.

`pnpm test:unit`, `pnpm check`, and `pnpm build` pass. Logs are `.codex-artifacts/emdash-m1/cms-source-{unit,check,build}.log`. No hosted requests or persistent Local database changes occurred. Task 7.2 remains open: the adapter still needs the Item Setup application/API and journal integration that also protects runtime Store Item and variant identities.
