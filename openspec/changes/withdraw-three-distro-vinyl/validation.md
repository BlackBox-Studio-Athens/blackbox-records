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

Hosted software release and UAT/PRD withdrawal are pending. UAT IDs were independently resolved: absence `01M2DC53WJ01S1VX8X5H0TM50M`, Bloed `01M2DC3FE094ED82FFZP41F544`, Goodbye Kings `01M2DC8J3MZ1W5P4MC7V3D0XCC`. No hosted withdrawal has been submitted.

R2 dashboard account-wide usage for September 2–October 2: 4.06k Class A, 136.94k Class B, 1.76 GB, $0 billable usage. Workers dashboard: 32,171 / 100,000 requests today, leaving 67,829. Read-only Wrangler info across all eight account D1 databases reported 2,194,677 rows read and 9,621 written over the last 24 hours (a conservative window covering the current UTC day), leaving more than 2.8 million reads and 90,000 writes against daily Free allowances. Analytics can lag.

Bounded release/withdrawal budget: at most 1,000 Worker requests, 50,000 D1 rows read, 1,000 D1 rows written, 20 R2 Class A and 2,000 Class B operations including native revisions, journal retries, both target snapshot/media restores and public verification. Reserve at least 20,000 Worker requests, one million D1 reads, 50,000 D1 writes and 100,000/one million R2 Class A/B operations for ordinary service. No KV binding, plan upgrade, provider writes or new background job. Pilot the target-specific binding reads before mutation; stop on quota warnings or excess observed operations. Reuse receipts rather than repeating operations.

The Chrome extension initially timed out repeatedly; DevTools fallback reported its profile already in use. Manually reopening the stuck Cloudflare Billing tab restored page access. UAT authenticated native record GET returned 200. Hosted writes still require an accepted software candidate and independent environment review.

Read-only D1 pilot executed nine selected operational queries per environment: UAT 97 rows read, PRD 103, zero rows written. This is comfortably below the operational estimate; retained result rows require command-mode queries because Wrangler file mode reports only execution totals.

Acceptance rows: CMS/publication, commerce and software release. No new staff interface, dependency, player behavior or module boundary was added. Browser/provider/release acceptance is not established by Local HTTP or repository tests.
