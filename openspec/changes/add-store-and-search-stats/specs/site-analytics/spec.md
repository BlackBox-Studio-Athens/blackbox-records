## ADDED Requirements

### Requirement: Staff can read store figures on Stats

The staff Stats page SHALL show, for the chosen 7-day or 30-day range and the same number of days before it, the paid total, paid orders, items sold and checkouts started, read from D1 through `GET /api/internal/store-stats`. Figures SHALL be described as paid, because refunds and withdrawals are not subtracted.

#### Scenario: Staff member compares store figures

- **WHEN** an authenticated staff member opens Stats and chooses a range
- **THEN** the page shows paid total, paid orders, items sold and checkouts started for that range
- **AND** shows how each compares with the period before it.

### Requirement: Staff can read Google search figures on Stats

The staff Stats page SHALL show Google Search clicks, impressions, average position and up to ten top search terms for the chosen range, read through `GET /api/internal/search-stats`. The Search Console credential SHALL stay in the Worker. Without configuration, the page SHALL show a not-set-up state instead of an error.

#### Scenario: Search Console is configured

- **WHEN** an authenticated staff member opens Stats on PRD
- **THEN** the page shows clicks, impressions, average position and top search terms
- **AND** no Google credential or token reaches the browser.

#### Scenario: Search Console is not configured

- **WHEN** the environment lacks the Search Console site or credential
- **THEN** the search read returns `not_configured`
- **AND** the page shows the search section as not set up while the other sections still load.

### Requirement: Stats relates visits to paid orders

The staff Stats page SHALL show paid orders per 100 visits for the chosen range when visits are above zero, labelled as an estimate.

#### Scenario: Range has visits and orders

- **WHEN** the range has visits above zero
- **THEN** the page shows paid orders per 100 visits, marked as an estimate.

### Requirement: Each Stats source fails on its own

Site visits, store figures and search figures SHALL load independently. A failed source SHALL show its own error with a reference and Retry, and SHALL keep its last successful figures, without hiding the other sources.

#### Scenario: Search read fails

- **WHEN** the search read returns an error
- **THEN** the search section shows the error, its reference and Retry
- **AND** visits and store figures remain visible.
