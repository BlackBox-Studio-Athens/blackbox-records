# Proposal

## Why

Staff operators need to set up Distro items and record physical stock counts from a local terminal. The CLI uses the same authenticated operations as the Staff workspace.

## What Changes

- Add `pnpm ops` commands for Access login, identity verification, Distro setup and publication, and stock counts.
- Use Commander to validate command arguments and generate command help.
- Show each write plan and require `--apply` plus typed confirmation or explicit `--yes`. PRD writes also require the live confirmation flag.
- Let Distro create and retry accept an omitted legacy `group` when EmDash returns the default empty value.
- Verify the CLI with mocked cloudflared and HTTP requests.

## Capabilities

### New Capabilities

- `operator-cli` covers safe terminal access to existing hosted Staff operations.

### Modified Capabilities

None.

## Impact

The root workspace owns the local TypeScript command, pinned Commander dependency and focused tests. The backend CMS source gateway owns Distro create identity checks. The CLI uses existing Staff, EmDash and commerce HTTP contracts.
