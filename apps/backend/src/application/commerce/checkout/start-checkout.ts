import type {
  CheckoutRetryAttempt,
  CheckoutStockHoldRepository,
  CreateCheckoutStockHoldInput,
  ItemAvailabilityRepository,
  SessionlessPendingCheckoutOrder,
  StockRepository,
  StoreItemOptionRepository,
} from '../../../domain/commerce/repositories/spi';
import {
  createCartQuantity,
  parseStoreItemSlug,
  parseVariantId,
  type AcceptedMonetaryPolicy,
  type CartQuantity,
  type StoreItemSlug,
  type VariantId,
} from '../../../domain/commerce';
import {
  CheckoutAttemptTerminalError,
  CheckoutCreationError,
  CheckoutRetryableError,
  CheckoutIdempotencyConflictError,
  CustomPriceCartError,
  CheckoutUnavailableError,
  NativeCheckoutDisabledError,
  StoreItemNotFoundError,
  VariantMismatchError,
} from './errors';
import {
  CatalogDriftError,
  createStoreOfferPriceFromCatalogPrice,
  hasBlockingCatalogIssue,
  type CatalogProductProjectionReader,
  type CatalogReconciler,
} from '../catalog-sync';
import { NEWSLETTER_CONSENT_COPY_VERSION } from './types';
import type { CheckoutSessionLineItem, CheckoutGateway, FeatureFlagReader, HostedCheckoutSession } from './spi';
import { quoteDelivery, type PackingPolicy } from './packing';
import { createPackingPolicy } from './packing-policy';
import { createCheckoutRequestFingerprint, createRequestIdentity } from '../../../domain/commerce/request-idempotency';

export type StartCheckoutCommand = {
  cancelUrl: string;
  idempotencyKey?: string;
  lines?: StartCheckoutLineCommand[];
  newsletterOptIn?: boolean;
  successUrl: string;
  storeItemSlug?: StoreItemSlug;
  variantId?: VariantId;
};

export type StartCheckoutLineCommand = {
  quantity: CartQuantity;
  storeItemSlug: StoreItemSlug;
  variantId: VariantId;
};

type StartCheckoutOptions = {
  now?: Date;
  packingPolicy?: PackingPolicy;
  monetaryPolicyReference?: string | null;
  productEnvironment?: string;
};

const CHECKOUT_HOLD_DURATION_MS = 35 * 60 * 1000;
const CHECKOUT_PROVIDER_LEASE_MS = 30 * 1000;

const enabledFeatureFlags: FeatureFlagReader = {
  isNativeCheckoutEnabled: async () => true,
};

function legacySingleCheckoutLine(command: StartCheckoutCommand): StartCheckoutLineCommand[] {
  if (!command.storeItemSlug || !command.variantId) return [];

  return [
    {
      quantity: createCartQuantity(1),
      storeItemSlug: command.storeItemSlug,
      variantId: command.variantId,
    },
  ];
}

export function createStartCheckoutLineCommand(input: {
  quantity: unknown;
  storeItemSlug: unknown;
  variantId: unknown;
}): StartCheckoutLineCommand {
  try {
    return {
      quantity: createCartQuantity(input.quantity),
      storeItemSlug: parseStoreItemSlug(input.storeItemSlug),
      variantId: parseVariantId(input.variantId),
    };
  } catch {
    throw new CheckoutUnavailableError();
  }
}

function createCheckoutQuantity(value: unknown): CartQuantity {
  try {
    return createCartQuantity(value);
  } catch {
    throw new CheckoutUnavailableError();
  }
}

function mergeCheckoutLines(lines: StartCheckoutLineCommand[]): StartCheckoutLineCommand[] {
  const mergedLines = new Map<string, StartCheckoutLineCommand>();

  for (const line of lines) {
    const key = line.storeItemSlug + ':' + line.variantId;
    const existingLine = mergedLines.get(key);

    mergedLines.set(key, {
      quantity: createCheckoutQuantity((existingLine?.quantity ?? 0) + line.quantity),
      storeItemSlug: line.storeItemSlug,
      variantId: line.variantId,
    });
  }

  return [...mergedLines.values()];
}

