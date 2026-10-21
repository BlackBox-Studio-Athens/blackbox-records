import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { backupCms, restoreCms, importCmsSql, exportCmsSnapshot, exportCmsSql } from '../../scripts/cms-backup.mjs';

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
      assert.ok(statements.length, 'D1 rejects empty batches.');
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
    assert.deepEqual(JSON.parse((await exportCmsSql(binding(source))).toString()), { schema: '', data: '' });
    source.exec(
      'CREATE TABLE content (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT, image BLOB); CREATE TABLE media (storage_key TEXT PRIMARY KEY); CREATE INDEX body_index ON content(body); CREATE VIRTUAL TABLE search USING fts5(body); CREATE TRIGGER searchable AFTER INSERT ON content BEGIN INSERT INTO search(rowid, body) VALUES (new.id,new.body); END;',
    );
    source
      .prepare('INSERT INTO content(id,body,image) VALUES (?,?,?)')
      .run(17, 'music\0record', Buffer.from([0, 255, 2]));
    source.prepare('INSERT INTO media(storage_key) VALUES (?)').run('cover.png');
    const snapshot = await exportCmsSnapshot(binding(source));
    assert.deepEqual(snapshot.mediaKeys, ['cover.png']);
    const dump = snapshot.sql;
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

async function backupFixture(t) {
  const source = bucket();
  const backups = bucket();
  const sql = Buffer.from('snapshot');
  await source.put('first.png', 'first media', {
    httpMetadata: { contentType: 'image/png', cacheExpiry: new Date('2027-01-01T00:00:00Z') },
    customMetadata: { caption: 'first image' },
  });
  await source.put('second.png', 'second media', {
    httpMetadata: { contentType: 'image/png' },
    customMetadata: { caption: 'second image' },
  });
  const wait = t.mock.fn(async () => {});
  const exportSnapshot = t.mock.fn(async () => ({ sql, mediaKeys: ['first.png', 'second.png'] }));
  const log = t.mock.method(console, 'log', () => {});
  const bytes = sql.byteLength + [...source.files.values()].reduce((sum, file) => sum + file.bytes.length, 0);
  const options = {
    source,
    backups,
    exportSnapshot,
    environment: 'local',
    now: new Date('2026-10-21T00:00:00Z'),
    maxBytes: bytes,
    wait,
  };
  return { source, backups, sql, bytes, wait, exportSnapshot, log, options };
}

test('retries a media request or body with a fresh get and preserves completed capture work', async (t) => {
  for (const phase of ['request', 'body']) {
    await t.test(phase, async (t) => {
      const { source, backups, sql, bytes, wait, exportSnapshot, options } = await backupFixture(t);
      const getSource = source.get.bind(source);
      let failed = false;
      const get = t.mock.method(source, 'get', async (key) => {
        const object = await getSource(key);
        if (key === 'second.png' && !failed) {
          failed = true;
          if (phase === 'request') throw new Error('Network connection lost.');
          object.arrayBuffer = async () => {
            throw new Error('Network connection lost.');
          };
        }
        return object;
      });
      const result = await backupCms(options);
      assert.equal(result.bytes, bytes, 'A recovered object counts once at the exact byte ceiling.');
      assert.equal(result.objects, 2);
      assert.equal(result.retries, 1);
      assert.deepEqual(
        get.mock.calls.map((call) => call.arguments[0]),
        ['first.png', 'second.png', 'second.png'],
      );
      assert.deepEqual(
        wait.mock.calls.map((call) => call.arguments[0]),
        [1000],
      );
      assert.equal(exportSnapshot.mock.callCount(), 1);
      const destination = bucket();
      let restored;
      await restoreCms({
        backups,
        destination,
        environment: 'local',
        point: result.point,
        importSql: async (value) => {
          restored = value;
        },
      });
      assert.deepEqual(Buffer.from(restored), sql);
      assert.deepEqual(destination.files, source.files, 'Recovery retains exact media bytes and metadata.');
    });
  }
});

