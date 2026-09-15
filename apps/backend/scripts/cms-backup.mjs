import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { getPlatformProxy } from 'wrangler';
import ts from 'typescript';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const backend = fileURLToPath(new URL('../', import.meta.url));
const resources = JSON.parse(await readFile(new URL('../cms-resources.json', import.meta.url), 'utf8'));

// Native hosted D1 export rejects FTS5. Capture through the existing binding without modifying search tables.
export async function exportCmsSql(database) {
  const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
  const { results: listed } = await database.prepare('PRAGMA table_list').all();
  const tables = listed
    .filter(
      (t) =>
        t.schema === 'main' &&
        ['table', 'virtual'].includes(t.type) &&
        !t.name.startsWith('_cf_') &&
        (!t.name.startsWith('sqlite_') || t.name === 'sqlite_sequence'),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const { results: schema } = await database
    .prepare('SELECT name, tbl_name, type, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type, name')
    .all();
  const names = new Set(tables.map((t) => t.name));
  const definitions = schema
    .filter((s) => s.name !== 'sqlite_sequence' && (names.has(s.tbl_name) || s.type === 'view'))
    .sort((a, b) => Number(b.type === 'table') - Number(a.type === 'table'));
  const columns = tables.length
    ? await database.batch(tables.map((t) => database.prepare(`PRAGMA table_xinfo(${quote(t.name)})`)))
    : [];
  const queries = tables.map((table, index) => {
    const fields = columns[index].results.filter((c) => c.hidden === 0).map((c) => c.name);
    if (table.type === 'virtual') fields.unshift('rowid');
    const expressions = fields.map((name) => {
      const col = quote(name);
      return `CASE WHEN typeof(${col})='text' THEN 'CAST(X''' || hex(${col}) || ''' AS TEXT)' ELSE quote(${col}) END`;
    });
    return {
      table,
      fields,
      statement: database.prepare(
        `SELECT ${expressions.map((e, i) => `${e} AS ${quote(String(i))}`).join(',')} FROM ${quote(table.name)} LIMIT 10001`,
      ),
    };
  });
  // ponytail: one bounded batch for this small CMS; stream a frozen export if it outgrows 10,000 rows.
  const results = queries.length ? await database.batch(queries.map((q) => q.statement)) : [];
  let count = 0;
  const data = results
    .flatMap((result, index) => {
      count += result.results.length;
      assert.ok(count <= 10000, 'CMS export exceeds the row budget.');
      const { table, fields } = queries[index];
      return [
        ...(table.name === 'sqlite_sequence' ? ['DELETE FROM sqlite_sequence;'] : []),
        ...result.results
          .map(
            (row) =>
              `INSERT INTO ${quote(table.name)} (${fields.map(quote).join(',')}) VALUES (${fields.map((_, i) => row[String(i)]).join(',')});`,
          )
          .sort(),
      ];
    })
    .join('\n');
  return Buffer.from(JSON.stringify({ schema: definitions.map((s) => s.sql + ';').join('\n'), data }));
}

async function list(bucket, prefix = '') {
  const objects = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000, include: ['httpMetadata', 'customMetadata'] });
    objects.push(...page.objects);
    assert.ok(objects.length <= 10000, 'Backup exceeds the object budget.');
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects.sort((a, b) => a.key.localeCompare(b.key));
}

export async function backupCms({
  source,
  backups,
  exportSql,
  environment,
  kind = 'daily',
  maxBytes = 256 * 1024 * 1024,
  now = new Date(),
}) {
  assert.ok(['local', 'uat', 'prd'].includes(environment));
  assert.ok(['daily', 'pre-upgrade'].includes(kind));
  const prefix = `cms/${environment}/`;
  const objects = await list(source);
  const sql = await exportSql();
  let bytes = sql.byteLength;
  assert.ok(bytes + objects.reduce((sum, item) => sum + item.size, 0) <= maxBytes, 'Backup exceeds the byte budget.');
  async function store(body) {
    const sha256 = hash(body);
    const key = `${prefix}blobs/${sha256}`;
    if (!(await backups.head(key))) await backups.put(key, body);
    return { sha256, bytes: body.byteLength };
  }
  const database = await store(sql);
  const media = [];
  for (const item of objects) {
    const object = await source.get(item.key);
    assert.ok(object && object.etag === item.etag, 'Media changed during backup.');
    const body = new Uint8Array(await object.arrayBuffer());
    bytes += body.byteLength;
    assert.ok(bytes <= maxBytes, 'Backup exceeds the byte budget.');
    media.push({
      key: item.key,
      ...(await store(body)),
      httpMetadata: object.httpMetadata,
      customMetadata: object.customMetadata,
    });
  }
  const identity = (items) => items.map(({ key, etag, size }) => ({ key, etag, size }));
  assert.deepEqual(identity(await list(source)), identity(objects), 'Media changed during backup.');
  assert.equal(hash(await exportSql()), database.sha256, 'CMS changed during backup; capture again.');
  const point = `${now.toISOString().slice(0, 10)}-${kind}`;
  const manifest = { version: 2, environment, kind, createdAt: now.toISOString(), database, media };
  await backups.put(`${prefix}points/${point}.json`, JSON.stringify(manifest));
  // Seven daily points plus the last pre-upgrade point; shared immutable bytes are stored once.
  const points = (await list(backups, `${prefix}points/`)).reverse();
  const keep = new Set();
  for (const selectedKind of ['daily', 'pre-upgrade']) {
    for (const item of points
      .filter((item) => item.key.endsWith(`-${selectedKind}.json`))
      .slice(0, selectedKind === 'daily' ? 7 : 1))
      keep.add(item.key);
  }
  const retained = new Set();
  for (const item of points) {
    if (!keep.has(item.key)) {
      await backups.delete(item.key);
      continue;
    }
    const saved = await (await backups.get(item.key)).json();
    for (const blob of [saved.database, ...saved.media]) retained.add(`${prefix}blobs/${blob.sha256}`);
  }
  for (const blob of await list(backups, `${prefix}blobs/`))
    if (!retained.has(blob.key)) await backups.delete(blob.key);
  return { point, objects: media.length, bytes };
}

