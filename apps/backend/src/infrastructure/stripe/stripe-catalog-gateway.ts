import Stripe from 'stripe';

import { parseStripePriceId } from '../../domain/commerce';
import type {
  StripeCatalogGateway,
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

  public async retrieveDefaultPrice(productId: string): Promise<StripeCatalogPrice | null> {
    try {
      const product = await this.stripe.products.retrieve(productId, { expand: ['default_price'] });
      if ('deleted' in product || !product.default_price || typeof product.default_price === 'string') {
        return null;
      }
      const price = product.default_price;
      const parentId = typeof price.product === 'string' ? price.product : price.product.id;
      if (parentId !== product.id || price.type !== 'one_time' || price.livemode !== product.livemode) {
        return null;
      }
      return toCatalogPrice({ ...price, product });
    } catch (error) {
      if (isStripeNotFoundError(error)) return null;
      throw error;
    }
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

  public async createCatalogPrice(
    input: StripeCatalogPriceCreateInput,
    context?: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    if (input.metadata.appEnv !== 'uat') throw new Error('Only UAT may bootstrap test Prices.');
    const products = await this.catalogProducts();
    const matches = products.filter(
      (product) =>
        product.metadata.appEnv === input.metadata.appEnv && product.metadata.variantId === input.metadata.variantId,
    );
    if (matches.length > 1) throw new Error('Multiple Products identify this variant; review its binding.');
    let product = matches[0];
    const stableId = 'prod_blackbox_' + input.metadata.appEnv + '_' + input.metadata.variantId;
    if (product) {
      if (!product.active || !hasMetadata(product.metadata, input.metadata)) {
        throw new Error('Existing Product is paused or has conflicting identity; review its binding.');
      }
      if (product.default_price) {
        const price = await this.retrieveDefaultPrice(product.id);
        if (!price) throw new Error('Existing Product has an invalid default Price.');
        return price;
      }
      if (product.id !== stableId) throw new Error('Existing Product needs an explicit default-price backfill.');
    } else {
      product = await this.stripe.products.create(
        {
          id: stableId,
          name: input.productProjection?.name ?? input.productName,
          description: input.productProjection?.description,
          images: input.productProjection?.imageUrls,
          metadata: { ...input.productProjection?.metadata, ...input.metadata },
          tax_code: input.productProjection?.taxCode ?? undefined,
        },
        toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'product')),
      );
      products.push(product);
    }
    const existingPrices = await this.listPrices({ product: product.id, expand: ['data.product'] });
    if (existingPrices.length > 1 || (existingPrices[0] && !matchesCatalogPriceInput(existingPrices[0], input))) {
      throw new Error('Interrupted bootstrap has conflicting Prices; review before retrying.');
    }
    let price = existingPrices[0];
    if (!price) {
      price = toCatalogPrice(
        await this.stripe.prices.create(
          createStripePriceCreateParams(input, product.id),
          toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'price')),
        ),
      );
    }
    if (!price.active) throw new Error('Interrupted bootstrap Price was paused; review before retrying.');
    await this.stripe.products.update(
      product.id,
      { default_price: price.priceId },
      toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'default')),
    );
    product.default_price = price.priceId;
    return price;
  }

  private products: Promise<Stripe.Product[]> | undefined;

  private catalogProducts(): Promise<Stripe.Product[]> {
    // One inventory read per release bootstrap; runtime uses the persisted Product binding.
    return (this.products ??= (async () => {
      const products: Stripe.Product[] = [];
      for await (const product of this.stripe.products.list({ limit: 100 })) products.push(product);
      return products;
    })());
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
    taxBehavior:
      price.tax_behavior === 'inclusive'
        ? 'inclusive'
        : price.tax_behavior === 'exclusive'
          ? 'exclusive'
          : 'unspecified',
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
    tax_behavior: 'inclusive',
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
  if (price.taxBehavior !== 'inclusive') return false;
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