export async function startCheckout(
  storeItems: StoreItemOptionRepository,
  itemAvailability: ItemAvailabilityRepository,
  stock: StockRepository,
  catalogReconciler: Pick<CatalogReconciler, 'reconcileVariant'>,
  productProjections: CatalogProductProjectionReader,
  checkoutGateway: CheckoutGateway,
  checkoutHolds: CheckoutStockHoldRepository,
  command: StartCheckoutCommand,
  featureFlags: FeatureFlagReader = enabledFeatureFlags,
  options: StartCheckoutOptions = {},
): Promise<Pick<HostedCheckoutSession, 'checkoutSessionId' | 'checkoutUrl'>> {
  if (!(await featureFlags.isNativeCheckoutEnabled())) {
    throw new NativeCheckoutDisabledError();
  }

  const requestedLines = mergeCheckoutLines(
    command.lines && command.lines.length > 0 ? command.lines : legacySingleCheckoutLine(command),
  );

  if (requestedLines.length === 0) {
    throw new CheckoutUnavailableError();
  }

  const requestFingerprint = createCheckoutRequestFingerprint({
    cancelUrl: command.cancelUrl,
    lines: requestedLines,
    newsletterOptIn: command.newsletterOptIn === true,
    successUrl: command.successUrl,
  });
  const requestIdentity = await createRequestIdentity({
    idempotencyKey: command.idempotencyKey,
    productEnvironment: options.productEnvironment ?? 'local',
    requestFingerprint,
  });

  if (requestIdentity) {
    const existingAttempt = await checkoutHolds.findByRequestIdentity(requestIdentity);
    if (existingAttempt) {
      return resumeCheckoutAttempt(
        checkoutGateway,
        checkoutHolds,
        existingAttempt,
        requestIdentity.requestFingerprint,
        options.now,
      );
    }
  }

  const validatedLines: CheckoutSessionLineItem[] = [];

  for (const line of requestedLines) {
    const quantity = line.quantity;
    const storeItem = await storeItems.findByStoreItemSlug(line.storeItemSlug);

    if (!storeItem) {
      throw new StoreItemNotFoundError(line.storeItemSlug);
    }

    if (storeItem.variantId !== line.variantId) {
      throw new VariantMismatchError();
    }

    const availability = await itemAvailability.findByVariantId(line.variantId);

    if (!availability || availability.status !== 'available' || !availability.canBuy) {
      throw new CheckoutUnavailableError();
    }

    const currentStock = await stock.findByVariantId(line.variantId);

    if (!currentStock || Math.min(currentStock.quantity, currentStock.onlineQuantity) < quantity) {
      throw new CheckoutUnavailableError();
    }

    const productProjection = await productProjections.findByStoreItem(storeItem);

    if (!productProjection) {
      throw new CatalogDriftError();
    }

    const catalogResult = await catalogReconciler.reconcileVariant(storeItem, {
      apply: true,
      applyProductProjection: false,
      productProjection,
    });
    const resolvedPrice = catalogResult.resolvedPrice;
    const offerPrice = resolvedPrice ? createStoreOfferPriceFromCatalogPrice(resolvedPrice) : null;

    if (!resolvedPrice || !offerPrice || hasBlockingCatalogIssue(catalogResult.issues)) {
      throw new CatalogDriftError();
    }

    const unitAmountMinor = offerPrice.kind === 'fixed' ? offerPrice.amountMinor : null;

    validatedLines.push({
      displayName: productProjection.name,
      lineAmountMinor: unitAmountMinor === null ? null : unitAmountMinor * quantity,
      optionLabel: null,
      quantity,
      storeItemSlug: line.storeItemSlug,
      stripePriceId: resolvedPrice.priceId,
      unitAmountMinor,
      variantId: line.variantId,
    });
  }

  if (
    validatedLines.some((line) => line.unitAmountMinor === null && (validatedLines.length !== 1 || line.quantity !== 1))
  ) {
    throw new CustomPriceCartError();
  }

  const createdAt = options.now ?? new Date();
  const delivery = quoteDelivery(validatedLines, options.packingPolicy ?? createPackingPolicy());
  if (!delivery || !options.monetaryPolicyReference?.trim()) throw new CheckoutUnavailableError();
  if (
    !Number.isSafeInteger(validatedLines.reduce((sum, line) => sum + (line.lineAmountMinor ?? 0), delivery.amountMinor))
  ) {
    throw new CheckoutUnavailableError();
  }
  const monetaryPolicy: AcceptedMonetaryPolicy = {
    acceptedDeliveryAmountMinor: delivery.amountMinor,
    acceptedParcelTier: delivery.tier,
    monetaryPolicyReference: options.monetaryPolicyReference,
  };
  const checkoutExpiresAt = new Date(createdAt.getTime() + CHECKOUT_HOLD_DURATION_MS);
  const [firstLine, ...remainingLines] = validatedLines;
  const holdInput: CreateCheckoutStockHoldInput = {
    checkoutCancelUrl: command.cancelUrl,
    checkoutSuccessUrl: command.successUrl,
    monetaryPolicy,
    checkoutExpiresAt,
    createdAt,
    lines: [firstLine!, ...remainingLines],
    newsletterConsentAt: command.newsletterOptIn ? createdAt : null,
    newsletterConsentCopyVersion: command.newsletterOptIn ? NEWSLETTER_CONSENT_COPY_VERSION : null,
    newsletterOptIn: command.newsletterOptIn === true,
    orderId: crypto.randomUUID(),
    requestIdentity,
  };
  let holdResult = await checkoutHolds.createPendingHold(holdInput);

  if (holdResult.kind === 'existing') {
    if (!requestIdentity || holdResult.attempt.idempotencyFingerprint !== requestIdentity.requestFingerprint) {
      throw new CheckoutIdempotencyConflictError();
    }
    return resumeCheckoutAttempt(
      checkoutGateway,
      checkoutHolds,
      holdResult.attempt,
      requestIdentity.requestFingerprint,
      createdAt,
    );
  }

  if (holdResult.kind === 'unavailable') {
    const [firstVariantId, ...remainingVariantIds] = validatedLines.map((line) => line.variantId);
    const expiredHolds = await checkoutHolds.listOldestExpiredSessionBoundHolds(
      [firstVariantId!, ...remainingVariantIds],
      createdAt,
    );
    let releasedAnyHold = false;

    try {
      for (const expiredHold of expiredHolds) {
        const providerSession = await checkoutGateway.readCheckoutSession(expiredHold.checkoutSessionId);

        if (providerSession.status === 'expired' && providerSession.paymentStatus !== 'paid') {
          releasedAnyHold = (await checkoutHolds.releaseSessionBoundHold(expiredHold, new Date())) || releasedAnyHold;
        }
      }
    } catch {
      throw new CheckoutUnavailableError();
    }

    if (releasedAnyHold) holdResult = await checkoutHolds.createPendingHold(holdInput);
  }

  if (holdResult.kind !== 'created') throw new CheckoutUnavailableError();

  return createCheckoutForHold(checkoutGateway, checkoutHolds, holdResult.hold, true, createdAt);
}

