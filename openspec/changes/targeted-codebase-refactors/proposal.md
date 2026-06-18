## Why

The Resend work exposed a broader issue: several parts of the repo carry small, local complexity piles that make behavior harder to follow than the domain deserves. The environment/profile cleanup is one important slice, but the real change is a targeted refactor epic for stupid-simple code: fewer repeated policies, fewer drifting types, fewer primitive string tricks, and fewer hand-assembled runtime objects.

## What Changes

- Establish a targeted codebase refactor portfolio, not a broad rewrite or style sweep.
- Prioritize refactors with concrete evidence: repeated policy branches, schema/type drift risk, primitive formatting with external meaning, duplicated runtime assembly, and unclear environment vocabulary.
- Make the Product Environment profile cleanup one slice inside the portfolio, with Product Environment as the single app-wide environment identity.
- Use Zod better by deriving runtime config types from validated schema output where the schema owns the contract.
- Replace repeated email runtime assembly with a small composition factory, without introducing a DI container.
- Promote `compactId`/order reference formatting into a value object, then evaluate other value-object candidates only when they own real invariants and remove code.
- Keep library adoption intentionally boring: no new Result, idempotency, DI, profile, or pattern-matching library unless a later decision proves it reduces code and is owner-approved.
- Add tests and drift checks so refactors are behavior-preserving and stay readable after implementation.

## Capabilities

### New Capabilities

- `codebase-simplification`: defines how targeted refactor candidates are selected, implemented, constrained, and verified.

### Modified Capabilities

- `environment-model`: strengthen the Local/UAT/PRD model into the implementation source of truth for environment policy.
- `project-language`: define how targeted refactor terms and Product Environment Profile are named without creating more vocabulary drift.
- `tooling-validation`: require schema-inferred runtime types, environment drift checks, and a value-object refactor standard.

## Impact

- Affected code: backend env bindings, feature flags, email config/routing, catalog verification, scheduled tasks, smoke scripts, runtime verification scripts, order-reference formatting, and any later approved refactor candidates found by inventory.
- Affected specs/docs: new codebase simplification spec plus environment model, project language, and tooling validation deltas.
- Dependencies: no new runtime dependency by default. Any new library for profiles, matching, DI, Result, or idempotency requires explicit owner approval.
- Behavior: intended to be behavior-preserving. UAT sink routing, PRD-disabled gates, Local modes, Stripe mode mapping, smoke evidence paths, checkout behavior, and public contracts must remain unchanged unless a later explicit task says otherwise.
