import Stripe from 'stripe';

import { parseStripePriceId } from '../../domain/commerce';
import type {
  StripeCatalogGateway,
  StripeCatalogIdentityMetadata,
  StripeCatalogMutationContext,
  StripeCatalogPrice,
  StripeCatalogPriceCreateInput,
  StripeCatalogProduct,
  StripeCatalogProductProjectionUpdateInput,
} from '../../application/commerce/catalog-sync';
import { deriveStripeCatalogChildMutationContext } from '../../application/commerce/catalog-sync';
import { CheckoutConfigurationError } from '../../application/commerce/checkout';
import type { AppBindings } from '../../env';
import { createStripeClientOptions } from './stripe-checkout-gateway';

type StripePriceWithExpandedProduct = Stripe.Price & {
  product: string | Stripe.Product | Stripe.DeletedProduct;
};

export class StripeCatalogGatewayClient implements StripeCatalogGateway {
  public constructor(private readonly stripe: Stripe) {}

  public async archivePrice(priceId: string, context?: StripeCatalogMutationContext): Promise<StripeCatalogPrice> {
    const price = (await this.stripe.prices.update(
      priceId,
      {
        active: false,
        expand: ['product'],
      },
      toStripeRequestOptions(context),
    )) as StripePriceWithExpandedProduct;

    return toCatalogPrice(price);
  }

