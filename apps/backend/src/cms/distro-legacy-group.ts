/**
 * Distro drafts clear the legacy `group` column with `group: null`, but `ec_distro.group` is NOT NULL DEFAULT ''.
 * Native publish copies the draft's keys into the columns, so the draft stores the column's own empty value first.
 * Readers already treat '' and null as the same cleared group.
 */
export async function storeClearedDistroGroup(db: D1Database, entryId: string) {
  await db
    .prepare(
      `UPDATE revisions SET data = json_set(data, '$.group', '')
      WHERE id = (SELECT draft_revision_id FROM ec_distro WHERE id = ?)
      AND collection = 'distro' AND json_type(data, '$.group') = 'null'`,
    )
    .bind(entryId)
    .run();
}
