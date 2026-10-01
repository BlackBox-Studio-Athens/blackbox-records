## ADDED Requirements

### Requirement: Home is structural in the main menu

The navigation content schema SHALL reject a Home (`/`) entry shown in the main menu, because the public site always lists Home first in the phone Menu and links it from the logo. A Home entry MAY appear in the footer. The staff editor SHALL name the main-menu checkbox for both surfaces it controls.

#### Scenario: Staff adds Home to the main menu

- **WHEN** a Home navigation entry is saved or published with Show in the main menu selected
- **THEN** validation reports, beside that checkbox, that Home is always in the main menu
- **AND** the public site keeps exactly one Home link in the Menu.

#### Scenario: Staff edits a section entry

- **WHEN** staff edit any other navigation entry
- **THEN** the checkbox reads "Show in the main menu (top of the site and the phone Menu)"
- **AND** selecting it lists the page at the top of the site on computers and in the phone Menu.
