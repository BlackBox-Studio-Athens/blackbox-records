## Purpose

Define the staged local launch commands, their read-only rehearsal, recovery boundaries and prerequisites for retiring temporary production addresses.

## ADDED Requirements

### Requirement: Launch runs as staged local commands

The repository SHALL provide `pnpm launch:switch -- <cutover|finalize|rollback> [--dry-run]`. Dry-run SHALL perform only external reads, print planned writes, and retain a summary under `.codex-artifacts/launch/`. Every run SHALL retain step outcomes and SHALL NOT print credentials. Shell credentials SHALL override the ignored `.env.launch` file.

#### Scenario: Owner rehearses cutover

- **WHEN** the owner runs `pnpm launch:switch -- cutover --dry-run`
- **THEN** it verifies target reads, accepted PRD release identity, the live webhook and a fresh account-matched Chrome Dashboard policy review, prints planned changes and makes no external write.

### Requirement: Cutover verifies the apex and recovers critical failures

Cutover SHALL save apex and www DNS, redirect rules and Pages domain state before writing. It SHALL verify Home, TLS, policy pages, brand assets, canonical and Open Graph URLs, sitemap, robots, canonical redirects, controlled image fallback and the apex API. A failed DNS write response, TLS check or Home check SHALL trigger restoration of the saved apex DNS and verification of the Holding Page. Other failed checks SHALL be reported without automatic rollback.

#### Scenario: The DNS response is lost

- **WHEN** a DNS update may have been accepted but its response fails
- **THEN** cutover restores the recorded apex target, records the recovery result and exits failed.

#### Scenario: A policy check fails after Home succeeds

- **WHEN** Home and TLS pass but a policy page fails
- **THEN** the summary reports that failure and leaves the apex on the selected release for operator review.

### Requirement: Finalization retires technical addresses after verified stability

Finalize SHALL require an unrolled-back cutover at least 24 hours old, repeat release and apex checks, and refuse unresolved active Stripe artwork outside apex runtime media before any write. It SHALL create a Pages Bulk Redirect with status 301, subpaths, subdomains and path/query preservation, disable both PRD Workers' technical and preview addresses, and enable six-month HSTS including subdomains without preload. It SHALL verify each effect.

#### Scenario: Finalize rehearsal is premature

- **WHEN** finalize runs with or without dry-run before a real cutover or inside its first 24 hours
- **THEN** it refuses before any hosted request and states the missing cutover or earliest permitted time.

#### Scenario: Finalization succeeds

- **WHEN** the rollback window has elapsed and all prerequisites and checks pass
- **THEN** Pages addresses redirect to the apex, both PRD workers.dev addresses stop answering, apex and staff send the expected HSTS header, and the snapshot records finalization.

### Requirement: Rollback reverses only launch-owned routing changes

Rollback SHALL use the pinned account, zone and apex record identity, remove only the launch-owned redirect rule and list, and restore the recorded apex DNS. It SHALL refuse unexpected DNS drift and SHALL NOT restore unrelated rules, Worker settings or HSTS. Before completed finalization it SHALL confirm the Holding Page response.

#### Scenario: The apex has changed outside the launch

- **WHEN** rollback finds a different DNS record identity or an unrecognized target
- **THEN** it refuses and records the discrepancy without changing that record.
