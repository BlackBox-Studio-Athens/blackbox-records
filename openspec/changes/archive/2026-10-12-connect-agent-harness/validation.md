# Validation and handoff

## Scope and decisions

- Product Environment: Local; repository tooling and instruction changes only.
- Acceptance row: boundaries/tooling/instructions. Product browser, CMS publication, hosted provider and release acceptance do not apply to this change; none is claimed.
- Global agent policy stays global. AGENTS.md routes only Blackbox constraints and task references. The detailed reference retains the Blackbox-specific archived-OpenSpec query caveat.
- The checker is intentionally bounded to three maintained Markdown documents. It does not prove semantic freshness, check heading anchors or execute examples.
- Existing validation and smoke artifacts remain the evidence store; OpenSpec remains the only task-state workflow.

## Checks

- Focused local-selection regression: `node --import tsx --test scripts/validate-local.test.mjs` passed, including manifest/enforcement selection and lightweight OpenSpec prose.
- Strict change validation: `pnpm openspec -- validate connect-agent-harness --type change --strict` passed.
- Focused guidance and local-selection fixtures: 9 passed via `node --import tsx --test scripts/check-agent-guidance.test.mjs scripts/validate-local.test.mjs`.
- `pnpm check:boundaries` passed, including current guidance, module ownership, dependency direction and commerce boundaries.
- Default local completion passed in 230.4 seconds: `.codex-artifacts/validation/2026-09-28T01-45-42-129Z-64528/summary.json`. This included the shared checkout's concurrent staff changes. The initial attempt stopped on formatting in the staff smoke script; only its formatting was normalized.
- After marking the tracked task record complete, revalidate against that passing run's pinned commit, including all remaining working-tree changes. Retain the final source identity and exact outcome in `.codex-artifacts/agent-harness/final-verification.json`.

The final ignored record links the existing validation summary and records its SHA, matching before/after fingerprints, Product Environment, commands and outcomes. Its source identity is authoritative; tracked handoff text alone is not a passing result. Unrelated concurrent staff edits in the shared checkout remain outside this change's ownership.

## Recovery

If final validation fails or the source changes during it, inspect the named failed phase log, repair the relevant issue and rerun. Do not reuse a passed summary from a different fingerprint. No application runtime change, production operation, push or deployment is part of this implementation.
