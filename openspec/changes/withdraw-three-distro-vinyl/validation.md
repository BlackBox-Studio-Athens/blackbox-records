# Withdrawal acceptance

Work is on canonical main in `C:/Users/SVall/WebstormProjects/blackbox-records`. OpenSpec guard passed before edits. Graphify and CodeGraph established publication, snapshot and commerce ownership; Graphify refreshed after implementation. Archived research and existing media were preserved.

## Repository checks

- Catalog contract: 14 tests passed. Distro source records reduced from 101 to 98 and inventory contracts from 104 to 101; the three exact sources are absent.
- Runtime publication and lifecycle: 29 tests passed, including linked/unlinked withdrawal, incomplete private drafts, unused media references, dangling identities, stale revisions/baselines, retained-request retries, interrupted native/render/confirmation responses and publish compatibility.
- Native lifecycle integration: 6 tests passed, including checkout pausing and retained commerce history.
- Backend type checking passed. Strict OpenSpec validation passed during implementation.
- Local mock seed: 5 tests passed after correcting its total to 101. The first full validation found the stale 104 assertion and was also invalidated by concurrent changes to main; that run is not completion evidence.
- `pnpm validate` passed in local mode: `.codex-artifacts/validation/2026-10-01T16-01-10-161Z-2732/summary.json`, source `caee18d04218064de54451092e0c44c86c94d630`, matching before/after fingerprint `d9bbb1fb9f4f405d5e54c56e3e8ce371a88eba8336bf2a4755f1881228181141`, no source changes. The final handoff pointer is `.codex-artifacts/withdrawal/final-validation.json`; refresh after the final tracked acceptance notes.

## Populated Local

The accepted baseline was `d844806db55def8d7cac3cb2bc0642d771993ab81ec60042660b7f5ab632631e`. Only these environment-owned records were selected:

| Source                     | Local CMS ID               |
| -------------------------- | -------------------------- |
| in-your-absence            | 01M2G9G3FH9ZTPVQRB2YY7TF7D |
| bloed-tranen               | 01M2G9G0GW5ZAGJ0ZZ67A583A4 |
| transatlantic-transiberian | 01M2G9G97TPW0ZE99VX8N7VRPJ |

Receipt `f7dc632f-5984-48e0-8d94-c589a1277d62` reached live; accepted snapshot is `58c67f4bf5c3f10138448d29b201aef5781cc49d87174e66f5614081b48db718`. Repeating the request reused the receipt. A request without mutation headers returned 403. All three native entries remain drafts. Store and Distro listings contain none of the three links; all six product/checkout routes return 404. All three linked options are withheld and cannot buy.

Read-only SQLite before/after comparison preserved every selected stock, stock-history/count, provider mapping, checkout order/line and delivery row. Stock SHA-256 stayed `62d376a6376bd3c133f7d8da7bb519f93ca70916ab002abc470872148c81fcab`; mapping SHA-256 stayed `281f7ca89017b78347946701fe4b4d46043d6fe6df2a4e8636745a9c6adbd79c`. The selected Local stock and mapping tables each contain three rows; selected order/history tables contain zero rows. Integration fixtures separately cover retained history.

Ignored evidence: `.codex-artifacts/withdrawal/local-review.json`, `local-input.json`, `local-receipt.json`, `local-before.json`, `local-after.json`, `local-stack-3.log` and the runnable `withdraw-local.mjs` / `local-operation-state.py` checks.

Initial receipt `883b6ecf-9a81-4ca5-89fd-126e5bf3212e` failed candidate validation because unused media references remained after withdrawal. Checkout stayed disabled and the accepted baseline remained intact. The shared snapshot removal helper now prunes unused manifest references while retaining media objects/history; a distinct withdrawal-image fixture prevents recurrence. The fresh Local review above confirmed recovery.

## Hosted work

Software source `6736181737bccca2da1791977bf08667590595e6` passed the full candidate gates in [UAT candidate 36890110252](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/36890110252), run number 479. The first PRD preparation attempt timed out waiting for the Firefox editor review heading; retrying only failed jobs passed both browser regressions and completed the paired artifact. No code changed for that retry. [PRD promotion 36894123055](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/36894123055) then passed, consuming that immutable candidate. PRD Worker response headers and frontend release identity both report the selected source and run 479. PRD native checkout remains disabled; promotion did not launch checkout or mutate the provider catalog.

Each environment received an independent fresh review, exact native revisions and retained withdrawal request. Reviews contained only the three requested records and no issues.

| Source                     | UAT CMS ID                 | PRD CMS ID                 |
| -------------------------- | -------------------------- | -------------------------- |
| in-your-absence            | 01M2DC53WJ01S1VX8X5H0TM50M | 01M2J1FCH4TJR69XS0C21Y34EJ |
| bloed-tranen               | 01M2DC3FE094ED82FFZP41F544 | 01M2J1EQHW68AGG3PKPWV5SQDE |
| transatlantic-transiberian | 01M2DC8J3MZ1W5P4MC7V3D0XCC | 01M2J1GZW07BYXK12V2GR9ZEEW |

UAT receipt `cd271ce4-4759-4cbe-845e-a0898cd9a3dd` reached live. Baseline `64c7200723b98d6a0413303b7adf84889e0e8da067890dffddf2a1cd334d84f8` became accepted snapshot `544e13f57744d3ca3d076721cea167b3be7cc0f7b4deb7c0a758fd6267e9a809`. Records changed 131 → 128, Distro 101 → 98, Store Items 104 → 101.

