## MODIFIED Requirements

### Requirement: Shared smoke harness and evidence contract

The system SHALL keep smoke runners on the shared `.codex-artifacts/smoke/<environment>/<suite>/<run-id>/` contract with per-scenario `evidence.json` files and a run `summary.json`.

#### Scenario: Smoke runner evidence is standardized

- **WHEN** smoke scripts or workflows are updated
- **THEN** shared redaction, secret scanning, route probing, screenshot policy, and evidence-writing helpers are reused where practical
- **AND** static smoke and provider smoke remain separate suite boundaries
- **AND** focused unit tests cover the shared harness and runner contracts.

#### Scenario: Hosted smoke reports its result

- **WHEN** a smoke suite finishes inside GitHub Actions, including after a preflight blocker
- **THEN** the job summary shows the suite, overall status, each scenario's result and the evidence directory
- **AND** the summary contains only redacted text already written to smoke evidence
- **AND** outside GitHub Actions the runner writes no job summary.
