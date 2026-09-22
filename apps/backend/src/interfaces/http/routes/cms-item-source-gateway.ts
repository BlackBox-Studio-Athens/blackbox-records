import { z } from 'zod';
import type { CmsItemSourceGateway, CmsItemSourceSelection } from '../../../application/commerce/catalog-sync';
import { createStripeCatalogRequestShapeFingerprint } from '../../../application/commerce/catalog-sync';
import { CatalogOperationConflictError } from '../../../domain/commerce/repositories/spi';

const identifier = z
  .string()
  .min(1)
  .max(128)
  .refine((value) => value === value.trim());
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(128);
const sourceKind = z.enum(['release', 'distro']);
const selectionSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('existing'), sourceKind, id: identifier }).strict(),
  z.object({ mode: z.literal('create'), sourceKind, slug, data: z.record(z.string(), z.json()) }).strict(),
]);
const sourceSchema = z.object({ id: identifier, slug, data: z.record(z.string(), z.unknown()) });

// CMS reads expand media and may serialize booleans as integers. Never rewrite a source to match a retry.
function normalize(value: unknown, expected: unknown): unknown {
  if (typeof expected === 'boolean' && (value === 0 || value === 1)) return value === 1;
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value))
    return value.map((item, index) => normalize(item, Array.isArray(expected) ? expected[index] : undefined));
  const shape = expected && typeof expected === 'object' ? (expected as Record<string, unknown>) : {};
  if (Object.keys(shape).length === 1 && typeof shape.id === 'string')
    return { id: (value as Record<string, unknown>).id };
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, item]) => item !== null || Object.hasOwn(shape, key))
      .map(([key, item]) => [key, normalize(item, shape[key])]),
  );
}

export function createCmsItemSourceGateway(
  cms: Pick<Fetcher, 'fetch'>,
  operatorRequest: Request,
): CmsItemSourceGateway {
  const origin = new URL(operatorRequest.url).origin;
  const headers = new Headers({ 'Content-Type': 'application/json', 'X-EmDash-Request': '1', Origin: origin });
  const assertion = operatorRequest.headers.get('Cf-Access-Jwt-Assertion');
  if (assertion) headers.set('Cf-Access-Jwt-Assertion', assertion);
  async function request(path: string, body?: unknown) {
    const response = await cms.fetch(
      new Request(origin + '/_emdash/api/content/' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        redirect: 'manual',
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    if (response.status === 404 && body === undefined) return null;
    if (!response.ok) throw new Error(`CMS source request failed (${response.status}).`);
    const result = z.object({ data: z.object({ item: sourceSchema }) }).parse(await response.json());
    return result.data.item;
  }
  return {
    async ensureSource(input: CmsItemSourceSelection) {
      const selection = selectionSchema.parse(input);
      const collection = selection.sourceKind === 'release' ? 'releases' : 'distro';
      const identifier = selection.mode === 'existing' ? selection.id : selection.slug;
      const existing = await request(collection + '/' + encodeURIComponent(identifier));
      if (selection.mode === 'existing') {
        if (!existing || existing.id !== selection.id)
          throw new CatalogOperationConflictError('Selected CMS source is unavailable.');
        return existing;
      }
      const source = existing ?? (await request(collection, { slug: selection.slug, data: selection.data }));
      if (
        !source ||
        source.slug !== selection.slug ||
        createStripeCatalogRequestShapeFingerprint(normalize(source.data, selection.data)) !==
          createStripeCatalogRequestShapeFingerprint(selection.data)
      )
        throw new CatalogOperationConflictError(
          'Source content differs; select the existing source or choose another slug.',
        );
      return source;
    },
  };
}
