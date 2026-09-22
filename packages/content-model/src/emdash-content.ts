import { z } from 'zod';
import {
  createArtistsContentSchema,
  createReleasesContentSchema,
  createNewsContentSchema,
  createHomeContentSchema,
  createAboutContentSchema,
  createServicesContentSchema,
  distroPageContentSchema,
  navigationContentSchema,
  socialsContentSchema,
  settingsContentSchema,
  newsletterContentSchema,
} from './schemas';
import { createDistroContentSchema } from './distro-content-schema';
import { purchaseInformationSchema } from './purchase-information-schema';
import { textBlockSchema, richTextSchema, proseSchema, requiredProseSchema, projectProseFields } from './prose';

const mediaId = z.string().min(1).max(128);
const image = () => z.object({ id: mediaId }).strict();
const key = z.string().min(1).max(128);
const bodyError =
  'Unsupported full-text formatting. Undo or remove the last block or formatting change. Use paragraphs, headings, lists, quotes, links, images with descriptions, or code; HTML, tables and galleries are not supported.';
export const cmsBodySchema = z.array(
  z.union(
    [
      textBlockSchema,
      z
        .object({
          _type: z.literal('image'),
          _key: key,
          asset: z.object({ _ref: mediaId }).strict(),
          alt: z.string().trim().min(1),
        })
        .strict(),
      z
        .object({
          _type: z.literal('code'),
          _key: key,
          code: z.string(),
          language: z.string().optional(),
          filename: z.string().optional(),
        })
        .strict(),
    ],
    {
      error: bodyError,
    },
  ),
);

export const cmsContentSchemas = {
  artists: createArtistsContentSchema(image).omit({ slug: true }).extend({ body: cmsBodySchema.optional() }),
  releases: createReleasesContentSchema(image, { artist: mediaId }).extend({
    body: cmsBodySchema.optional(),
    release_date: z.iso.date(),
  }),
  news: createNewsContentSchema(image).extend({ body: cmsBodySchema.optional(), date: z.iso.date() }),
  distro: createDistroContentSchema(image).extend({ release_date: z.iso.date().optional() }),
  distro_page: distroPageContentSchema,
  navigation: navigationContentSchema,
  socials: socialsContentSchema,
  settings: settingsContentSchema,
  newsletter: newsletterContentSchema,
  home: createHomeContentSchema(image),
  about: createAboutContentSchema(image),
  services: createServicesContentSchema(image),
  purchase_information: purchaseInformationSchema,
} satisfies Record<string, z.ZodType>;

export type CmsCollection = keyof typeof cmsContentSchemas;
export type CmsContentIssue = {
  path: Array<string | number>;
  message: string;
};
export const sourceCollectionNames: Record<CmsCollection, string> = {
  artists: 'artists',
  releases: 'releases',
  news: 'news',
  distro: 'distro',
  distro_page: 'distroPage',
  navigation: 'navigation',
  socials: 'socials',
  settings: 'settings',
  newsletter: 'newsletter',
  home: 'home',
  about: 'about',
  services: 'services',
  purchase_information: 'purchaseInformation',
};

export function isCmsCollection(value: string): value is CmsCollection {
  return Object.hasOwn(cmsContentSchemas, value);
}

// EmDash stores absent optional columns as null. Validate that representation as
// absent, while still rejecting unknown keys and null required fields.
export function getCmsContentIssues(collection: CmsCollection, data: Record<string, unknown>): CmsContentIssue[] {
  const schema = cmsContentSchemas[collection];
  const known =
    collection === 'purchase_information' ? ['publication', 'content'] : Object.keys((schema as z.ZodObject).shape);
  const normalized = Object.fromEntries(
    Object.entries(projectProseFields(collection, data)).filter(
      ([field, value]) => value !== null || !known.includes(field),
    ),
  );
  const result = schema.safeParse(normalized);
  if (!result.success)
    return result.error.issues.map((issue) => ({
      path: issue.path.map((segment) => (typeof segment === 'number' ? segment : String(segment))),
      message: issue.message,
    }));
  const issues: CmsContentIssue[] = [];
  function unknownFields(input: unknown, parsed: unknown, path: Array<string | number> = []) {
    if (!input || typeof input !== 'object' || !parsed || typeof parsed !== 'object') return;
    for (const [name, value] of Object.entries(input)) {
      const next = [...path, Array.isArray(input) ? Number(name) : name];
      if (!Object.hasOwn(parsed, name)) issues.push({ path: next, message: 'Unsupported field.' });
      else unknownFields(value, (parsed as Record<string, unknown>)[name], next);
    }
  }
  unknownFields(normalized, result.data);
  return issues;
}

