## MODIFIED Requirements

### Requirement: Above-The-Fold Image Priority

The system SHALL prioritize actual first-viewport and LCP images without eager-loading every image on a route or assigning competing high-priority candidates.

#### Scenario: Route has a single visual hero or lead media

- **WHEN** a direct route has one primary first-viewport Content Image such as the homepage hero, About hero, first Services feature, latest release feature, store detail media, release detail media, artist detail media, or news lead image
- **THEN** that image uses explicit Astro priority behavior or equivalent eager loading and high fetch priority appropriate for LCP media
- **AND** its request is discoverable in initial HTML
- **AND** no second content image on the same direct page receives high fetch priority without measured evidence.

#### Scenario: Route starts with a product or catalog grid

- **WHEN** the first visible viewport contains a product, distro, release, artist, news, or store card grid
- **THEN** only the expected leading visible card set uses browser eager loading
- **AND** at most the expected LCP card receives high fetch priority
- **AND** below-fold card images remain lazy-loaded.

#### Scenario: Detail fragment is loaded after user navigation

- **WHEN** a detail or overlay fragment is loaded after an in-site user action
- **THEN** supporting images remain normal or lazy priority unless the same component is direct-loaded as first-viewport route media
- **AND** the component's priority input distinguishes those two contexts without duplicating content markup.

## ADDED Requirements

### Requirement: Secondary route lead media matches its direct-load role

The system SHALL give About, Services, and Artists route-specific image discovery, candidate, and source treatment that meets their load budget without making later media eager.

#### Scenario: About direct route loads

- **WHEN** About renders its `InternalPageHero` as direct-load first-viewport media
- **THEN** the hero is eager and high priority
- **AND** its responsive width ladder includes a 1200w candidate between the existing 1080w and 1440w candidates
- **AND** overlay or non-first-viewport uses of the shared hero component do not inherit that priority automatically.

#### Scenario: Services direct route loads

- **WHEN** the first Services feature image is the expected LCP candidate
- **THEN** that image is eager and high priority
- **AND** subsequent Services feature images remain lazy-loaded with normal priority
- **AND** all feature images retain stable geometry, alt text, `srcset`, and route-appropriate `sizes`.

#### Scenario: Artists direct route loads

- **WHEN** the Artists roster grid enters the first viewport
- **THEN** only the expected visible leading portraits are eager
- **AND** the expected LCP portrait is high priority
- **AND** later portraits remain lazy-loaded
- **AND** the selected 480w Ouranopithecus candidate is no more than 100 KiB after existing-pipeline source remediation or candidate tuning
- **AND** its documented 3:4 crop, subject placement, detail, and alt text have no material visual regression.

#### Scenario: Secondary route image work is accepted

- **WHEN** About, Services, or Artists image priority or source assets change
- **THEN** five-run desktop and declared mobile-stress profiles meet the route LCP and CLS gates
- **AND** Browser Use verifies mobile and desktop crop, hierarchy, loading stability, and no duplicate high-priority content-image request.
