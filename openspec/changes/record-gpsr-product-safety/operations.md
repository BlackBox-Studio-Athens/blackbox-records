# Minimal product-safety adoption procedure

Selected 14 October 2026 under the owner's instruction to handle routine decisions autonomously and keep the solution simple. No new interface, supplier service, catalogue gate or contact campaign is added.

## One existing CMS field, one internal register

Use the implemented `product_safety` field and existing review/publication flow. `evidence-register.csv` lists the retained source candidates at `188e3d29`: 3 Release Markdown files and 98 Distro JSON files. It is a source-fixture inventory, not a live catalogue export, a list of currently buyable offers or verified editions. None has structured safety evidence in source. Match each candidate to its actual CMS record and physical edition before using it operationally; do not import this CSV into the CMS as product facts.

Blank edition/batch and evidence cells mean not established. The row status starts as `unresolved`. Keep the private documents outside Git; the eventual reference must locate the evidence without disclosing its contents. A current product name, cover image or music-release date is not enough to complete the row.

At the next normal edit of an item, examine existing packaging, purchasing and commissioning records. Establish the edition/batch, legal operator role, manufacturer and contact information, any required EU responsible person, and Greek safety instructions or a supported assessment that none are needed. Use the precise requirements in `handover.md`. Where variants differ materially, keep their evidence separate. No supplier is contacted automatically.

Only mark the CMS record `verified` when the evidence supports all required facts for that edition. Missing enum values are omitted; do not store an invented `unknown` enum. Incomplete work may remain a private draft. The existing validator enforces complete verified records, and public projection excludes evidence, role, review metadata and first-market date.

## Chosen treatment of unresolved records

Complete evidence before adopting a new verified disclosure. Do not fill unknowns with dunk, BlackBox, an EU address, generic safety assurances, a CE mark or a historic exemption. The owner's statement that existing own releases were dunk-pressed remains a lead for checking paperwork, not a manufacturer determination.

Preserve the owner's previously selected launch/checkout/VAT behavior and the approved UI. No existing item is silently withdrawn or disabled. Existing offers with unresolved required information remain an explicitly unresolved legal issue; retaining their current operation does not cure the disclosure duty. A risk register is not a substitute for resolving the facts or withholding an affected offer. This document selects the administrative workflow, not a legal exemption or a claim that every existing offer can lawfully continue.

When evidence is complete, review the exact saved revision and the public projection for product and both checkout paths. Publish only through the existing separately authorized workflow. A successful test with synthetic values proves software behavior, not a real manufacturer's identity.

## What this closes

The owner no longer needs to choose a tracking format or define routine verification defaults. The register is populated from available source identifiers, and the existing CMS flow remains the only writer. Tasks for actual supplier evidence and real-catalogue/publication acceptance stay open. No private supplier evidence was found or invented, and no acceptance box is checked merely because the owner delegated the work.