test('stops a sustained storage failure after three attempts and retains the previous point', async (t) => {
  const { source, backups, wait, exportSnapshot, options } = await backupFixture(t);
  await backupCms({ ...options, now: new Date('2026-10-20T00:00:00Z') });
  const previous = Buffer.from(backups.files.get('cms/local/points/2026-10-20-daily.json').bytes);
  const failure = new Error('Network connection lost.');
  const get = t.mock.method(source, 'get', async () => {
    throw failure;
  });
  await assert.rejects(backupCms(options), (error) => error === failure);
  assert.equal(get.mock.callCount(), 3);
  assert.deepEqual(
    wait.mock.calls.map((call) => call.arguments[0]),
    [1000, 2000],
  );
  assert.equal(exportSnapshot.mock.callCount(), 1, 'The failed first pass never reaches another D1 snapshot.');
  assert.equal(backups.files.has('cms/local/points/2026-10-21-daily.json'), false);
  assert.deepEqual(backups.files.get('cms/local/points/2026-10-20-daily.json').bytes, previous);
});

test('recovers transient R2 actions and lost acknowledgements without damaging retained points', async (t) => {
  const cases = [
    { name: 'source list', target: 'source', method: 'list' },
    { name: 'point list', method: 'list', match: (options) => options.prefix.endsWith('/points/') },
    { name: 'blob list', method: 'list', match: (options) => options.prefix.endsWith('/blobs/') },
    { name: 'blob head', method: 'head' },
    { name: 'blob write acknowledgement', method: 'put', match: (key) => key.includes('/blobs/'), after: true },
    { name: 'point write acknowledgement', method: 'put', match: (key) => key.includes('/points/'), after: true },
    { name: 'retained point request', method: 'get', message: 'get: Unspecified error (0)' },
    { name: 'retained point body', method: 'get', body: true },
    { name: 'unused blob delete acknowledgement', method: 'delete', after: true },
    {
      name: 'expired point delete acknowledgement',
      method: 'delete',
      match: (key) => key.includes('/points/'),
      after: true,
      seed: true,
    },
  ];
  for (const scenario of cases) {
    await t.test(scenario.name, async (t) => {
      const { source, backups, wait, exportSnapshot, log, options } = await backupFixture(t);
      if (scenario.seed) {
        for (let day = 1; day <= 7; day++)
          await backupCms({ ...options, now: new Date(`2026-10-${String(day).padStart(2, '0')}T00:00:00Z`) });
      }
      const orphan = `cms/local/blobs/${'0'.repeat(64)}`;
      await backups.put(orphan, 'unused bytes');
      const target = scenario.target === 'source' ? source : backups;
      const original = target[scenario.method].bind(target);
      const failure = scenario.message
        ? new Error(scenario.message)
        : Object.assign(new Error('private provider payload'), { status: 503 });
      let failed = false;
      let failedKey;
      const operation = t.mock.method(target, scenario.method, async (...args) => {
        if (!failed && (!scenario.match || scenario.match(args[0]))) {
          failed = true;
          failedKey = args[0];
          if (scenario.body) {
            const object = await original(...args);
            object.json = async () => {
              throw failure;
            };
            return object;
          }
          if (scenario.after) await original(...args);
          throw failure;
        }
        return original(...args);
      });
      const snapshotsBefore = exportSnapshot.mock.callCount();
      const result = await backupCms(options);
      assert.ok(failed, 'The selected action must actually receive the injected failure.');
      assert.equal(result.retries, 1);
      assert.equal(result.objects, 2);
      assert.equal(result.bytes, options.maxBytes);
      assert.equal(exportSnapshot.mock.callCount(), snapshotsBefore + 1);
      assert.deepEqual(
        wait.mock.calls.map((call) => call.arguments[0]),
        [1000],
      );
      assert.equal(backups.files.has(orphan), false);
      const points = [...backups.files].filter(([key]) => key.includes('/points/'));
      assert.equal(points.length, scenario.seed ? 7 : 1);
      for (const [, file] of points) {
        const manifest = JSON.parse(file.bytes);
        assert.equal(manifest.version, 2);
        for (const entry of [manifest.database, ...manifest.media]) {
          const stored = backups.files.get(`cms/local/blobs/${entry.sha256}`).bytes;
          assert.equal(createHash('sha256').update(stored).digest('hex'), entry.sha256);
          assert.equal(stored.byteLength, entry.bytes);
        }
      }
      if (scenario.method === 'put') {
        const writes = operation.mock.calls.filter((call) => call.arguments[0] === failedKey);
        assert.equal(writes.length, 2);
        assert.deepEqual(writes[0].arguments, writes[1].arguments, 'Replay exactly the same key and bytes.');
      }
      const diagnostics = log.mock.calls.map((call) => call.arguments[0]).join('\n');
      assert.match(diagnostics, /attempt 2\/3, retry 1\/20/);
      assert.doesNotMatch(diagnostics, /first\.png|second\.png|private provider payload|cms\/local\/blobs/);
    });
  }
});