async function resumeCheckoutAttempt(
  checkoutGateway: CheckoutGateway,
  checkoutHolds: CheckoutStockHoldRepository,
  attempt: CheckoutRetryAttempt,
  requestFingerprint: string,
  now = new Date(),
): Promise<Pick<HostedCheckoutSession, 'checkoutSessionId' | 'checkoutUrl'>> {
  if (attempt.idempotencyFingerprint !== requestFingerprint) {
    throw new CheckoutIdempotencyConflictError();
  }

  if (attempt.status !== 'pending_payment') {
    throw new CheckoutAttemptTerminalError();
  }

  if (attempt.checkoutSessionId) {
    let providerSession;
    try {
      providerSession = await checkoutGateway.readCheckoutSession(attempt.checkoutSessionId);
    } catch {
      throw new CheckoutRetryableError();
    }

    if (providerSession.paymentStatus === 'paid' || providerSession.status === 'complete') {
      throw new CheckoutAttemptTerminalError();
    }

    if (providerSession.status === 'expired') {
      throw new CheckoutAttemptTerminalError();
    }

    if (providerSession.status === 'open') {
      const checkoutUrl = attempt.checkoutUrl ?? providerSession.checkoutUrl;
      if (checkoutUrl) {
        return {
          checkoutSessionId: attempt.checkoutSessionId,
          checkoutUrl,
        };
      }
    }

    throw new CheckoutRetryableError();
  }

  const claim = await checkoutHolds.claimCheckoutProvider(
    attempt.id,
    crypto.randomUUID(),
    now,
    new Date(now.getTime() + CHECKOUT_PROVIDER_LEASE_MS),
  );
  if (claim === 'in_progress') throw new CheckoutRetryableError();
  if (claim === 'unavailable') throw new CheckoutAttemptTerminalError();

  return createCheckoutForHold(checkoutGateway, checkoutHolds, attempt, false, now);
}

