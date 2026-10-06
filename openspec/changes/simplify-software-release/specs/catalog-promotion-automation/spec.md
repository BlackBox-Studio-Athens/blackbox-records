## MODIFIED Requirements

### Requirement: One release workflow gates deployment

The canonical software release workflow SHALL own application verification, compatible migrations, UAT Worker/public deployment, and hosted release identity verification. Content Publication SHALL be a runtime operation serialized by the CMS publication journal and its accepted-pointer activation, not a release workflow trigger, and SHALL perform no provider catalog apply or backend deployment.

#### Scenario: A software candidate reaches UAT

- **WHEN** repository gates and compatible migrations pass
- **THEN** code deploys and hosted checks verify runtime catalog compatibility
- **AND** no routine full-catalog Stripe mutation or stock seed occurs.

#### Scenario: One existing item needs catalog repair

- **WHEN** a read-only check identifies an affected binding
- **THEN** targeted operational repair remains separate from software release
- **AND** a paused or sold-out item is not automatically reactivated.

#### Scenario: A newer release arrives

- **WHEN** another software deployment is changing the same target
- **THEN** the current mutation finishes before the next checks its deployment preconditions.

#### Scenario: Invalid release item

- **WHEN** an existing item has catalog drift but the software candidate is schema-compatible
- **THEN** that item stays unavailable for checkout and its targeted repair remains separate
- **AND** unrelated software deployment does not run a full-catalog apply or reset to repair it.

#### Scenario: PRD code is promoted without live catalog confirmation

- **WHEN** an accepted code candidate is promoted without batch catalog authorization
- **THEN** deployment performs no live Product or Price mutation, because the release workflow carries no live catalog job
- **AND** unready items remain unavailable without preventing a compatible disabled-PRD deployment.

### Requirement: Live catalog preparation requires one-run authorization

Live batch catalog migration or repair SHALL require false-by-default, one-run confirmation carried by a dedicated reviewed workflow or command, never by the routine release workflow. Routine staff price and Item Setup commands SHALL require explicit item-scoped confirmation and authorization. Neither approval SHALL enable shopper checkout.

The executable home of this confirmation is the apply workflow of the `migrate-stripe-to-blackboxrecords` change; the cutover jobs and inputs that carried it before are removed.

#### Scenario: Confirmation is absent

- **WHEN** a code build, content publication, import dry-run, or readiness check runs
- **THEN** it performs no live Stripe or commerce-data mutation by implication.

#### Scenario: Confirmed bounded operation runs

- **WHEN** its environment, item or reviewed batch, and intended values are explicitly confirmed
- **THEN** only that operation may perform its approved writes
- **AND** PRD_LAUNCH_APPROVED and native_checkout_enabled remain independent.
