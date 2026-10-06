## Implementation

- [x] 1. Upgrade EmDash 1.1.0 and rebase core/admin integration patches.
- [x] 2. Extend upgrade migration smoke for current and retained older histories.
- [x] 3. Implement focused Stock and explicitly closable full-width preview.
- [x] 4. Implement validated batch uploads and native upload integration.
- [x] 5. Extend editorial image/video contracts and all preview/public readers.
- [x] 6. Retain publication baseline/completion evidence and add detail/calendar APIs.
- [x] 7. Implement richer history and responsive read-only calendar.
- [x] 8. Update operational documentation and rollout reader-before-writer ordering.
- [x] 8a. Reproduce and fix Firefox scrolling after release backdrop dismissal; verify repeated dismissals and player continuity.
- [x] 8b. Prevent unversioned Local renderer builds from reusing HTML with obsolete asset hashes; verify current public and preview hydration.
- [x] 8c. Preserve automatic original fallback on Images Free exhaustion and cover social-image crawlers without enabling paid services.

## Acceptance

- [x] 9. Pass focused regression tests, frozen installation, builds, strict OpenSpec and final pnpm validate.
- [x] 10. Complete disposable Local migration and desktop/phone browser acceptance; record source-bound evidence.
- [ ] 11. Complete authorized UAT verification with backups and Free-tier allowance evidence. Candidate `02ec9984` passed; the consolidated follow-ups remain Local because the user explicitly prohibited a UAT push.
- [ ] 12. Complete separately approved PRD promotion. Held at the user's request; hand over consolidated local main without pushing.
