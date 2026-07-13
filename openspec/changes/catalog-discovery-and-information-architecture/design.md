## Context

The repository already groups Distro entries, derives Store entries from catalog data, exposes Releases as editorial content, and has Artist search backed by Fuse.js. Existing OpenSpec work covers the full Distro catalog source of truth and runtime performance.

Rough Trade's current site uses broad browse categories and repeated mixed-format product rails; no literal featured-vinyl rail was observed. This is an information-architecture reference only, not a visual or content copy target.

## Goals / Non-Goals

**Goals:**

- Research each numbered discovery, catalog, music-link, loading, and browse question before implementation.
- Promote each approved item into one native child change.
- Keep remaining questions visible without pre-owning their implementation requirements.

**Non-Goals:**

- Immediate implementation in this umbrella.
- A Rough Trade clone, scraper, new dependency, CMS redesign, or commerce migration by assumption.
- Provider-link changes without manual verification.

## Decisions

- Keep this change as the research index; child changes own normative implementation behavior.
- Reuse existing content, catalog, player, browser, and CSS seams before adding abstractions.
- Prefer static/client-side discovery and native scrolling unless measured scale or performance proves them insufficient.

### Promoted native changes

- 1.1: [`organize-distro-format-discovery`](../organize-distro-format-discovery/proposal.md)
- 1.2: [`canonicalize-store-item-ownership`](../canonicalize-store-item-ownership/proposal.md)
- 1.3: [`add-static-distro-search`](../add-static-distro-search/proposal.md)
- 2.1: [`harden-music-provider-data`](../harden-music-provider-data/proposal.md)
- 2.2: [`define-music-link-audit`](../define-music-link-audit/proposal.md)
- 2.3: [`run-first-music-link-audit`](../run-first-music-link-audit/proposal.md)
- 3.1: [`gate-artists-search-by-roster-size`](../gate-artists-search-by-roster-size/proposal.md)
- 3.2: skipped by product decision; no child change exists.
- 3.3: [`soften-homepage-hero-exit`](../soften-homepage-hero-exit/proposal.md)
- 3.4: [`add-distro-format-jump-navigation`](../add-distro-format-jump-navigation/proposal.md)
- 3.5: skipped by product decision; no child change exists.

Detailed evidence and decisions live in those child designs. Items 3.6 onward remain research-only until reviewed and approved.

Implement the promoted changes in numbered order. Item 1.1 establishes reconciled grouped Distro input consumed by 1.2 and 1.3; item 2.1 stabilizes provider roles before 2.2 hands its audit protocol to 2.3. Item 3.1 follows 1.3 in sequence but owns only Artists outlet availability, not the shared matcher or Distro search. Item 3.3 owns only the Home media/shade fade and must wait for `improve-site-runtime-performance-round-two` to archive or validly release its conflicting transition-free contract. Item 3.4 consumes 1.1's populated group model and 1.3's active-query state but owns only native format navigation. No other serious dependency warrants reordering the approved changes.

## Risks / Trade-offs

- [Research fragments across changes] → Keep this numbered index and direct child links.
- [A proposal becomes implementation by assumption] → Require explicit approval before creating its child change.
- [Future visual work reintroduces runtime or accessibility cost] → Require measured performance and accessible interaction evidence in the relevant child.
