-- Application-owned CMS_DB migration; never apply to COMMERCE_DB or native core history.
ALTER TABLE _blackbox_publications ADD COLUMN before_snapshot_sha256 TEXT
  CHECK (before_snapshot_sha256 IS NULL OR
    (length(before_snapshot_sha256) = 64 AND before_snapshot_sha256 NOT GLOB '*[^0-9a-f]*'));
CREATE INDEX _blackbox_publications_calendar
  ON _blackbox_publications (environment, status, COALESCE(completed_at, requested_at) DESC, id DESC);
