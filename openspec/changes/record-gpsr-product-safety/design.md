## Scope and owner decisions

Finding 9 only. All rendered UI, including text, belongs to Claude Desktop under the owner's superseding instruction. No UI component has been edited here. This local branch prepares additive backend/data work and a handover. No VAT, checkout, launch, seller-registration or durable-confirmation changes are authorized.

The owner states that existing own releases have all been dunk-pressed. This is unverified supplier context, not a verified GPSR manufacturer, address, electronic contact or future-release default. No catalogue entry is populated from it. Owner acceptance of business risk does not become a GPSR exemption.

## Data and boundaries

Release and Distro share optional private `product_safety`. Full CMS schemas override the renderer's narrower offer schema. Draft validation retains partial work. `review_status: verified` requires complete manufacturer contacts and establishment, product type and identifier, applicable Greek safety text or an explicit `not_required` assessment, BlackBox's operator role, and evidence reference/date/notes. A non-EU manufacturer requires a responsible person with full contacts and an EU member-state country. A contact-page URL must support direct communication; syntax validation cannot verify that fact.

Use evidence references to an operator-controlled record, not private documents, secrets or customer data. Notes must identify which edition/batch and sources establish identity/role, contacts, product identification and the safety assessment. `first_placed_on_eu_market` is optional evidence context, distinct from the music release date; it never bypasses readiness checks. A single record must describe the physical edition sold. Where one source covers materially different editions, resolve that mapping before marking it verified; do not silently reuse a statement across them.

`prepareCatalogSchema` adds nullable/optional JSON columns through existing explicit SchemaRegistry setup, checking existing types and safely repeating. Fresh seeds derive the JSON field from the CMS schema. It writes no content or revisions. No schema operation is invoked against hosted environments here.

Existing publication checks reject a malformed verified record. Old/absent/null fields and structurally valid incomplete records keep existing publication behavior. This is intentional staging, not a compliance waiver. Immutable snapshots retain evidence for authorized operations, while `publishedCollection` returns only `productSafetyOfferInformation`; incomplete data and internal evidence/role/review/date never reach the renderer-facing collection. Selected private preview uses that same projection. No public safety badge or certification is inferred.

## Missing facts and enforcement decision

Unknown manufacturer is unresolved, not exempt. `getProductSafetyIssues` returns field paths and messages for operator review. It is not connected to commerce or a catalogue-wide sale/publication gate in this patch. After real data is inventoried and Claude's approved public presentation is implemented, the parent/owner must review the concrete list of affected offers and choose a coordinated enforcement/adoption plan. New offers should not be represented as GPSR-ready while required facts are unresolved. Existing live offers are not silently removed, disabled or bulk-rewritten here.

The complete finding remains open until facts, approved presentation, the reviewed incomplete-offer treatment and normal publication acceptance are established. Software release alone cannot publish supplier evidence or establish the Article 19 display duty. No tax or launch gate is introduced by this change.

For an in-scope offer, missing required Article 19 information needs resolution or withholding of that offer; merely recording an unknown value is not remediation. The regulation specifies the disclosure duty, not a particular software gate. A coordinated publication/sale check is the recommended enforcement implementation after the actual catalogue impact is reviewed. This patch stages its readiness predicate and explicit blockers, rather than activating that check against unreviewed live records.

## Verification and recovery

Test incomplete drafts, verified completeness, non-EU responsibility, malformed contacts and dates, explicit safety assessment, old records, accepted snapshot isolation and evidence stripping. Test schema setup repetition and unexpected native types. Run focused `pnpm test` and final `pnpm validate`, then strict guarded OpenSpec validation. A reviewed code revert leaves additive CMS fields and accepted snapshots intact; do not delete evidence columns or restore content during a code rollback. Public display acceptance waits for Claude, then Local browser and publication checks; hosted acceptance requires separate authorization.
