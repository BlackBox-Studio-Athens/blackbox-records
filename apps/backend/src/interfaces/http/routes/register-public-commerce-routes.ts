import type { AppOpenApi } from '../../../env';
import {
  getCheckoutStateRoute,
  getStoreCapabilitiesRoute,
  getStoreItemRoute,
  getStoreItemVariantsRoute,
  postCheckoutSessionRoute,
} from '../contracts/public-contracts';
import { createStartCheckoutLineCommand } from '../../../application/commerce/checkout';
import { requestLogger, safeCheckoutSessionId, traceContextFromHono, runWithTraceSpan } from '../../../observability';
import { createPublicCheckoutCancelUrl, createPublicCheckoutReturnUrl } from './public-checkout-return-url';
import { createPublicCommerceServices } from './public-commerce-services';

const jsonNoStore = <TResponse extends Response>(response: TResponse): TResponse => {
  response.headers.set('Cache-Control', 'no-store');

  return response;
};

export function registerPublicCommerceRoutes(app: AppOpenApi): void {
  app.openapi(getStoreCapabilitiesRoute, async (context) => {
    const logger = requestLogger(context);
    const services = createPublicCommerceServices(context.env, logger);

    try {
      const capabilities = await services.readStoreCapabilities();
      const nativeCheckoutEnabled = capabilities.nativeCheckout.enabled;

      logger.info({
        event: 'checkout_capability_evaluated',
        outcome: nativeCheckoutEnabled ? 'allowed' : 'disabled',
        safeReason: nativeCheckoutEnabled ? undefined : 'native_checkout_disabled',
      });

      return jsonNoStore(context.json(capabilities, 200));
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(getStoreItemRoute, async (context) => {
    const services = createPublicCommerceServices(context.env);

    try {
      const { storeItemSlug } = context.req.valid('param');
      const offer = await services.readStoreOffer(storeItemSlug);

      if (!offer) {
        return jsonNoStore(context.json({ error: 'Store item not found.' }, 404));
      }

      return jsonNoStore(context.json(offer, 200));
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(getStoreItemVariantsRoute, async (context) => {
    const services = createPublicCommerceServices(context.env);

    try {
      const { storeItemSlug } = context.req.valid('param');
      const variants = await services.listVariantOffersForStoreItem(storeItemSlug);

      if (!variants) {
        return jsonNoStore(context.json({ error: 'Store item not found.' }, 404));
      }

      return jsonNoStore(context.json(variants, 200));
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(postCheckoutSessionRoute, async (context) => {
    const logger = requestLogger(context);
    const services = createPublicCommerceServices(context.env, logger);

    try {
      const body = context.req.valid('json');
      const lines =
        body.lines ??
        (body.storeItemSlug && body.variantId
          ? [
              {
                quantity: 1,
                storeItemSlug: body.storeItemSlug,
                variantId: body.variantId,
              },
            ]
          : []);
      const primaryLine = lines[0];

      if (!primaryLine) {
        logger.warn({
          event: 'checkout_start_outcome',
          outcome: 'validation_failed',
          safeReason: 'missing_cart_line',
        });

        return jsonNoStore(context.json({ error: 'Checkout requires at least one cart line.' }, 400));
      }

      const checkoutLines = lines.map(createStartCheckoutLineCommand);
      const primaryCheckoutLine = checkoutLines[0]!;

      const checkoutSession = await runWithTraceSpan(
        traceContextFromHono(context),
        'checkout.start',
        {
          operation: 'checkout_start',
          productEnvironment: context.env.PRODUCT_ENVIRONMENT,
          storeItemSlug: primaryCheckoutLine.storeItemSlug,
          variantId: primaryCheckoutLine.variantId,
        },
        () =>
          services.startCheckout({
            cancelUrl: createPublicCheckoutCancelUrl(
              context.req.raw.headers,
              context.req.url,
              primaryCheckoutLine.storeItemSlug,
              context.env.CHECKOUT_RETURN_ORIGINS,
            ),
            ...(body.lines ? { lines: checkoutLines } : {}),
            newsletterOptIn: body.newsletterOptIn === true,
            successUrl: createPublicCheckoutReturnUrl(
              context.req.raw.headers,
              context.req.url,
              primaryCheckoutLine.storeItemSlug,
              context.env.CHECKOUT_RETURN_ORIGINS,
            ),
            storeItemSlug: primaryCheckoutLine.storeItemSlug,
            variantId: primaryCheckoutLine.variantId,
          }),
      );

      logger.info({
        checkoutSessionIdHash: safeCheckoutSessionId(checkoutSession.checkoutSessionId),
        event: 'checkout_start_outcome',
        outcome: 'allowed',
        storeItemSlug: primaryCheckoutLine.storeItemSlug,
        variantId: primaryCheckoutLine.variantId,
      });

      return jsonNoStore(context.json({ checkoutUrl: checkoutSession.checkoutUrl }, 200));
    } catch (error) {
      if (error instanceof services.errors.StoreItemNotFoundError) {
        logger.warn({
          event: 'checkout_start_outcome',
          outcome: 'validation_failed',
          safeReason: 'store_item_not_found',
        });

        return jsonNoStore(context.json({ error: error.message }, 404));
      }

      if (error instanceof services.errors.VariantMismatchError) {
        logger.warn({
          event: 'checkout_start_outcome',
          outcome: 'validation_failed',
          safeReason: 'variant_mismatch',
        });

        return jsonNoStore(context.json({ error: error.message }, 400));
      }

      if (error instanceof services.errors.NativeCheckoutDisabledError) {
        logger.warn({
          event: 'checkout_start_outcome',
          outcome: 'disabled',
          safeReason: 'native_checkout_disabled',
        });

        return jsonNoStore(context.json({ error: error.message }, 503));
      }

      if (error instanceof services.errors.CheckoutUnavailableError) {
        logger.warn({
          event: 'checkout_start_outcome',
          outcome: 'stock_unavailable',
          safeReason: 'checkout_unavailable',
        });

        return jsonNoStore(context.json({ error: error.message }, 409));
      }

      if (error instanceof services.errors.CatalogDriftError) {
        logger.warn({
          event: 'checkout_start_outcome',
          outcome: 'catalog_drift',
          safeReason: 'catalog_drift',
        });

        return jsonNoStore(context.json({ error: error.message }, 409));
      }

      if (error instanceof services.errors.CheckoutConfigurationError) {
        logger.error({
          event: 'checkout_start_outcome',
          outcome: 'provider_failed',
          safeReason: 'checkout_configuration',
        });

        return jsonNoStore(context.json({ error: error.message }, 409));
      }

      throw error;
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(getCheckoutStateRoute, async (context) => {
    const services = createPublicCommerceServices(context.env);

    try {
      const { checkoutSessionId } = context.req.valid('param');
      const checkoutState = await services.readCheckoutState(checkoutSessionId);

      return jsonNoStore(context.json(checkoutState, 200));
    } catch (error) {
      if (error instanceof services.errors.CheckoutConfigurationError) {
        return jsonNoStore(context.json({ error: error.message }, 409));
      }

      throw error;
    } finally {
      await services.disconnect();
    }
  });
}
