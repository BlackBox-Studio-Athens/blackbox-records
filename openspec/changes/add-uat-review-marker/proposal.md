## Why

Non-technical colleagues treat the UAT link as the public website because its visible experience closely matches the intended launch site. UAT needs a persistent, calm identity cue that makes review status and test payments unmistakable without changing the reviewed design into a warning screen.

## What Changes

- Add the exact visible marker `Review site · test payments` directly beneath the BlackBox wordmark in the persistent header.
- Enable the marker only in the GitHub Pages UAT build through an explicit private build-time flag; keep Local and every PRD artifact unmarked by default.
- Keep the marker non-interactive, always visible across shell-managed navigation, direct page loads, overlays, cart/player states, desktop navigation, and mobile navigation.
- Fit the full wording at 320px without increasing the current header height, obscuring controls, or introducing a banner, pill, animation, dismissal state, or new design system.
- Extend the existing environment-model verifier and hosted UAT smoke so configuration drift or a missing marker fails validation.

## Capabilities

### New Capabilities

- `uat-review-marker`: Defines the marker's exact public copy, header placement, responsive/accessibility behavior, persistence, and environment visibility boundary.

### Modified Capabilities

- `static-site-and-deployment`: Makes the marker an explicit UAT-only build and hosted-deployment contract while prohibiting it from Local and PRD artifacts.
- `project-language`: Establishes `Review Site Marker` as the canonical maintainer term and separates its public wording from Product Environment vocabulary.

## Impact

- Persistent header markup and existing global header styles under `apps/web`.
- One private Astro build-time environment declaration and the UAT build job in `.github/workflows/pages.yml`.
- Existing environment-model verification and UAT static smoke coverage.
- Deployment/review documentation and affected OpenSpec baselines after implementation.
- No checkout gate, runtime API, CMS field, local-storage state, new component abstraction, dependency, UAT URL change, or PRD behavior change.
