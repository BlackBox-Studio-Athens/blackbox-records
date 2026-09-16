ALTER TABLE _blackbox_publications ADD COLUMN request_json TEXT;
ALTER TABLE _blackbox_publications ADD COLUMN stage TEXT;
ALTER TABLE _blackbox_publications ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE _blackbox_publications ADD COLUMN completed_at INTEGER;
ALTER TABLE _blackbox_publications ADD COLUMN failure_code TEXT;