test('retries a failed list page before advancing its cursor', async (t) => {
  const { source, options, wait } = await backupFixture(t);
  const listSource = source.list.bind(source);
  let failed = false;
  const cursors = [];
  source.list = async (args) => {
    cursors.push(args.cursor);
    if (args.cursor === '1' && !failed) {
      failed = true;
      throw Object.assign(new Error('Service unavailable'), { statusCode: 502 });
    }
    const { objects } = await listSource(args);
    const start = Number(args.cursor ?? 0);
    return { objects: objects.slice(start, start + 1), truncated: start === 0, cursor: '1' };
  };
  const result = await backupCms(options);
  assert.equal(result.objects, 2);
  assert.deepEqual(cursors, [undefined, '1', '1', undefined, '1']);
  assert.equal(wait.mock.callCount(), 1);
});

test('shares a twenty-retry limit across otherwise recoverable objects', async (t) => {
  const { source, backups, options, wait, exportSnapshot } = await backupFixture(t);
  source.files.clear();
  for (let index = 0; index < 21; index++) await source.put(String(index).padStart(2, '0'), 'x');
  const getSource = source.get.bind(source);
  const failed = new Set();
  const failure = new Error('Network connection lost.');
  const get = t.mock.method(source, 'get', async (key) => {
    if (!failed.has(key)) {
      failed.add(key);
      throw failure;
    }
    return getSource(key);
  });
  await assert.rejects(backupCms({ ...options, maxBytes: 1000 }), (error) => error === failure);
  assert.equal(get.mock.callCount(), 41);
  assert.equal(wait.mock.callCount(), 20);
  assert.ok(wait.mock.calls.every((call) => call.arguments[0] === 1000));
  assert.equal(exportSnapshot.mock.callCount(), 0);
  assert.equal(
    [...backups.files.keys()].some((key) => key.includes('/points/')),
    false,
  );
});

test('authentication, quota and unknown failures do not trigger retries', async (t) => {
  const failures = [
    Object.assign(new Error('Network connection lost.'), { status: 401 }),
    Object.assign(new Error('Forbidden'), { status: 403 }),
    Object.assign(new Error('Daily quota exceeded'), { status: 429 }),
    Object.assign(new Error('Storage full'), { statusCode: 507 }),
    new Error('Unexpected storage error'),
    new SyntaxError('Malformed provider data'),
  ];
  for (const failure of failures) {
    await t.test(failure.message, async (t) => {
      const { source, backups, options, wait } = await backupFixture(t);
      const get = t.mock.method(source, 'get', async () => {
        throw failure;
      });
      await assert.rejects(backupCms(options), (error) => error === failure);
      assert.equal(get.mock.callCount(), 1);
      assert.equal(wait.mock.callCount(), 0);
      assert.equal(
        [...backups.files.keys()].some((key) => key.includes('/points/')),
        false,
      );
    });
  }
});

test('a missing or changed referenced object after a retry still prevents publication', async (t) => {
  for (const change of ['missing', 'changed']) {
    await t.test(change, async (t) => {
      const { source, backups, options, wait } = await backupFixture(t);
      const getSource = source.get.bind(source);
      let failed = false;
      source.get = async (key) => {
        const object = await getSource(key);
        if (key === 'second.png' && !failed) {
          failed = true;
          object.arrayBuffer = async () => {
            if (change === 'missing') await source.delete(key);
            else await source.put(key, 'changed');
            throw new Error('Network connection lost.');
          };
        }
        return object;
      };
      await assert.rejects(backupCms(options), /missing 1 media object/);
      assert.equal(wait.mock.callCount(), 1);
      assert.equal(
        [...backups.files.keys()].some((key) => key.includes('/points/')),
        false,
      );
    });
  }
});

