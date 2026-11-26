## ADDED Requirements

### Requirement: Bandcamp lookup reports a closed outcome

The authenticated Bandcamp lookup SHALL answer with exactly one outcome: `resolved` with a recording, `not_found` with an optional suggested page, or `provider_blocked`. It SHALL first query Bandcamp's public search and accept a recording only when a result's page address equals the requested normalized page. The page read SHALL remain the fallback. Transport failures, timeouts and inconsistent metadata SHALL keep the existing private 422 problem.

#### Scenario: Search finds the exact page

- **WHEN** the search returns an album or track whose page address equals the requested page
- **THEN** the lookup resolves that recording without reading the page.

#### Scenario: The page does not exist

- **WHEN** the page read returns 404, or Bandcamp challenges the read and search finds the same address on exactly one related subdomain
- **THEN** the lookup answers `not_found`, with that related page as the suggestion when there is one
- **AND** Staff shows a Use action for the suggested page, which starts a new lookup for it.

#### Scenario: Bandcamp challenges the read and search has no answer

- **WHEN** search finds no exact or single related page and the page read is challenged
- **THEN** the lookup answers `provider_blocked` and logs the provider-challenge category
- **AND** Staff keeps the previous saved source and offers Open on Bandcamp, Retry, Revert and Clear.
