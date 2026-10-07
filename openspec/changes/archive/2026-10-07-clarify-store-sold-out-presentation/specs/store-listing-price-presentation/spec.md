## ADDED Requirements

### Requirement: Listing availability follows the existing activation lifecycle

Listing price and availability SHALL consume the same single fresh request per collection activation and SHALL reset together when cached content is restored. Unknown availability SHALL never be inferred as sold out.

#### Scenario: Fresh or cached collection activation

- **WHEN** a collection is loaded directly, through shell navigation, or restored from history
- **THEN** one fresh projection request updates its price and status together
- **AND** superseded requests cannot update the current collection.

#### Scenario: Older or failed response

- **WHEN** a response omits availabilityState, omits an item, or fails
- **THEN** any stale availability label is removed and neutral unknown feedback is shown
- **AND** no Sold Out state is inferred from missing data or a failed price read.
