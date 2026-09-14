import Stripe from 'stripe';

import { parseStripePriceId } from '../../domain/commerce';
import type {
  StripeCatalogGateway,
  StripeCatalogSetupGateway,
  StripeCatalogSetupProductInput,
  StripeCatalogMutationContext,
  StripeCatalogPrice,
  StripeCatalogPriceChangeInput,
  StripeCatalogPriceChangeGateway,
  StripeCatalogPriceCreateInput,
  StripeCatalogProduct,
  StripeCatalogProductProjectionUpdateInput,
} from '../../application/commerce/catalog-sync';
import {
  CatalogPriceConflictError,
  deriveStripeCatalogChildMutationContext,
} from '../../application/commerce/catalog-sync';
import { CheckoutConfigurationError } from '../../application/commerce/checkout';
import type { AppBindings } from '../../env';
import { createStripeClientOptions } from './stripe-checkout-gateway';

type StripePriceWithExpandedProduct = Stripe.Price & {
  product: string | Stripe.Product | Stripe.DeletedProduct;
};

export class StripeCatalogGatewayClient
  implements StripeCatalogGateway, StripeCatalogPriceChangeGateway, StripeCatalogSetupGateway
{
  public constructor(
    private readonly stripe: Stripe,
    private readonly providerLiveMode?: boolean,
  ) {}

  public async ensureSetupProduct(
    input: StripeCatalogSetupProductInput,
    context: StripeCatalogMutationContext,
  ): Promise<StripeCatalogProduct> {
    const live = input.metadata.appEnv === 'prd';
    if (
      !['local', 'uat', 'prd'].includes(input.metadata.appEnv) ||
      this.providerLiveMode !== live ||
      (live && !input.confirmLiveSetup) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(input.operationId) ||
      !/^variant_[A-Za-z0-9_-]{1,120}$/.test(input.metadata.variantId) ||
      !input.projection.name.trim() ||
      input.projection.taxCode !== 'txcd_99999999' ||
      input.projection.imageUrls.some((value) => {
        try {
          return new URL(value).protocol !== 'https:';
        } catch {
          return true;
        }
      })
    )
      throw new CatalogPriceConflictError('Invalid or unconfirmed Product setup.');
    const productId = 'prod_blackbox_' + input.metadata.appEnv + '_' + input.metadata.variantId;
    const metadata = {
      ...input.projection.metadata,
      ...input.metadata,
      catalogOperationId: input.operationId,
      catalogInputFingerprint: context.requestShapeFingerprint,
    };
    let product: Stripe.Product | Stripe.DeletedProduct;
    try {
      product = await this.stripe.products.retrieve(productId);
    } catch (error) {
      if (!isStripeNotFoundError(error)) throw error;
      product = await this.stripe.products.create(
        {
          id: productId,
          name: input.projection.name,
          description: input.projection.description,
          images: input.projection.imageUrls,
          tax_code: input.projection.taxCode,
          metadata,
        },
        toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'setup-product')),
      );
    }
    if (
      'deleted' in product ||
      product.id !== productId ||
      !product.active ||
      product.livemode !== live ||
      normalizeProductTaxCode(product.tax_code) !== 'txcd_99999999' ||
      !hasMetadata(product.metadata, metadata)
    )
      throw new CatalogPriceConflictError('Existing Product conflicts with this setup.');
    return toCatalogProduct(product);
  }

  public async createReplacementPrice(
    input: StripeCatalogPriceChangeInput,
    context: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    const product = await this.readPriceChangeProduct(input);
    const metadata = {
      ...input.metadata,
      catalogOperationId: input.operationId,
      catalogInputFingerprint: context.requestShapeFingerprint,
    };
    const matches: Stripe.Price[] = [];
    // Bound recovery to this Product, including archived Prices; never scan the account.
    for (const active of [true, false]) {
      let startingAfter: string | undefined;
      for (let pageNumber = 0; pageNumber < 3; pageNumber++) {
        const page = await this.stripe.prices.list({
          product: product.id,
          active,
          limit: 100,
          starting_after: startingAfter,
        });
        if (
          input.expectedDefaultPriceId === null &&
          page.data.some((price) => price.metadata.catalogOperationId !== input.operationId)
        )
          throw new CatalogPriceConflictError('Initial Product has unrecognized Prices; review its binding.');
        matches.push(...page.data.filter((price) => price.metadata.catalogOperationId === input.operationId));
        if (!page.has_more) break;
        const next = page.data.at(-1)?.id;
        if (!next || next === startingAfter || pageNumber === 2)
          throw new CatalogPriceConflictError('Price recovery exceeds its bounded inspection budget.');
        startingAfter = next;
      }
    }
    if (matches.length > 1) throw new CatalogPriceConflictError('Multiple replacement Prices identify this operation.');
    if (matches[0]) return validateReplacementPrice(matches[0], product, input, metadata);
    if (defaultPriceId(await this.readPriceChangeProduct(input)) !== input.expectedDefaultPriceId)
      throw new CatalogPriceConflictError('Product default Price changed.');
    const price = await this.stripe.prices.create(
      {
        ...createStripePriceCreateParams(input, product.id),
        metadata,
        // A replacement must not move the old Price's lookup key before selection.
        lookup_key: undefined,
        transfer_lookup_key: undefined,
      },
      toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'replacement')),
    );
    return validateReplacementPrice(price, product, input, metadata);
  }

  public async selectReplacementPrice(
    input: StripeCatalogPriceChangeInput,
    priceId: string,
    context: StripeCatalogMutationContext,
  ): Promise<StripeCatalogPrice> {
    const product = await this.readPriceChangeProduct(input);
    const price = await this.stripe.prices.retrieve(priceId);
    const expectedMetadata = {
      ...input.metadata,
      catalogOperationId: input.operationId,
      catalogInputFingerprint: context.requestShapeFingerprint,
    };
    validateReplacementPrice(price, product, input, expectedMetadata);
    const current = defaultPriceId(product);
    if (current !== priceId && current !== input.expectedDefaultPriceId)
      throw new CatalogPriceConflictError('Product default Price changed.');
    if (current !== priceId)
      await this.stripe.products.update(
        product.id,
        { default_price: priceId },
        toStripeRequestOptions(deriveStripeCatalogChildMutationContext(context, 'select-default')),
      );
    const confirmed = await this.readPriceChangeProduct(input);
    if (defaultPriceId(confirmed) !== priceId)
      throw new CatalogPriceConflictError('Product default Price changed during selection.');
    return validateReplacementPrice(price, confirmed, input, expectedMetadata);
  }

  private async readPriceChangeProduct(input: StripeCatalogPriceChangeInput): Promise<Stripe.Product> {
    if (!input.operationId.trim() || input.operationId.length > 128 || input.currencyCode !== 'EUR')
      throw new CatalogPriceConflictError('Invalid price operation.');
    const amounts =
      input.kind === 'fixed'
        ? [input.amountMinor]
        : [input.minimumAmountMinor, input.presetAmountMinor, input.maximumAmountMinor];
    if (
      amounts.some((amount) => !Number.isSafeInteger(amount) || amount <= 0 || amount > 99_999_999) ||
      (input.kind === 'pay_what_you_want' &&
        (input.minimumAmountMinor > input.presetAmountMinor || input.presetAmountMinor > input.maximumAmountMinor))
    )
      throw new CatalogPriceConflictError('Invalid price amount.');
    const product = await this.stripe.products.retrieve(input.productId);
    if (
      'deleted' in product ||
      product.id !== input.productId ||
      normalizeProductTaxCode(product.tax_code) !== 'txcd_99999999' ||
      !product.active ||
      product.livemode !== (input.metadata.appEnv === 'prd') ||
      !hasMetadata(product.metadata, input.metadata)
    ) {
      throw new CatalogPriceConflictError('Bound Product identity is unavailable or conflicts.');
    }
    return product;
  }

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
): StripeCatalogGateway & StripeCatalogPriceChangeGateway & StripeCatalogSetupGateway {
  if (!bindings.STRIPE_SECRET_KEY) {
    throw new CheckoutConfigurationError('Stripe secret key is not configured.');
  }

  return new StripeCatalogGatewayClient(
    new Stripe(bindings.STRIPE_SECRET_KEY, createStripeClientOptions(bindings.STRIPE_API_BASE_URL)),
    /^[sr]k_live_/.test(bindings.STRIPE_SECRET_KEY)
      ? true
      : /^[sr]k_test_/.test(bindings.STRIPE_SECRET_KEY)
        ? false
        : undefined,
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

function defaultPriceId(product: Stripe.Product): string | null {
  return typeof product.default_price === 'string' ? product.default_price : (product.default_price?.id ?? null);
}

function validateReplacementPrice(
  price: Stripe.Price,
  product: Stripe.Product,
  input: StripeCatalogPriceChangeInput,
  metadata: Record<string, string>,
): StripeCatalogPrice {
  const parentId = typeof price.product === 'string' ? price.product : price.product.id;
  const mapped = toCatalogPrice({ ...price, product });
  if (
    parentId !== product.id ||
    price.type !== 'one_time' ||
    price.livemode !== product.livemode ||
    !price.active ||
    !hasMetadata(price.metadata, metadata) ||
    !matchesCatalogPriceInput(mapped, input)
  ) {
    throw new CatalogPriceConflictError('Replacement Price conflicts with the recorded operation.');
  }
  return mapped;
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
