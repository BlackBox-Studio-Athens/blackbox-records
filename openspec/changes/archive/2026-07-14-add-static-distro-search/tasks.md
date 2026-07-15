## 1. Shared matching seam

- [x] 1.1 Extract the existing exact-first Fuse matcher into a neutral pure helper that accepts caller-supplied search text while preserving Artists behavior.
- [x] 1.2 Add matcher tests for Artists titles and Distro title, `artist_or_label`, exact group, and format text, including exact-before-fuzzy and empty-query cases.

## 2. Distro search UI

- [x] 2.1 Emit the minimal Distro card/chunk/group hooks and add a Distro-specific control reusing the Artists input, count, clear, empty-state, and accessibility pattern.
- [x] 2.2 Filter existing DOM nodes in place, hide empty chunks/groups, preserve ordering, remove only search-authored hidden state on clear, and leave the DOM untouched when mounting fails.

## 3. Shell lifecycle

- [x] 3.1 Add the Distro portal placeholder and route-only lazy mount, disconnect it on route exit, and clear it from shell snapshots without introducing a portal registry.
- [x] 3.2 Add focused DOM, portal-target, snapshot, route-cleanup, result-count, and empty-state regression tests.

## 4. Verification

- [x] 4.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; verify search, clear, no-results, route exit/re-entry, keyboard use, and no-JavaScript fallback with Browser Use.
- [x] 4.2 Re-run the fixed Distro load and mobile-stress interaction profiles; retain LCP ≤2.5 seconds, CLS ≤0.1, and no search task ≥50 milliseconds, diagnosing any failure before proposing remediation.
