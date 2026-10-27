## ADDED Requirements

### Requirement: Stats-led Overview

Overview SHALL open with headline figures for Visits, Paid orders, Paid total and Google clicks for the selected period. Each figure SHALL state its signed change against the previous period in text and link to its Stats source. Overview SHALL show the read time and each source's day and delay rules.

#### Scenario: Member compares the period

- **WHEN** a member selects 30 days on Overview
- **THEN** each figure shows the 30-day value and its signed change against the 30 days before, in text.

### Requirement: Overview to-do counts

Overview SHALL show counted to-do items for paid orders to ship, orders waiting for stock and saved changes not on the website, each linking to its filtered destination. Zero, not connected and failed reads SHALL be visibly different. Each source and to-do read SHALL load and fail independently.

#### Scenario: Member opens Overview with figures available

- **WHEN** a member opens Overview and the Stats, Orders and Review reads succeed
- **THEN** the four figures, their previous-period changes, the read time and the non-zero to-do counts are visible without opening another area
- **AND** each figure and count opens the matching Stats source or filtered list.

#### Scenario: A source is not connected or fails

- **WHEN** Visits is not connected and the Orders read fails
- **THEN** Visits states that it is not connected, the to-do area shows its own error and Retry, and the remaining figures stay usable
- **AND** no missing value is shown as zero.

### Requirement: Shared staff page header

Every staff area SHALL use one page-header pattern with the same title size, left edge and placement of subtitle and actions. Top-level areas SHALL NOT repeat a Back to Overview link. Below 1440 px the shell header SHALL name the current area.

#### Scenario: Member moves between areas

- **WHEN** a member opens Overview, Catalog, Website, Images, Stock, Orders and Stats in turn at 1440 px and at 390 px
- **THEN** each page title has the same size and left edge, and the phone header names the current area.
