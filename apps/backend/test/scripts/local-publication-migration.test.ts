import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';

it('preserves publication history and requires snapshot receipts locally and deployment evidence when hosted', () => {
  const db = new DatabaseSync(':memory:');
  const migrate = (name: string) =>
    db.exec(readFileSync(new URL(`../../cms-migrations/${name}.sql`, import.meta.url), 'utf8'));
  try {
    migrate('0001_publications');
    migrate('0002_publication_dispatch');
    for (const environment of ['local', 'uat', 'prd']) {
      db.prepare(
        `INSERT INTO _blackbox_publications (id, environment, actor_email, requested_revision, requested_at, dispatch_token, dispatch_after)
        VALUES (?, ?, 'operator@example.com', 'revision', 1, 'claim', 2)`,
      ).run(environment, environment);
    }
    const before = db.prepare('SELECT * FROM _blackbox_publications ORDER BY id').all();
    migrate('0003_local_publication_receipt');
    expect(db.prepare('SELECT * FROM _blackbox_publications ORDER BY id').all()).toEqual(before);
    expect(() => db.exec("UPDATE _blackbox_publications SET status = 'live' WHERE id = 'local'")).toThrow();
    db.prepare("UPDATE _blackbox_publications SET status = 'live', snapshot_sha256 = ? WHERE id = 'local'").run(
      'a'.repeat(64),
    );
    for (const environment of ['uat', 'prd']) {
      expect(() =>
        db
          .prepare("UPDATE _blackbox_publications SET status = 'live', snapshot_sha256 = ? WHERE id = ?")
          .run('a'.repeat(64), environment),
      ).toThrow();
      db.prepare(
        "UPDATE _blackbox_publications SET status = 'live', snapshot_sha256 = ?, code_sha = ?, ci_run_id = '123', deployment_id = 'deployment' WHERE id = ?",
      ).run('a'.repeat(64), 'b'.repeat(40), environment);
    }
    expect(db.prepare("SELECT count(*) AS count FROM _blackbox_publications WHERE status = 'live'").get()).toEqual({
      count: 3,
    });
  } finally {
    db.close();
  }
});
