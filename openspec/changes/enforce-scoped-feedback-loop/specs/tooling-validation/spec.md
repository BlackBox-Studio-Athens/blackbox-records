# Spec Delta

## ADDED Requirements

### Requirement: Feedback policy classifies every root command

The repository SHALL keep one committed feedback policy that classifies every root package command as iteration, completion, release-tier or operational, and that states the machine slot budget, guarded command patterns, suite tiers and lease durations. Validation scripts and agent hooks SHALL read that policy instead of restating its rules.

#### Scenario: A root command is added without classification

- **WHEN** a root package command exists that the policy does not classify
- **THEN** the tooling contract tests fail and name the command.

#### Scenario: A guard is not wired

- **WHEN** a release-tier command does not pass through the guard, or an agent hook configuration omits the command guard
- **THEN** the tooling contract tests fail and name the missing wiring.

#### Scenario: A rule changes

- **WHEN** a maintainer changes a guarded pattern, the slot budget or a lease duration in the policy
- **THEN** scripts and hooks apply the new value without another source edit.

### Requirement: Whole-project commands require a maintainer grant

Release-tier commands, including the full validator, complete checks, editor acceptance, package-wide and repository-wide tests, repository-wide check, lint and build, the unfiltered end-to-end suite and cache-disabling options, SHALL be refused on a development machine unless a maintainer grant is active. Refusal SHALL exit non-zero before starting work and SHALL name the scoped command to use. CI SHALL be unaffected.

#### Scenario: An agent runs the full validator

- **WHEN** `pnpm validate:full` runs locally without an active grant
- **THEN** it exits non-zero without starting any task
- **AND** it names `pnpm validate` and `pnpm test <module|file>` as the scoped commands.

#### Scenario: The maintainer grants a full run

- **WHEN** the maintainer issues a grant for a stated number of minutes
- **THEN** release-tier commands run from any checkout of the repository until the grant expires
- **AND** an expired or malformed grant is treated as absent.

#### Scenario: CI runs complete checks

- **WHEN** a release-tier command runs inside the repository's GitHub Actions workflows
- **THEN** it runs without a grant.

#### Scenario: A whole-package suite is run directly

- **WHEN** a package's whole test or type-check suite is started from the package directory or through a package filter, without a grant
- **THEN** it exits non-zero before starting work
- **AND** the same suite runs when the task runner starts it as a selected task.

#### Scenario: A release-tier script file is run directly

- **WHEN** a script file that performs release-tier work, such as the editor browser check, is started with `node` instead of its package command, without a grant
- **THEN** it exits non-zero before starting work.

### Requirement: Agent hooks deny guard bypasses

Committed agent hook configuration for Claude Code and Codex SHALL deny shell commands that bypass the feedback policy: direct whole-suite test, browser or build runners, cache-disabling options, issuing or forging a maintainer grant, and inline override variables. A denial SHALL state the scoped alternative and SHALL be recorded in ignored artifacts.

#### Scenario: An agent invokes a runner directly

- **WHEN** an agent runs Playwright without a spec or title filter, `nx run-many`, `nx affected`, or a package-wide Vitest run, by name or by the runner's file path
- **THEN** the hook denies the command before it starts and names the scoped command.

#### Scenario: An agent tries to lift the guard

- **WHEN** an agent runs the grant command, writes the grant file, or sets the override variable inline
- **THEN** the hook denies the command.

#### Scenario: A scoped command runs

- **WHEN** an agent runs `pnpm validate`, `pnpm test <module|file>`, or `pnpm test:e2e` with a spec path or title filter
- **THEN** the hook allows it.

### Requirement: Validation shares a machine-wide slot budget

Local validation SHALL draw task parallelism from one slot budget shared by every checkout of the repository on the machine. A run SHALL take the free slots, at least one, or wait in arrival order, and SHALL report which checkout it waits behind. Focused single-module tests SHALL never wait. A slot whose holder has exited SHALL be reclaimed.

#### Scenario: Two worktrees validate at once

- **GIVEN** one checkout holds every slot
- **WHEN** a second checkout starts `pnpm validate`
- **THEN** it prints that it is waiting and names the holding checkout
- **AND** it starts when a slot is released, with parallelism equal to the slots it obtained.

#### Scenario: A holder crashes

- **WHEN** the process that holds a slot no longer exists
- **THEN** the next run reclaims that slot without manual cleanup.

#### Scenario: A focused test runs while validation holds the budget

- **WHEN** `pnpm test <module|file>` starts and no slot is free
- **THEN** it runs immediately.

#### Scenario: A second validation starts in the same checkout

- **WHEN** `pnpm validate` starts while another validation of the same checkout is running
- **THEN** it waits, reports the running process, and continues when that validation ends
- **AND** it does not fail or ask for the lock to be deleted.

#### Scenario: An end-to-end spec runs

- **WHEN** `pnpm test:e2e` runs a named spec locally
- **THEN** it holds one slot for the run, waiting in order when none is free.

### Requirement: Local validation converges and repairs formatting