test('byte and object limits remain fatal after storage recovery', async (t) => {
  await t.test('captured bytes', async (t) => {
    const { source, backups, options, wait } = await backupFixture(t);
    const getSource = source.get.bind(source);
    let failed = false;
    source.get = async (key) => {
      if (!failed) {
        failed = true;
        throw new Error('Network connection lost.');
      }
      return getSource(key);
    };
    await assert.rejects(backupCms({ ...options, maxBytes: options.maxBytes - 1 }), /exceeds the byte budget/);
    assert.equal(wait.mock.callCount(), 1);
    assert.equal(
      [...backups.files.keys()].some((key) => key.includes('/points/')),
      false,
    );
  });
  await t.test('listed objects', async (t) => {
    const { source, options, wait, exportSnapshot } = await backupFixture(t);
    source.list = async () => ({
      objects: Array.from({ length: 10001 }, (_, index) => ({ key: String(index) })),
      truncated: false,
    });
    await assert.rejects(backupCms(options), /exceeds the object budget/);
    assert.equal(wait.mock.callCount(), 0);
    assert.equal(exportSnapshot.mock.callCount(), 0);
  });
});

test('the D1 row guard and snapshot errors are not replayed', async (t) => {
  await t.test('row ceiling', async (t) => {
    const { options, wait } = await backupFixture(t);
    const database = {
      prepare(sql) {
        return {
          sql,
          async all() {
            return {
              results:
                sql === 'PRAGMA table_list'
                  ? [{ schema: 'main', type: 'table', name: 'content' }]
                  : [{ name: 'content', tbl_name: 'content', type: 'table', sql: 'CREATE TABLE content (id INTEGER)' }],
            };
          },
        };
      },
      async batch(statements) {
        return statements.map(({ sql }) => ({
          results: sql.startsWith('PRAGMA')
            ? [{ name: 'id', hidden: 0 }]
            : Array.from({ length: 10001 }, () => ({ 0: '1' })),
        }));
      },
    };
    const snapshot = t.mock.fn(() => exportCmsSnapshot(database));
    await assert.rejects(backupCms({ ...options, exportSnapshot: snapshot }), /exceeds the row budget/);
    assert.equal(snapshot.mock.callCount(), 1);
    assert.equal(wait.mock.callCount(), 0);
  });
  await t.test('snapshot connection failure', async (t) => {
    const { options, wait } = await backupFixture(t);
    const failure = new Error('Network connection lost.');
    const snapshot = t.mock.fn(async () => {
      throw failure;
    });
    await assert.rejects(backupCms({ ...options, exportSnapshot: snapshot }), (error) => error === failure);
    assert.equal(snapshot.mock.callCount(), 1);
    assert.equal(wait.mock.callCount(), 0);
  });
});

test('malformed retained manifests stop pruning without a retry', async (t) => {
  const { backups, options, wait } = await backupFixture(t);
  const previous = 'cms/local/points/2026-10-20-daily.json';
  const orphan = `cms/local/blobs/${'0'.repeat(64)}`;
  await backups.put(previous, '{invalid');
  await backups.put(orphan, 'retained until manifests can be checked');
  await assert.rejects(backupCms(options), SyntaxError);
  assert.equal(wait.mock.callCount(), 0);
  assert.equal(backups.files.has(previous), true);
  assert.equal(backups.files.has(orphan), true);
});

test('restore imports retain their original single-attempt behavior', async (t) => {
  const { backups, options } = await backupFixture(t);
  const { point } = await backupCms(options);
  const failure = new Error('Network connection lost.');
  const importSql = t.mock.fn(async () => {
    throw failure;
  });
  await assert.rejects(
    restoreCms({ backups, destination: bucket(), environment: 'local', point, importSql }),
    (error) => error === failure,
  );
  assert.equal(importSql.mock.callCount(), 1);
});

test('capture progress reports safe counts every hundred objects', async (t) => {
  const { source, options, log } = await backupFixture(t);
  source.files.clear();
  for (let index = 0; index < 100; index++) await source.put(`private-name-${index}`, 'x');
  const result = await backupCms({
    ...options,
    maxBytes: 1000,
    exportSnapshot: async () => ({ sql: Buffer.from('snapshot'), mediaKeys: [] }),
  });
  assert.equal(result.retries, 0);
  assert.deepEqual(
    log.mock.calls.map((call) => JSON.parse(call.arguments[0])),
    [{ environment: 'local', stage: 'media', objects: 100, bytes: 100 }],
  );
});

