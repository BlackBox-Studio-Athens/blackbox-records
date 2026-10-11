# Proposal

## Why

The public site needs a careful pass for unnecessary code and tests that add maintenance cost without protecting behavior. The main aim is to mostly remove proven dead, redundant, duplicated or unnecessary production code and test scaffolding. Review each module independently, then implement only demonstrated simplifications while preserving exactly the same functionality and meaningful regression tests. New abstractions require a clear reduction in code and complexity; there is no deletion quota.

## What Changes

- Review all 11 closed public web modules, the page and layout composition roots, both shared packages, and all 14 commerce backend modules individually (29 review/implementation pairs), with independent work allowed to run concurrently.
- Use `gpt-6.1-sol` with `high` reasoning, Full access and approval policy `never` for all remaining turns. Preserve completed max review/implementation history and full reports; reviewers and implementers remain separate fresh roles. Resume the deliberately interrupted module 5/17 implementers in their same roles at high effort.
- Allow four read-only reviewers and dependency-aware execution by up to four disjoint source writers, with current owned/caller hash rechecks. Prepared SAME fresh implementer roles may execute independently while prior acceptance is pending, through the parent's explicit `--execute --defer-acceptance` action construction; default execution still requires preceding checkpoint acceptance. Retain actual completed preparation, full raw report equality, profile, separate fresh roles, ownership, reservation and duplicate-execution checks. Resume with verified full review/prep paths, IDs and hashes instead of replaying their reports; prepare mode still delivers the full review. The parent owns starts; no new task database, controller or overlapping daemon is introduced.
- Implementers run their own published scoped checks immediately. One exclusive persistent verifier consolidates source-bound shared/e2e/browser/normal Local union acceptance and both-graph freshness on the final stable tree, with source writers idle. Module task acceptance remains unchecked until all required evidence passes; intermediate checkpoints remain valid when their actual gates pass. Preserve full inspection, equivalence, security and meaningful coverage obligations, historical failures and unrelated work.
- Remove proven redundancy, unnecessary complexity and duplication; simplify responsibilities and hot paths where current behavior can be retained.
- Retain meaningful regression coverage, security and trust-boundary checks, accessibility, visual output, persistence, error behavior and public module contracts.
- Record findings, implemented and rejected proposals, affected checks and remaining acceptance evidence in this change.
- Permit formatting-only normalization of audit Markdown while implementers are idle, preserving complete content, IDs, identities, hashes and evidence links; retain raw JSON and prior failures unchanged. Report production and test reductions separately, with net files/lines excluding formatting and required audit Markdown.
- Retain mandatory final integration: one policy-compliant `pnpm validate` on the final combined tree and strict OpenSpec final gates. Intermediate global validation is optional evidence and cannot replace tasks 30.1/30.2.

## Capabilities

### New Capabilities

None. This is an internal refactor, with `skip_specs: true`.

### Modified Capabilities

None. Existing behavioral requirements remain in force, including the codebase-simplification baseline.

## Impact

The public web source under `apps/web/src`, commerce backend module source under `apps/backend/src` excluding CMS implementation, both shared packages, their owned tests, and relevant focused runtime/browser acceptance. CMS and staff implementation, generated contracts, migrations, hosted services and release operations are outside the editing scope. Shared contracts must remain compatible with all callers, including CMS and staff. Work stays in the existing `main` checkout. No new dependencies or module interfaces are planned.
