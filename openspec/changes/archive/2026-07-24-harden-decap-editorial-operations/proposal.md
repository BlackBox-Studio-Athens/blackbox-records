## Why

Decap currently passes its focused unit tests and local smoke, but its production/runtime contract and editor model have accumulated risky inconsistencies: missing production auth can fall back to localhost, media ownership differs between config and preview serving, local and deployed Decap versions differ, and some CMS controls no longer match the rendered site. With the site approaching a stable iteration, label members need a trustworthy editorial surface that explains its limits, keeps routine work obvious, and does not require coding knowledge.

## What Changes

- Keep Decap editorial-only, authenticated through DecapBridge, and publishing directly to `main`.
- Make production Decap configuration fail visibly when required DecapBridge settings are missing instead of generating a localhost backend.
- Upgrade `decap-cms` and `decap-server` to one compatibility-tested current version set, pin the browser runtime deliberately, and verify local/UAT behavior after the upgrade.
- Reconcile CMS media folders, collection-relative assets, preview asset URLs, and the static admin media route under one explicit contract.
- Audit every Decap collection against Astro schemas, committed content, rendered consumers, and current site terminology; remove or hide controls that no longer affect the site.
- Reorder and relabel collections around common editorial work, with site-wide settings/navigation/social controls separated as clearly warned advanced changes.
- Add concise in-product ownership guidance showing that Decap changes editorial content only and identifying the existing operational surface for price, stock, checkout availability, orders, and fulfillment work.
- Improve labels, hints, defaults, validation, list summaries, destructive-action warnings, slug handling, and collection descriptions without replacing the current language or introducing a new CMS.
- Keep custom previews for key public collections and align them with the current public rendering rather than obsolete homepage or store structures.
- Reduce or harden brittle DOM patches in `public/admin/init.js`, preferring supported Decap configuration and extension APIs where they cover the behavior.
- Expand deterministic config/schema/media tests and focused Local/UAT Static Smoke coverage for auth mode, config validity, admin boot, preview registration, media resolution, and representative editor loading.
- Exclude an editorial-workflow branch model, external media platform, editor handbook, recovery handbook, and manual label-member usability acceptance gate from this change.

## Capabilities

### New Capabilities

- `decap-editorial-operations`: Defines the supported Decap editor scope, direct-to-`main` publication model, DecapBridge runtime contract, collection information architecture, field usability, media handling, previews, advanced-setting warnings, and production failure behavior.

### Modified Capabilities

- `stripe-catalog-field-ownership`: Requires the Decap surface to explain editorial ownership and direct non-editorial commerce work to the existing authoritative operational surfaces without exposing provider or database authority in CMS content.
- `tooling-validation`: Adds deterministic Decap config/schema/media/version checks plus focused Local and UAT Static Smoke coverage for the supported editor flow.

## Impact

- Decap configuration and builders under `apps/web/src/lib/admin/**`.
- Static admin routes under `apps/web/src/pages/admin/**` and custom admin assets under `apps/web/public/admin/**`.
- Astro content schemas and current collection content where stale CMS-only fields require cleanup.
- Local CMS launch/smoke scripts, Decap package versions, lockfile, and deployment configuration validation.
- Existing catalog ownership and validation specifications; no new commerce authority, backend API, database schema, or public route is introduced.
