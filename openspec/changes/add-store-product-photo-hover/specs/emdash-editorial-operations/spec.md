# Spec Delta

## ADDED Requirements

### Requirement: Gallery ordering controls the browse preview in the existing editor

Members SHALL choose the alternate browse photo by ordering the existing More images gallery. The editor SHALL explain this relationship within the current media, draft, preview, and publication workflow.

#### Scenario: Member chooses the preview photo

- **WHEN** a member edits More images
- **THEN** the editor explains that the first image different from the main image appears on hover or keyboard focus
- **AND** all gallery rows remain available on the item page with their placement descriptions
- **AND** the member uses the existing image selection and ordering controls without a separate hover-image field.

#### Scenario: Member reviews and publishes a reordered gallery

- **WHEN** the member saves and previews a gallery change
- **THEN** the private detail preview shows the saved ordering
- **AND** the public card and gallery retain their accepted ordering until publication
- **AND** publishing makes the first non-primary image the browse preview while retaining the complete gallery order
- **AND** changing only the gallery leaves primary selection and commerce state unchanged.
