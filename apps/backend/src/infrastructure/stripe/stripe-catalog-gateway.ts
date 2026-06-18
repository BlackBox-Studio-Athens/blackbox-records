import Stripe from 'stripe';

import { parseStripePriceId } from '../../domain/commerce';
import type {
  StripeCatalogGateway,
  StripeCatalogIdentityMetadata,
  StripeCatalogMutationContext,
  StripeCatalogPrice,
  StripeCatalogPriceCreateInput,
  StripeCatalogProductProjectionUpdateInput,
} from '../../application/commerce/catalog-sync';
import { CheckoutConfigurationError } from '../../application/commerce/checkout';
import type { AppBindings } from '../../env';
import { createStripeClientOptions } from './stripe-checkout-gateway';

type StripePriceWithExpandedProduct = Stripe.Price & {
  product: string | Stripe.Product | Stripe.DeletedProduct;
};

class StripeCatalogGatewayClient implements StripeCatalogGateway {
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
    const prices = await this.stripe.prices.list({
      expand: ['data.product'],
      limit: 100,
      lookup_keys: [lookupKey],
    });

    return prices.data.map((price) => toCatalogPrice(price as StripePriceWithExpandedProduct));
  }

  public async listPricesByMetadata(metadata: StripeCatalogIdentityMetadata): Promise<StripeCatalogPrice[]> {
    const prices = await this.stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 100,
    });

    return prices.data
      .map((price) => toCatalogPrice(price as StripePriceWithExpandedProduct))
      .filter(
        (price) =>
          hasMetadata(price.metadata, metadata) ||
          hasMetadata(price.productMetadata, metadata) ||
          price.lookupKey === `blackbox:${metadata.appEnv}:${metadata.storeItemSlug}:${metadata.variantId}`,
      );
  }

  public async createCatalogPrice(
    input: StripeCatalogPriceCreateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    const existingPrice = (await this.listPricesByMetadata(input.metadata)).find(
      (price) =>
        price.active &&
        price.productActive &&
        price.amountMinor === input.amountMinor &&
        price.currencyCode?.toUpperCase() === input.currencyCode.toUpperCase(),
    );

    if (existingPrice) {
      return this.updatePriceMetadata(existingPrice.priceId, input.metadata, context);
    }

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
      toStripeRequestOptions(deriveChildMutationContext(context, 'product')),
    );
    const price = (await this.stripe.prices.create(
      {
        active: true,
        currency: input.currencyCode.toLowerCase(),
        lookup_key: input.lookupKey,
        metadata: input.metadata,
        product: product.id,
        transfer_lookup_key: true,
        unit_amount: input.amountMinor,
        expand: ['product'],
      },
      toStripeRequestOptions(deriveChildMutationContext(context, 'price')),
    )) as StripePriceWithExpandedProduct;

    return toCatalogPrice(price);
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
      toStripeRequestOptions(deriveChildMutationContext(context, 'price')),
    )) as StripePriceWithExpandedProduct;

    const product = getActiveProduct(price.product);

    if (product) {
      await this.stripe.products.update(
        product.id,
        { metadata },
        toStripeRequestOptions(deriveChildMutationContext(context, 'product')),
      );
    }

    return toCatalogPrice(price);
  }

  public async updateProductProjection(
    productId: string,
    input: StripeCatalogProductProjectionUpdateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<void> {
    await this.stripe.products.update(
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
    lookupKey: price.lookup_key,
    metadata: normalizeMetadata(price.metadata),
    priceId: parseStripePriceId(price.id),
    productActive: product?.active ?? false,
    productDescription: product?.description ?? null,
    productId: product?.id ?? (typeof price.product === 'string' ? price.product : null),
    productImages: product?.images ?? [],
    productMetadata: normalizeMetadata(product?.metadata ?? {}),
    productName: product?.name ?? null,
    productTaxCode: normalizeProductTaxCode(product?.tax_code),
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

function deriveChildMutationContext(
  context: StripeCatalogMutationContext | undefined,
  child: string,
): StripeCatalogMutationContext | undefined {
  return context ? { idempotencyKey: `${context.idempotencyKey}:${child}` } : undefined;
}

function hasMetadata(candidate: Record<string, string>, expected: Record<string, string>): boolean {
  return Object.entries(expected).every(([key, value]) => candidate[key] === value);
}

function isStripeNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'statusCode' in error && Number(error.statusCode) === 404;
}