async function createCheckoutForHold(
  checkoutGateway: CheckoutGateway,
  checkoutHolds: CheckoutStockHoldRepository,
  hold: SessionlessPendingCheckoutOrder | CheckoutRetryAttempt,
  isNewHold: boolean,
  now: Date,
): Promise<Pick<HostedCheckoutSession, 'checkoutSessionId' | 'checkoutUrl'>> {
  if (isNewHold) {
    const claim = await checkoutHolds.claimCheckoutProvider(
      hold.id,
      crypto.randomUUID(),
      now,
      new Date(now.getTime() + CHECKOUT_PROVIDER_LEASE_MS),
    );
    if (claim !== 'claimed') throw new CheckoutRetryableError();
  }

  const request = createHostedCheckoutRequest(hold);
  let checkoutSession: HostedCheckoutSession;

  try {
    checkoutSession = await checkoutGateway.createHostedCheckoutSession(request);
  } catch (error) {
    if (error instanceof CheckoutCreationError) {
      if (error.definitiveNonCreation) {
        await checkoutHolds.releaseSessionlessHold(hold as SessionlessPendingCheckoutOrder, now);
      } else if (error.session) {
        await checkoutHolds.recoverCheckoutSession(
          hold.id,
          error.session.checkoutSessionId,
          now,
          error.session.checkoutExpiresAt,
          error.session.checkoutUrl,
        );
      }
    }
    throw error;
  }

  let boundOrder: unknown;
  try {
    boundOrder = isNewHold
      ? await checkoutHolds.bindCheckoutSession(
          hold as SessionlessPendingCheckoutOrder,
          checkoutSession.checkoutSessionId,
          now,
          checkoutSession.checkoutExpiresAt,
          checkoutSession.checkoutUrl,
        )
      : await checkoutHolds.recoverCheckoutSession(
          hold.id,
          checkoutSession.checkoutSessionId,
          now,
          checkoutSession.checkoutExpiresAt,
          checkoutSession.checkoutUrl,
        );
  } catch {
    boundOrder = null;
  }

  if (boundOrder) {
    return {
      checkoutSessionId: checkoutSession.checkoutSessionId,
      checkoutUrl: checkoutSession.checkoutUrl,
    };
  }

  const recovered = await checkoutHolds.recoverCheckoutSession(
    hold.id,
    checkoutSession.checkoutSessionId,
    now,
    checkoutSession.checkoutExpiresAt,
    checkoutSession.checkoutUrl,
  );
  const expiredSession = await checkoutGateway.expireHostedCheckoutSession(checkoutSession.checkoutSessionId);
  if (recovered && expiredSession.status === 'expired' && expiredSession.paymentStatus !== 'paid') {
    await checkoutHolds.releaseSessionBoundHold(
      {
        id: hold.id,
        checkoutSessionId: checkoutSession.checkoutSessionId,
        checkoutExpiresAt: checkoutSession.checkoutExpiresAt,
      },
      now,
    );
  }

  throw isNewHold ? new CheckoutUnavailableError() : new CheckoutRetryableError();
}

function createHostedCheckoutRequest(
  hold: SessionlessPendingCheckoutOrder | CheckoutRetryAttempt,
): Parameters<CheckoutGateway['createHostedCheckoutSession']>[0] {
  if (!hold.checkoutCancelUrl || !hold.checkoutSuccessUrl) throw new CheckoutRetryableError();
  const acceptedDeliveryAmountMinor = hold.acceptedDeliveryAmountMinor;
  if (
    typeof acceptedDeliveryAmountMinor !== 'number' ||
    !Number.isSafeInteger(acceptedDeliveryAmountMinor) ||
    acceptedDeliveryAmountMinor <= 0 ||
    (hold.acceptedParcelTier !== 'small' && hold.acceptedParcelTier !== 'medium') ||
    !hold.monetaryPolicyReference?.trim()
  ) {
    throw new CheckoutRetryableError();
  }

  const lineItems = hold.lines.map((line) => {
    if (!line.stripePriceId) throw new CheckoutRetryableError();
    return {
      displayName: line.displayName ?? 'Store item',
      lineAmountMinor: line.lineAmountMinor,
      optionLabel: line.optionLabel,
      quantity: line.quantity,
      storeItemSlug: line.storeItemSlug,
      stripePriceId: line.stripePriceId,
      unitAmountMinor: line.unitAmountMinor,
      variantId: line.variantId,
    };
  });

  return {
    cancelUrl: hold.checkoutCancelUrl,
    checkoutExpiresAt: hold.checkoutExpiresAt,
    lineItems,
    monetaryPolicy: {
      acceptedDeliveryAmountMinor,
      acceptedParcelTier: hold.acceptedParcelTier,
      monetaryPolicyReference: hold.monetaryPolicyReference,
    },
    newsletterOptIn: hold.newsletterOptIn === true,
    orderId: hold.id,
    successUrl: hold.checkoutSuccessUrl,
  };
}
