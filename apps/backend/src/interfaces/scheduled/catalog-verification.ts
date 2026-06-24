import {
  CatalogReconciler,
  createCurrentCatalogExpectedProductProjectionMap,
  createCurrentCatalogExpectedSandboxPriceMap,
  type CatalogSyncIssue,
} from '../../application/commerce/catalog-sync';
import { productEnvironmentProfileFromBindings, type AppBindings } from '../../env';
import {
  createPrismaClient,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaVariantStripeMappingRepository,
} from '../../infrastructure/persistence/prisma';
import { createStripeCatalogGateway } from '../../infrastructure/stripe';
import { createBindingLogger, normalizeUnknownError } from '../../observability';

export async function runScheduledCatalogVerification(bindings: AppBindings): Promise<void> {
  const productEnvironmentProfile = productEnvironmentProfileFromBindings(bindings);
  const logger = createBindingLogger(bindings);
  const prisma = createPrismaClient(bindings);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const catalogReconciler = new CatalogReconciler({
    environment: productEnvironmentProfile.workerDeploymentTarget,
    storeItems,
    storeOfferSnapshots: new PrismaStoreOfferSnapshotRepository(prisma),
    stripeCatalog: createStripeCatalogGateway(bindings),
    variantStripeMappings: new PrismaVariantStripeMappingRepository(prisma),
  });

  logger.info({
    event: 'catalog_verification_scheduled_start',
    outcome: 'started',
  });

  try {
    const result = await catalogReconciler.verifyBuyableCatalog({
      apply: productEnvironmentProfile.catalogVerificationPolicy.applyScheduledChanges,
      expectedPrices: createCurrentCatalogExpectedSandboxPriceMap(productEnvironmentProfile.workerDeploymentTarget),
      expectedProductProjections: createCurrentCatalogExpectedProductProjectionMap(),
    });

    if (result.issues.length) {
      logger.warn({
        ...countCatalogIssueBreakdown(result.issues),
        event: 'catalog_verification_scheduled_issue_summary',
        issueCount: result.issues.length,
        outcome: 'issues_found',
        safeReason: 'catalog_drift',
      });
    } else {
      logger.info({
        event: 'catalog_verification_scheduled_success',
        issueCount: 0,
        outcome: 'success',
      });
    }
  } catch (error) {
    logger.error({
      ...normalizeUnknownError(error),
      event: 'catalog_verification_scheduled_failure',
      outcome: 'failed',
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function countCatalogIssueBreakdown(issues: CatalogSyncIssue[]) {
  return {
    d1ReadinessIssues: countCatalogIssues(issues, 'd1_readiness'),
    priceAuthorityIssues: countCatalogIssues(issues, 'price_authority'),
    productProjectionIssues: countCatalogIssues(issues, 'product_projection'),
    storeOfferSnapshotIssues: countCatalogIssues(issues, 'store_offer_snapshot'),
  };
}

function countCatalogIssues(issues: CatalogSyncIssue[], driftCategory: CatalogSyncIssue['driftCategory']): number {
  return issues.filter((issue) => issue.driftCategory === driftCategory).length;
}
