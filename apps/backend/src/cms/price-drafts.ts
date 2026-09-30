import { z } from 'zod';
import { PluginRouteError } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import type { PluginContext, RouteEntry, SandboxedRouteContext } from 'emdash/plugin';

// A price draft is private staff plugin state. It is never Price Authority and never enters a publication
// snapshot; only the confirmed commerce command changes a selling price.
export const editorialPluginId = 'blackbox-editorial';
export const priceDraftRoute = 'price-drafts';
const keyPrefix = 'price-draft:';
const identity = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const collection = z.enum(['releases', 'distro']);
// Staff price policy stays in the commerce command; this bound matches the staff input range.
const minor = z.number().int().min(0).max(99_999_999);

const priceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fixed'), currencyCode: z.literal('EUR'), amountMinor: minor }).strict(),
  z
    .object({
      kind: z.literal('pay_what_you_want'),
      currencyCode: z.literal('EUR'),
      minimumAmountMinor: minor,
      presetAmountMinor: minor,
      maximumAmountMinor: minor,
    })
    .strict(),
]);

const format = z.string().min(1).max(64);
const cmsRevision = z.string().min(1).max(512);
const expectedRevision = z.number().int().min(0);

// One publish attempt: exactly the idempotent command a retry must resend, on any device.
const attemptSchema = z.discriminatedUnion('command', [
  z.object({ command: z.literal('change'), operationId: z.uuid(), expectedRevision }).strict(),
  z
    .object({
      command: z.literal('initialize'),
      operationId: z.uuid(),
      expectedRevision,
      cmsRevision,
      itemType: format,
    })
    .strict(),
]);

const draftSchema = z
  .object({
    collection,
    recordId: identity,
    price: priceSchema,
    /** Format chosen for a first price before any attempt. */
    itemType: format.optional(),
    /** The live amount the member saw while typing; a different live price is a conflict. */
    liveAmountWhenStaged: minor.nullable(),
    attempt: attemptSchema.nullable(),
  })
  .strict()
  .refine(
    ({ price }) =>
      price.kind === 'fixed' ||
      (price.minimumAmountMinor <= price.presetAmountMinor && price.presetAmountMinor <= price.maximumAmountMinor),
    'Minimum must not exceed suggested price, and suggested price must not exceed maximum.',
  );

export type PriceDraft = z.infer<typeof draftSchema>;
/** The KV value. */
export type StoredPriceDraft = PriceDraft & { updatedBy: string | null; updatedAt: string };
/** What the route returns: the stored value with its compare-and-set revision. */
export type PriceDraftRecord = StoredPriceDraft & { revision: string };

const readSchema = z.object({ collection: collection.optional(), id: identity.optional() }).strict();
const writeSchema = z.object({ draft: draftSchema, revision: z.string().min(1).max(512).nullable() }).strict();
const deleteSchema = z.object({ collection, recordId: identity, revision: z.string().min(1).max(512) }).strict();

export const priceDraftKey = (target: { collection: string; recordId: string }) =>
  `${keyPrefix}${target.collection}:${target.recordId}`;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw PluginRouteError.badRequest(result.error.issues[0]?.message ?? 'Invalid price draft.');
  return result.data;
}

async function read(routeCtx: SandboxedRouteContext, ctx: PluginContext) {
  const query = parse(readSchema, routeCtx.input ?? {});
  if (query.collection && query.id) {
    const stored = await ctx.kv.getVersioned<StoredPriceDraft>(
      priceDraftKey({ collection: query.collection, recordId: query.id }),
    );
    const items: PriceDraftRecord[] = stored ? [{ ...stored.value, revision: stored.revision }] : [];
    return { items };
  }
  if (query.collection || query.id) throw PluginRouteError.badRequest('Select both a collection and a record.');
  // ponytail: one prefix list plus a versioned read per draft; drafts are a handful of catalog items,
  // add paging if they grow past hundreds. Revisions let editors save or clear a listed draft directly.
  const entries = await ctx.kv.list(keyPrefix);
  const stored = await Promise.all(entries.map((entry) => ctx.kv.getVersioned<StoredPriceDraft>(entry.key)));
  const items: PriceDraftRecord[] = stored.flatMap((entry) =>
    entry ? [{ ...entry.value, revision: entry.revision }] : [],
  );
  return { items };
}

async function write(routeCtx: SandboxedRouteContext, ctx: PluginContext) {
  const { draft, revision } = parse(writeSchema, routeCtx.input);
  const value: StoredPriceDraft = {
    ...draft,
    updatedBy: routeCtx.user?.email ?? null,
    updatedAt: new Date().toISOString(),
  };
  const result = await ctx.kv.compareAndSet(priceDraftKey(draft), revision, value);
  if (!result.applied) throw PluginRouteError.conflict('Someone else changed this price draft. Load it again.');
  const item: PriceDraftRecord = { ...value, revision: result.revision };
  return { item };
}

async function remove(routeCtx: SandboxedRouteContext, ctx: PluginContext) {
  const target = parse(deleteSchema, routeCtx.input);
  const result = await ctx.kv.compareAndDelete(priceDraftKey(target), target.revision);
  if (!result.applied) throw PluginRouteError.conflict('Someone else changed this price draft. Load it again.');
  return { deleted: true };
}

export const priceDraftRouteEntry: RouteEntry = {
  permission: 'content:edit_own',
  methods: ['GET', 'PUT', 'DELETE'],
  handler: async (routeCtx, ctx) => {
    const method = routeCtx.request.method.toUpperCase();
    if (method === 'PUT') return write(routeCtx, ctx);
    if (method === 'DELETE') return remove(routeCtx, ctx);
    return read(routeCtx, ctx);
  },
};

// Server-side discovery reads through the plugin route, never the plugin's private storage table.
export async function readPriceDrafts(
  runtime: Pick<EmDashRuntime, 'handlePluginApiRoute'>,
  origin: string,
): Promise<PriceDraftRecord[]> {
  const path = `/_emdash/api/plugins/${editorialPluginId}/${priceDraftRoute}`;
  const result = await runtime.handlePluginApiRoute(
    editorialPluginId,
    'GET',
    priceDraftRoute,
    new Request(origin + path),
  );
  if (!result.success) throw new Error('Price drafts could not be loaded.');
  return (result.data as { items: PriceDraftRecord[] }).items;
}

export async function deletePriceDraftFor(ctx: PluginContext, target: { collection: string; recordId: string }) {
  if (!collection.safeParse(target.collection).success) return;
  await ctx.kv.delete(priceDraftKey(target));
}
