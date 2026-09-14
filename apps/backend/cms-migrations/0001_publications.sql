-- Application-owned CMS_DB migration. Never apply to COMMERCE_DB or EmDash's core migration history.
CREATE TABLE _blackbox_publications (
  id TEXT PRIMARY KEY NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('local', 'uat', 'prd')),
  actor_email TEXT NOT NULL,
  requested_revision TEXT NOT NULL CHECK (length(requested_revision) BETWEEN 1 AND 128),
  requested_at INTEGER NOT NULL CHECK (requested_at >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'failed')),
  snapshot_sha256 TEXT CHECK (snapshot_sha256 IS NULL OR
    (length(snapshot_sha256) = 64 AND snapshot_sha256 NOT GLOB '*[^0-9a-f]*')),
  code_sha TEXT CHECK (code_sha IS NULL OR (length(code_sha) = 40 AND code_sha NOT GLOB '*[^0-9a-f]*')),
  ci_run_id TEXT CHECK (ci_run_id IS NULL OR length(ci_run_id) BETWEEN 1 AND 128),
  deployment_id TEXT CHECK (deployment_id IS NULL OR length(deployment_id) BETWEEN 1 AND 128),
  CHECK (status <> 'live' OR
    (snapshot_sha256 IS NOT NULL AND code_sha IS NOT NULL AND ci_run_id IS NOT NULL AND deployment_id IS NOT NULL))
);

CREATE INDEX _blackbox_publications_pending ON _blackbox_publications (environment, status, requested_at, id);
