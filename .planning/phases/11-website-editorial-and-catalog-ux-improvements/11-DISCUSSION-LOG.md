# Phase 11: Website Editorial And Catalog UX Improvements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-05-12T13:07:27.5299211+03:00
**Phase:** 11-website-editorial-and-catalog-ux-improvements
**Areas discussed:** Artist profile presentation, Homepage and releases emphasis, Distro grouping and metadata, Validation focus

---

## Artist Profile Presentation

| Question | Option | Description | Selected |
| --- | --- | --- | --- |
| First-screen emphasis | Artist story first | Large image/title, bio and links prominent, latest release nearby but secondary. | ✓ |
| First-screen emphasis | Latest release first | Artist identity plus latest release/listen action leads, bio follows. | |
| First-screen emphasis | Balanced split | Image/identity on one side, bio/links/latest release arranged evenly on the other. | |
| Bio model | Optional `bio_paragraphs` plus legacy `bio` fallback | Keeps current content compatible and lets richer profiles opt in. | |
| Bio model | Convert `bio` to an array everywhere | Cleaner long-term shape but forces migration of all artist entries now. | |
| Bio model | Keep one Markdown body only | Use the artist file body for long bios, leaving frontmatter minimal. | ✓ |
| Link presentation | Small profile link row | Bandcamp/Instagram/website-style links near the bio, quiet and scannable. | ✓ |
| Link presentation | Prominent action buttons | Bigger CTAs for artist destinations, more obvious but heavier. | |
| Link presentation | Text list under bio | Simple editorial list, lowest visual weight. | |
| Video presentation | Optional embedded media section | Render a Videos section only when content exists, below the first-screen story/latest-release area. | ✓ |
| Video presentation | Inline in the first screen | Visually prominent, but risks crowding the profile opening. | |
| Video presentation | External links only | Avoids embeds, but underserves the partner note to add videos. | |

**User's choice:** Artist story first; use artist Markdown body for long-form bio; small profile links; optional YouTube embeds.

**Notes:** Existing `bio` frontmatter remains useful as short/card/meta summary text. Videos should always mean YouTube embeds in this phase.

---

## Homepage And Releases Emphasis

| Question | Option | Description | Selected |
| --- | --- | --- | --- |
| Homepage News prominence | Same footprint as current module | Replace the content type but preserve homepage rhythm and the rest of the page. | |
| Homepage News prominence | More prominent editorial lead | Make News the main post-hero feature, stronger than the old releases module. | |
| Homepage News prominence | Compact update strip | Smaller, faster-scanning news row so Artists/Distro stay visually dominant. | ✓ |
| Homepage News count | Three items | Familiar card rhythm, enough freshness without becoming a news page. | ✓ |
| Homepage News count | One latest item | Very compact, but may feel thin if the homepage is meant to show activity. | |
| Homepage News count | Two items | Balanced and compact, less grid weight than three. | |
| News archive link | Link to `/news/` quietly | Homepage can expose the archive without adding News back to header/footer. | ✓ |
| News archive link | No archive link | Show three updates only, keeping News semi-hidden. | |
| News archive link | Restore News to navigation | Makes News first-class globally, but changes IA beyond the homepage module. | |
| Latest release feature | Editorial banner | Clear top feature with artwork, title, artist, short copy, and listen/detail actions. | ✓ |
| Latest release feature | Small pinned card | Latest release appears as a highlighted first card before the grid. | |
| Latest release feature | Full hero treatment | Latest release dominates the release index, more dramatic but heavier. | |

**User's choice:** Compact three-item homepage News strip with quiet `/news/` link; editorial latest-release banner.

**Notes:** If the releases banner or broader Phase 11 visual direction needs extra design support, route through GSD planning/UI-spec work and allow a manual GPT Image 2 mockup as input. The mockup guides implementation but does not replace repo design-system constraints.

---

## Distro Grouping And Metadata

| Question | Option | Description | Selected |
| --- | --- | --- | --- |
| Group order | Vinyl 12-inch, Vinyl 7-inch, CDs, Clothes, Tapes, Other | Matches the partner note and keeps fallback items contained. | ✓ |
| Group order | Vinyl 12-inch, Vinyl 7-inch, Tapes, CDs, Clothes, Other | Keeps music formats before apparel. | |
| Group order | Vinyl, CDs, Tapes, Clothes, Other | Simpler but does not visibly separate 12-inch and 7-inch. | |
| Date display | Small metadata line | Quiet date near artist/label or format, present only when known. | ✓ |
| Date display | Prominent date badge | More visible, but risks making catalog cards feel like event/news cards. | |
| Date display | Detail-only date | Keep listing clean, show dates only on store/detail pages. | |
| Unknown dates | Omit completely | No placeholder, no unknown, no invented dates. | ✓ |
| Unknown dates | Show date unavailable | Explicit but visually noisy. | |
| Unknown dates | Infer year from context if obvious | Useful in rare cases, but risks fake data. | |
| Description cleanup | Editorial polish only | Improve clarity/tone while preserving titles, slugs, images, routes, and commerce linkage. | ✓ |
| Description cleanup | Rewrite heavily for sales copy | Stronger marketing voice, higher risk of sounding generic. | |
| Description cleanup | Minimal typo fixes only | Safest, but may not satisfy fix descriptions. | |

**User's choice:** Group order is Vinyl 12-inch, Vinyl 7-inch, CDs, Clothes, Tapes, Other; dates are quiet optional metadata; unknown dates omitted; descriptions get editorial polish only.

**Notes:** Distro identity, routing, images, and commerce linkage must remain stable.

---

## Validation Focus

| Question | Option | Description | Selected |
| --- | --- | --- | --- |
| Highest-risk Browser Use check | Artist direct + overlay routes | Same content renders in two shells, and videos/player/latest release can easily regress layout. | ✓ |
| Highest-risk Browser Use check | Homepage mobile | Compact News strip could crowd the hero/following sections. | |
| Highest-risk Browser Use check | Distro grouping | Many cards and group headings make spacing/order regressions likely. | |
| Representative enriched artist | Chronoboros | Existing release/news context and can exercise latest release plus richer profile content. | |
| Representative enriched artist | Afterwise | Ties to the current native store smoke item and latest release path. | ✓ |
| Representative enriched artist | First full enriched content entry | Lets implementation choose based on available real content. | |
| App-shell/player continuity | Yes, targeted check | Open artist overlay, trigger/reopen/minimize existing listen/player behavior, confirm videos do not take over player ownership. | ✓ |
| App-shell/player continuity | No, visual only | Enough if routes render; lighter validation. | |
| App-shell/player continuity | Full player regression suite | Thorough, but larger than this phase unless player code changes directly. | |
| Mobile strictness | Representative narrow routes | Homepage, enriched artist, releases banner, distro grouping at one narrow viewport. | ✓ |
| Mobile strictness | Every changed route at multiple mobile widths | Strongest coverage, but slower and heavier. | |
| Mobile strictness | Only homepage mobile | Fastest, but misses artist/video and distro grouping risks. | |

**User's choice:** Prioritize artist direct and overlay routes, use Afterwise, include targeted player continuity, and validate representative narrow routes.

**Notes:** Browser Use checks should cover homepage, enriched artist, releases banner, and distro grouping at one narrow viewport.

---

## The Agent's Discretion

- No area was delegated fully to the agent.

## Deferred Ideas

- Hiding all homepage sections other than News.
- Search/filter/sort controls for distro.
- Account-backed artist/media administration.
- Checkout, order, stock, cart, Stripe, BOX NOW, or shipping behavior changes.
