# Decouple release gates from content

## Why

Release BlackBox run 36944753940 failed because release gates assumed specific editorial content. PRD editors gave the hard-coded Disintegration release a gallery, so the image-markup check lost its single-cover classes. The UAT static smoke assumed every sampled detail page renders an image, and the PRD Holding Page threw during every hosted site build when its contact content was missing. The same run reported a false test failure: `--nxBail` killed a test that was still running.

## What Changes

- Validation gives each run a unique id and omits `--nxBail` in CI, so killed tasks are not reported as failures.
- The image-markup check selects detail pages through route patterns and uses the first built page that renders the checked classes. A detail page renders either a single cover or a gallery, so those checks are alternatives: each kind that renders is checked, and the pattern fails only when no page renders either.
- The UAT static smoke samples media from the first published page per section that renders a content image.
- Hosted site builds render the PRD Holding Page without an action whose content is missing or invalid, with a build warning. The holding artifact check still fails when either action is missing, so the holding artifact cannot be published without both.
- Remaining: the UAT provider smoke still pins two Store items and reads expected values from repository content (see tasks).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `prd-holding-page`: missing contact content degrades the site build and fails the holding artifact check, instead of failing every build.

## Impact

Validation tooling, `apps/web` image-markup and holding-page build, the UAT static smoke and the PRD Holding Page. No dependency, provider, data or hosted-state change.
