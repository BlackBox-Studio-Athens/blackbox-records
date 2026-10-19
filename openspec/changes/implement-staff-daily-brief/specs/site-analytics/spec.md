## ADDED Requirements

### Requirement: Staff stats opens a mobile Daily brief

Stats SHALL open with the approved Daily brief and independently readable Visits, Store and Google Search sections. Each section SHALL open its detailed report and return to the brief with its date/filter state retained. Phone layouts SHALL support 320 CSS pixels and enlarged text without horizontal page overflow.

#### Scenario: Member investigates a report on a phone

- **WHEN** a member opens Store from the brief, filters it and returns
- **THEN** the brief retains the shared dates and Store filter context
- **AND** returning to Store restores those filters without applying them to Visits or Search.

### Requirement: Staff reporting has a concise date picker

The picker SHALL offer Today, Yesterday, 7 days, 30 days, 90 days, This month, 12 months and Custom. Start/end inputs SHALL exist only for Custom. Apply SHALL commit valid dates and Cancel SHALL preserve the existing selection. Dates SHALL be inclusive calendar dates with a maximum one-year selection and source timezones disclosed.

#### Scenario: Member selects a preset

- **WHEN** a member selects 30 days and applies
- **THEN** the report uses the rolling thirty-day period without rendering date inputs
- **AND** neither Last month nor Year to date is offered.

#### Scenario: Member edits custom dates

- **WHEN** Custom is selected
- **THEN** labelled start/end inputs render and reject missing, reversed, future or out-of-range dates inline
- **AND** selecting a preset removes those inputs and obsolete custom validation.

### Requirement: Real reports support relevant filters and drill-downs

Protected reports SHALL support Visits page/referrer/country/device, Store item/format and Search query/page/country/device filters. Charts SHALL support daily, weekly and monthly grouping with tap and keyboard inspection. Active filters SHALL remain visible and removable. Reports SHALL provide current figures and eligible preceding-period comparisons without exposing private order/customer records.

#### Scenario: Member filters Store sales

- **WHEN** a member selects an item or format
- **THEN** D1 paid-order and line facts determine the totals and daily series
- **AND** multi-line orders are counted once, line quantities are not duplicated and paid totals are explicitly distinguished from filtered merchandise amounts.

#### Scenario: Member inspects a chart or ranked row

- **WHEN** a member changes the metric/grouping or activates a ranked row
- **THEN** values and the breakdown reflect the current report filters
- **AND** keyboard and touch inspection work without requiring hover.

### Requirement: Coverage and source failure remain honest

Reports SHALL distinguish zero observations from unavailable history, unconfigured providers and delayed Search data. Access failures SHALL clear protected data. Refresh failures SHALL retain the matching last successful snapshot with its time and Retry. Comparisons SHALL be unavailable when their required source coverage is incomplete.

#### Scenario: Search has not reported recent dates

- **WHEN** the selected dates include recent days that Google has not reported or finalized
- **THEN** missing daily values are unavailable rather than zero
- **AND** the interface identifies the latest available date and Pacific reporting timezone.

### Requirement: Visits history preserves filter dimensions within Free limits

The existing schedule SHALL retain bounded daily aggregate Visits facts, including their joint page/referrer/country/device dimensions. Retention SHALL be isolated by provider/site/environment, idempotent and subject to a documented size and operation budget. Report reads SHALL not write history. Expired or incomplete provider history SHALL not be invented.

#### Scenario: Daily aggregate collection succeeds

- **WHEN** the configured scheduled collection reads a complete bounded day
- **THEN** its aggregate facts replace that site's same-day snapshot atomically
- **AND** repeated execution does not duplicate figures or affect commerce processing.

#### Scenario: Collection exceeds its budget or fails

- **WHEN** the provider fails or its aggregate exceeds the configured completeness/size bound
- **THEN** the prior complete snapshot remains intact and a safe failure is logged
- **AND** report reads continue with explicit available coverage.
