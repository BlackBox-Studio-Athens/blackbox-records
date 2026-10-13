# Tasks

Tags: `[Claude]` contains UI work; `[Claude or Codex]` has none; `[Owner]` needs the owner's dashboard sign-in or staff content access.

## 1. Search engines and visit measurement

- [x] 1.1 [Owner] Add `blackboxrecordsathens.com` as a Domain property in Google Search Console and verify it through Cloudflare DNS. Evidence: 2026-10-13, Google confirmed Domain ownership after one apex DNS-only TXT addition; [owner setup](owner-setup.md#pre-launch-dashboard-steps--2026-10-13).
- [x] 1.2 [Owner] In Bing Webmaster Tools, import the verified property from Search Console. Evidence: 2026-10-13, owner-approved read-only import added only BlackBox with zero sitemaps; Bing explicitly confirms existing Google verification and no separate code needed; [screenshot](../../../.codex-artifacts/owner-setup/bing-verified.jpg).
- [x] 1.3 [Owner] Turn on Crawler Hints (Cloudflare → Caching → Configuration). Evidence: 2026-10-13, the Free zone's Crawler Hints switch was already On; verified without changing it or accepting terms; [screenshot](../../../.codex-artifacts/owner-setup/crawler-hints-on.jpg).
- [x] 1.4 [Owner] Turn on Web Analytics automatic setup for `blackboxrecordsathens.com` (Cloudflare → Analytics & Logs → Web Analytics); note the site tag for 2.2. Evidence: signed-in Chrome setup now enables normal automatic collection, including EU visitors; site tag recorded in [owner setup](owner-setup.md).
- [x] 1.5 [Owner] Add a Cloudflare Web Analytics paragraph to the privacy notice in staff and publish it. Evidence: 2026-10-13, exact wording/date approved privately, then separately approved and published through Review changes; staff confirms On the website and PRD `/privacy/` contains the paragraph; [public screenshot](../../../.codex-artifacts/owner-setup/privacy-public.jpg).
- [ ] 1.6 [Claude or Codex] After switch day, confirm the apex HTML carries the beacon, in-shell navigation counts page views and no analytics cookie is set; record evidence.

## 2. Analytics read

- [x] 2.1 [Claude or Codex] Read the GraphQL `settings` limits for `rumPageloadEventsAdaptiveGroups` and `workersInvocationsAdaptive` on the account; fix the supported ranges in the design. Evidence: one settings-only query returned HTTP 200/no errors; both `7d` and `30d` fit the verified [limits](design.md).
- [x] 2.2 [Owner] Create a Cloudflare API token limited to Account Analytics Read and store it as the PRD Worker secret `CLOUDFLARE_ANALYTICS_API_TOKEN`; add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG` as PRD vars. UAT reuses the same site tag read-only or returns a stable not-configured state. Evidence: owner-confirmed token creation and encrypted PRD secret/vars verified through Chrome; existing config preserved, UAT left optional; [owner setup](owner-setup.md).
- [x] 2.3 [Claude or Codex] Add `GET /api/internal/analytics?range=7d|30d` with the GraphQL queries, 15-minute Cache API caching, stable errors and request IDs; register the secret in runtime-config verification. Evidence: protected read, optional config, runtime forwarding and generated internal contracts implemented; [Local summary](../../../.codex-artifacts/validation/2026-10-12T15-10-47-958Z-65748-b74604/summary.json).
- [x] 2.4 [Claude or Codex] Worker tests for range validation, response mapping, caching, upstream failure and Access rejection. Evidence: all 25 analytics Worker tests pass, including missing configuration, timeout and secret-safe errors; [Local summary](../../../.codex-artifacts/validation/2026-10-12T15-10-47-958Z-65748-b74604/summary.json).

- [x] 2.5 [Claude or Codex] Apply the approved public-apex/bot filter with a new cache version, distinguish upstream failure categories safely, and test the captured live response plus runtime configuration forwarding. Record the deployed 503 cause only when demonstrated. Local corrections and focused regressions passed; deployed diagnosis remains part of 4.2. See [validation.md](validation.md#stats-read-corrections--2026-10-13).

Backend-only evidence and remaining acceptance: [validation.md](validation.md).

- [x] 2.6 [Claude or Codex] Fix the demonstrated workerd redirect-mode incompatibility, verify native Request construction and redirect rejection, then release through every UAT/PRD gate and complete the live Stats comparison in 4.2. Evidence: `24cacf78`, release 567 and PRD promotion 17 passed; both live ranges return 200/ok. See [validation](validation.md#stats-503-redirect-mode-correction--2026-10-13).

## 3. Staff Stats page

- [x] 3.1 [Claude] Present visual options for the Stats page and wait for the owner's choice. Evidence: three-option canvas checked at 390/1280 px; owner chose C with Recharts via shadcn Chart and approved the dependency ([design](design.md#staff-stats)).
- [x] 3.2 [Claude] Implement the chosen page and its staff navigation entry, with loading, failure, stale-data and empty states; add the internal API client. Evidence: `/stats/` in the new `staff-stats` module, Stats nav after Orders, lazy Recharts chunk, `staff-platform` analytics client; Worker requests removed after owner review; approved summary-sentence readability redesign ([validation](validation.md#staff-stats-page)).
- [x] 3.3 [Claude] Focused staff tests and a browser check at phone and desktop widths. Evidence: client, store, view, navigation, shell and backend analytics tests pass; stubbed Local staff screenshots at 390/1280 px and header checks at 1280–1920 px ([validation](validation.md#staff-stats-page)).
- [x] 3.4 [Claude] Stop the page scrolling together with the Stats area. Evidence: the shell's scrolling `main` now contains visually hidden row text; at 390/1280/1440 px the document no longer scrolls ([validation](validation.md#stats-page-double-scroll--2026-10-13)).

## 4. Acceptance

- [x] 4.1 Run strict OpenSpec validation and `pnpm validate` on the final tree; record evidence. Evidence: strict validation and `pnpm validate` passed after the readability redesign; see [validation.md](validation.md). Committed as `0995c185` and `aa5dfac6`.
- [x] 4.2 After promotion, open Stats on PRD staff and compare one day's figures with the Cloudflare dashboard.
  - Passed on `24cacf78491c54e826807764b1cf7b156cd61821` / release 567 / PRD promotion 17. Both 7d and 30d return HTTP 200 with `status: ok` through the existing Worker secret. Stats and Cloudflare both report 0 visits / 0 page views for the complete UTC day 2026-10-12, filtered to the apex and excluding bots; no mismatch. Screenshots, response identities and cache timestamps are in [validation](validation.md#stats-503-redirect-mode-correction--2026-10-13). The earlier 503 is resolved by the supported manual redirect mode.
