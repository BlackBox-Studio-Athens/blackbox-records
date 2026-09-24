# Spec Delta

## ADDED Requirements

### Requirement: Live price confirmation states the intended action

Live-price confirmation SHALL use direct action wording while retaining its existing required confirmation and operation scope.

#### Scenario: Fixed price

- **WHEN** initial price setup or a price change requires live confirmation
- **THEN** the checkbox reads Apply this price to the live shop beside the item and proposed price
- **AND** existing checkbox and server confirmation requirements remain effective.

#### Scenario: Pay-what-you-want settings

- **WHEN** that price form requires live confirmation
- **THEN** the checkbox reads Apply these pricing settings to the live shop beside proposed minimum, suggested, and maximum amounts
- **AND** confirmation covers only the price operation, not publication or checkout launch.
