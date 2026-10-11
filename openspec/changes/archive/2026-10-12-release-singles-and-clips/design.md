# Design

Use optional `singles: { title, url }[]` and `clips: { title, youtube_video_id }[]` in the shared release schema. These separate entry shapes prevent a link-only single from being mistaken for a playable clip. Existing releases remain valid. Add the fields as optional JSON in explicit EmDash schema setup and reuse the editor's existing row and YouTube controls.

Below the release hero, show one “Singles & clips” section when either array has entries. Singles are flat ruled rows with title and Listen link. Clips reuse the artist video's privacy-preserving YouTube embed, loading lazily and never autoplaying. The layout follows the current dark type and container widths, stacking naturally on mobile. This is a small extension of an established page, so no image-generated mock or new visual system is needed. The [Design Library hierarchy](C:/Users/SVall/.codex/design-library/patterns/hier.md#hier-02) and [reflow](C:/Users/SVall/.codex/design-library/patterns/lay.md#lay-04) records are direction references with inherited, not freshly tested, evidence.

Source-backed LOTUS links can be entered in PRD after code promotion. Publication changes content only; it does not alter selling, stock, or shopper launch gates.
