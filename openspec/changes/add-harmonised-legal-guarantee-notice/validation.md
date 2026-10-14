# Preparation evidence

## Scope and source

- Product Environment: Local, documentation preparation only.
- Worktree: `C:/Users/SVall/.codex/worktrees/b107/blackbox-records`.
- Branch: `codex/harmonised-guarantee-notice`.
- Base/source SHA: `dfea9e105f51e7e472dc08e535a479e7dbb2186b`.
- User superseding instruction: Claude Desktop owns all UI edits, including rendered text. No UI, backend, schema, source content fixture or live CMS change was made.
- Read all four active change proposals before creating this uniquely named change. Existing unrelated changes remain untouched.
- `pnpm openspec:guard --allow-worktree` passed; all OpenSpec commands use the guarded `pnpm openspec -- ... --allow-worktree` path.

## Research and source inspection

The [legal record](legal-research.md) contains official EU/Greek sources and hashes of retained Gazette PDFs. Law 5326/2026 article 106 is the relevant commencement correction; the notice applies from 27 September 2026. No live CMS behaviour is inferred from the pending source fixture.

The initial focused Graphify query failed because this newly created worktree had no graph file. CodeGraph reported no `.codegraph` index and instructed against further queries in this session. Scoped exact reads established the handover edit points. Creating the authorized local branch subsequently triggered the repository checkout hook to bootstrap CodeGraph and build Graphify. A later Graphify query found the checkout component but exceeded its 2500-token budget; its broad relationships are not accepted as complete evidence. The bounded path query between `CheckoutOfferStatus()` and `DeliverySummary()` is limited to that seam. No substantive code edit batch requires an additional graph refresh, and CodeGraph is not claimed as consulted source evidence.

## Acceptance boundaries

- Documentation/planning validation is applicable; final run receipt is recorded under ignored `.codex-artifacts/guarantee-notice/`.
- Shell/player/routing, checkout, CMS publication and browser acceptance are not claimed: this delivery changes no product source and the user assigned UI to Claude Desktop. Tasks 2–3 stay open.
- No hosted request to BlackBox, provider mutation, purchase, email, push, deployment or publication was performed.
- Official assets, user-approved preview, readable presentation, complete accessible transcript and implemented behaviour remain unverified until Claude completes the handover.

## Checks

- Strict guarded OpenSpec validation passed for `add-harmonised-legal-guarantee-notice`.
- `pnpm validate` passed 18 selected tasks, 16 with matching cached outputs, in `mode: local`. Summary: `.codex-artifacts/validation/2026-10-14T08-59-31-648Z-62488-9e543d/summary.json`. Its before/after source fingerprint matches: `838b82aec276ee1b029d8b87b4db59fe40aac4f027a27501c1696eb83e566375`; source SHA is the base SHA above.
- `git diff --check` passed. No product code changed, so no new implementation test or browser run is claimed.
- The final rerun after these documentation edits and task updates is recorded in ignored `.codex-artifacts/guarantee-notice/completion.json`, including its source-bound summary and local commit identity. The earlier summary above is retained as an intermediate check, not evidence for later edited documentation.
- No check was waived and no full-project grant was requested.
