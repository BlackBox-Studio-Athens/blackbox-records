## 1. First audit run

- [ ] 1.1 Confirm `harden-music-provider-data` and `define-music-link-audit` are implemented before this change, then enumerate the twelve current Artist/Release Bandcamp/Tidal slots from the final content tree.
- [ ] 1.2 Use Browser Use to classify every slot exactly once in one dated `music-link-audit.md`, recording final destinations, field roles, identity evidence, and Release playback evidence under the approved protocol.

## 2. Verified corrections

- [ ] 2.1 For `Verified` Artist rows only, add the Chronoboros Bandcamp root, replace Afterwise's Bandcamp track link with its root, and add the Ouranopithecus Bandcamp root and Tidal Artist `79935313`; retain already-correct links.
- [ ] 2.2 For `Verified` Release rows only, replace `Disintegration`'s Bandcamp track embed with album embed `3481803854` and Tidal album `505727858` with `521945607`, and add `Anarchotribal` Bandcamp album embed `2894598366` and Tidal album `526716850`; keep every Missing or Questionable provider absent and record each old value, replacement, field, and evidence in the report.

## 3. Verification

- [ ] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; use existing content/provider checks plus Browser Use to verify each changed profile destination and Release embed, adding one focused assertion only if current coverage misses a corrected content shape, and do not change release dates, biography copy, merch, schemas, or player behavior.
