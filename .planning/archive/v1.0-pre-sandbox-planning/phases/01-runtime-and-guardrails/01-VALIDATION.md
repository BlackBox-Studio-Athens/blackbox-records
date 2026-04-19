---
phase: 1
slug: runtime-and-guardrails
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Repo smoke commands + grep-based doc verification |
| **Config file** | `package.json` scripts / none for doc-grep checks |
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
| 1-01-01 | 01 | 1 | DEPL-01 | T-01-01-A | ADR locks Cloudflare Workers + Astro adapter target | grep | `rg -n "Cloudflare Workers|@astrojs/cloudflare|GitHub Pages" .planning/adrs/ADR-001-hosting-runtime.md` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | DEPL-02 | T-01-01-B | Requirements stop implying browser-visible or GitHub-only runtime secrets | grep | `rg -n "Worker secrets|D1|GitHub Secrets|runtime secrets" .planning/REQUIREMENTS.md` | ✅ | ⬜ pending |
| 1-02-01 | 02 | 2 | CATA-03 | T-01-02-A | ADR preserves Stripe as sellable catalog truth and Astro collections as editorial layer | grep | `rg -n "Stripe.*source of truth|Astro content collections remain editorial|D1" .planning/adrs/ADR-002-commerce-boundaries.md` | ✅ | ⬜ pending |
| 1-02-02 | 02 | 2 | SECU-01 | T-01-02-B | Project docs state browser cannot mutate order/inventory and Stripe version policy is explicit | grep | `rg -n "browser.*must not write|API version|ui_mode" .planning/adrs/ADR-002-commerce-boundaries.md .planning/REQUIREMENTS.md` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 1 | DEPL-01 | T-01-03-A | Cutover ADR defines full migration and deployment-level rollback without Fourthwall fallback | grep | `rg -n "full replacement|no Fourthwall fallback|rollback" .planning/adrs/ADR-003-boxnow-and-cutover.md` | ✅ | ⬜ pending |
| 1-03-02 | 03 | 1 | DEPL-01 | T-01-03-B | Launch/readiness docs align to new rollback and review gates | grep | `rg -n "rollback|kill-switch|go-live|Fourthwall" .planning/LAUNCH-READINESS.md .planning/BACKLOG.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing repo scripts cover build, type/content, and unit-test smoke checks
- [x] `rg` is available for deterministic document verification

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Human approval of runtime, trust boundary, and rollback decisions | DEPL-01, DEPL-02, SECU-01 | Phase 1 completion is gated by human review of ADR content, not code execution | Read updated ADR-001, ADR-002, and ADR-003 together and confirm they match the locked context before advancing to Phase 2 planning |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
