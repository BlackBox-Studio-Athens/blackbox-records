## Context

The 29 October 2026 audit measured DESIGN.md at 60,362 bytes and identified repeated color, typography, control and state rules; misplaced Staff workflows; and obsolete film, icon and Stats instructions. The user authorized applying the trims after the audit.

## Decisions

- Keep DESIGN.md as the public site's current visual contract and a short router to Staff and product context. Retain a compact machine-readable summary; the inspected Impeccable loader reads Markdown as text.
- Consolidate approved rules in place. Describe responsive and surface exceptions beside their defaults. Keep numeric values that define an approved visual contract.
- Use accepted current deltas where baseline specifications are older. Do not silently reconcile unrelated baseline specs or DESIGN.json in this change.
- Transfer the unique current Staff chart/comparison behavior to docs/backoffice-design.md. Keep research, task permissions and acceptance history in their existing owners.
- Preserve the original document and full audit under ignored .codex-artifacts/design-md-trim-audit-20261029/. Use a coverage map and source hashes for deletion safety.

## Risks and Verification

The main risk is losing a unique constraint while removing repeated text. Check coverage of every original section, scoped accessibility/motion/commerce rules, current decision links and local links. Run strict OpenSpec validation, pnpm agent:check and final pnpm validate. No browser or provider acceptance is claimed for this documentation-only change.
