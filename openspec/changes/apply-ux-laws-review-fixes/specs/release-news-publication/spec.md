# Spec Delta

## ADDED Requirements

### Requirement: News articles read at a comfortable measure

On wide screens, a News article's card SHALL be no wider than 46rem, its body text SHALL be 16px and its running text SHALL stop at 34rem, so lines stay near 65 to 75 characters. The card SHALL stay aligned with the page frame, and phones SHALL keep their current full-width layout.

#### Scenario: Visitor reads an article on desktop

- **WHEN** a News article renders at 1280px
- **THEN** its body paragraphs measure between 60 and 75 characters per line at 16px
- **AND** the cover and title sit in the same 46rem card.

#### Scenario: Visitor reads an article on a phone

- **WHEN** the article renders at 390px
- **THEN** the card fills the page frame as before.

### Requirement: News addresses are descriptive and stable

A published News article SHALL NOT use placeholder text such as `lorem-ipsum` in its address. When an article's address changes, the retired address SHALL permanently redirect to the new one, and internal links and the sitemap SHALL use the new address.

#### Scenario: Visitor follows the retired Caregivers address

- **WHEN** a visitor or crawler requests `/news/lorem-ipsum/`
- **THEN** the response is a permanent redirect to `/news/caregivers/`
- **AND** `/news/caregivers/` serves the Caregivers article with a self-referencing canonical URL.

#### Scenario: Site links to the article

- **WHEN** the News list, Home news cards or sitemap link to the Caregivers article
- **THEN** they use `/news/caregivers/`.
