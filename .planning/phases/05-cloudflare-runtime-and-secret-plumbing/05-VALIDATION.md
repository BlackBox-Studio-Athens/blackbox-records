---
phase: 5
slug: cloudflare-runtime-and-secret-plumbing
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-20
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Repo smoke commands + grep checks + workflow/config inspection |
| **Config file** | `package.json` scripts, `astro.config.mjs`, `wrangler.jsonc`, GitHub workflow YAML |
| **Quick run command** | `pnpm check` |
| **Full suite command** | `pnpm test:unit && pnpm check && pnpm build && pnpm build:pages` |
| **Estimated runtime** | ~90 seconds after Worker tooling is added |

---

## Sampling Rate

- **After every task commit:** Run the task-specific `rg` verification and the smallest relevant command (`pnpm check` when config or scripts changed)
- **After every plan wave:** Run `pnpm test:unit && pnpm check && pnpm build && pnpm build:pages`
- **Before `$gsd-verify-work`:** Full suite must be green and the sandbox workflow file must parse cleanly
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 05 | 1 | DEPL-01 | T-05-01-A | Worker runtime tooling and scripts exist without erasing the legacy Pages build path | grep | `rg -n "@astrojs/cloudflare|wrangler|prisma|build:pages|build:worker|dev:worker" package.json` | ✅ | ⬜ pending |
| 5-01-02 | 05 | 1 | DEPL-01 | T-05-01-B | Astro config uses the Cloudflare adapter path while preserving a legacy Pages build mode | grep | `rg -n "@astrojs/cloudflare|output: 'static'|DEPLOY_TARGET|site:|base:" astro.config.mjs` | ✅ | ⬜ pending |
| 5-02-01 | 05 | 1 | DEPL-02 | T-05-02-A | Wrangler config declares D1 bindings and required secrets for the Worker runtime | grep | `rg -n "d1_databases|secrets|required|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|env.beta" wrangler.jsonc` | ✅ | ⬜ pending |
| 5-02-02 | 05 | 1 | SECU-01 | T-05-02-B | Prisma-on-D1 scaffold and local secret hygiene are explicit and checked in safely | grep | `rg -n "runtime *= *\"cloudflare\"|provider *= *\"sqlite\"|prisma migrate diff|\\.dev\\.vars|src/generated/prisma" prisma/schema.prisma prisma.config.ts .dev.vars.example .gitignore` | ✅ | ⬜ pending |
| 5-03-01 | 05 | 2 | DEPL-03 | T-05-03-A | Sandbox Worker deploy automation is isolated from the Pages workflow and supports both push and manual dispatch | grep | `rg -n "workflow_dispatch|push:|sandbox|wrangler-action|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID" .github/workflows/cloudflare-sandbox.yml` | ✅ | ⬜ pending |
| 5-03-02 | 05 | 2 | DEPL-03 | T-05-03-B | Repo docs reflect the Worker runtime, Prisma migration flow, and the deferred Cloudflare Access posture | grep | `rg -n "Workers|D1|Prisma|build:pages|sandbox|Cloudflare Access" README.md AGENTS.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing repo scripts cover unit tests, type/content checks, and baseline builds
- [x] `rg` is available for deterministic config and doc verification
- [x] The current repo already has a Pages workflow that can be used as the non-regression reference during Worker workflow work

*Existing infrastructure is sufficient; no extra harness is required before execution starts.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Review the sandbox deployment trigger policy | DEPL-03 | Human review must confirm the dedicated `sandbox` branch plus `workflow_dispatch` behavior is acceptable before rollout | Read `.github/workflows/cloudflare-sandbox.yml` and confirm it does not trigger from `main` or mutate the Pages workflow |
| Review the sandbox exposure posture | SECU-01 | Cloudflare Access is intentionally deferred, so the team must consciously accept that the sandbox is not private | Read `README.md` and `AGENTS.md` and confirm the sandbox is documented as reachable but non-production |

---

## Validation Sign-Off

- [x] All tasks have automated verify or existing infrastructure coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
