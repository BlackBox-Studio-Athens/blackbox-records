# Staff order workspace evidence

## Integration and approved presentation

- Main-worktree guard passed on 2026-09-11 at `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`. Pre-existing planning edits in other changes were preserved.
- Reviewed the generated `InternalCheckoutOrder` and `InternalOrderStatus` in `packages/api-client/src/generated/internal/schema.ts`, the internal fetcher, order routes, and operator middleware/identity verification. Reads support `limit=100`, the four payment states, and exact encoded Checkout Session lookup. Orders include nullable session/payment references, timestamps, review reasons, accepted delivery/policy facts, historical locker facts, notifications, and discriminated unavailable/incomplete/current fulfillment. Current fulfillment includes immutable lines, gross/VAT values (nullable historical values), Greek shipping/contact and newsletter consent.
- Existing `/api/internal/*` middleware validates hosted Access JWT issuer, audience, expiry and email. JWT-free identity remains Local and loopback-only. The client uses existing generated GETs, `no-store`, and same-origin credentials. No backend, schema, provider or mutation contract was changed.
- Impeccable loaded PRODUCT.md and DESIGN.md. The user selected full-page detail, requested a more human-friendly icon-led design, approved the revised image direction, and requested the existing logo. UI edits began only after that approval.
- The approved design uses dark staff styling, the actual horizontal BlackBox logo, text-labeled Lucide icons, restrained paid/review colors, clear recent-subset coverage and lookup, full-page detail with a back link, mobile stacking, explicit access denial and stale/retry feedback. Mock-only artwork, slogans, account controls and invented order references are excluded. No generated image is a runtime asset.
- The staff artifact allowlist now includes `/orders/` and the logo; public artifact validation rejects both stock and order workspace routes. Module ownership and workspace entrypoints remain unchanged.

## Local verification

Focused staff tests cover generated-client encoding, no-store GETs, 401/403/404 and safe server errors; list/detail supersession; cross-request access denial and late-success invalidation; same-query stale read times versus failed new queries; unbound-row inspection and lookup outside the list; multi-line facts, nullable historical amounts, escaped unknown reasons, known review guidance and notification wording.

Native Browser Use initialized successfully (`bootstrap_ok`). A loopback-only synthetic HTTP preview served the built staff artifact on port 4333; it never contacted a Worker or provider. Browser checks covered all payment states, notification-filter empty state, successful payment filtering, no-session inspection, exact older-session lookup, 404 guidance, full-page detail, multi-line amounts and unknown VAT, manual-review guidance, keyboard Enter selection and focus return, and 390px mobile layout without horizontal overflow.

Synthetic 503 refresh retained the same list with an explicit stale label, successful read time and Retry. A failed new payment filter removed the previous rows. A synthetic 403 during a delayed list refresh cleared both views and the session URL; after the 15-second successful list response returned, Access required remained and no order facts reappeared. Unit checks cover the inverse race and 401 as well. No-session selection preserves any stale source-list status and returns to the list for retry.

The preview's sanitized order-workspace request log records only GET reads to `/api/internal/orders` (limit 100, selected status) and `/api/internal/orders/checkout-sessions/<synthetic>`. Stock navigation adds its existing variant-list GET. Built staff output contains neither the synthetic session, recipient nor email fixture strings. The copied logo is the existing `apps/web/public/assets/images/brand/logo-horizontal.png`, not a generated substitute; SHA-256 hashes match.

Final implementation verification passed on 2026-09-11:

- `pnpm test:unit`: passed across web, staff, Worker, Node persistence/architecture, generated client and route/workflow contract tests. Staff: 31 tests.
- `pnpm check`: passed formatting, lint, types/content, catalog/environment verification and module/commerce boundaries. Staff: no errors, warnings or hints. Existing public-cart Zod deprecation and boundary-plugin migration notices remain informational.
- `pnpm build`: passed both static apps, cache/font/image checks and public/staff route isolation. Its `pnpm build:staff` step also passed.
- `pnpm openspec -- validate add-staff-order-workspace --type change --strict`: passed.
- `git diff --check`: passed.

