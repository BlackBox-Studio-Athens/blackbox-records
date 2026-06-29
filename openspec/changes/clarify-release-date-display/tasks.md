## 1. Public Release Date UI

- [x] 1.1 Confirm every current public `release_date` render surface: release card, release detail, releases landing latest/upcoming feature blocks, artist discography/release references, distro card, and store card metadata if applicable.
- [x] 1.2 Add or reuse a date formatter for delicate metadata display, keeping detail views day-level and compact surfaces from becoming crowded.
- [x] 1.3 Update release-facing components so `release_date` appears as metadata outside summary/body copy.
- [x] 1.4 Keep optional distro dates hidden when missing and aligned with the same metadata language when present.

## 2. Decap Editor Guidance

- [x] 2.1 Update the Releases collection `Release date` hint to explain it is official release metadata used for public display and ordering/latest behavior.
- [x] 2.2 Review the Distro collection `Release date` hint and align wording only where it prevents editor confusion.
- [x] 2.3 Update Decap YAML generation tests for changed hint text.

## 3. Verification

- [x] 3.1 Run focused unit tests for Decap config/date presentation helpers changed in this slice, including day-level detail formatting if a helper is added.
- [x] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [x] 3.3 Validate affected release UI with Browser Use on representative desktop and mobile widths.
