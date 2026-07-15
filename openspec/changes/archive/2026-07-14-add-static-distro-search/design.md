## Context

Distro is a static Astro route with 79 server-rendered records, five populated groups, and 16 six-card chunks. Artists already has an accessible React search control, exact-substring-first Fuse.js matcher, lazy app-shell portal, and route cleanup. Distro's searchable values already exist in content or rendered markup.

The measured Distro baseline is within current performance budgets: desktop/mobile LCP is 0.136/1.484 seconds and CLS is 0.00024/0.02103, with no traversal long tasks.

## Goals / Non-Goals

**Goals:**

- Reuse the Artists control and exact-first search behavior.
- Search Distro title, `artist_or_label`, exact group, and format.
- Preserve category/item order, progressive enhancement, shell lifecycle, and performance budgets.

**Non-Goals:**

- A search API, remote index, new dependency, pagination, virtualization, or URL-persisted query.
- A generic filtering framework or shared page-specific DOM controller.

## Decisions

1. Extract only the pure exact-first matcher into a neutral module and let callers supply searchable text. Artists supplies title; Distro supplies one normalized string containing title, `artist_or_label`, exact group, and format. Keep Fuse.js and its current exact-match preference.
2. Keep React controls page-specific. The Distro control reads the server-rendered cards, applies the shared matcher, toggles unmatched cards, then toggles chunks and groups with no visible cards. It never reorders or recreates catalog nodes. Clearing the query restores every node and the original count.
3. Add a Distro portal placeholder beside the intro. The app shell lazily imports the Distro control only when that placeholder exists, disconnects it on route exit, and clears the placeholder when caching a page snapshot. This mirrors Artists without creating a portal registry.
4. Search adds no pre-hydration hidden state. Before a successful mount and active query, it leaves the baseline server-rendered DOM untouched.
5. Verify the final route with the existing mobile-stress profile. It must retain the Distro LCP/CLS budgets and add no task of 50 milliseconds or longer. Select any remediation only after a measured failure identifies its cause.

## Risks / Trade-offs

- [Hiding descendants can leave empty layout containers] → Derive chunk and group visibility from visible cards after every query and clear.
- [Cached shell HTML can retain hydrated controls] → Strip the Distro portal contents during snapshot creation.
- [Fuzzy results can surprise visitors] → Return all case-insensitive substring matches first and use fuzzy fallback only when none exist.