Raw local command logs are retained in ignored `.codex-artifacts/staff-orders-final-{tests,check,build}.log`. Browser preview and fixtures are Local only, separate from the built application. No synthetic order strings were found in the final staff output.

Additional final local checks: the 320px viewport initially exposed a header overflow; allowing the logo/navigation header to wrap resolved it (305px content width equals the available viewport excluding scrollbar). Recipient and notification headings align on desktop, stack on mobile, and references expand with Enter. Stock navigation still opens the existing workspace. The adapter checks status before JSON decoding so malformed 401/403 responses still invalidate private data; all 31 focused staff tests pass.

## Local closure and hosted follow-up

The user approved the implemented UI and requested all 10 tasks closed and committed locally on 2026-09-11. The checklist now separates completed local verification from future deployment acceptance. This is local implementation closure, not evidence that hosted checks passed. The chat remains open as requested.

The user subsequently authorized deployment and hosted checks on 2026-09-11. Commit `7bfb062f339071a5b37d38914faa2b9837cca7ec` deployed successfully through [the canonical static pipeline](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/34598042683). All pipeline jobs passed. The release also fixes a shared-workflow defect: the public build's backend URL had been baked into staff output. Every hosted staff artifact now rebuilds with an empty `PUBLIC_BACKEND_BASE_URL`, preserving same-origin Access credentials.

Before pushing, `pnpm test:unit`, `pnpm check`, and `pnpm build` passed against a clean export of that exact commit under ignored `.codex-artifacts/staff-orders-release-check`. This excluded concurrent, unfinished storefront edits in the main checkout. Logs are `.codex-artifacts/staff-orders-release-{tests,check,build}.log`. Initial main-checkout attempts encountered Worker timing failures and concurrent storefront changes; those were not treated as passing release evidence.

Native Browser Use confirmed the existing staff login opens the deployed Orders page without new auth configuration. Anonymous staff page/API requests redirect to Cloudflare Access; anonymous direct Worker order reads return 401 and `no-store`. Stock list, selected detail and history read successfully with same-origin GETs returning 200 and `no-store`. No stock writes were performed.

Hosted order acceptance remains blocked: authenticated `GET /api/internal/orders?limit=100` returns 500 with `no-store`. Read-only PRD D1 inspection found migrations applied only through 0008, missing order expiry, fulfillment and monetary columns, and no `PaidOrderDelivery` table. Orders and order lines are both empty. The existing migrations 0009–0018 are pending; this is production schema lag, not a staff-login failure.

## Prepared production database follow-up

The proposed next operation is `pnpm --filter @blackbox/backend d1:migrations:apply:prd`, applying the reviewed migrations 0009–0018 from release `7bfb062f`. They update catalog snapshot/event bookkeeping, order expiry and fulfillment fields, the notification outbox, stock revision validation, review reasons and monetary snapshots. Caregivers cleanup migrations have no matching canonical or duplicate rows in the current PRD database. Read-only checks found zero orders, order lines, catalog events and invalid stock rows.

A local SQLite upgrade rehearsal from schema 0008 through 0018 passed, preserving representative stock quantities, retaining zero orders and passing foreign-key checks. A pre-apply D1 Time Travel bookmark was read: `0000000a-00000000-000050e3-35e0354c853bac7b83b0d6d18e3b81ef`; refresh it immediately before any authorized apply. Recheck migration status and affected-row preconditions, apply once, then repeat protected order reads and Stock reads. A successful empty production list cannot substitute for populated-order detail acceptance; synthetic detail coverage remains local.

Production database mutation has not been performed: repository `AGENTS.md` requires one-run confirmation for live catalog/D1 preparation. No fake PRD orders, order-payload evidence, payment, refund, resend, customer communication or dispatch action was created. Checkout launch remains unapproved by this work.