  public async retrievePrice(priceId: string): Promise<StripeCatalogPrice | null> {
    try {
      const price = (await this.stripe.prices.retrieve(priceId, {
        expand: ['product'],
      })) as StripePriceWithExpandedProduct;

      return toCatalogPrice(price);
    } catch (error) {
      if (isStripeNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  public async listPricesByLookupKey(lookupKey: string): Promise<StripeCatalogPrice[]> {
    return this.listPrices({
      expand: ['data.product'],
      lookup_keys: [lookupKey],
    });
  }

  public async listPricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]> {
    const prices = await this.listPrices({
      active: true,
      expand: ['data.product'],
    });

    return prices.filter(
      (price) =>
        hasMetadata(price.metadata, metadata) ||
        hasMetadata(price.productMetadata, metadata) ||
        price.lookupKey === `blackbox:${metadata.appEnv}:${metadata.storeItemSlug}:${metadata.variantId}`,
    );
  }

  public async listOwnedPrices(_environment: StripeCatalogIdentityMetadata['appEnv']): Promise<StripeCatalogPrice[]> {
    const prices = await this.listPrices({
      active: true,
      expand: ['data.product'],
    });

    return prices.filter(
      (price) =>
        price.lookupKey?.startsWith('blackbox:') ||
        hasBlackBoxCatalogMetadataHint(price.metadata) ||
        hasBlackBoxCatalogMetadataHint(price.productMetadata),
    );
  }

  public async listOwnedProducts(
    _environment: StripeCatalogIdentityMetadata['appEnv'],
  ): Promise<StripeCatalogProduct[]> {
    const products: StripeCatalogProduct[] = [];
    let startingAfter: string | undefined;

    do {
      const page = await this.stripe.products.list({
        active: true,
        limit: 100,
        starting_after: startingAfter,
      });

      products.push(
        ...page.data.map(toCatalogProduct).filter((product) => hasBlackBoxCatalogMetadataHint(product.metadata)),
      );
      startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
    } while (startingAfter);

    return products;
  }

  public async createCatalogPrice(
    input: StripeCatalogPriceCreateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    const existingPrice = (await this.listPricesByMetadata(input.metadata)).find(
      (price) => price.active && price.productActive && matchesCatalogPriceInput(price, input),
    );

    if (existingPrice) {
      return this.updatePriceMetadata(existingPrice.priceId, input.metadata, context);
    }

    const inactivePrice = (await this.listInactivePricesByMetadata(input.metadata)).find(
      (price) => (!price.active || !price.productActive) && matchesCatalogPriceInput(price, input) && price.productId,
    );

    if (inactivePrice) {
      await this.releaseInactiveLookupKey(input.lookupKey, context);
      return this.restoreInactiveCatalogPrice(inactivePrice, input, context);
    }

    await this.releaseInactiveLookupKey(input.lookupKey, context);

    const product = await this.stripe.products.create(
      {
        active: true,
        description: input.productProjection?.description,
        images: input.productProjection?.imageUrls,
        metadata: {
          ...(input.productProjection?.metadata ?? {}),
          ...input.metadata,
        },
        name: input.productProjection?.name ?? input.productName,
        tax_code: input.productProjection?.taxCode ?? undefined,
      },
      toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'product')),
    );
    const price = (await this.stripe.prices.create(
      createStripePriceCreateParams(input, product.id),
      toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'price')),
    )) as StripePriceWithExpandedProduct;

    return toCatalogPrice(price);
  }

  private async listInactivePricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]> {
    const [activePrices, inactivePrices] = await Promise.all([
      this.listPrices({
        active: true,
        expand: ['data.product'],
      }),
      this.listPrices({
        active: false,
        expand: ['data.product'],
      }),
    ]);

    return [...activePrices, ...inactivePrices].filter(
      (price) =>
        (!price.active || !price.productActive) &&
        (hasMetadata(price.metadata, metadata) ||
          hasMetadata(price.productMetadata, metadata) ||
          price.lookupKey === `blackbox:${metadata.appEnv}:${metadata.storeItemSlug}:${metadata.variantId}`),
    );
  }

  private async restoreInactiveCatalogPrice(
    price: StripeCatalogPrice,
    input: StripeCatalogPriceCreateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    if (!price.productId) {
      return price;
    }

    await this.stripe.products.update(
      price.productId,
      {
        active: true,
        description: input.productProjection?.description,
        images: input.productProjection?.imageUrls,
        metadata: {
          ...(input.productProjection?.metadata ?? {}),
          ...input.metadata,
        },
        name: input.productProjection?.name ?? input.productName,
        tax_code: input.productProjection?.taxCode ?? undefined,
      },
      toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, `restore_product_${price.priceId}`)),
    );

    const restoredPrice = (await this.stripe.prices.update(
      price.priceId,
      {
        active: true,
        expand: ['product'],
        lookup_key: input.lookupKey,
        metadata: input.metadata,
      },
      toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, `restore_price_${price.priceId}`)),
    )) as StripePriceWithExpandedProduct;

    return toCatalogPrice(restoredPrice);
  }

  private async releaseInactiveLookupKey(lookupKey: string, context?: StripeCatalogMutationContext): Promise<void> {
    const prices = await this.listPricesByLookupKey(lookupKey);
    const inactivePrices = prices.filter(
      (price) => price.lookupKey === lookupKey && (!price.active || !price.productActive),
    );

    for (const price of inactivePrices) {
      await this.stripe.prices.update(
        price.priceId,
        {
          expand: ['product'],
          lookup_key: '',
        },
        toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, `release_lookup_${price.priceId}`)),
      );
    }
  }

  public async updatePriceMetadata(
    priceId: string,
    metadata: StripeCatalogIdentityMetadata,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    const price = (await this.stripe.prices.update(
      priceId,
      {
        metadata,
        expand: ['product'],
      },
      toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'price')),
    )) as StripePriceWithExpandedProduct;

    const product = getActiveProduct(price.product);

    if (product) {
      await this.stripe.products.update(
        product.id,
        { metadata },
        toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'product')),
      );
    }

    return toCatalogPrice(price);
  }

  public async updatePriceLookupKey(
    priceId: string,
    lookupKey: string,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    const price = (await this.stripe.prices.update(
      priceId,
      {
        expand: ['product'],
        lookup_key: lookupKey,
        transfer_lookup_key: true,
      },
      toStripeRequestOptions(context),
    )) as StripePriceWithExpandedProduct;

    return toCatalogPrice(price);
  }

  public async updateProductProjection(
    productId: string,
    input: StripeCatalogProductProjectionUpdateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogProduct> {
    const product = await this.stripe.products.update(
      productId,
      {
        description: input.projection.description,
        images: input.projection.imageUrls,
        metadata: {
          ...input.projection.metadata,
          ...input.stripeMetadata,
        },
        name: input.projection.name,
        tax_code: input.projection.taxCode ?? undefined,
      },
      toStripeRequestOptions(context),
    );

    return toCatalogProduct(product);
  }

  private async listPrices(
    params: Omit<Stripe.PriceListParams, 'limit' | 'starting_after'>,
  ): Promise<StripeCatalogPrice[]> {
    const prices: StripeCatalogPrice[] = [];
    let startingAfter: string | undefined;

    do {
      const page = await this.stripe.prices.list({
        ...params,
        limit: 100,
        starting_after: startingAfter,
      });

      prices.push(...page.data.map((price) => toCatalogPrice(price as StripePriceWithExpandedProduct)));
      startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
    } while (startingAfter);

    return prices;
  }
}

export function createStripeCatalogGateway(
  bindings: Pick<AppBindings, 'STRIPE_API_BASE_URL' | 'STRIPE_SECRET_KEY'>,
): StripeCatalogGateway {
  if (!bindings.STRIPE_SECRET_KEY) {
    throw new CheckoutConfigurationError('Stripe secret key is not configured.');
  }

  return new StripeCatalogGatewayClient(
    new Stripe(bindings.STRIPE_SECRET_KEY, createStripeClientOptions(bindings.STRIPE_API_BASE_URL)),
  );
}

function toCatalogPrice(price: StripePriceWithExpandedProduct): StripeCatalogPrice {
  const product = getActiveProduct(price.product);

  return {
    active: price.active,
    amountMinor: price.unit_amount,
    currencyCode: price.currency?.toUpperCase() ?? null,
    customUnitAmount: toCatalogCustomUnitAmount(price.custom_unit_amount),
    idempotentReplayed: getStripeIdempotentReplayed(price),
    lookupKey: price.lookup_key,
    metadata: normalizeMetadata(price.metadata),
    priceKind: price.custom_unit_amount ? 'pay_what_you_want' : 'fixed',
    priceId: parseStripePriceId(price.id),
    productActive: product?.active ?? false,
    productDescription: product?.description ?? null,
    productId: product?.id ?? (typeof price.product === 'string' ? price.product : null),
    productImages: product?.images ?? [],
    productMetadata: normalizeMetadata(product?.metadata ?? {}),
    productName: product?.name ?? null,
    productTaxCode: normalizeProductTaxCode(product?.tax_code),
    requestId: getStripeRequestId(price),
  };
}

