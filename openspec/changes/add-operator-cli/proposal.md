# Proposal

## Why

Staff operators need to set up Distro items and record physical stock counts from a local terminal. The CLI uses the same authenticated operations as the Staff workspace.

## What Changes

- Add `pnpm ops` commands for Access login, identity verification, Distro setup and publication, and stock counts.
- Show each write plan and require interactive confirmation. PRD writes also require a live confirmation flag.
- Verify the CLI with mocked cloudflared and HTTP requests.

## Capabilities

### New Capabilities

- `operator-cli` covers safe terminal access to existing hosted Staff operations.

### Modified Capabilities

None.

## Impact

The root workspace owns the local TypeScript command and focused tests. The CLI uses existing Staff, EmDash and commerce HTTP contracts.
