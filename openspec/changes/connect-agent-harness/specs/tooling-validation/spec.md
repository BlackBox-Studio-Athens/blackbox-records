## ADDED Requirements

### Requirement: Agent instructions route only project-specific context

The repository AGENTS.md SHALL remain at most 120 lines and route tasks to maintained Blackbox-specific guidance. It SHALL inherit global agent policy without duplicating tool, graph, browser, style or approval workflows. OpenSpec SHALL remain the sole repository planning and task-state workflow.

#### Scenario: An agent starts a backend task

- **WHEN** the task concerns backend behavior
- **THEN** the entry point identifies backend and module-boundary references without requiring unrelated frontend startup reads.

### Requirement: Maintained agent guidance is checked mechanically

The guidance checker SHALL validate local Markdown link targets and root pnpm script names in AGENTS.md, docs/agent-workflow.md and docs/agent-reference.md without executing the documented commands or crawling linked documents. Missing documents, invalid package metadata and broken references SHALL fail with actionable diagnostics. Local completion and full CI checks SHALL run this check.

#### Scenario: A documented root script is renamed

- **WHEN** maintained guidance still names the removed script
- **THEN** guidance validation fails and identifies the document and correction needed.

#### Scenario: Guidance contains a broken relative link

- **WHEN** a local link target does not exist
- **THEN** guidance validation fails without fetching external URLs.

### Requirement: Boundary policy changes receive local boundary validation

Local validation SHALL treat the OpenSpec module-boundary manifest as executable configuration, and SHALL select check:boundaries for changes to that manifest or its enforcement configuration and scripts. Ordinary OpenSpec prose SHALL remain eligible for documentation-only validation.

#### Scenario: Only the module-boundary manifest changes

- **WHEN** the changed file is openspec/specs/module-boundaries/module-boundaries.manifest.json
- **THEN** local validation includes check:boundaries and repository contract coverage instead of formatting alone.

### Requirement: Task acceptance links observed behavior to source evidence

Each substantive change SHALL retain its acceptance criteria, decisions, remaining work and validation evidence in its existing OpenSpec change. Validation evidence SHALL identify the source SHA and fingerprint, Product Environment, checks and outcomes, failures or unobserved behavior, and artifact locations. Shell/player, CMS/publication, commerce/stock and release tasks SHALL use their existing domain acceptance checks. A local passed summary SHALL NOT establish browser, provider or release acceptance on its own.

#### Scenario: Tooling changes need no product browser acceptance

- **WHEN** a change affects only repository tooling and guidance
- **THEN** the completion record explains why product browser checks do not apply and records focused and final local validation separately.

#### Scenario: A browser or provider check has not run

- **WHEN** required behavior has not been observed
- **THEN** the record identifies it as unverified rather than inferring success from a unit or formatting result.