test('captures one D1 snapshot while CMS content and media change', async () => {
  const source = bucket();
  const backups = bucket();
  await source.put('existing.png', 'existing bytes');
  let liveSql = Buffer.from('initial state');
  let sourceLists = 0;
  let editedBeforeSnapshot = false;
  const listSource = source.list.bind(source);
  source.list = async (options) => {
    sourceLists++;
    if (sourceLists === 2) {
      liveSql = Buffer.from('edited after snapshot');
      await source.put('after-snapshot.png', 'later upload');
    }
    return listSource(options);
  };
  const getSource = source.get.bind(source);
  source.get = async (key) => {
    const object = await getSource(key);
    if (!editedBeforeSnapshot) {
      editedBeforeSnapshot = true;
      liveSql = Buffer.from('edited before snapshot');
      await source.put('during-capture.png', 'concurrent upload');
    }
    return object;
  };
  let exportCalls = 0;
  const result = await backupCms({
    source,
    backups,
    exportSnapshot: async () => {
      exportCalls++;
      return { sql: Buffer.from(liveSql), mediaKeys: ['existing.png', 'during-capture.png'] };
    },
    environment: 'local',
    now: new Date('2026-09-09T00:00:00Z'),
  });

  assert.equal(exportCalls, 1);
  assert.equal(result.objects, 3);
  const manifest = JSON.parse(backups.files.get(`cms/local/points/${result.point}.json`).bytes.toString());
  assert.deepEqual(manifest.media.map(({ key }) => key).sort(), [
    'after-snapshot.png',
    'during-capture.png',
    'existing.png',
  ]);
  assert.equal(
    backups.files.get(`cms/local/blobs/${manifest.database.sha256}`).bytes.toString(),
    'edited before snapshot',
  );
});

test('warns above 75% of the byte ceiling and stays quiet below it', async (t) => {
  const log = t.mock.method(console, 'log', () => {});
  const run = async (maxBytes) => {
    const source = bucket();
    await source.put('existing.png', 'existing bytes'); // 14 bytes + 8 SQL bytes = 22
    return backupCms({
      source,
      backups: bucket(),
      exportSnapshot: async () => ({ sql: Buffer.from('snapshot'), mediaKeys: ['existing.png'] }),
      environment: 'local',
      maxBytes,
      now: new Date('2026-09-12T00:00:00Z'),
    });
  };
  const warnings = () => log.mock.calls.map((call) => call.arguments[0]).filter((line) => line.startsWith('::warning'));

  assert.equal((await run(40)).maxBytes, 40);
  assert.equal(warnings().length, 0, '22 of 40 bytes is 55%.');
  await run(29);
  assert.deepEqual(warnings(), [
    '::warning title=CMS backup nearing its byte ceiling::local captured 22 of 29 bytes (76%). Review docs/cms-backup.md before it fails.',
  ]);
});

test('does not publish a recovery point when snapshot media is missing', async () => {
  const source = bucket();
  const backups = bucket();
  await assert.rejects(
    backupCms({
      source,
      backups,
      exportSnapshot: async () => ({ sql: Buffer.from('snapshot'), mediaKeys: ['missing.png'] }),
      environment: 'local',
      now: new Date('2026-09-10T00:00:00Z'),
    }),
    /missing 1 media object/,
  );
  assert.equal(
    [...backups.files.keys()].some((key) => key.includes('/points/')),
    false,
  );
});

test('does not publish when snapshot media changes during capture', async () => {
  const source = bucket();
  const backups = bucket();
  await source.put('image.png', 'before');
  let changed = false;
  const getSource = source.get.bind(source);
  source.get = async (key) => {
    const object = await getSource(key);
    if (!changed) {
      changed = true;
      await source.put(key, 'after');
    }
    return object;
  };
  await assert.rejects(
    backupCms({
      source,
      backups,
      exportSnapshot: async () => ({ sql: Buffer.from('snapshot'), mediaKeys: ['image.png'] }),
      environment: 'local',
      now: new Date('2026-09-11T00:00:00Z'),
    }),
    /missing 1 media object/,
  );
  assert.equal(
    [...backups.files.keys()].some((key) => key.includes('/points/')),
    false,
  );
});

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
      exportSnapshot: async () => ({ sql, mediaKeys: [] }),
      environment: 'local',
      now: new Date(`2026-09-${String(day).padStart(2, '0')}T00:00:00Z`),
    });
  assert.equal([...backups.files.keys()].filter((key) => key.includes('/points/')).length, 7);
  assert.equal([...backups.files.keys()].filter((key) => key.includes('/blobs/')).length, 2);
  let restored;
  let blobReads = 0;
  const getBackup = backups.get.bind(backups);
  backups.get = async (key) => {
    if (key.includes('/blobs/')) blobReads++;
    return getBackup(key);
  };
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
  assert.equal(blobReads, 2, 'Download each verified blob only once during recovery.');
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
