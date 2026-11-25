# Operator CLI

## Purpose

Let Staff operators perform selected catalog and stock operations from a local terminal using their verified Access identity.

## ADDED Requirements

### Requirement: Authenticate to the selected Staff environment

The CLI SHALL use the operator's human Access session and send a fresh token lookup with each request to the selected HTTPS Staff origin. The CLI SHALL keep tokens out of its output and storage.

#### Scenario: Verify the signed-in operator

- **WHEN** the operator runs `whoami` with a valid Access session
- **THEN** the CLI reports the operator email after the Worker accepts the token on a read-only request

#### Scenario: A request is redirected

- **WHEN** a protected request returns a redirect
- **THEN** the CLI stops the request and names the login command for that environment

### Requirement: Confirm writes explicitly

The CLI SHALL require an explicit UAT or PRD target and display a JSON write plan before remote work. It SHALL apply only with `--apply` and either the exact environment name typed at an interactive prompt or `--yes`. Applying to PRD SHALL also require `--confirm-live`.

#### Scenario: Preview a write

- **WHEN** the operator runs a valid write command without `--apply`, with or without `--yes`
- **THEN** the CLI displays the plan and makes zero remote requests

#### Scenario: Apply without a terminal

- **WHEN** the operator passes `--apply --yes` and also passes `--confirm-live` for PRD
- **THEN** the CLI shows `"confirmation": "--yes"` in the plan and proceeds without a prompt or interactive terminal

#### Scenario: Apply with typed confirmation

- **WHEN** the operator applies without `--yes`
- **THEN** the CLI shows `"confirmation": "typed"` in the plan and requires the exact environment name in an interactive terminal

### Requirement: Provide generated command help

The CLI SHALL use Commander to route commands, validate environment choices and generate help for the root and nested commands.

#### Scenario: Show Distro create options

- **WHEN** the operator runs `pnpm ops distro create --help`
- **THEN** the CLI displays the create options and exits successfully without a remote request

### Requirement: Set up Distro items and record stock counts

The CLI SHALL use the protected Staff APIs to upload artwork, set up new or existing Distro items, optionally publish completed setups, and record revision-checked physical stock counts.

#### Scenario: Create and publish a Distro item

- **WHEN** the operator confirms a Distro create with `--publish`
- **THEN** the CLI uploads the artwork, submits setup and requests publication after setup reports completion

#### Scenario: Replay a transient failure

- **WHEN** a replayable write returns a transient failure
- **THEN** its bounded retry uses the same body and request identity
- **AND** the CLI reports the operation identity and resulting status

### Requirement: Preserve Distro create identity with the CMS default group

During create-mode Distro setup, the backend CMS source gateway SHALL accept a stored empty legacy `group` when the create request omits it. It SHALL apply the existing identity comparison to the remaining content and to any explicitly supplied `group`.

#### Scenario: Create and retry with the same operation ID

- **WHEN** create-mode Distro setup omits `group` and EmDash returns it as an empty string
- **THEN** the matching CMS source is accepted
- **AND** a retry with the same operation ID and request reuses the saved source or replays the completed operation
