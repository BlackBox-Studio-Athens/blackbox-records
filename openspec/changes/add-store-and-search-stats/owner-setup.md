# Google setup outcome — 2026-10-13

Task **2.1 remains incomplete**. The read-only inspection used the owner's signed-in Chrome BlackBox profile through the ChatGPT extension, under `blackboxrecordsathens@gmail.com`. No project, API, service account, key, user permission, MFA setting or hosted Worker configuration was changed.

## What exists

- **Search Console:** the verified Domain property `sc-domain:blackboxrecordsathens.com` has exactly one user, `blackboxrecordsathens@gmail.com`, marked **Owner / Verified**. No service-account email is listed. [User list](../../../.codex-artifacts/store-search-setup/search-console-users.png).
- **Google Cloud:** the console redirects to `/enable-mfa` and displays **Google Cloud access blocked**, requiring two-step verification. Its account control confirms the requested BlackBox account. Project inventory, Search Console API enablement, service accounts and project IAM roles could not be inspected. Their existence is unknown; no duplicate project or service account was created. [MFA gate](../../../.codex-artifacts/store-search-setup/google-cloud-mfa.png).
- **PRD Worker:** the existing `blackbox-records-backend-prd` Production variables/secrets table contains neither `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` nor `GOOGLE_SEARCH_CONSOLE_SITE`. Only binding presence was checked; no credential value was read or downloaded. The safe [inspection receipt](../../../.codex-artifacts/store-search-setup/owner-receipt.json) records these observations.

The owner declined MFA because multiple people use the Google account. This decision leaves Cloud Console inspection and provisioning pending. The task does not change that authentication setup or use another identity.

## Prepared repository configuration

`apps/backend/wrangler.jsonc` now declares `GOOGLE_SEARCH_CONSOLE_SITE: "sc-domain:blackboxrecordsathens.com"` for PRD, preserving it across future deployments. Local/mock/mock-api/UAT declare an empty site. This is a local source edit, not a hosted deployment. `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` is registered as an optional Worker secret and is never committed. Without either binding, the endpoint returns HTTP 200 `not_configured`.

## Remaining owner steps

Cloud Console must first be accessible under an owner-approved identity. Then inspect existing projects, API enablement, service accounts and project roles before proposing changes. The original per-action approval stops remain: creating a project, accepting Google Cloud terms, enabling the API, creating a service account with no IAM roles, creating a JSON key, and adding its email to Search Console as **Restricted**.

After those approvals, the owner stores the JSON themselves as the PRD Worker secret `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` and deletes the downloaded key file. The agent must never open, print, paste or commit that key, and confirms only the secret name's presence. A real authenticated Search Analytics read remains hosted acceptance after provisioning and an authorized release.
