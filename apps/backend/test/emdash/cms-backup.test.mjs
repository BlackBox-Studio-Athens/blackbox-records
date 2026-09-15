import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { backupCms, restoreCms, importCmsSql, exportCmsSql } from '../../scripts/cms-backup.mjs';

test('binding export restores FTS5 row identities, triggers, blobs and embedded NUL text', async () => {
  const source = new DatabaseSync(':memory:');
  const destination = new DatabaseSync(':memory:');
  const binding = (db) => ({
    prepare(sql) {
      return {
        sql,
        values: [],
        bind(...values) {
          return { sql, values: values.map((v) => (Array.isArray(v) ? Buffer.from(v) : v)) };
        },
        async all() {
          return { results: db.prepare(sql).all() };
        },
      };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const result = statements.map((s) => ({ results: db.prepare(s.sql).all(...s.values) }));
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  });
  try {
    source.exec(
      'CREATE TABLE content (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT, image BLOB); CREATE INDEX body_index ON content(body); CREATE VIRTUAL TABLE search USING fts5(body); CREATE TRIGGER searchable AFTER INSERT ON content BEGIN INSERT INTO search(rowid, body) VALUES (new.id,new.body); END;',
    );
    source
      .prepare('INSERT INTO content(id,body,image) VALUES (?,?,?)')
      .run(17, 'music\0record', Buffer.from([0, 255, 2]));
    const dump = await exportCmsSql(binding(source));
    await importCmsSql(dump, binding(destination));
    assert.deepEqual(destination.prepare('SELECT * FROM content').all(), source.prepare('SELECT * FROM content').all());
    assert.equal(destination.prepare("SELECT rowid FROM search WHERE search MATCH 'music'").get().rowid, 17);
    destination.prepare('INSERT INTO content(body) VALUES (?)').run('later');
    assert.equal(destination.prepare("SELECT rowid FROM search WHERE search MATCH 'later'").get().rowid, 18);
  } finally {
    source.close();
    destination.close();
  }
});

function bucket() {
  const files = new Map();
  return {
    files,
    async put(key, value, metadata = {}) {
      files.set(key, { bytes: Buffer.from(value), ...metadata });
    },
    async get(key) {
      const file = files.get(key);
      return (
        file && {
          ...file,
          etag: createHash('sha256').update(file.bytes).digest('hex'),
          arrayBuffer: async () => file.bytes,
          json: async () => JSON.parse(file.bytes.toString()),
        }
      );
    },
    async head(key) {
      return files.has(key);
    },
    async delete(key) {
      files.delete(key);
    },
    async list({ prefix = '' } = {}) {
      return {
        truncated: false,
        objects: [...files]
          .filter(([key]) => key.startsWith(prefix))
          .map(([key, file]) => ({
            key,
            size: file.bytes.length,
            etag: createHash('sha256').update(file.bytes).digest('hex'),
          })),
      };
    },
  };
}

test('retains seven daily points, restores exact SQL/media, and rejects corrupt bytes before restoring', async () => {
  const source = bucket(),
    backups = bucket(),
    destination = bucket();
  await source.put('original/image.png', 'image bytes', {
    httpMetadata: { contentType: 'image/png', cacheExpiry: new Date('2027-01-01T00:00:00Z') },
  });
  const sql = Buffer.from("CREATE TABLE content (id TEXT); INSERT INTO content VALUES ('one');");
  for (let day = 1; day <= 8; day++)
    await backupCms({
      source,
      backups,
      exportSql: async () => sql,
      environment: 'local',
      now: new Date(`2026-09-${String(day).padStart(2, '0')}T00:00:00Z`),
    });
  assert.equal([...backups.files.keys()].filter((key) => key.includes('/points/')).length, 7);
  assert.equal([...backups.files.keys()].filter((key) => key.includes('/blobs/')).length, 2);
  let restored;
  await restoreCms({
    backups,
    destination,
    importSql: async (bytes) => {
      restored = bytes;
    },
    environment: 'local',
    point: '2026-09-08-daily',
  });
  assert.deepEqual(Buffer.from(restored), sql);
  assert.equal(destination.files.get('original/image.png').bytes.toString(), 'image bytes');
  assert.equal(
    destination.files.get('original/image.png').httpMetadata.cacheExpiry.toISOString(),
    '2027-01-01T00:00:00.000Z',
  );
  const blob = [...backups.files.keys()].find((key) => key.includes('/blobs/'));
  await backups.put(blob, 'corrupt');
  await assert.rejects(
    restoreCms({
      backups,
      destination: bucket(),
      importSql: async () => assert.fail('Must not import corrupt backup'),
      environment: 'local',
      point: '2026-09-08-daily',
    }),
  );
  const recovered = new DatabaseSync(':memory:');
  try {
    await importCmsSql(
      Buffer.from(
        JSON.stringify({
          schema:
            'CREATE TABLE parent (id INTEGER PRIMARY KEY); CREATE TABLE child (parent_id INTEGER REFERENCES parent(id), body TEXT); CREATE TABLE status (value INTEGER); CREATE TRIGGER changed AFTER INSERT ON child BEGIN UPDATE status SET value=99; END;',
          data: `INSERT INTO status VALUES (1); INSERT INTO parent VALUES (1); INSERT INTO child VALUES (1, '${'x'.repeat(150000)}');`,
        }),
      ),
      {
        prepare(sql) {
          assert.ok(sql.length < 100000, 'Large values must use bindings.');
          return {
            sql,
            values: [],
            bind(...values) {
              return { sql, values };
            },
          };
        },
        async batch(statements) {
          recovered.exec('BEGIN');
          for (const statement of statements) recovered.prepare(statement.sql).run(...statement.values);
          recovered.exec('COMMIT');
        },
      },
    );
    assert.equal(recovered.prepare('SELECT length(body) AS size FROM child').get().size, 150000);
    assert.equal(recovered.prepare('PRAGMA foreign_key_check').all().length, 0);
    assert.equal(recovered.prepare('SELECT value FROM status').get().value, 1);
    recovered.prepare('INSERT INTO child VALUES (1, ?)').run('later edit');
    assert.equal(recovered.prepare('SELECT value FROM status').get().value, 99);
  } finally {
    recovered.close();
  }
});
