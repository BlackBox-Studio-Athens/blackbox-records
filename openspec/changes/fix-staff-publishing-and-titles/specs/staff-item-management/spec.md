## ADDED Requirements

### Requirement: Item publication always reaches a step result

Every item publication attempt SHALL end in a step result the member can act on. A failed attempt SHALL free its claim so that Retry resumes the same operation at once. Staff SHALL keep checking an item step only while a requested website publication can still finish without the page.

#### Scenario: Retry follows a failed attempt

- **WHEN** an item publication attempt fails after it claimed the operation
- **AND** the member selects Retry within the claim period
- **THEN** the same operation resumes from its last completed step
- **AND** no step is repeated.

#### Scenario: Nothing is advancing the operation

- **WHEN** the server answers pending for an operation that has not requested a website publication
- **THEN** the step shows as failed with Retry instead of a spinner
- **AND** a requested publication that is still pending keeps the bounded status checks.

### Requirement: A Distro draft that clears its group publishes

Publishing a Distro draft whose legacy `group` is cleared SHALL store the column's empty value, in both item publication and runtime publication. Drafts saved with `group: null` before this rule SHALL also publish without a new save.

#### Scenario: Member publishes an edited Distro item

- **WHEN** a member publishes a Distro draft that stores `group: null`
- **THEN** native publish succeeds and the live `group` column holds an empty value
- **AND** readers treat the empty value as no group.
