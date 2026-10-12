# Tasks

Tags: `[Claude]` contains UI work; `[Claude or Codex]` has none; `[Owner]` needs the owner's sign-in or credentials. This change has no UI work.

## 1. PRD API under the apex

- [x] 1.1 [Claude or Codex] Add the PRD route `blackboxrecordsathens.com/api/*` and the apex to the PRD allowed origins; promote and prove `/api/` reaches the backend while the apex serves the Holding Page. PRD promotion 38237055376 passed; apex API serves source 5f09436 while Home remains the noindex Holding Page.
- [x] 1.2 [Claude or Codex] Find any server-side call from the PRD renderer or Pages gateway to the backend's public URL and move it to a service binding.
- [x] 1.3 [Owner] Set the GitHub variable `PRD_PUBLIC_BACKEND_BASE_URL` to `https://blackboxrecordsathens.com`. Completed by Codex under the owner's continuation authorization; value read back on 2026-10-12.
- [ ] 1.4 [Claude or Codex] Promote and verify from `pages.dev`: listing prices, checkout start, and the Services, newsletter and Notify me forms.
- [ ] 1.5 [Owner] Create a restricted live Stripe key with read access and webhook endpoint write.
- [x] 1.6 [Claude or Codex] With scoped live Stripe authority, update the live webhook endpoint URL to `https://blackboxrecordsathens.com/api/stripe/webhooks` and confirm the next delivered event; update the environment model and Stripe docs. Completed through the existing live connector, retaining endpoint ID/events/secret; Workbench signed replay returned 200 and all 99 subsequent artwork events have no pending delivery.
- [x] 1.7 [Claude or Codex] Add apex delivery for approved PRD product artwork, preserve old image delivery during migration, and migrate active Stripe Product image URLs without changing prices, stock or unpublished content. Promote and verify apex image bytes before finalization; its read-only guard must refuse remaining technical-origin images. Added with owner approval on 2026-10-12; all 98 distinct images match their SHA-256 identities, two legacy byte comparisons match, all 99 Product URLs are migrated with other fields unchanged, and the 99 stock rows match before/after.

## 2. UAT behind Access

- [x] 2.1 [Claude or Codex] List every hosted UAT site read in CI and scripts and add Access service-token headers to each, read from GitHub secrets.
- [ ] 2.2 [Owner] Create separate Access applications for `blackbox-records-web-uat.pages.dev` and `*.blackbox-records-web-uat.pages.dev`, with team Allow and service-token Service Auth policies. Add the approved production-host-only published-media bypass; store `UAT_ACCESS_CLIENT_ID` and `UAT_ACCESS_CLIENT_SECRET` as repository GitHub secrets.
- [ ] 2.3 [Claude or Codex] Push and confirm the UAT deploy and its gates pass with Access on; confirm an anonymous browser is asked to sign in and the UAT API still answers without Access.

## 3. Launch script

- [x] 3.1 [Claude or Codex] Implement `scripts/launch-switch/` and `pnpm launch:switch` with `cutover`, `finalize`, `rollback` and `--dry-run`, credential loading from the shell or ignored `.env.launch`, the snapshot and the summary file.
- [x] 3.2 [Claude or Codex] Tests with stubbed Cloudflare, Stripe and HTTP responses: dry-run makes no writes, a critical failure rolls back, finalize refuses inside 24 hours, credentials never appear in output.
- [ ] 3.3 [Owner] Create the Cloudflare token from the design and optionally the Bing Webmaster API key; put them and the Stripe key in `.env.launch`.
- [ ] 3.4 [Owner] Run `pnpm launch:switch -- cutover --dry-run` and `finalize --dry-run`; [Claude or Codex] fix anything the rehearsal reports.

## 4. Completion

- [ ] 4.1 [Claude or Codex] Run strict OpenSpec validation and `pnpm validate`; record evidence and archive this change before switch day.
