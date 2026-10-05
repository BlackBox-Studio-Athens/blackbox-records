## Why

Staff editing forms use consistent controls but many field types and editing actions lack the icon cues already used in the workspace navigation. Members need to recognize images, links, dates, text, prices and ordering quickly across Website and Catalog.

## What Changes

- Reuse Lucide outline icons in existing FieldLabel and FieldLegend components, retaining text and required indicators.
- Add field-type and section cues to shared content forms, relationship/country/image pickers, tracklists, catalog creation, selling price, stock counting and pre-order forms.
- Complete existing add, remove, reorder, retry and save affordances with decorative icons.
- Keep checkboxes, switches and already-iconed editor toolbars clear of redundant decoration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-workspace`: consistent, accessible icon cues for editing forms and actions.

## Impact

Staff frontend components only. No dependency, content schema, persistence, autosave, publication or commerce authority change. Footer-specific fields belong to the separate footer-copy change.
