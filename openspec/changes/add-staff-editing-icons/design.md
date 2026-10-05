## Context

Website and Catalog share ContentFields. Catalog creation and selling/stock forms also contain native labels. Staff already depends on lucide-react and uses labeled outline icons in its navigation and actions. The shared FieldLabel and FieldLegend components can accept optional icon components without a separate icon renderer.

## Decisions

- Use 16px Lucide outline icons and the existing muted foreground for field labels and headings. Actions retain their current button styling and visible text.
- Text, long text, dates, numbers, URLs, email, images, related artists, countries, physical formats, prices, quantities and ship estimates use recognizable field cues.
- Repeaters and tracklists share Plus, Trash2, ArrowUp and ArrowDown. Retry uses RefreshCw; draft saving uses Save.
- Icons remain aria-hidden. Preserve existing labels, help, validation, required indicators, disabled states and focus behavior.
- Keep icons outside editable values. Checkboxes/switches already communicate their control type. The native EmDash rich-text toolbar already owns formatting icons.
- Use the [Design Library's Lucide record](C:/Users/SVall/.codex/design-library/sources/lucide/README.md) as the family reference. Compare label cues, inset input cues and section/action-only cues; the user selected beside labels and actions on 2026-10-05. Label cues preserve existing controls and keep input space available. No additional icon family is adopted. Current [Lucide accessibility guidance](https://lucide.dev/how-to/accessibility), React exports and license were checked on the same date.

## Scope and coordination

Generic ContentFields helpers apply to all collection branches, including settings. Footer-specific settings field edits are preserved. No artist order/list edits, public typography or footer renderer edits belong here.

## Acceptance

- Website and Catalog retain their labeled controls and all editing callbacks.
- Ordered rows and tracks retain boundary disabling and data preservation while showing matching action icons.
- Price/stock/pre-order controls retain their existing business guards and values.
- No decorative icon adds an accessible name or keyboard stop.
- Phone layouts retain full-width inputs and readable labels without horizontal overflow; action icons retain existing 44px touch targets and wrapping action rows.
- Focused staff tests pass. Real rendered fixture checks remain separate from tests and final integration validation, owned by the parent chat.
