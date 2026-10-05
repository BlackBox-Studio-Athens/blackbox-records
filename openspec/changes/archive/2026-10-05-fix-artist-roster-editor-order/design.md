# Investigation and decision

The previous activity change is present in this checkout. `listArtistRosterProfiles` groups published active artists before inactive artists, then sorts names. Both Home and Artists use it. `chronoboros.md` contains `is_active: false`.

`readStaffWorkspace` intentionally requests native title ordering for the Artist finder. Sorting one returned page in the browser would not implement a correct global roster across cursors, and changing its title sort would mislabel an existing finder behavior.

`ContentPreview` sends the selected editor data. `selectPreviewContent` replaces only that record in the accepted snapshot, preserving unrelated drafts. `previewDestination` directs Artist Listing to the same `/artists/` template as the public site. A private active draft may therefore differ from accepted inactive content without a rendering defect.

Schema preparation adds an optional boolean without updating records. Missing/null activity remains active; native zero projects as inactive. CMS bootstrap imports only an empty library. Deployment is not content adoption. The prior change's Local browser evidence already recorded the selected inactive draft appearing fourth before publication and the public roster appearing fourth afterward.

No new ordering implementation is warranted by these flows. Clarify the operational owner and rerun existing relevant tests. Subsequent user-authorized Chrome blackbox inspection found PRD Chronoboros still Active, Everything is live, and second on public Artists. The remaining correction is PRD content adoption of the existing inactive status, not an ordering code patch. No hosted write or publication has been performed; see validation.md for the observations and separate preview sign-in issue.

The human subsequently confirmed that marking Chronoboros inactive in PRD resolved the issue. That confirmation closes the adoption task; the earlier observations remain historical evidence. No additional hosted action, ordering patch or preview investigation is required for this task.

# Safe environment adoption

1. Confirm the intended CMS environment and matching software/schema support.
2. Open Catalog → Artists → Chronoboros. Compare the saved private draft with the live version and inspect Active artist.
3. If the accepted public roster is already correct, leave content untouched. An alphabetical editor finder is expected.
4. If adoption is needed, turn Active artist off, retain existing authored changes, and inspect Appearance → Listing. With the other three active, expect Afterwise, Ouranopithecus, Sidus, Chronoboros.
5. Review every change on the Artist before publishing. If unrelated saved edits are not ready, retain the draft and defer publication; publication accepts the reviewed revision, not one field alone.
6. After authorized publication, verify public Artists and Home and record the accepted snapshot identity. Do not reseed a populated CMS.
