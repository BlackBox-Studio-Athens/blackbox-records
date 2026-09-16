import { createHash } from 'node:crypto';
import { globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const web = path.join(root, 'apps/web');
const webRequire = createRequire(path.join(web, 'package.json'));
const astroRequire = createRequire(webRequire.resolve('astro/package.json'));
const markdownRequire = createRequire(astroRequire.resolve('@astrojs/markdown-satteri'));
const { markdownToMdast } = markdownRequire('satteri');
export const parseMarkdown = markdownToMdast;
const { slug: githubSlug } = astroRequire('github-slugger');
const sharp = webRequire('sharp');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
const imageExtension = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;

export function readSource(source, extension) {
  if (extension === '.json') return { data: JSON.parse(source), body: '' };
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source);
  if (!match) throw new Error('Markdown must have delimited YAML frontmatter');
  const data = parse(match[1], { uniqueKeys: true, maxAliasCount: 100 });
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected frontmatter object');
  return { data, body: match[2] };
}

export function sourceId(filename, data) {
  return data.slug
    ? String(data.slug)
    : filename
        .replace(/\.[^.]+$/, '')
        .split('/')
        .map(githubSlug)
        .join('/')
        .replace(/\/index$/, '');
}

function collectionDefinitions(source) {
  const syntax = ts.createSourceFile('content.config.ts', source, ts.ScriptTarget.Latest, true);
  const definitions = [];
  let exported;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(syntax) === 'collections') {
      exported = node.initializer.properties.map((property) => property.name.getText(syntax));
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(syntax) === 'defineCollection'
    ) {
      const definition = { name: node.name.getText(syntax), references: [] };
      function inspect(child) {
        if (ts.isCallExpression(child) && child.expression.getText(syntax) === 'publicContentLoader') {
          const [collection, pattern, base] = child.arguments;
          if (![collection, pattern, base].every(ts.isStringLiteral) || collection.text !== definition.name)
            throw new Error('Inventory requires literal source configuration');
          definition.pattern = pattern.text;
          definition.base = base.text;
        }
        if (ts.isCallExpression(child) && child.expression.getText(syntax) === 'glob') {
          for (const property of child.arguments[0].properties) {
            if (!ts.isStringLiteral(property.initializer))
              throw new Error('Inventory requires literal glob configuration');
            definition[property.name.getText(syntax)] = property.initializer.text;
          }
        }
        if (
          ts.isPropertyAssignment(child) &&
          ts.isCallExpression(child.initializer) &&
          child.initializer.expression.getText(syntax) === 'reference'
        ) {
          definition.references.push({
            field: child.name.getText(syntax),
            collection: child.initializer.arguments[0].text,
          });
        }
        ts.forEachChild(child, inspect);
      }
      inspect(node.initializer);
      if (!definition.base || !definition.pattern) throw new Error(`Missing loader for ${definition.name}`);
      definitions.push(definition);
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  if (!exported || definitions.length !== exported.length || definitions.some(({ name }) => !exported.includes(name))) {
    throw new Error('Collection exports differ from discovered loaders');
  }
  return definitions.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

export async function inventory() {
  const config = readFileSync(path.join(web, 'src/content.config.ts'), 'utf8');
  const collections = collectionDefinitions(config);
  const records = [];
  const anomalies = [];
  const media = new Map();
  for (const base of ['src/content', 'public/assets']) {
    for (const file of globSync('**/*', { cwd: path.join(web, base), withFileTypes: true })) {
      if (!file.isFile() || !imageExtension.test(file.name)) continue;
      const absolute = path.join(file.parentPath, file.name);
      const bytes = readFileSync(absolute);
      const metadata = await sharp(bytes).metadata();
      media.set(relative(absolute), {
        path: relative(absolute),
        sha256: hash(bytes),
        bytes: bytes.length,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        references: [],
      });
    }
  }
  function recordImage(value, file, field, record, alt) {
    const absolute = value.startsWith('/assets/')
      ? path.join(web, 'public', value)
      : path.resolve(path.dirname(file), value);
    const item = media.get(relative(absolute));
    if (!item) anomalies.push({ code: 'MISSING_IMAGE', source: record.source, field, value });
    else item.references.push({ source: record.source, field, original: value, ...(alt === undefined ? {} : { alt }) });
  }
  for (const collection of collections) {
    const base = path.resolve(web, collection.base);
    const files = globSync(collection.pattern, { cwd: base }).sort();
    collection.count = files.length;
    for (const filename of files) {
      const file = path.join(base, filename);
      const source = readFileSync(file, 'utf8');
      const { data, body } = readSource(source, path.extname(file));
      const id = sourceId(filename.split(path.sep).join('/'), data);
      const record = {
        collection: collection.name,
        id,
        source: relative(file),
        sha256: hash(source),
        data,
        body,
        fields: [],
        markdown: {},
        links: [],
        references: [],
      };
      function walk(value, field = '', parent = {}) {
        if (field) record.fields.push(field);
        if (typeof value === 'string' && imageExtension.test(value)) {
          recordImage(value, file, field, record, parent[`${field.split('.').at(-1)}_alt`]);
        } else if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, `${field}[${index}]`));
        else if (value && typeof value === 'object') {
          for (const [key, child] of Object.entries(value)) walk(child, field ? `${field}.${key}` : key, value);
        }
      }
      walk(data);
      if (path.extname(file) === '.mdx') anomalies.push({ code: 'MDX_REQUIRES_CONVERSION', source: record.source });
      function markdown(node) {
        record.markdown[node.type] = (record.markdown[node.type] ?? 0) + 1;
        if (node.type === 'link' || node.type === 'definition') record.links.push(node.url);
        if (node.type === 'image') recordImage(node.url, file, 'body', record, node.alt);
        for (const child of node.children ?? []) markdown(child);
      }
      if (body.trim()) markdown(markdownToMdast(body));
      for (const relation of collection.references) {
        record.references.push({ ...relation, id: data[relation.field] });
      }
      records.push(record);
    }
  }
  const identities = new Set();
  for (const record of records) {
    const key = `${record.collection}/${record.id}`;
    if (identities.has(key)) anomalies.push({ code: 'DUPLICATE_ID', source: record.source, key });
    identities.add(key);
  }
  for (const record of records) {
    for (const reference of record.references) {
      if (!identities.has(`${reference.collection}/${reference.id}`))
        anomalies.push({ code: 'MISSING_REFERENCE', source: record.source, ...reference });
    }
  }
  const images = [...media.values()].sort((a, b) => a.path.localeCompare(b.path, 'en'));
  return {
    version: 1,
    configSha256: hash(config),
    collections,
    recordCount: records.length,
    mediaCount: images.length,
    mediaBytes: images.reduce((sum, item) => sum + item.bytes, 0),
    records,
    media: images,
    anomalies,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: { output: { type: 'string', default: '.codex-artifacts/emdash-migration/source-manifest.json' } },
  });
  const manifest = await inventory();
  const output = path.resolve(root, values.output);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        output: relative(output),
        sha256: hash(readFileSync(output)),
        collections: manifest.collections.map(({ name, count }) => ({ name, count })),
        records: manifest.recordCount,
        media: manifest.mediaCount,
        bytes: manifest.mediaBytes,
        anomalies: manifest.anomalies,
      },
      null,
      2,
    ),
  );
  if (manifest.anomalies.length) process.exitCode = 1;
}
