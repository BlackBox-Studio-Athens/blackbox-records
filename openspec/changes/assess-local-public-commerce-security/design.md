# Design

## Context

Strix 1.7.0 and Docker Desktop are installed in Ubuntu WSL2. Subscription authentication works; an earlier fixture run was interrupted by an OpenAI cybersecurity safeguard. The existing Windows site on port 4321 must remain running. See proposal.md for scope.

## Goals / Non-Goals

Use the approved one-hour priority window after preparation. Preserve user services, databases and source. Deliver reproducible findings or an honest blocked/partial report; neither interruption nor zero findings establishes security. No hosted validation or remediation is authorized here.

## Decisions

- Capture SHA, Git status and per-file hashes before copying tracked source; include current file bytes. Exclude secrets, Git internals and existing runtime state. Use separate pristine analysis and disposable runtime copies.
- Run the canonical mock stack in its own Docker network namespace to retain ports 4321/8787 without conflicting with the owner's Windows site. Adapt only copy-local launcher resource bookkeeping and local transport exposure. Record every adaptation.
- Enforce outbound restrictions in assessment-owned containers before testing. The model controller retains subscription connectivity; the sandbox and app have only loopback and specifically required local service access. Verify both local access and blocked external HTTPS before starting.
- Use a dedicated Strix config with `chatgpt/gpt-6.1-sol`, reasoning `high`, dedupe reasoning `high`, telemetry disabled, standard mode, full source scope and 30 turns per agent. No API-key or endpoint fallback.
- Supervise aggregate elapsed time and provider refusal independently of per-agent turn limits. Aim for 10 minutes mapping, 35 minutes testing and 15 minutes validation/reporting. Stop affected work immediately on refusal, quota exhaustion or external traffic; preserve artifacts rather than resume automatically.
- Validate findings independently, redact sensitive evidence, and distinguish mock/development behavior from production-relevant application risk.

## Risks / Trade-offs

- Provider safeguards may block the real assessment → stop agents and report blocked coverage without switching models or evading safeguards.
- One hour limits completeness → prioritize impact and record tested, partial, blocked and excluded areas.
- Container transport and local authentication differ from hosted behavior → record adaptations and limit conclusions accordingly.
- Mock providers cannot prove real Stripe or email-provider security → assess application contracts locally and retain provider acceptance gaps.
