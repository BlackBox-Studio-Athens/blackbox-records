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

### Requirement: Confirm writes interactively

The CLI SHALL require an explicit UAT or PRD target, display the write plan, and apply only with `--apply` and the exact environment name typed at an interactive prompt. Applying to PRD SHALL also require `--confirm-live`.

#### Scenario: Preview a write

- **WHEN** the operator runs a valid write command without `--apply`
- **THEN** the CLI displays the plan and makes zero remote requests

### Requirement: Set up Distro items and record stock counts

The CLI SHALL use the protected Staff APIs to upload artwork, set up new or existing Distro items, optionally publish completed setups, and record revision-checked physical stock counts.

#### Scenario: Create and publish a Distro item

- **WHEN** the operator confirms a Distro create with `--publish`
- **THEN** the CLI uploads the artwork, submits setup and requests publication after setup reports completion

#### Scenario: Replay a transient failure

- **WHEN** a replayable write returns a transient failure
- **THEN** its bounded retry uses the same body and request identity
- **AND** the CLI reports the operation identity and resulting status
