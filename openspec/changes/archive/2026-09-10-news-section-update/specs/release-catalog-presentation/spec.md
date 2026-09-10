## ADDED Requirements

### Requirement: Release details expose source-backed editorial data

The site SHALL present useful verified release context and complete structured credits for _Disintegration_ and _Anarchotribal_ through the existing Release summary, formats, credits, date, and album-player presentation.

#### Scenario: Disintegration Release detail is enriched

- **WHEN** a visitor opens the _Disintegration_ Release detail directly or in the app-shell overlay
- **THEN** it identifies the June 9, 2026 six-track debut as instrumental post-rock/post-metal from Athens
- **AND** its formats distinguish provider-confirmed Digital from label-owned Black Vinyl LP and CD
- **AND** its credits identify Afterwise as writer/performer; George Stamatiou, Stavros Apostolou, Ilias Daramouskas, Markos Kousounadis Knousen, and Giannis Avraam with their instruments; Jim Spanos' recording/mixing work at BlackBox Studio; Nikos Dimitrakakos and Jim Spanos' mastering at Unreal Studio; Joshua Takak's artwork; and BlackBox Records' label role

#### Scenario: Anarchotribal Release detail is enriched

- **WHEN** a visitor opens the _Anarchotribal_ Release detail directly or in the app-shell overlay
- **THEN** it identifies the June 6, 2026 ten-track album by the Athens psychedelic/punk-influenced rock trio
- **AND** its formats distinguish provider-confirmed Digital from label-owned Vinyl
- **AND** its credits identify music by Ouranopithecus; lyrics by Zon Pletsis; Mario, Jack, and Zon Pletsis with their instruments; the Atavo and Buduzi Studios recording locations; Kostas Ragiadakos' drum-engineering/mastering roles; Marios Adamopoulos' engineering/recording/mixing/production roles; Ouranopithecus' production role; Nina Politimou and Marianna Tzaneti on `Bad`; Voltas and Ouranopithecus' artwork; Edward S. Curtis' original cover photography; and BlackBox Records' label role

#### Scenario: Existing Release presentation carries the enrichment

- **WHEN** both enriched Release entries are built
- **THEN** their existing `summary`, `formats`, and `credits` fields render without a new schema field or detail component
- **AND** the direct and overlay routes present the same summary, formats, and credits
- **AND** the album player continues using the exact Bandcamp and Tidal values introduced by `7193409a`
- **AND** no native track-list UI is added because the verified album player already exposes the tracks
