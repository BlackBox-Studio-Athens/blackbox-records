import { createCmsItemSourceGateway } from './cms-item-source-gateway';
import { createRoute, z } from '@hono/zod-openapi';
import {
  CatalogPriceConflictError,
  catalogItemSetupSchema,
  setupCatalogItem,
  prepareCmsSetupPresentation,
} from '../../../application/commerce/catalog-sync';
import { CatalogOperationConflictError } from '../../../domain/commerce/repositories/spi';
import { productEnvironmentProfileFromBindings, type AppOpenApi } from '../../../env';
import {
  createPrismaClient,
  D1CatalogOperationRepository,
  PrismaStoreItemOptionRepository,
  D1OperatorStockRepository,
} from '../../../infrastructure/persistence/prisma';
import { createStripeCatalogGateway } from '../../../infrastructure/stripe';
import {
  addHypermedia,
  apiLink,
  apiPath,
  hypermediaMetadataShape,
  jsonError,
  jsonNoStore,
  operatorAccessErrorResponses,
  problemContent,
} from '../responses';

const resultSchema = z
  .object({
    operationId: z.string(),
    variantId: z.string(),
    status: z.enum(['pending', 'completed', 'needs_review']),
    ...hypermediaMetadataShape,
  })
  .strict()
  .openapi('CatalogItemSetupResult');
const errorResponse = (description: string) => ({
  description,
  content: problemContent,
});

export function registerInternalSetupRoutes(app: AppOpenApi): void {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/internal/items/setup',
      operationId: 'setupCatalogItem',
      tags: ['Internal catalog'],
      summary: 'Set up an item using a replayable operator command.',
      description:
        'Requires verified operator Access, an Origin matching this API origin, and X-Blackbox-Request: 1. Reuse the same operationId and body when retrying.',
      request: {
        headers: z.object({ origin: z.string().optional(), 'x-blackbox-request': z.string().optional() }),
        body: { required: true, content: { 'application/json': { schema: catalogItemSetupSchema } } },
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
        503: errorResponse('Operator authentication or item setup is temporarily unavailable.'),
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
      if (environment === 'prd' && !command.confirmLiveSetup)
        return jsonError(context, {
          code: 'catalog_conflict',
          message: 'Confirm this live item setup.',
          status: 409,
        });
      const cms = context.env.CMS_RUNTIME;
      if (!cms)
        return jsonError(context, {
          code: 'catalog_temporarily_unavailable',
          message: 'Item setup is unavailable on this service.',
          status: 503,
        });
      const prisma = createPrismaClient(context.env);
      try {
        const result = await setupCatalogItem(
          {
            environment,
            catalog: new PrismaStoreItemOptionRepository(prisma),
            stock: new D1OperatorStockRepository(context.env.COMMERCE_DB),
            sources: createCmsItemSourceGateway(cms.getByName('editorial'), context.req.raw),
            preparePresentation: prepareCmsSetupPresentation,
            journal: new D1CatalogOperationRepository(context.env.COMMERCE_DB),
            gateway: createStripeCatalogGateway(context.env),
          },
          context.get('operatorIdentity').email,
          command,
        );
        const parsed = resultSchema.parse(result);
        return jsonNoStore(
          context.json(
            addHypermedia(parsed, [
              apiLink({
                href: apiPath('api', 'internal', 'variants', parsed.variantId, 'stock'),
                rel: 'stock',
              }),
              apiLink({
                href: apiPath('api', 'internal', 'variants', parsed.variantId, 'price'),
                rel: 'price',
              }),
              apiLink({
                href: apiPath('api', 'internal', 'variants', parsed.variantId, 'publication'),
                rel: 'publication',
              }),
            ]),
            200,
          ),
        );
      } catch (error) {
        if (error instanceof CatalogOperationConflictError || error instanceof CatalogPriceConflictError)
          return jsonError(context, {
            code: 'catalog_conflict',
            message: 'Operation input or catalog revision conflicts.',
            status: 409,
          });
        return jsonError(context, {
          code: 'catalog_temporarily_unavailable',
          message: 'Item setup interrupted. Retry the same operation.',
          status: 503,
        });
      } finally {
        await prisma.$disconnect();
      }
    },
  );
}
