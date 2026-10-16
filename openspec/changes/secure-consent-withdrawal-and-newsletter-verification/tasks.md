# Tasks

## 1. Newsletter ownership

- [x] 1.1 Implement single-use mailbox verification across site and checkout opt-ins; verify D1, retry, expiry, concurrency and gateway tests.
- [x] 1.2 Preserve global unsubscribe preferences and suppression; verify unverified calls have no provider writes and verified updates omit the unsubscribe field.

## 2. Alert withdrawal

- [x] 2.1 Deliver/recover secure cancellation capabilities and atomically remove pending/leased alerts; verify guesses, replay and stale-lease regressions.
- [x] 2.2 Bound link sends and prune pending evidence/capabilities on the existing schedule; verify daily limit and cleanup tests.

## 3. Contracts and integration

- [x] 3.1 Regenerate public API contracts, declare persistence seams and record local validation, strict OpenSpec and Graphify evidence.
- [x] 3.2 Deliver Claude Desktop's handover with exact edit points, copy, states and acceptance checks; verify no website UI source changed.

## 4. Separate acceptance

- [ ] 4.4 Owner correction, 16 October 2026: remove the second newsletter confirmation, automatically POST after fragment removal and render truthful success/error states; verify focused unit/browser checks, merge main and release the verified candidate to PRD. Alert withdrawal stays explicit.

- [x] 4.0 Close audit gaps found on 14 October 2026: truthful signup/alert success copy, one consent label on every surface (`blackbox-newsletter-v1` = "I agree to receive BlackBox Records release, distro, and event updates. I can unsubscribe anytime."), `availability-alert-form` consent source, case-insensitive confirmation cooldown and withdrawal notice in the alert fine print; verify focused backend/web tests and the shell-islands and availability-alerts browser specs.

- [ ] 4.1 Claude Desktop implements the email-preferences page and truthful form copy after required preview approval; verify browser, accessibility and player continuity checks.
- [ ] 4.2 Review and publish a narrow amendment to actual CMS privacy content through Content Publication; preserve real controller/editorial information and verify accepted snapshot.
- [ ] 4.3 With separate release/provider authorization, verify UAT sink behavior, reconcile migration numbering and obtain exact-candidate hosted acceptance. No real email or hosted mutation in this implementation.
