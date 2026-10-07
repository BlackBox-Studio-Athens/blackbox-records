# Validation notes

## Local repository, e2e and browser checks: 2026-10-07

### Source and environment

- Base SHA `af12509c8013f0013ac33fc283e1371c6b9e67e3`, plus this change's working tree.
- `pnpm validate` (`mode: local`) passed with matching before/after fingerprint `24b90c6f5b341bd543822885f29281178c19e8aa6ecaba03648ba6e7b7c51c2f`. Summary: `.codex-artifacts/validation/2026-10-07T15-06-57-450Z-14528-150624/summary.json`.
- The final run after this note and the e2e fixture change is recorded in the ignored artifacts.
- Environment: Windows primary checkout, Local only, Node 24.21.0. No full stack, provider, UAT or PRD checks ran.
- `pnpm openspec -- validate add-coming-soon-availability --type change --strict` passed.

### Rows selected

**Commerce/checkout/stock.** Backend module tests (932 tests in 102 files) passed. They cover:

- the zero-stock classifier (missing stock record reads as zero stock, default Sold Out);
- the expected month;
- the listing and offer readers, including no pre-order reported unless stocked, with `isAwaitingStock` unchanged for paid pre-orders;
- the 0031 migration (`restockPlanned=1` becomes `coming_soon`, and no other data is lost);
- the internal `zero-stock-state` PATCH and item setup;
- the alert table and repository (cap, idempotency, expiry, budget per Athens day);
- the public alert route (400/404/503, no address in logs);
- the schedule drain (order email first, then the budget, lease and retry, names from the accepted publication);
- the email snapshot.

`pnpm check:boundaries` passed.

**Staff/editor.**

- 80 staff tests passed: the zero-stock control, month save, 409/400 handling and the waiting count.
- The staff screens were not exercised in a browser.

**Shell/player/routing.**

- Web unit tests (829) passed.
- e2e, all on a server started by the harness with the dev toolbar off:

| Spec                        | Result                                                                         |
| --------------------------- | ------------------------------------------------------------------------------ |
| `availability-alerts` (new) | 5/5                                                                            |
| `store-preorders`           | 12/12                                                                          |
| `international-order-item`  | 5/5                                                                            |
| `store-item-preorders`      | 7/7                                                                            |
| `release-merchandising`     | 39 passed, then the 6 "Vinyl reads Coming Soon" runs passed on rerun           |
| `store-cart`                | 47 passed and 7 skipped, then the 4 "header cart control" runs passed on rerun |

**Why the first runs failed.**

- `store-cart`: the cold dev server re-optimised the newly used `lucide-react` icons in the middle of the run, so a Firefox module load failed.
- `release-merchandising`: Chromium logged Vite hot-reload socket messages.

`e2e/fixtures.ts` now ignores Vite's own socket messages alongside Chrome's existing one. These messages are dev-server-only; CI runs against Astro preview, which has no Vite client.

**CMS/publication and release rows.** Not applicable here. The release gates are tracked in tasks 6.x.

### Browser observation (playwright-cli, stubbed Worker reads, 1440 px and 390 px)

Screenshots are in `.codex-artifacts/design/final/`.

- **Store cards:**
  - Repressing and Coming Soon · Nov 2026 show as dashed neutral chips.
  - Sold Out has the solid Store Blood chip.
  - None of these cards shows a Buy button.
- **Anarchotribal item page:**
  - A dashed Coming Soon control with a 14 px disc icon.
  - The line "First pressing on its way · Expected November 2026".
  - A quiet "Email me when it lands" action. Submitting empty shows red errors with the inputs marked invalid; a valid submit shows "✓ We'll email you once when it can be ordered."
  - No price is shown, because the Worker sends no price for a non-buyable offer. This matches the earlier zero-stock pages.
- **Releases:**
  - "Digital out now" plus a dashed "Vinyl Coming Soon", with "Expected November 2026" on the shipping line.
  - "View vinyl details →" as an underlined text link.

### Owner design approval

- The review canvas and the style options were approved on 7 October 2026: statuses A4 with smaller icons, Notify me B4, Releases action C2, and one tone per state on every surface.
- The demo pages were removed before commit.

### Unverified

- Migrations 0031/0032 on UAT and PRD D1.
- Alert delivery through Resend to the UAT sink.
- The Staff control against a running Local stack.
- Real alert delivery in the commerce-only Local Worker: it has no publication binding, so alerts stay pending there.