export async function restoreCms({ backups, destination, importSql, environment, point }) {
  assert.match(point, /^\d{4}-\d{2}-\d{2}-(daily|pre-upgrade)$/);
  assert.ok(['local', 'uat', 'prd'].includes(environment));
  const prefix = `cms/${environment}/`;
  const object = await backups.get(`${prefix}points/${point}.json`);
  assert.ok(object, 'Backup point is missing.');
  const manifest = await object.json();
  assert.equal(manifest.version, 2);
  assert.equal(manifest.environment, environment);
  // ponytail: retain this small site's verified blobs in memory; use a disk cache for larger recovery points.
  const verified = new Map();
  async function read(blob) {
    assert.match(blob.sha256, /^[a-f0-9]{64}$/);
    let bytes = verified.get(blob.sha256);
    if (!bytes) {
      const object = await backups.get(`${prefix}blobs/${blob.sha256}`);
      assert.ok(object, 'Backup bytes are missing.');
      bytes = new Uint8Array(await object.arrayBuffer());
      assert.equal(hash(bytes), blob.sha256, 'Backup checksum mismatch.');
      verified.set(blob.sha256, bytes);
    }
    assert.equal(bytes.byteLength, blob.bytes);
    return bytes;
  }
  // Verify every blob before touching the isolated destination.
  for (const blob of [manifest.database, ...manifest.media]) await read(blob);
  for (const item of manifest.media)
    await destination.put(item.key, await read(item), {
      httpMetadata: item.httpMetadata?.cacheExpiry
        ? { ...item.httpMetadata, cacheExpiry: new Date(item.httpMetadata.cacheExpiry) }
        : item.httpMetadata,
      customMetadata: item.customMetadata,
    });
  await importSql(await read(manifest.database));
  return { point, objects: manifest.media.length };
}