Targeted local validation SHALL format changed files before checking them, SHALL rerun its task selection once when source changed during the run instead of ending invalidated, and SHALL identify source without reading every tracked file. It SHALL still record matching source identity before and after the final pass, and CI SHALL keep check-only formatting.

#### Scenario: A changed file is unformatted

- **WHEN** local validation starts with an unformatted changed file
- **THEN** the file is formatted before the source identity is recorded
- **AND** the run does not fail on formatting for that file.

#### Scenario: Another thread edits the checkout during validation

- **WHEN** tracked or untracked source changes while tasks run
- **THEN** validation runs its selection again, reusing cached results for tasks whose inputs did not change
- **AND** it reports invalidated only if source changes again during the second pass.

#### Scenario: A plugin worker starts slowly

- **WHEN** the machine is loaded and an Nx plugin worker needs more than its default start time
- **THEN** validation waits for it instead of failing the task.

### Requirement: Workspace tasks declare the inputs they read

Root workspace lint, architecture, environment and contract-test tasks SHALL declare the files they read as cache inputs instead of the whole repository. A change limited to documentation or OpenSpec change artifacts SHALL execute no test, lint, type or architecture task that does not read those files; such tasks SHALL be restored from cache. The root package manifest SHALL be a cache input of root workspace tasks only. A scheduled uncached full run in CI SHALL detect an input that was declared too narrowly.

#### Scenario: Only an OpenSpec change note is edited

- **GIVEN** the tree passed validation before the edit
- **WHEN** `pnpm validate` runs after editing a file under `openspec/changes/`
- **THEN** formatting is the only task executed
- **AND** every other selected task is restored from cache.

#### Scenario: An agent-guidance document is edited

- **WHEN** one of the documents the agent-guidance check reads is edited, or a documentation file is added, removed or renamed
- **THEN** the architecture task runs again, because that check reads those documents and verifies that linked files exist.

#### Scenario: A root package script is edited

- **WHEN** a script in the root package manifest changes and the lockfile does not
- **THEN** root workspace tasks run again
- **AND** module tests and package lint and type checks are restored from cache.

#### Scenario: A declared input changes

- **WHEN** a file that a workspace task reads changes
- **THEN** that task runs again instead of being restored from cache.

#### Scenario: The scheduled full run fails

- **WHEN** the weekly uncached full validation fails on a tree whose targeted validation passed
- **THEN** the failure is visible in the workflow result
- **AND** the under-declared input is corrected before the task's cache is trusted again.

### Requirement: Linked worktrees use their own public site port

The primary checkout SHALL serve the Local public site on port 4321. Each linked worktree SHALL be assigned a stable, distinct port that its background and foreground site launchers and its end-to-end harness use. A launcher SHALL fail clearly when its assigned port is occupied and SHALL NOT choose another port.

#### Scenario: A linked worktree starts the site

- **WHEN** a linked worktree runs the site launcher
- **THEN** the site listens on that worktree's assigned port
- **AND** the same worktree receives the same port on later runs.

#### Scenario: Two worktrees run end-to-end specs

- **WHEN** two checkouts run a named spec at the same time
- **THEN** each harness reaches only the site served from its own checkout.

#### Scenario: A removed worktree releases its port

- **WHEN** a worktree no longer exists
- **THEN** its port assignment is released for reuse.

### Requirement: Shared local resources are leased

The full Local stack SHALL run from one checkout at a time: a second start SHALL fail before binding ports and name the owning checkout. Use of the shared Chrome profile by agents SHALL require a lease that is renewed by use and expires when idle, enforced by a committed hook. A status command SHALL report slot holders, site ports and both leases.

#### Scenario: A second checkout starts the stack

- **WHEN** another checkout already runs the full Local stack
- **THEN** the new start exits non-zero and names that checkout.

#### Scenario: A linked worktree runs the stack

- **WHEN** a linked worktree holds the stack lease
- **THEN** that worktree serves the public site on port 4321
- **AND** the primary checkout's site launcher and end-to-end harness fail clearly instead of using that site.

#### Scenario: Two sessions use Chrome

- **GIVEN** one agent session used the shared Chrome profile within the idle period
- **WHEN** another session calls a Chrome tool
- **THEN** the call is denied and names the holding checkout
- **AND** it succeeds after the idle period passes without use.

#### Scenario: An agent inspects local resources

- **WHEN** an agent runs the status command
- **THEN** it lists each held slot, each served site port with its checkout, the stack owner and the Chrome lease holder.

### Requirement: Feedback cost is reported from task history

The repository SHALL provide a read-only command that reports executed task time by category, cache-hit count and per-task minimum and average duration from the task runner's own history, so that before and after comparisons use one query. Each local validation, guard denial and local end-to-end run SHALL append one record to an uncommitted history log shared by every checkout, and the command SHALL report a weekly timeline from it.

#### Scenario: A maintainer compares feedback cost

- **WHEN** the report command runs for a stated period
- **THEN** it prints total executed task time, the share by category, cache hits and the slowest tasks
- **AND** it changes no file and runs no task.

#### Scenario: A maintainer reviews the trend

