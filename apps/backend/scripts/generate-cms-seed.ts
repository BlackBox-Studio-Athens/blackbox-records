import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import type { SeedFile, SeedField } from 'emdash';
import { cmsContentSchemas } from '../src/cms/content-schema';

const collections: NonNullable<SeedFile['collections']> = Object.entries(cmsContentSchemas).map(([slug, schema]) => {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' });
  const variants = json.oneOf ?? [json];
  const properties = Object.assign({}, ...variants.map((variant) => variant.properties ?? {})) as Record<
    string,
    z.core.JSONSchema.JSONSchema
  >;
  const required = new Set(variants.flatMap((variant) => variant.required ?? []));
  const fields: SeedField[] = Object.entries(properties).map(([name, property]) => {
    let type: SeedField['type'] = 'json';
    if (property.type === 'string') type = property.format === 'date' ? 'datetime' : 'string';
    if (property.type === 'integer' || property.type === 'number' || property.type === 'boolean') type = property.type;
    if (name === 'image' || name === 'cover_image') type = 'image';
    if (name === 'body') type = 'portableText';
    if (slug === 'releases' && name === 'artist') type = 'reference';
    return {
      slug: name,
      label: name.replaceAll('_', ' '),
      type,
      required: required.has(name),
      ...(type === 'reference' ? { options: { collection: 'artists' } } : {}),
    };
  });
  return {
    slug,
    label: slug.replaceAll('_', ' '),
    routable: false,
    supports: ['drafts', 'revisions', 'preview'],
    fields,
  };
});

const seed = { version: '1', collections } satisfies SeedFile;
mkdirSync('.emdash', { recursive: true });
writeFileSync('.emdash/seed.json', `${JSON.stringify(seed, null, 2)}\n`);
console.log(`Prepared ${collections.length} CMS collection schemas; no content or hosted resources changed.`);
