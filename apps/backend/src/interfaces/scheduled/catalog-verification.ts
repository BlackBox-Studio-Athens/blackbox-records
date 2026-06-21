import {
  CatalogReconciler,
  createCurrentCatalogExpectedProductProjectionMap,
  createCurrentCatalogExpectedSandboxPriceMap,
  type CatalogSyncIssue,
} from '../../application/commerce/catalog-sync';
import { formatProductEnvironmentLabel, productEnvironmentProfileFromBindings, type AppBindings } from '../../env';
import {
  createPrismaClient,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaVariantStripeMappingRepository,
} from '../../infrastructure/persistence/prisma';
import { createStripeCatalogGateway } from '../../infrastructure/stripe';

export async function runScheduledCatalogVerification(bindings: AppBindings): Promise<void> {
  const productEnvironmentProfile = productEnvironmentProfileFromBindings(bindings);
  const prisma = createPrismaClient(bindings);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const catalogReconciler = new CatalogReconciler({
    environment: productEnvironmentProfile.workerDeploymentTarget,
    storeItems,
    storeOfferSnapshots: new PrismaStoreOfferSnapshotRepository(prisma),
    stripeCatalog: createStripeCatalogGateway(bindings),
    variantStripeMappings: new PrismaVariantStripeMappingRepository(prisma),
  });

  try {
    const result = await catalogReconciler.verifyBuyableCatalog({
      apply: productEnvironmentProfile.catalogVerificationPolicy.applyScheduledChanges,
      expectedPrices: createCurrentCatalogExpectedSandboxPriceMap(productEnvironmentProfile.workerDeploymentTarget),
      expectedProductProjections: createCurrentCatalogExpectedProductProjectionMap(),
    });

    if (result.issues.length) {
      console.warn(
        [
          `Scheduled Stripe catalog verification found ${result.issues.length} issue(s) in ${formatProductEnvironmentLabel(productEnvironmentProfile.productEnvironment)}.`,
          formatScheduledCatalogIssueBreakdown(result.issues),
        ].join(' '),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

function formatScheduledCatalogIssueBreakdown(issues: CatalogSyncIssue[]): string {
  return [
    `Product Projection: ${countCatalogIssues(issues, 'product_projection')}`,
    `Price Authority: ${countCatalogIssues(issues, 'price_authority')}`,
    `D1 readiness: ${countCatalogIssues(issues, 'd1_readiness')}`,
    `Store Offer snapshots: ${countCatalogIssues(issues, 'store_offer_snapshot')}`,
  ].join('; ');
}

function countCatalogIssues(issues: CatalogSyncIssue[], driftCategory: CatalogSyncIssue['driftCategory']): number {
  return issues.filter((issue) => issue.driftCategory === driftCategory).length;
}
