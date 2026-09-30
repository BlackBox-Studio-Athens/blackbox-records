## 1. Shared contracts

- [x] 1.1 Add `SITE_PAGES`, `ABOUT_STAT_KEYS` and `SOCIAL_PLATFORMS`. Tighten the matching content schemas and add service-id uniqueness. Remove the unused internal-path helper. Cover accepted and rejected values in `editorial-validation.test.ts`.
- [x] 1.2 Restrict the stock-change request reason to the four staff reasons. Regenerate the internal API contract and update the route fixtures.

## 2. Staff controls

- [x] 2.1 Replace closed-set content inputs with choice controls. Add the Social hide switch, the single-choice country picker, parsed Bandcamp and YouTube fields, service link-name normalization and row bounds.
- [x] 2.2 Constrain:
  - tracklist durations and side letters
  - EUR amount keystrokes
  - the restored item-setup format and the opening stock
  - stock quantities, notes and search lengths
  - stock reasons, typed from the generated API

## 3. Acceptance

- [x] 3.1 Verify the changed forms in the browser against Local fixtures. Illegal values cannot be entered or published, and the controls work by keyboard.
- [x] 3.2 Run the affected tests, `pnpm test:content`, the staff check, strict OpenSpec validation and a final `pnpm validate`. Record the evidence in `validation.md`.