function createStripePriceCreateParams(
  input: StripeCatalogPriceCreateInput,
  productId: string,
): Stripe.PriceCreateParams {
  const baseParams = {
    active: true,
    currency: input.currencyCode.toLowerCase(),
    expand: ['product'],
    lookup_key: input.lookupKey,
    metadata: input.metadata,
    product: productId,
    transfer_lookup_key: true,
  } satisfies Omit<Stripe.PriceCreateParams, 'custom_unit_amount' | 'unit_amount'>;

  if (input.kind === 'pay_what_you_want') {
    return {
      ...baseParams,
      custom_unit_amount: {
        enabled: true,
        maximum: input.maximumAmountMinor,
        minimum: input.minimumAmountMinor,
        preset: input.presetAmountMinor,
      },
    };
  }

  return {
    ...baseParams,
    unit_amount: input.amountMinor,
  };
}

function matchesCatalogPriceInput(price: StripeCatalogPrice, input: StripeCatalogPriceCreateInput): boolean {
  if (price.priceKind !== input.kind || price.currencyCode?.toUpperCase() !== input.currencyCode.toUpperCase()) {
    return false;
  }

  if (input.kind === 'fixed') {
    return price.amountMinor === input.amountMinor;
  }

  return (
    price.customUnitAmount?.minimumAmountMinor === input.minimumAmountMinor &&
    price.customUnitAmount?.presetAmountMinor === input.presetAmountMinor &&
    price.customUnitAmount?.maximumAmountMinor === input.maximumAmountMinor
  );
}

function toCatalogCustomUnitAmount(
  customUnitAmount: Stripe.Price.CustomUnitAmount | null,
): StripeCatalogPrice['customUnitAmount'] {
  if (!customUnitAmount) {
    return null;
  }

  return {
    maximumAmountMinor: customUnitAmount.maximum ?? null,
    minimumAmountMinor: customUnitAmount.minimum ?? null,
    presetAmountMinor: customUnitAmount.preset ?? null,
  };
}

function toCatalogProduct(product: Stripe.Product): StripeCatalogProduct {
  return {
    active: product.active,
    idempotentReplayed: getStripeIdempotentReplayed(product),
    metadata: normalizeMetadata(product.metadata),
    name: product.name ?? null,
    productId: product.id,
    requestId: getStripeRequestId(product),
  };
}

function getActiveProduct(product: StripePriceWithExpandedProduct['product']): Stripe.Product | null {
  if (typeof product === 'string' || 'deleted' in product) {
    return null;
  }

  return product;
}

function normalizeMetadata(metadata: Stripe.Metadata | null | undefined): Record<string, string> {
  return Object.fromEntries(Object.entries(metadata ?? {}).filter(([, value]) => typeof value === 'string'));
}

function normalizeProductTaxCode(taxCode: string | Stripe.TaxCode | null | undefined): string | null {
  if (!taxCode) {
    return null;
  }

  return typeof taxCode === 'string' ? taxCode : taxCode.id;
}

function toStripeRequestOptions(context: StripeCatalogMutationContext | undefined): Stripe.RequestOptions | undefined {
  return context ? { idempotencyKey: context.idempotencyKey } : undefined;
}

function hasMetadata(candidate: Record<string, string>, expected: Record<string, string>): boolean {
  return Object.entries(expected).every(([key, value]) => candidate[key] === value);
}

function hasBlackBoxCatalogMetadataHint(metadata: Record<string, string>): boolean {
  return Boolean(
    metadata.appEnv || metadata.sourceId || metadata.sourceKind || metadata.storeItemSlug || metadata.variantId,
  );
}

function getStripeRequestId(object: unknown): string | null {
  return getStripeLastResponse(object)?.requestId ?? null;
}

function getStripeIdempotentReplayed(object: unknown): boolean | null {
  const value = getStripeLastResponse(object)?.headers?.['idempotent-replayed'];

  if (Array.isArray(value)) {
    return value.some((item) => item.toLowerCase() === 'true');
  }

  return typeof value === 'string' ? value.toLowerCase() === 'true' : null;
}

function getStripeLastResponse(object: unknown): {
  headers?: Record<string, string | string[] | undefined>;
  requestId?: string;
} | null {
  if (!object || typeof object !== 'object' || !('lastResponse' in object)) {
    return null;
  }

  const lastResponse = object.lastResponse;

  return lastResponse && typeof lastResponse === 'object'
    ? (lastResponse as { headers?: Record<string, string | string[] | undefined>; requestId?: string })
    : null;
}

function isStripeNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'statusCode' in error && Number(error.statusCode) === 404;
}
