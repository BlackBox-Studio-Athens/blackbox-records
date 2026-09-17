import { createRoute, z } from '@hono/zod-openapi';
import {
  catalogItemPublishSchema,
  publishCatalogItem,
  CatalogPriceConflictError,
} from '../../../application/commerce/catalog-sync';
import { CatalogOperationConflictError } from '../../../domain/commerce/repositories/spi';
import { parseVariantId } from '../../../domain/commerce';
import { productEnvironmentProfileFromBindings, type AppOpenApi } from '../../../env';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../infrastructure/persistence/prisma';
import { createStripeCatalogGateway } from '../../../infrastructure/stripe';
import { backendErrorResponseSchema, jsonError, jsonNoStore, operatorAccessErrorResponses } from '../responses';
import { createCmsItemPublicationGateway } from './cms-item-publication-gateway';

const resultSchema = z
  .object({
    operationId: z.string(),
    variantId: z.string(),
    status: z.enum(['pending', 'completed', 'needs_review']),
    publicationId: z.uuid().optional(),
    publicationStatus: z.enum(['pending', 'live', 'failed']).optional(),
  })
  .strict()
  .openapi('CatalogItemPublishResult');
const detailSchema = z
  .object({
    expectedRevision: z.number().int().positive(),
    cmsRevision: z.string(),
    requiresLiveConfirmation: z.boolean(),
    title: z.string(),
    collection: z.enum(['releases', 'distro']),
    cmsSourceId: z.string(),
    availability: z.enum(['published', 'withheld', 'retired']),
    pending: catalogItemPublishSchema.nullable(),
    operationStatus: z.enum(['pending', 'completed', 'needs_review']).nullable().optional(),
    publicationStatus: z.enum(['pending', 'live', 'failed']).nullable().optional(),
  })
  .strict()
  .openapi('CatalogItemPublishDetail');
const params = z.object({ variantId: z.string().regex(/^variant_[A-Za-z0-9_-]+$/) });
const errors = {
  400: { description: 'Invalid request.', content: { 'application/json': { schema: backendErrorResponseSchema } } },
  403: {
    description: 'Same-origin operator request required.',
    content: { 'application/json': { schema: backendErrorResponseSchema } },
  },
  409: {
    description: 'Item or content requires review.',
    content: { 'application/json': { schema: backendErrorResponseSchema } },
  },
  ...operatorAccessErrorResponses,
  503: {
    description: 'Publication unavailable. Retry the retained operation.',
    content: { 'application/json': { schema: backendErrorResponseSchema } },
  },
};

export function registerInternalPublicationRoutes(app: AppOpenApi) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/internal/variants/{variantId}/publication',
      operationId: 'readCatalogItemPublication',
      tags: ['Internal catalog'],
      summary: 'Read linked content and any retained item publication.',
      request: { params },
      responses: {
        200: { description: 'Publication detail.', content: { 'application/json': { schema: detailSchema } } },
        ...errors,
      },
    }),
    async (context) => {
      const prisma = createPrismaClient(context.env);
      try {
        const catalog = new PrismaStoreItemOptionRepository(prisma);
        const item = await catalog.findByVariantId(parseVariantId(context.req.valid('param').variantId));
        const record = item && (await catalog.findByStoreItem(item));
        if (!record?.cmsSourceId || record.catalogRevision < 1 || !context.env.CMS_RUNTIME)
          throw new CatalogPriceConflictError('Item setup is incomplete.');
        const cms = createCmsItemPublicationGateway(context.env.CMS_RUNTIME.getByName('editorial'), context.req.raw);
        const source = await cms.read(record);
        const pending = await prisma.catalogOperation.findFirst({
          where: { variantId: record.variantId, kind: 'item_publish', status: { not: 'completed' } },
        });
        const retained = pending && (await new D1CatalogOperationRepository(context.env.COMMERCE_DB).find(pending.id));
        const requiresLiveConfirmation =
          productEnvironmentProfileFromBindings(context.env).workerDeploymentTarget === 'prd';
        return jsonNoStore(
          context.json(
            detailSchema.parse({
              ...source,
              expectedRevision: record.catalogRevision,
              availability: record.catalogAvailability,
              requiresLiveConfirmation,
              operationStatus: retained?.status ?? null,
              publicationStatus: retained?.results.publicationId
                ? (await cms.readPublication(retained.results.publicationId)).status
                : null,
              pending: retained?.results.cmsRevision
                ? {
                    operationId: retained.id,
                    expectedRevision: retained.expectedRevision,
                    cmsRevision: retained.results.cmsRevision,
                    confirmLivePublication: requiresLiveConfirmation,
                    retryPublication: false,
                  }
                : null,
            }),
            200,
          ),
        );
      } catch (error) {
        return error instanceof CatalogPriceConflictError
          ? jsonError(context, {
              code: 'catalog_conflict',
              message: 'Complete item setup before publishing.',
              status: 409,
            })
          : jsonError(context, {
              code: 'catalog_temporarily_unavailable',
              message: 'Publication detail is unavailable.',
              status: 503,
            });
      } finally {
        await prisma.$disconnect();
      }
    },
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/internal/variants/{variantId}/publication',
      operationId: 'publishCatalogItem',
      tags: ['Internal catalog'],
      summary: 'Publish an item without changing its Price or opening stock.',
      request: {
        params,
        headers: z.object({ origin: z.string().optional(), 'x-blackbox-request': z.string().optional() }),
        body: { required: true, content: { 'application/json': { schema: catalogItemPublishSchema } } },
      },
      responses: {
        200: { description: 'Retained publication status.', content: { 'application/json': { schema: resultSchema } } },
        ...errors,
      },
    }),
    async (context) => {
      if (
        context.req.header('origin') !== new URL(context.req.url).origin ||
        context.req.header('x-blackbox-request') !== '1'
      )
        return jsonError(context, {
          code: 'forbidden',
          message: 'Same-origin operator request required.',
          status: 403,
        });
      const prisma = createPrismaClient(context.env);
      try {
        if (!context.env.CMS_RUNTIME) throw new Error('CMS unavailable');
        const result = await publishCatalogItem(
          {
            environment: productEnvironmentProfileFromBindings(context.env).workerDeploymentTarget,
            catalog: new PrismaStoreItemOptionRepository(prisma),
            mappings: new PrismaVariantStripeMappingRepository(prisma),
            journal: new D1CatalogOperationRepository(context.env.COMMERCE_DB),
            gateway: createStripeCatalogGateway(context.env),
            cms: createCmsItemPublicationGateway(context.env.CMS_RUNTIME.getByName('editorial'), context.req.raw),
          },
          context.req.valid('param').variantId,
          context.get('operatorIdentity').email,
          context.req.valid('json'),
        );
        return jsonNoStore(context.json(resultSchema.parse(result), 200));
      } catch (error) {
        return error instanceof CatalogPriceConflictError || error instanceof CatalogOperationConflictError
          ? jsonError(context, {
              code: 'catalog_conflict',
              message: 'Item or content changed. Reload before publishing.',
              status: 409,
            })
          : jsonError(context, {
              code: 'catalog_temporarily_unavailable',
              message: 'Publication interrupted. Check the same operation again.',
              status: 503,
            });
      } finally {
        await prisma.$disconnect();
      }
    },
  );
}