- **WHEN** the report command runs after validations, denials and end-to-end runs were recorded
- **THEN** it prints per week the number of local validations, the share that passed, median and upper-quartile duration, slot wait, guard denials and end-to-end runs
- **AND** a missing history log is reported as no history, not as an error.

#### Scenario: Recording fails

- **WHEN** the history log cannot be written
- **THEN** the validation, denial or end-to-end run proceeds with its normal result.

## MODIFIED Requirements

### Requirement: Local end-to-end harness is deterministic and opt-in

The repository SHALL provide `pnpm test:e2e`, which runs Playwright specs against this checkout's Local site URL and is the required check for shell navigation, overlay, player, mobile-navigation and cart continuity. It SHALL reuse a site already serving that URL or run the foreground static-site launcher for the run. It SHALL NOT start the Local stack, run inside `pnpm validate`, or depend on external network or Worker responses. A local run SHALL name a spec path or title filter; the whole suite runs at PRD promotion or under a maintainer grant.

#### Scenario: A site already serves the canonical port

- **GIVEN** background Astro or the full Local stack owned by this checkout serves the checkout's canonical Local site URL
- **WHEN** an agent runs `pnpm test:e2e` with a spec path
- **THEN** the harness reuses that server and leaves it running afterwards.

#### Scenario: Nothing serves the canonical port

- **WHEN** an agent runs `pnpm test:e2e` with a spec path and the checkout's canonical site port is free
- **THEN** the harness starts `pnpm site:dev` for the run
- **AND** the port is free again after the run.

#### Scenario: Another checkout serves port 4321

- **GIVEN** the primary checkout serves port 4321
- **WHEN** a linked worktree runs `pnpm test:e2e` with a spec path
- **THEN** the harness uses the linked worktree's own port and does not test the primary checkout's site.

#### Scenario: An agent verifies the feature under work

- **WHEN** an agent runs `pnpm test:e2e` with a spec path or title filter
- **THEN** only the selected specs run.

#### Scenario: An agent runs the whole suite locally

- **WHEN** `pnpm test:e2e` runs locally without a spec path, title filter or maintainer grant
- **THEN** it exits non-zero without starting a browser or server
- **AND** it tells the agent to name a spec.

#### Scenario: A page logs an error

- **WHEN** a page under test logs a console error or throws an uncaught error
- **THEN** that test fails and names the message
- **AND** a trace, screenshot and error context are retained under `.codex-artifacts/e2e/test-results/`.

### Requirement: Post-merge UAT provider smoke workflow

The system SHALL validate the deployed Cloudflare Pages UAT site with the canonical Stripe test-mode paid scenarios and newsletter Contact smoke inside the canonical release workflow before PRD promotion mutates PRD, without requiring operator presence or Resend receipt credentials. A push to `main` SHALL NOT run provider smoke.

#### Scenario: Shared static deployment completes successfully

- **GIVEN** an operator requests PRD code promotion of a candidate and UAT serves that candidate's source SHA
- **WHEN** the canonical release workflow starts its promotion acceptance
- **THEN** it runs `pnpm smoke:stripe-uat -- --scenario happy_path_paid,pay_what_you_want_paid --screenshots on-failure` against the deployed Cloudflare Pages UAT site
- **AND** it runs `pnpm smoke:resend-uat` against the deployed UAT Worker
- **AND** it uses the `catalog-promotion-uat` GitHub Actions environment for the same UAT Cloudflare and sandbox Stripe credentials already used by UAT promotion
- **AND** resulting application email routes to the managed UAT sink
- **AND** it uploads the standard smoke summary and evidence artifacts
- **AND** one canonical invocation owns provider smoke for that promotion, with its result required before any PRD mutation.

#### Scenario: Receipt mode is omitted from post-merge smoke

- **WHEN** the canonical release workflow runs `pnpm smoke:stripe-uat`
- **THEN** it does not enable receipt mode, require a local Resend profile, add a Resend GitHub secret, or wait for an operator
- **AND** checkout, webhook, order, D1, screenshot, trace, and existing Smoke Evidence behavior remains unchanged
- **AND** the result does not claim that inbox receipt was verified.

#### Scenario: Stale smoke runs are cancelled

- **GIVEN** a newer candidate was deployed to UAT after the candidate selected for promotion
- **WHEN** promotion acceptance verifies the hosted UAT release identity
- **THEN** it stops before any provider scenario or PRD mutation
- **AND** an earlier candidate's smoke result cannot authorize the newer candidate; manual diagnostic smoke does not substitute for promotion acceptance.

#### Scenario: A push deploys a UAT candidate

- **WHEN** a push to `main` completes its UAT deployment
- **THEN** that run verifies the hosted release identity and starts no browser or provider smoke
- **AND** its success does not claim provider acceptance.

#### Scenario: Deployment ownership is validated

- **WHEN** environment-model and workflow contract validation run
- **THEN** they reject Worker deployment or D1 migration commands in provider smoke
- **AND** they reject a standalone UAT Worker deployment workflow
- **AND** they require the canonical release workflow to retain the UAT Worker deployment step.