PRD receipt `72d2f8c3-7d2e-45ad-a463-6373c31c527d` reached live. Baseline `205d3b5094c34210b4d7b46fc89ad3c5b0839352093c6d2339ae7809e7e11c15` became accepted snapshot `3fe3c05d08f4874f156cd0868d59c234986790e3a40e4fa2b1a4409e37e2e8ba`. Records changed 128 → 125, Distro 98 → 95, Store Items 101 → 98. PRD already had three other source entries absent before this operation; they remained outside the batch.

In both environments, repeating the identical request returned the same live receipt. All six native records remain private drafts with null live revisions. All three options per environment changed from published revision 2 to withheld revision 3 and cannot buy. Parsed snapshot comparisons confirmed every remaining record and Store Item identity unchanged, valid media references and no dangling identities. Existing R2 objects and historical manifests remain retained.

Public checks ran after the 60-second cache window: UAT at `2026-10-01T16:42:30.479Z`, PRD at `2026-10-01T16:55:08.281Z`. In each environment all six product/checkout routes returned 404, Store and Distro returned 200 with none of the selected links, and all three offers reported checkout unavailable. Release identities matched the live receipts and expected snapshots. Browser Search Store queries for `we.own.the.sky`, `Bloed` and `Goodbye, Kings` each returned zero items. Screenshots: `.codex-artifacts/withdrawal/uat-search.jpg` and `prd-search.jpg`.

Read-only before/after comparisons preserved all selected stock, stock history/count, provider mapping, order/line and delivery rows. UAT stock (three rows) SHA-256 stayed `67254945cc95248462ed0c7d22096e293d11c4205577b4c272d859a89498470b`; mappings (three rows) stayed `11861ceff7adcf30f3772f4f79f909f7a0461b280f6abee1300b5fb3bafeda41`. PRD stock (three rows) stayed `c805f517fcbdba80c6cfa974ce1068a1865b73f6e0c8f8269c6ca9abbff828cc`; StockChange history (three rows) stayed `21fc4fad71078c09e0285d2b809d5cbcbf62ebc3c5b5c20951dcb666ec4d0d4d`; mappings (three rows) stayed `23729e1d7dcad3b14c19bd9ef16c089dda14ea981fedb14ecb6083696daeefca`. Selected order tables were empty before and after. Existing tests cover retained nonempty order/reservation history.

Ignored hosted evidence under `.codex-artifacts/withdrawal/`: environment-specific `*-input.json`, `*-receipt.json`, `*-identity-before.json`, `*-identity-after.json`, `*-snapshot-before.json`, `*-snapshot-after.json`, `*-before.json`, `*-after.json`, `*-before-summary.json`, `*-after-summary.json` and `*-public.json`. Runnable checks are `check-hosted-audit.mjs`, `check-snapshot.mjs` and `check-public.mjs`; bounded queries are `hosted-audit.sql`.

R2 dashboard account-wide usage for September 2–October 2: 4.06k Class A, 136.94k Class B, 1.76 GB, $0 billable usage. Workers dashboard: 32,171 / 100,000 requests today, leaving 67,829. Read-only Wrangler info across all eight account D1 databases reported 2,194,677 rows read and 9,621 written over the last 24 hours (a conservative window covering the current UTC day), leaving more than 2.8 million reads and 90,000 writes against daily Free allowances. Analytics can lag.

Bounded release/withdrawal budget: at most 1,000 Worker requests, 50,000 D1 rows read, 1,000 D1 rows written, 20 R2 Class A and 2,000 Class B operations including native revisions, journal retries, both target snapshot/media restores and public verification. Reserve at least 20,000 Worker requests, one million D1 reads, 50,000 D1 writes and 100,000/one million R2 Class A/B operations for ordinary service. No KV binding, plan upgrade, provider writes or new background job. Pilot the target-specific binding reads before mutation; stop on quota warnings or excess observed operations. Reuse receipts rather than repeating operations.

The Chrome extension initially timed out repeatedly; DevTools fallback reported its profile already in use. Manually reopening the stuck Cloudflare Billing tab restored page access. The connected Blackbox Chrome session completed both hosted reviews, withdrawals and browser acceptance.

Read-only D1 pilot executed nine selected operational queries per environment: UAT 97 rows read, PRD 103, zero rows written. This is comfortably below the operational estimate; retained result rows require command-mode queries because Wrangler file mode reports only execution totals.

Command-mode audits consumed 113 rows per UAT read and 121 per PRD read, with zero writes. Candidate restores fetched 128 unique UAT media objects and 196 PRD objects; one PRD preparation retry brought the total to 522 media fetches (about 1,044 manifest/media R2 reads). Hosted checks stayed bounded, reused live receipts and produced no quota warnings. No repeated failed withdrawal or release loop remained. Account analytics were checked before work; these figures are observed query counts and bounded operation estimates, not final billing measurements.

Acceptance rows: CMS/publication, commerce and software release across Local, UAT and PRD. No new staff interface, dependency, player behavior or module boundary was added; shell/player and boundary-change rows do not apply. Required withdrawal behavior is verified with no unresolved failure. The final `pnpm validate` local-mode summary, source SHA and matching before/after fingerprint are retained in `.codex-artifacts/withdrawal/final-validation.json`, written after these tracked notes. Full CI gates and hosted evidence above establish the checks beyond local mode.
