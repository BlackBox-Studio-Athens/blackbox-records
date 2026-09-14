-- Application-owned dispatch claims; no changes to EmDash core or commerce tables.
ALTER TABLE _blackbox_publications ADD COLUMN dispatch_token TEXT;
ALTER TABLE _blackbox_publications ADD COLUMN dispatch_after INTEGER NOT NULL DEFAULT 0 CHECK (dispatch_after >= 0);
