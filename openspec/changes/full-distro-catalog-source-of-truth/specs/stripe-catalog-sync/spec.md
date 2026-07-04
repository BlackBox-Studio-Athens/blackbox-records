## ADDED Requirements

### Requirement: Distro Inventory Source projects desired catalog entries

The system SHALL project current distro catalog entries from the Distro Inventory Source plus approved Current-Site Extras.

#### Scenario: Desired catalog state is generated

- **GIVEN** the Distro Inventory Source and approved Current-Site Extras are available to catalog artifact generation
- **WHEN** generated Desired Catalog State is built for distro Store Items
- **THEN** every non-duplicate source row and every approved Current-Site Extra appears as a desired distro catalog entry
- **AND** unapproved existing distro content absent from the Distro Inventory Source and approved Current-Site Extras is absent from generated desired catalog entries and checkout eligibility.

#### Scenario: Duplicate source row is ignored

- **GIVEN** the source includes `Living Under Drones - Knot On Knot` and duplicate row `Living Under Drones - Knot On Knot?`
- **WHEN** catalog artifacts are generated
- **THEN** exactly one desired Store Item is generated for `Living Under Drones - Knot On Knot`
- **AND** no second question-mark Store Item or variant is generated.

#### Scenario: Current-site extras are retained

- **GIVEN** `S/T - Spinners` and `Three Way Plane - Wreckquiem` are absent from the Distro Inventory Source
- **WHEN** catalog artifacts are generated
- **THEN** both remain desired distro catalog entries
- **AND** their prices use Vinyl 12-inch blank-price defaults unless a later OpenSpec change supplies explicit prices.

### Requirement: Distro desired prices support fixed and custom amounts

The system SHALL represent desired distro catalog prices as fixed EUR prices or pay-what-you-want EUR prices.

#### Scenario: Numeric source price is projected

- **GIVEN** a Distro Inventory Source row has a numeric price
- **WHEN** desired catalog price data is generated
- **THEN** the desired price is fixed
- **AND** the amount minor is the numeric price multiplied by 100
- **AND** the currency is `EUR`.

#### Scenario: ΕΣ source price is projected

- **GIVEN** a Distro Inventory Source row has source price `ΕΣ`
- **WHEN** desired catalog price data is generated
- **THEN** the desired price is pay-what-you-want
- **AND** the minimum amount minor is `100`
- **AND** the preset amount minor is `500`
- **AND** the maximum amount minor is `10000`
- **AND** the currency is `EUR`.

#### Scenario: Blank source price is projected

- **GIVEN** a Distro Inventory Source row has no source price
- **WHEN** desired catalog price data is generated
- **THEN** the desired price is fixed using the item type default
- **AND** Vinyl 12-inch and Vinyl 10-inch default to `2000`
- **AND** Vinyl 7-inch defaults to `1500`
- **AND** Tape defaults to `500`
- **AND** CD defaults to `1000`
- **AND** the currency is `EUR`.

### Requirement: Stripe catalog sync handles custom-amount Prices

The system SHALL reconcile fixed desired prices to Stripe `unit_amount` Prices and pay-what-you-want desired prices to Stripe `custom_unit_amount` Prices.

#### Scenario: Fixed Stripe Price is created

- **GIVEN** a desired catalog entry has a fixed price
- **WHEN** catalog verification runs with apply enabled
- **THEN** Stripe has an active Price whose `unit_amount` and currency match the desired fixed price
- **AND** the Price is tied to the active Product through BlackBox catalog identity metadata or lookup key.

#### Scenario: Pay-what-you-want Stripe Price is created

- **GIVEN** a desired catalog entry has a pay-what-you-want price
- **WHEN** catalog verification runs with apply enabled
- **THEN** Stripe has an active Price whose `custom_unit_amount` minimum, preset, maximum, and currency match the desired pay-what-you-want price
- **AND** the Price is tied to the active Product through BlackBox catalog identity metadata or lookup key.

#### Scenario: Price kind changes

- **GIVEN** an existing active Stripe Price for a Store Item uses the wrong price kind for the desired entry
- **WHEN** catalog verification runs
- **THEN** the mismatch is reported as Price Authority drift
- **AND** apply creates or activates the correct replacement Price instead of mutating immutable Stripe Price amount fields.

### Requirement: Stripe cleanup limits are explicit

The system SHALL treat clean-slate catalog work as archive-or-rebuild unless a fresh Stripe environment is configured.

#### Scenario: UAT clean slate is requested

- **GIVEN** operators request a clean UAT catalog without archived items in the Dashboard
- **WHEN** implementation or runbook guidance is produced
- **THEN** it states that existing Stripe Price history cannot be guaranteed empty by automation alone
- **AND** it allows manual deletion only where Stripe permits deletion
- **AND** it identifies a fresh Stripe test environment as the only guaranteed empty-history option.

#### Scenario: PRD clean slate is requested

- **GIVEN** operators request a clean PRD catalog without archived items in the Dashboard
- **WHEN** implementation or runbook guidance is produced
- **THEN** it rejects PRD reset as an option
- **AND** it requires PRD-open approval before live provider mutation
- **AND** it identifies a fresh live Stripe environment as the only guaranteed empty-history option.
