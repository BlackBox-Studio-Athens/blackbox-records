---
phase: 3
slug: webhook-authoritative-orders-and-inventory
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Repo smoke commands + grep-based planning artifact verification |
| **Config file** | `package.json` scripts / none for grep checks |
| **Quick run command** | `pnpm check` |
| **Full suite command** | `pnpm test:unit && pnpm check && pnpm build` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific `rg` verification plus `pnpm check`
- **After every plan wave:** Run `pnpm test:unit && pnpm check && pnpm build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | ORDR-01 | T-03-01-A | Order states are D1-backed and minimal, not Supabase-backed or OMS-sized | grep | `rg -n "pending_payment|paid|closed_unpaid|needs_review|D1|Supabase" .planning/phases/03-webhook-authoritative-orders-and-inventory/03-ORDER-STATE-MODEL.md .planning/REQUIREMENTS.md` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | ORDR-05 | T-03-01-B | State model explicitly preserves no-reservation semantics | grep | `rg -n "no reservation|no-reservation|before payment|needs_review" .planning/phases/03-webhook-authoritative-orders-and-inventory/03-ORDER-STATE-MODEL.md` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 1 | ORDR-02 | T-03-02-A | Webhook contract uses authoritative Checkout-session events only | grep | `rg -n "checkout.session.completed|checkout.session.async_payment_succeeded|checkout.session.async_payment_failed|checkout.session.expired" .planning/phases/03-webhook-authoritative-orders-and-inventory/03-WEBHOOK-CONTRACT.md` | ✅ | ⬜ pending |
| 3-02-02 | 02 | 1 | SECU-02 | T-03-02-B | Contract forbids browser-paid authority and documents idempotent duplicate handling | grep | `rg -n "browser.*must not|idempot|duplicate|out-of-order|raw body|signature" .planning/phases/03-webhook-authoritative-orders-and-inventory/03-WEBHOOK-CONTRACT.md` | ✅ | ⬜ pending |
| 3-03-01 | 03 | 2 | ORDR-03 | T-03-03-A | Stock decrement happens once and only on authoritative paid transition | grep | `rg -n "decrement|paid|atomic|batch|transaction|available > 0" .planning/phases/03-webhook-authoritative-orders-and-inventory/03-INVENTORY-RECONCILIATION.md` | ✅ | ⬜ pending |
| 3-03-02 | 03 | 2 | ORDR-04, OPER-01 | T-03-03-B | Unpaid sessions leave stock unchanged and operator flow stays Stripe-Dashboard-first | grep | `rg -n "closed_unpaid|expired|failed|Stripe Dashboard|needs_review|refund" .planning/phases/03-webhook-authoritative-orders-and-inventory/03-INVENTORY-RECONCILIATION.md .planning/BACKLOG.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing repo scripts cover build, type/content, and unit-test smoke checks
- [x] `rg` is available for deterministic planning-artifact verification

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Human approval that the order model stays intentionally small and operable | ORDR-01, OPER-01 | The tradeoff between simplicity and exception coverage is a product/ops judgment, not a unit test | Review `03-ORDER-STATE-MODEL.md`, `03-WEBHOOK-CONTRACT.md`, and `03-INVENTORY-RECONCILIATION.md` together. Confirm the normal path is minimal and that exceptions route to `needs_review` rather than hidden complexity. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
