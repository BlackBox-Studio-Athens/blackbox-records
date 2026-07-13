## Context

The Artists page already has the complete `artistProfiles` list at build time. It always emits a search outlet; the app shell finds that outlet, lazily mounts the filter UI, and the outlet's CSS reserves space. The current roster has three entries.

Item 1.3 may extract the shared matcher for Distro, but it does not own Artists search availability. Implement 1.3 first as project sequencing; this change avoids its matcher and Distro surfaces.

## Goals / Non-Goals

**Goals:**

- Hide Artists search for zero through five profiles.
- Restore the existing search automatically at six profiles.
- Prevent hidden search UI, reserved space, and filter execution from existing below the threshold.

**Non-Goals:**

- Matcher, filter component, app-shell, snapshot, CSS, content, or schema changes.
- A configurable threshold, feature flag, shared visibility helper, or new test harness.

## Decisions

1. Guard the existing outlet directly with `artistProfiles.length > 5`. The same build-time collection drives both the roster and the decision, so no second count or flag can drift.
2. Use outlet absence as the capability boundary. Existing portal code already maps a missing outlet to a null target, which prevents the lazy filter mount; the outlet CSS also has no element on which to reserve space.
3. Add one source-contract assertion to the existing Artists roster layout test. It checks the five-to-six guard where the behavior is declared; `pnpm build` and Browser Use cover compilation and the current three-profile route without adding an Astro fixture harness.

## Risks / Trade-offs

- [A source-contract assertion is coupled to concise markup] → Keep the condition inline and change the assertion with the contract if the page is later restructured.
- [A future edit restores an unconditional outlet] → The focused threshold assertion fails.
