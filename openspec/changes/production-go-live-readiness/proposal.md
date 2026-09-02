## Why

UAT evidence exists, but PRD native-commerce launch still depends on closing the active environment, catalog, editorial, domain, operator-security, checkout-concurrency, and paid-delivery work before live provider and cutover decisions can be trusted.

## What Changes

- Make this change the sole owner of final shopper launch approval, full-site cutover, holding rollback/retirement, and final go/no-go evidence after the archived production-control refactor.
- Require operator JWT/Access proof, checkout hold/concurrency proof, paid-delivery retry/Cron readiness, permanent Greece-only shipping, accepted Decap content, and the verified holding-page handoff before launch.
- Make the launch data path explicit: Decap-authored repo content may become PRD release content through generated artifacts, but UAT D1, Stripe test-mode objects, synthetic stock, and UAT evidence are not promoted into PRD.
- Remeasure Store performance after commerce consolidation; create a bounded performance child only if the current gates still fail.
- Keep `PRD_LAUNCH_APPROVED` absent until live Stripe, production Worker/D1/webhook, final domain/origin, rollback, and sole-approver evidence all pass on one exact launch tree.

## Prerequisite Sequence

1. Correct and archive `site-performance-program`; leave no active performance child.
2. Complete and archive `align-cloudflare-environment-names`.
3. Complete and archive `stabilize-store-listing-prices`.
4. Complete and archive `redesign-decap-editor-experience`.
5. Complete and archive `publish-prd-holding-page` after its apex/`www` handoff proof.
6. Complete and archive `verify-operator-access-jwt`.
7. Complete and archive `add-checkout-stock-reservations`.
8. Complete and archive `add-paid-order-delivery-outbox`.
9. Remeasure Store performance on the consolidated commerce tree; record no action when gates pass, or complete and archive one bounded child when they fail.
10. Complete this change's missing design artifact, strict-validate the planning graph, then execute production go-live last.

## Capabilities

### New Capabilities

- `launch-readiness`: Production go-live gates and evidence boundaries for native commerce.

### Modified Capabilities

None. Existing domain capabilities remain authoritative; `launch-readiness` references their completed evidence without duplicating or changing their behavior.

## Impact

- Docs/specs only.
- No product behavior change.
- External follow-ups remain in Cloudflare, Stripe, DNS/domain, and human approval surfaces.
- Planning remains incomplete until the existing OpenSpec workflow creates `design.md`; this update does not invent that missing artifact.
