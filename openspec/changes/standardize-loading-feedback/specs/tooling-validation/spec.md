## ADDED Requirements

### Requirement: Loading feedback has focused automated coverage

The validation workflow SHALL include focused automated coverage for loading feedback state transitions introduced or changed by this work.

#### Scenario: Loading component behavior is tested

- **WHEN** a loading button, loading status block, checkout readiness state, checkout return pending state, shell overlay state, player loading state, or stock pending state is changed
- **THEN** focused tests assert the visible label, disabled or busy state, accessibility attributes, and resolved ready/error state
- **AND** tests use delayed or mocked async dependencies where needed to hold pending states deterministically.

### Requirement: Rendered loading feedback is browser-validated

The validation workflow SHALL use Browser Use for representative rendered loading states whose acceptance depends on layout, timing, focus, or motion.

#### Scenario: Loading UI changes are accepted

- **GIVEN** implementation changes visible loading feedback
- **WHEN** validation is run
- **THEN** Browser Use verifies representative local routes for store item purchase readiness, checkout start or return status, shell navigation or overlay loading, player loading, and stock operation pending states where local access permits
- **AND** validation notes distinguish unit-test proof from rendered Browser Use proof.

### Requirement: Standard repository gates still apply

The validation workflow SHALL run standard repository gates after behavior-changing loading feedback implementation.

#### Scenario: Loading feedback implementation is complete

- **WHEN** code changes alter loading feedback behavior
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass before completion is claimed
- **AND** `openspec validate standardize-loading-feedback --type change --strict` and `openspec validate --all --strict` pass before the change is treated as ready.
