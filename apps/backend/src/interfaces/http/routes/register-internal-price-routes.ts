import { createRoute, z } from '@hono/zod-openapi';
import {
  CatalogPriceConflictError,
  catalogPriceChangeSchema,
  changeCatalogPrice,
  readCatalogPrice,
} from '../../../application/commerce/catalog-sync';
import { CatalogOperationConflictError } from '../../../domain/commerce/repositories/spi';
import { productEnvironmentProfileFromBindings, type AppOpenApi } from '../../../env';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  PrismaStoreItemOptionRepository,
  PrismaVariantStripeMappingRepository,
} from '../../../infrastructure/persistence/prisma';
import { createStripeCatalogGateway } from '../../../infrastructure/stripe';
import { backendErrorResponseSchema, jsonError, jsonNoStore, operatorAccessErrorResponses } from '../responses';

const resultSchema = z
  .object({
    operationId: z.string(),
    variantId: z.string(),
    status: z.enum(['pending', 'completed', 'needs_review']),
  })
  .strict()
  .openapi('CatalogPriceChangeResult');
const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: backendErrorResponseSchema } },
});

export function registerInternalPriceRoutes(app: AppOpenApi): void {
  const detailSchema = z
    .object({
      variantId: z.string(),
      expectedRevision: z.number().int().positive(),
      requiresLiveConfirmation: z.boolean(),
      price: catalogPriceChangeSchema.shape.price,
    })
    .strict()
    .openapi('CatalogPriceDetail');
  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/internal/variants/{variantId}/price',
      operationId: 'readCatalogPrice',
      tags: ['Internal catalog'],
      summary: 'Read the current item price and edit revision without provider writes.',
      request: { params: z.object({ variantId: z.string().regex(/^variant_[A-Za-z0-9_-]+$/) }) },
      responses: {
        200: { description: 'Current price.', content: { 'application/json': { schema: detailSchema } } },
        409: errorResponse('Item setup or price requires reconciliation.'),
        ...operatorAccessErrorResponses,
        503: errorResponse('Price is temporarily unavailable.'),
      },
    }),
    async (context) => {
      const prisma = createPrismaClient(context.env);
      try {
        const result = await readCatalogPrice(
          {
            environment: productEnvironmentProfileFromBindings(context.env).workerDeploymentTarget,
            catalog: new PrismaStoreItemOptionRepository(prisma),
            mappings: new PrismaVariantStripeMappingRepository(prisma),
            gateway: createStripeCatalogGateway(context.env),
          },
          context.req.valid('param').variantId,
        );
        return jsonNoStore(context.json(detailSchema.parse(result), 200));
      } catch (error) {
        return error instanceof CatalogPriceConflictError
          ? jsonError(context, {
              code: 'catalog_conflict',
              message: 'Item setup or price needs review before editing.',
              status: 409,
            })
          : jsonError(context, {
              code: 'catalog_temporarily_unavailable',
              message: 'Price is temporarily unavailable.',
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
      path: '/api/internal/variants/{variantId}/price',
      operationId: 'changeCatalogPrice',
      tags: ['Internal catalog'],
      summary: 'Change an item price using a replayable operator command.',
      description:
        'Requires verified operator Access, an Origin matching this API origin, and X-Blackbox-Request: 1. Reuse the same operationId and body when retrying.',
      request: {
        params: z.object({ variantId: z.string().regex(/^variant_[A-Za-z0-9_-]+$/) }),
        headers: z.object({ origin: z.string().optional(), 'x-blackbox-request': z.string().optional() }),
        body: { required: true, content: { 'application/json': { schema: catalogPriceChangeSchema } } },
      },
      responses: {
        200: {
          description:
            'Retained operation status. Retry pending operations with identical input and operation identity.',
          content: { 'application/json': { schema: resultSchema } },
        },
        400: errorResponse('Invalid request.'),
        403: errorResponse('Same-origin operator request required.'),
        409: errorResponse('Operation input or catalog revision conflicts, or live confirmation is missing.'),
        ...operatorAccessErrorResponses,
        503: errorResponse('Operator authentication or price processing is temporarily unavailable.'),
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
      const command = context.req.valid('json');
      const environment = productEnvironmentProfileFromBindings(context.env).workerDeploymentTarget;
      if (environment === 'prd' && !command.confirmLivePriceChange)
        return jsonError(context, {
          code: 'catalog_conflict',
          message: 'Confirm this live price change.',
          status: 409,
        });
      const prisma = createPrismaClient(context.env);
      try {
        const result = await changeCatalogPrice(
          {
            environment,
            catalog: new PrismaStoreItemOptionRepository(prisma),
            mappings: new PrismaVariantStripeMappingRepository(prisma),
            journal: new D1CatalogOperationRepository(context.env.COMMERCE_DB),
            gateway: createStripeCatalogGateway(context.env),
          },
          context.req.valid('param').variantId,
          context.get('operatorIdentity').email,
          command,
        );
        return jsonNoStore(context.json(resultSchema.parse(result), 200));
      } catch (error) {
        if (error instanceof CatalogOperationConflictError || error instanceof CatalogPriceConflictError)
          return jsonError(context, {
            code: 'catalog_conflict',
            message: 'Operation input or catalog revision conflicts.',
            status: 409,
          });
        return jsonError(context, {
          code: 'catalog_temporarily_unavailable',
          message: 'Price change interrupted. Retry the same operation.',
          status: 503,
        });
      } finally {
        await prisma.$disconnect();
      }
    },
  );
}
