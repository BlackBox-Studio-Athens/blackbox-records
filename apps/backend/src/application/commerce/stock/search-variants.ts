import type { StoreItemOptionRepository } from '../../../domain/commerce/repositories';
import type { VariantSummary } from './types';

export async function searchVariants(
    storeItemOptions: StoreItemOptionRepository,
    query: string | null,
    limit = 20,
): Promise<VariantSummary[]> {
    return storeItemOptions.search(query, limit);
}
