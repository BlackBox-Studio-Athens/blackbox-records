/**
 * Older Distro drafts clear the legacy `group` column with `group: null`, but `ec_distro.group` is NOT NULL DEFAULT ''.
 * Native publish copies the draft's keys into the columns, so the revision stores the column's own empty value first.
 * Readers treat '' and null as the same cleared group; new drafts already save ''.
 */
export async function storeClearedDistroGroup(db: D1Database, draft: { revisionId: string } | { entryId: string }) {
  const revision = 'revisionId' in draft ? '?' : '(SELECT draft_revision_id FROM ec_distro WHERE id = ?)';
  await db
    .prepare(
      `UPDATE revisions SET data = json_set(data, '$.group', '')
      WHERE id = ${revision} AND collection = 'distro' AND json_type(data, '$.group') = 'null'`,
    )
    .bind('revisionId' in draft ? draft.revisionId : draft.entryId)
    .run();
}
