## ADDED Requirements

### Requirement: Local Durable Object storage fits the Windows path limit

Local Worker names SHALL keep every Local Durable Object storage file, including its SQLite `-wal` and `-shm` files, below 256 characters for checkout paths of up to 104 characters. On Windows, a Local Worker launcher SHALL refuse to start a Worker whose Durable Object storage path would reach 256 characters. Hosted Worker names SHALL NOT change for Local storage reasons.

#### Scenario: Maintainer runs pnpm dev from a worktree

- **GIVEN** a Windows checkout path of up to 104 characters, such as a Claude Code worktree
- **WHEN** the maintainer runs `pnpm dev`
- **THEN** Worker commerce reads, staff CMS requests and public pages succeed.

#### Scenario: Checkout path is too long

- **GIVEN** a Windows checkout where a Local Durable Object storage path would reach 256 characters
- **WHEN** a Local Worker launcher starts
- **THEN** it stops before starting the Worker
- **AND** it names the Durable Object class, the required path length and how many characters shorter the checkout path must be.
