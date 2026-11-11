## Context

The evidence is in `proposal.md`. The owner chose a journey-only gate and deletion of the other browser specs over keeping them as a non-blocking job (choice recorded on 11 November 2026).

## Decisions

- **Delete, not quarantine.** A non-blocking job that is often red is ignored. The deleted checks stay in git history if a design area needs one back during its own change.
- **Selection rule.** A test stays only if a broken shopper or staff journey would fail it. Tests of geometry, typography, motion, timing budgets or exact catalog content are removed, even inside kept specs.
- **One job, three projects.** Chromium desktop, Chromium phone and WebKit phone run in one `e2e` job against the built preview. One retry stays, so a network hiccup is reported as flaky instead of failing the release.
- **Chromium staff previews.** The staff journey is the publication path. One engine proves it; the local `--firefox` option remains for focused checks.

## Risks

- CI no longer catches a Firefox-only or layout regression. Mitigation: design changes keep their visual review, and the UAT static smoke still runs against the deployed site.
