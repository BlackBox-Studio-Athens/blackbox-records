# Connect the repository agent harness

## Why

Project instructions repeat global policy, require unrelated startup reads, and retain obsolete CMS and tool guidance. Local validation also treats the executable module-boundary manifest as ordinary OpenSpec prose. Existing tests, browser diagnostics and runtime logs need a clear route from each task's acceptance criteria to its evidence.

## What changes

- Replace the project AGENTS.md with a short Blackbox-specific task router. Keep global policy in the global harness and project operational details in linked references.
- Check the router and its two supporting documents for broken local links, missing root package commands and an excessive entry-point length.
- Select boundary checks for boundary-policy changes, including the manifest under OpenSpec. Check maintained agent guidance during local and CI validation.
- Document task-specific acceptance using existing commands, source fingerprints, smoke artifacts and Worker request IDs. Keep task state and completion evidence in this OpenSpec workflow.

## Scope

Repository tooling and instructions only. Existing runtime behavior, release gates and provider access remain governed by their current specs. No new orchestration service, monitoring provider, worktree or recurring job is introduced.

## Acceptance

The guidance checker accepts the maintained documents and rejects broken fixtures. A manifest-only change selects boundary validation. Ordinary OpenSpec prose does not select application tests. Task-specific acceptance distinguishes local checks, observed behavior and hosted release evidence. Focused tests, strict OpenSpec validation and final pnpm validate pass.
