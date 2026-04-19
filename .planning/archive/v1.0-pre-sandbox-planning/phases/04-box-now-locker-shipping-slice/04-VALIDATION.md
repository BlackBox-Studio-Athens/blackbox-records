---
phase: 4
slug: box-now-locker-shipping-slice
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
---

# Phase 4 — Validation Strategy

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
| 4-01-01 | 01 | 1 | SHIP-01 | T-04-01-A | Shipping contract stays Greece-only and blocks payment until locker selection completes | grep | `rg -n "Greece only|country = GR|fail closed|payment must not proceed|locker_id" .planning/phases/04-box-now-locker-shipping-slice/04-SHIPPING-CONTRACT.md` | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | SHIP-02 | T-04-01-B | Requirements and contract keep the stored locker data intentionally minimal | grep | `rg -n "SHIP-01|SHIP-02|locker_id|country_code|locker_name_or_label|address" .planning/REQUIREMENTS.md .planning/phases/04-box-now-locker-shipping-slice/04-SHIPPING-CONTRACT.md` | ✅ | ⬜ pending |
| 4-02-01 | 02 | 2 | SHIP-03 | T-04-02-A | Fulfillment model stays manual partner-portal only | grep | `rg -n "Partner Portal|manual|no API automation|thin server-assisted" .planning/phases/04-box-now-locker-shipping-slice/04-FULFILLMENT-MODEL.md` | ✅ | ⬜ pending |
| 4-02-02 | 02 | 2 | SHIP-03 | T-04-02-B | Future automation and non-Greece shipping remain deferred in backlog | grep | `rg -n "non-Greece|automation|Partner Portal|BOX NOW API|multi-carrier" .planning/BACKLOG.md` | ✅ | ⬜ pending |

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
| Human approval that the shipping flow remains intentionally thin and Greece-only | SHIP-01, SHIP-03 | The main tradeoff is product/ops scope, not code correctness | Review `04-SHIPPING-CONTRACT.md`, `04-FULFILLMENT-MODEL.md`, and `04-UI-SPEC.md` together. Confirm the shopper flow does not imply a second carrier or a non-Greece path and that fulfillment remains manual. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
