import type { AppOpenApi } from '../../../env';
import {
  getCheckoutStateRoute,
  getStoreCapabilitiesRoute,
  getStoreItemRoute,
  getStoreItemVariantsRoute,
  postCheckoutSessionRoute,
} from '../contracts/public-contracts';
import { createPublicCheckoutReturnUrl } from './public-checkout-return-url';
import { createPublicCommerceServices } from './public-commerce-services';

export function registerPublicCommerceRoutes(app: AppOpenApi): void {
  app.openapi(getStoreCapabilitiesRoute, async (context) => {
    const services = createPublicCommerceServices(context.env);

    try {
      return context.json(await services.readStoreCapabilities(), 200);
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
        return context.json({ error: 'Store item not found.' }, 404);
      }

      return context.json(offer, 200);
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
        return context.json({ error: 'Store item not found.' }, 404);
      }

      return context.json(variants, 200);
    } finally {
      await services.disconnect();
    }
  });

  app.openapi(postCheckoutSessionRoute, async (context) => {
    const services = createPublicCommerceServices(context.env);

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
        return context.json({ error: 'Checkout requires at least one cart line.' }, 400);
      }

      const checkoutSession = await services.startCheckout({
        ...(body.lines ? { lines } : {}),
        returnUrl: createPublicCheckoutReturnUrl(
          context.req.raw.headers,
          context.req.url,
          primaryLine.storeItemSlug,
          context.env.CHECKOUT_RETURN_ORIGINS,
        ),
        shippingLocker: body.shippingLocker,
        storeItemSlug: primaryLine.storeItemSlug,
        variantId: primaryLine.variantId,
      });

      return context.json(
        {
          clientSecret: checkoutSession.clientSecret,
        },
        200,
      );
    } catch (error) {
      if (error instanceof services.errors.StoreItemNotFoundError) {
        return context.json({ error: error.message }, 404);
      }

      if (error instanceof services.errors.VariantMismatchError) {
        return context.json({ error: error.message }, 400);
      }

      if (error instanceof services.errors.CheckoutShippingSelectionError) {
        return context.json({ error: error.message }, 400);
      }

      if (error instanceof services.errors.NativeCheckoutDisabledError) {
        return context.json({ error: error.message }, 503);
      }

      if (
        error instanceof services.errors.CheckoutUnavailableError ||
        error instanceof services.errors.CheckoutConfigurationError
      ) {
        return context.json({ error: error.message }, 409);
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

      return context.json(checkoutState, 200);
    } catch (error) {
      if (error instanceof services.errors.CheckoutConfigurationError) {
        return context.json({ error: error.message }, 409);
      }

      throw error;
    } finally {
      await services.disconnect();
    }
  });
}