export async function importCmsSql(bytes, destination) {
  const sqlite = new DatabaseSync(':memory:', { enableForeignKeyConstraints: false });
  const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
  try {
    const dump = JSON.parse(Buffer.from(bytes).toString('utf8'));
    assert.equal(typeof dump.schema, 'string');
    assert.equal(typeof dump.data, 'string');
    sqlite.exec(dump.schema);
    const triggers = sqlite.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'trigger'").all();
    for (const trigger of triggers) sqlite.exec(`DROP TRIGGER ${quote(trigger.name)}`);
    sqlite.exec(dump.data);
    for (const trigger of triggers) sqlite.exec(trigger.sql);
    const schema = sqlite
      .prepare("SELECT name, type, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE '_cf_%'")
      .all();
    const tables = sqlite
      .prepare('PRAGMA table_list')
      .all()
      .filter(
        (table) =>
          table.schema === 'main' &&
          ['table', 'virtual'].includes(table.type) &&
          !table.name.startsWith('sqlite_') &&
          !table.name.startsWith('_cf_'),
      );
    const statements = [destination.prepare('PRAGMA defer_foreign_keys=ON')];
    for (const table of tables)
      statements.push(destination.prepare(schema.find((item) => item.name === table.name).sql));
    for (const item of schema.filter((item) => item.type === 'index')) statements.push(destination.prepare(item.sql));
    for (const table of tables) {
      const columns = sqlite
        .prepare(`PRAGMA table_xinfo(${quote(table.name)})`)
        .all()
        .filter((column) => column.hidden === 0)
        .map((column) => column.name);
      if (table.type === 'virtual') columns.unshift('rowid');
      const rows = sqlite.prepare(`SELECT ${columns.map(quote).join(',')} FROM ${quote(table.name)}`).all();
      for (const row of rows)
        statements.push(
          destination
            .prepare(
              `INSERT INTO ${quote(table.name)} (${columns.map(quote).join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
            )
            .bind(
              ...columns.map((column) => (row[column] instanceof Uint8Array ? Array.from(row[column]) : row[column])),
            ),
        );
    }
    if (schema.some((item) => item.name === 'sqlite_sequence')) {
      statements.push(destination.prepare('DELETE FROM sqlite_sequence'));
      for (const row of sqlite.prepare('SELECT name, seq FROM sqlite_sequence').all())
        statements.push(
          destination.prepare('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)').bind(row.name, row.seq),
        );
    }
    for (const item of schema.filter((item) => ['trigger', 'view'].includes(item.type)))
      statements.push(destination.prepare(item.sql));
    statements.push(destination.prepare('PRAGMA defer_foreign_keys=OFF'));
    // ponytail: one transaction for this small CMS; dependency-aware batches if it grows beyond 10,000 statements.
    assert.ok(statements.length <= 10000, 'Recovery exceeds the transaction budget.');
    await destination.batch(statements);
  } finally {
    sqlite.close();
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      env: { type: 'string' },
      mode: { type: 'string', default: 'backup' },
      kind: { type: 'string', default: 'daily' },
      'backup-bucket': { type: 'string' },
      point: { type: 'string' },
      'recovery-database': { type: 'string' },
      'recovery-id': { type: 'string' },
      'recovery-bucket': { type: 'string' },
      'max-bytes': { type: 'string', default: String(256 * 1024 * 1024) },
      'hosted-budget-reviewed': { type: 'boolean', default: false },
    },
  });
  const environment = values.env;
  assert.ok(['local', 'uat', 'prd'].includes(environment), 'Select Local, UAT or PRD explicitly.');
  assert.ok(['backup', 'restore'].includes(values.mode));
  const remote = environment !== 'local';
  assert.ok(
    !remote || values['hosted-budget-reviewed'],
    'Review account-wide Free-tier budget before hosted backup/restore.',
  );
  assert.match(values['backup-bucket'] ?? '', /^blackbox-cms-backups-[a-z0-9-]+$/);
  const source = resources[environment];
  const restoring = values.mode === 'restore';
  if (restoring) {
    assert.match(values['recovery-database'] ?? '', /^blackbox-cms-recovery-[a-z0-9-]+$/);
    assert.match(values['recovery-bucket'] ?? '', /^blackbox-cms-recovery-[a-z0-9-]+$/);
    assert.match(values['recovery-id'] ?? '', /^[a-f0-9-]{36}$/);
    assert.ok(!Object.values(resources).some((item) => item.database_id === values['recovery-id']));
    const configured = ts.parseConfigFileTextToJson(
      'wrangler.jsonc',
      await readFile(join(backend, 'wrangler.jsonc'), 'utf8'),
    );
    assert.ok(!configured.error);
    const targets = [configured.config, ...Object.values(configured.config.env ?? {})];
    assert.ok(
      !targets.some((target) =>
        target.d1_databases?.some((database) => database.database_id === values['recovery-id']),
      ),
      'Recovery cannot target an application database.',
    );
  }
  const configPath = join(backend, `.cms-backup-${randomUUID()}.json`);
  await writeFile(
    configPath,
    JSON.stringify({
      name: 'blackbox-cms-backup-tool',
      compatibility_date: '2026-08-31',
      d1_databases: [
        {
          binding: 'CMS_DB',
          database_name: restoring ? values['recovery-database'] : source.database_name,
          database_id: restoring ? values['recovery-id'] : source.database_id,
          remote,
        },
      ],
      r2_buckets: [
        { binding: 'MEDIA', bucket_name: restoring ? values['recovery-bucket'] : source.bucket_name, remote },
        { binding: 'BACKUPS', bucket_name: values['backup-bucket'], remote },
      ],
    }),
  );
  const maxBytes = Number(values['max-bytes']);
  assert.ok(Number.isSafeInteger(maxBytes) && maxBytes > 0);
  const proxy = await getPlatformProxy({
    configPath,
    remoteBindings: remote,
    persist: { path: join(backend, '.wrangler/state/v3') },
    envFiles: [],
  });
  try {
    if (restoring) {
      const tables = await proxy.env.CMS_DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'",
      ).all();
      assert.equal(tables.results.length, 0, 'Recovery database must be empty.');
      assert.equal((await list(proxy.env.MEDIA)).length, 0, 'Recovery media bucket must be empty.');
    }
    const result = restoring
      ? await restoreCms({
          backups: proxy.env.BACKUPS,
          destination: proxy.env.MEDIA,
          environment,
          point: values.point,
          importSql: (bytes) => importCmsSql(bytes, proxy.env.CMS_DB),
        })
      : await backupCms({
          source: proxy.env.MEDIA,
          backups: proxy.env.BACKUPS,
          environment,
          kind: values.kind,
          maxBytes,
          exportSql: () => exportCmsSql(proxy.env.CMS_DB),
        });
    console.log(JSON.stringify({ environment, mode: values.mode, ...result }));
  } finally {
    await proxy.dispose();
    await rm(configPath, { force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
