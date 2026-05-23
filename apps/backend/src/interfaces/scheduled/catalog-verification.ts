import { CatalogReconciler } from '../../application/commerce/catalog-sync';
import type { AppBindings } from '../../env';
import {
  createPrismaClient,
  PrismaStoreItemOptionRepository,
  PrismaStoreOfferSnapshotRepository,
  PrismaVariantStripeMappingRepository,
} from '../../infrastructure/persistence/prisma';
import { createStripeCatalogGateway } from '../../infrastructure/stripe';

export async function runScheduledCatalogVerification(bindings: AppBindings): Promise<void> {
  const prisma = createPrismaClient(bindings);
  const storeItems = new PrismaStoreItemOptionRepository(prisma);
  const catalogReconciler = new CatalogReconciler({
    environment: bindings.APP_ENV,
    storeItems,
    storeOfferSnapshots: new PrismaStoreOfferSnapshotRepository(prisma),
    stripeCatalog: createStripeCatalogGateway(bindings),
    variantStripeMappings: new PrismaVariantStripeMappingRepository(prisma),
  });

  try {
    const result = await catalogReconciler.verifyBuyableCatalog({
      apply: bindings.APP_ENV !== 'production',
    });

    if (result.issues.length) {
      console.warn(
        `Scheduled Stripe catalog verification found ${result.issues.length} issue(s) in ${bindings.APP_ENV}.`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}
