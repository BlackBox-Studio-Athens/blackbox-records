---
phase: 2
slug: native-catalog-and-embedded-checkout-slice
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
---

# Phase 2 — Validation Strategy

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
| 2-01-01 | 01 | 1 | CATA-01 | T-02-01-A | Catalog slice stays curated and Stripe-backed, not CMS-priced | grep | `rg -n "hand-picked|Stripe|price|deferred|cart" .planning/phases/02-native-catalog-and-embedded-checkout-slice/02-CATALOG-SLICE.md` | ✅ | ⬜ pending |
| 2-01-02 | 01 | 1 | CATA-02 | T-02-01-B | Backlog explicitly defers full-catalog and cart scope | grep | `rg -n "cart|full catalog|filters|quantity" .planning/BACKLOG.md` | ✅ | ⬜ pending |
| 2-03-01 | 03 | 1 | CHKO-01 | T-02-03-A | Shopper flow stays collection -> detail -> dedicated checkout, not direct grid checkout | grep | `rg -n "collection|product detail|dedicated checkout|Buy Now|View Product" .planning/phases/02-native-catalog-and-embedded-checkout-slice/02-SHOPPER-FLOW.md` | ✅ | ⬜ pending |
| 2-03-02 | 03 | 1 | CATA-01 | T-02-03-B | Return/cancel states do not claim payment authority | grep | `rg -n "return|cancel|not authoritative|payment success" .planning/phases/02-native-catalog-and-embedded-checkout-slice/02-SHOPPER-FLOW.md` | ✅ | ⬜ pending |
| 2-02-01 | 02 | 2 | CHKO-02 | T-02-02-A | Checkout Session contract stays server-created and uses embedded-session semantics | grep | `rg -n "ui_mode: embedded|return_url|redirect_on_completion|server-created|success_url|cancel_url" .planning/phases/02-native-catalog-and-embedded-checkout-slice/02-CHECKOUT-CONTRACT.md` | ✅ | ⬜ pending |
| 2-02-02 | 02 | 2 | CHKO-01 | T-02-02-B | Contract does not introduce browser-side privileged writes or hosted Checkout assumptions | grep | `rg -n "browser.*must not write|D1|hosted|success_url|cancel_url" .planning/phases/02-native-catalog-and-embedded-checkout-slice/02-CHECKOUT-CONTRACT.md` | ✅ | ⬜ pending |

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
| Human approval that the storefront feel remains BlackBox-native rather than generic ecommerce | CATA-01, CHKO-01 | The design judgment comes from reading the planning artifacts and UI-SPEC together | Review `02-UI-SPEC.md`, `02-CATALOG-SLICE.md`, and `02-SHOPPER-FLOW.md` together. Confirm they still describe a curated BlackBox flow, not a marketplace/cart-first storefront. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
