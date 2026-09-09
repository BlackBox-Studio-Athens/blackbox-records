# Checkout creation acceptance — 2026-09-09

Accepted checkout implementation: `f84358446c4ebb000c55d00db1b54502e392799c`.
Checks ran in the main worktree with unrelated uncommitted work present; this evidence accepts this correction, not those changes or reservation UAT settlement.

## Real Stripe test mode

- Local Worker and storefront used the new account's sandbox, its matching active payment configuration, and separate Local catalog mappings. The ignored Local seed covers 104 current Store Items. No secrets or provider identifiers are included here.
- At 09:34 UTC, fixed-price quantity two and custom-Price quantity one each created an open hosted test Session. Stripe accepted 2,099 seconds from creation to expiry; local D1 stored exactly the accepted expiry for both.
- Custom quantity two, duplicate custom lines, and mixed custom/fixed lines returned HTTP 409 with purchase-alone guidance and no new CheckoutOrder holds.
- At 09:48 UTC, a gateway probe deliberately waited five seconds after computing the provisional deadline. The real provider accepted an expiry 2,099,659 milliseconds after the send timestamp, beyond the provisional deadline. The unpaid probe Session was then expired. This probes the real gateway boundary; delayed D1 work and retry stability are covered by committed regression tests.

## Browser acceptance

Native Chrome extension control repeatedly timed out after successful bootstrap. The repository-approved Chrome DevTools fallback completed the checks in an isolated browser context.

- Desktop: added Disintegration, increased quantity to two, observed EUR 56, and followed the checkout action to the real Stripe sandbox payment form showing quantity two and Greece-only shipping.
- Desktop and 390 × 844 mobile emulation: a mixed fixed/custom cart displayed the purchase-alone explanation. Submitting returned an accessible `role=alert`; the two fixed units and single custom item remained intact. The custom increment was disabled with its associated explanation.
- Mobile: removed only the fixed-price line using the drawer's Remove action. The custom item remained at quantity one, and checkout opened Stripe's real editable amount field for 2016 / Cassette. No payment or personal information was submitted.
- Existing local mock launcher/readiness acceptance and desktop/mobile fixed-quantity correction remain recorded in `tasks.md`.

PRD configuration, deployment, and checkout activation were untouched. Full reservation paid settlement, release, and replay acceptance remains a separate UAT gate.
