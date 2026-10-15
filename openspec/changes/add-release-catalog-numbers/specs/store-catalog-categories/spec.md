## ADDED Requirements

### Requirement: Store All begins with catalog-ordered BlackBox Releases

Store All SHALL list BlackBox Release Store Items first in ascending numeric catalog order, then all Distro Store Items in the existing artist order. It SHALL retain each item once, render no new catalog-number text, and preserve other category ordering.

#### Scenario: Mixed Store All is ordered

- **WHEN** Caregivers BBR#001, Disintegration BBR#002 and Anarchotribal BBR#003 are present with Distro items
- **THEN** those Releases appear first in that order
- **AND** Distro items follow in the existing artist/title/slug order regardless of input order.
