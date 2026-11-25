import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { StaffClient } from './access';
import {
  cmsIdOf,
  distroFormatOf,
  OpsError,
  variantIdOf,
  type CmsId,
  type DistroCreate,
  type DistroSetup,
  type StockSet,
  type VariantId,
} from './arguments';

type Report = (message: string) => void;
type SavedDistro = { title: string; format: DistroCreate['format'] };
type DistroSource = { command: DistroCreate; image: CmsId } | { command: DistroSetup; saved: SavedDistro };

// Match the title normalization and operation suffix in Staff's editorialSlug.
function editorialSlug(title: string, operationId: string): string {
  const name = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
    .replace(/-$/, '');
  return `${name || 'item'}-${operationId}`;
}

export function distroSetupBody(distro: DistroSource, operationId: string) {
  const { command } = distro;
  const { title, format } = 'saved' in distro ? distro.saved : distro.command;
  const source =
    'saved' in distro
      ? { mode: 'existing' as const, sourceKind: 'distro' as const, id: distro.command.id }
      : {
          mode: 'create' as const,
          sourceKind: 'distro' as const,
          slug: editorialSlug(title, operationId),
          data: {
            title,
            artist_or_label: distro.command.artist,
            summary: distro.command.summary,
            image: { id: distro.image },
            image_alt: distro.command.alt,
            format,
            order: 0,
            product_condition: distro.command.condition,
          },
        };

  return {
    operationId,
    storeItemSlug: editorialSlug(`${title}-${format}`, operationId),
    source,
    itemType: format,
    price: { kind: 'fixed' as const, currencyCode: 'EUR' as const, amountMinor: command.price },
    openingQuantity: command.copies,
    zeroStockState: 'sold_out' as const,
    expectedMonth: null,
    confirmLiveSetup: true,
  };
}

function readResult<T>(schema: z.ZodType<T>, value: unknown, action: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new OpsError(`${action} returned an unexpected result.`);
  return result.data;
}

function editorialResult<T>(schema: z.ZodType<T>, value: unknown, action: string): T {
  return readResult(z.object({ success: z.literal(true), data: schema }), value, action).data;
}

const journalStatus = z.enum(['pending', 'completed', 'needs_review']);
const websiteStatus = z.enum(['pending', 'live', 'failed']);
const catalogResult = z.object({
  operationId: z.uuid(),
  variantId: z.string(),
  status: journalStatus,
  publicationStatus: websiteStatus.optional(),
});

async function readDistro(client: StaffClient, id: CmsId): Promise<SavedDistro> {
  const response = await client.request(`/_emdash/api/content/distro/${id}`);
  const { item } = editorialResult(
    z.object({
      item: z.object({
        id: z.literal(id),
        data: z.object({
          title: z.string().trim().min(1),
          group: z.unknown().optional(),
          format: z.unknown().optional(),
        }),
      }),
    }),
    response,
    'Distro lookup',
  );
  return { title: item.data.title, format: distroFormatOf(item.data.group || item.data.format) };
}

async function uploadArtwork(client: StaffClient, body: FormData): Promise<CmsId> {
  const response = await client.request('/_emdash/api/media', { body });
  const { item } = editorialResult(z.object({ item: z.object({ id: z.string() }) }), response, 'Artwork upload');
  return cmsIdOf(item.id);
}

function variantPath(variant: VariantId) {
  return `/api/internal/variants/${variant}`;
}

async function publishItem(client: StaffClient, variant: VariantId, report: Report): Promise<boolean> {
  const path = `${variantPath(variant)}/publication`;
  const detail = readResult(
    z.object({
      expectedRevision: z.number().int().positive(),
      cmsRevision: z.string().min(1).max(512),
      pending: z.object({ operationId: z.uuid() }).nullable(),
      operationStatus: journalStatus.nullish(),
      publicationStatus: websiteStatus.nullish(),
    }),
    await client.request(path),
    'Publication lookup',
  );
  if (detail.pending || detail.operationStatus === 'needs_review' || detail.publicationStatus === 'failed') {
    const retainedId = detail.pending ? ` operationId ${detail.pending.operationId}` : '';
    report(
      `Publication${retainedId} status ${detail.publicationStatus === 'failed' ? 'failed' : (detail.operationStatus ?? 'pending')}.`,
    );
    return false;
  }

  const operationId = randomUUID();
  report(`Publication operationId ${operationId}.`);
  const result = readResult(
    catalogResult,
    await client.request(path, {
      body: {
        operationId,
        expectedRevision: detail.expectedRevision,
        cmsRevision: detail.cmsRevision,
        confirmLivePublication: true,
        retryPublication: false,
      },
    }),
    'Publication',
  );
  if (result.operationId !== operationId || result.variantId !== variant) {
    throw new OpsError('Publication returned a different operation or variant.');
  }
  const website = result.publicationStatus ? ` (website ${result.publicationStatus})` : '';
  report(`Publication operationId ${operationId} status ${result.status}${website}.`);
  return result.status === 'completed' && (!result.publicationStatus || result.publicationStatus === 'live');
}

export async function setUpDistro(
  client: StaffClient,
  command: DistroCreate | DistroSetup,
  artwork: FormData | undefined,
  operationId: string,
  report: Report,
): Promise<boolean> {
  let distro: DistroSource;
  if (command.action === 'distro create') {
    if (!artwork) throw new OpsError('Artwork is required.');
    const image = await uploadArtwork(client, artwork);
    report(`Artwork uploaded as ${image}.`);
    distro = { command, image };
  } else {
    distro = { command, saved: await readDistro(client, command.id) };
  }
  const body = distroSetupBody(distro, operationId);
  const result = readResult(catalogResult, await client.request('/api/internal/items/setup', { body }), 'Distro setup');
  if (result.operationId !== operationId) throw new OpsError('Distro setup returned a different operation.');

  const variant = variantIdOf(result.variantId);
  report(`Distro setup operationId ${operationId} status ${result.status} for ${variant}.`);
  if (result.status !== 'completed') return false;
  return command.publish ? publishItem(client, variant, report) : true;
}

export async function setStock(client: StaffClient, command: StockSet, operationId: string, report: Report) {
  const path = `${variantPath(command.variant)}/stock`;
  const nonnegativeInt = z.number().int().nonnegative();
  const current = readResult(
    z.object({
      variantId: z.literal(command.variant),
      stock: z.object({ revision: nonnegativeInt.nullable() }),
      owedQuantity: nonnegativeInt,
    }),
    await client.request(path),
    'Stock lookup',
  );
  const result = readResult(
    z.object({
      variantId: z.literal(command.variant),
      entry: z.object({ type: z.literal('count'), id: z.string().regex(/^[\w-]+$/) }),
      shortfall: nonnegativeInt.nullable(),
    }),
    await client.request(`${path}/counts`, {
      idempotencyKey: randomUUID(),
      body: {
        expectedRevision: current.stock.revision,
        countedQuantity: command.copies,
        onlineQuantity: Math.max(0, command.copies - current.owedQuantity),
        notes: null,
      },
    }),
    'Stock count',
  );
  const shortfall = result.shortfall ? `, shortfall ${result.shortfall}` : '';
  report(`Stock operationId ${operationId} status completed (count ${result.entry.id}${shortfall}).`);
  return true;
}
