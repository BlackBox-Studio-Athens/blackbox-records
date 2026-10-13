# Tasks

Tags: `[Claude]` contains UI work; `[Claude or Codex]` has none; `[Owner]` needs the owner's Google or Cloudflare sign-in.

## 1. Backend reads

- [x] 1.1 [Claude or Codex] Add `GET /api/internal/store-stats?range=7d|30d` to the [design](design.md#store-stats) contract, reading D1 through the orders module. Worker tests cover window edges, the previous period, every order status, null amounts, quantity sums, invalid range and Access rejection.
- [x] 1.2 [Claude or Codex] Add `GET /api/internal/search-stats?range=7d|30d` to the [design](design.md#search-stats) contract. Cover WebCrypto JWT signing, token reuse, the one-hour cache and safe failures. Register `GOOGLE_SEARCH_CONSOLE_SITE` and `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` in runtime-config verification. Worker tests use a generated test key and native workerd Requests, and prove no key, JWT or token appears in responses or logs.
- [x] 1.3 [Claude or Codex] Regenerate the internal contracts (`pnpm generate:api`); update `docs/worker-observability.md` for the new events and module-boundary metadata if entrypoints change.

Backend completion evidence: [validation.md](validation.md). The existing orders root and HTTP entrypoints remain sufficient; no module-boundary metadata changed.

## 2. Google access

- [ ] 2.1 [Owner] Confirm or create a Google Cloud service account with the Search Console API enabled and no project roles. Add it to `sc-domain:blackboxrecordsathens.com` as a Restricted user, store its JSON key as the PRD Worker secret `GOOGLE_SEARCH_CONSOLE_CREDENTIALS`, then delete the downloaded key.

Read-only inspection and the owner's decision to leave MFA unchanged are recorded in [owner-setup.md](owner-setup.md). Google Cloud access is blocked, so this task remains incomplete.

## 3. Staff Stats

- [x] 3.1 [Claude] Present a shape brief and two visual options for the Store and Google search sections and the visit-to-order rate; wait for the owner's choice. Evidence: two options at 390/1280 px on the real Stats page with stubbed figures; the owner chose Option 2, Visits first ([design](design.md#staff-stats)).
- [x] 3.2 [Claude] Implement the chosen sections with independent loading, failure, stale and not-set-up states; add the client reads. Evidence: [validation](validation.md#staff-stats-sections--2026-10-13).
- [x] 3.3 [Claude] Focused staff tests and a browser check at phone and desktop widths with stubbed contracts. Evidence: seven staff projects pass; 390/1280 px screenshots with ok and degraded sources ([validation](validation.md#staff-stats-sections--2026-10-13)).

## 4. Acceptance

- [x] 4.1 Run strict OpenSpec validation and `pnpm validate` on the final tree; record evidence. Evidence: strict validation and `pnpm validate` passed, `mode: local`: `.codex-artifacts/validation/2026-10-13T14-51-02-769Z-40900-86c58c/summary.json`.
- [ ] 4.2 [Claude or Codex] Release through UAT and PRD. On PRD Stats, the store figures match the Orders page for the same window, and search shows data or its empty state. UAT shows search as not set up.