export function validateCmsContent(collection: CmsCollection, data: Record<string, unknown>) {
  return getCmsContentIssues(collection, data).map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

// Drafts may omit unfinished fields, but never introduce unknown fields, unsafe
// links, invalid types, or unsupported rich-text blocks. Publication uses the
// complete schemas above, including their cross-field refinements.
function draftSchema(schema: z.ZodType): z.ZodType {
  if (schema === cmsBodySchema) return cmsBodySchema.optional().nullable();
  if (schema === richTextSchema) return richTextSchema.optional().nullable();
  if (schema === proseSchema || schema === requiredProseSchema) return proseSchema.optional().nullable();
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault)
    return draftSchema(schema.unwrap() as z.ZodType);
  if (schema instanceof z.ZodObject)
    return z
      .object(
        Object.fromEntries(
          Object.entries(schema.shape).map(([name, field]) => [name, draftSchema(field as z.ZodType)]),
        ),
      )
      .strict()
      .optional()
      .nullable();
  if (schema instanceof z.ZodArray)
    return z
      .array(draftSchema(schema.element as z.ZodType))
      .max(1000)
      .optional()
      .nullable();
  if (schema instanceof z.ZodUnion)
    return z
      .union(schema.options.map((option) => draftSchema(option as z.ZodType)))
      .optional()
      .nullable();
  return z
    .union([schema, z.literal('')])
    .optional()
    .nullable();
}
const cmsDraftSchemas = Object.fromEntries(
  Object.entries(cmsContentSchemas).map(([name, schema]) => [name, draftSchema(schema)]),
);

export function validateCmsDraft(collection: CmsCollection, data: Record<string, unknown>): string[] {
  if (JSON.stringify(data).length > 256 * 1024) return ['Draft is too large.'];
  const result = cmsDraftSchemas[collection]!.safeParse(data);
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

export function contentMediaIds(data: unknown): string[] {
  const ids = new Set<string>();
  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    // Native revisions enrich local image references with dimensions/provider metadata.
    if (typeof record.id === 'string' && (Object.keys(record).length === 1 || record.provider === 'local'))
      ids.add(record.id);
    if (typeof record._ref === 'string') ids.add(record._ref);
    for (const child of Object.values(record)) visit(child);
  }
  visit(data);
  return [...ids];
}

// Validate native revision enrichment without weakening the editorial write contract.
export function validateCmsRevisionContent(collection: CmsCollection, data: Record<string, unknown>) {
  const revisionImage = z
    .object({
      id: mediaId,
      provider: z.literal('local'),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      filename: z.string().min(1).max(200).optional(),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']).optional(),
      blurhash: z.string().optional(),
      dominantColor: z.string().optional(),
      alt: z.string().optional(),
      focalX: z.number().min(0).max(1).optional(),
      focalY: z.number().min(0).max(1).optional(),
      meta: z
        .object({
          storageKey: z.string().min(1),
          caption: z.string().nullable().optional(),
          blurhash: z.string().nullable().optional(),
          dominantColor: z.string().nullable().optional(),
        })
        .strict()
        .optional(),
    })
    .strict();
  function editorialValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(editorialValue);
    if (!value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    if (record.provider === 'local' && revisionImage.safeParse(record).success) return { id: record.id };
    return Object.fromEntries(Object.entries(record).map(([key, child]) => [key, editorialValue(child)]));
  }
  return validateCmsContent(collection, editorialValue(data) as Record<string, unknown>);
}
