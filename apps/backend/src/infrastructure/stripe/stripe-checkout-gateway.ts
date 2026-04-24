import Stripe from 'stripe';

import type {
    CheckoutGateway,
    EmbeddedCheckoutSession,
    EmbeddedCheckoutSessionRequest,
    StripeCheckoutSessionState,
} from '../../application/commerce/checkout';
import { CheckoutConfigurationError } from '../../application/commerce/checkout';
import type { AppBindings } from '../../env';

const STRIPE_API_VERSION = '2026-04-22.dahlia';

export class StripeCheckoutGateway implements CheckoutGateway {
    public constructor(private readonly stripe: Stripe) {}

    public async createEmbeddedCheckoutSession(request: EmbeddedCheckoutSessionRequest): Promise<EmbeddedCheckoutSession> {
        const session = await this.stripe.checkout.sessions.create({
            line_items: [
                {
                    price: request.stripePriceId,
                    quantity: 1,
                },
            ],
            metadata: {
                storeItemSlug: request.storeItemSlug,
                variantId: request.variantId,
            },
            mode: 'payment',
            return_url: request.returnUrl,
            ui_mode: 'embedded_page',
        });

        if (!session.client_secret) {
            throw new CheckoutConfigurationError('Stripe did not return a Checkout client secret.');
        }

        return {
            checkoutSessionId: session.id,
            clientSecret: session.client_secret,
        };
    }

    public async readCheckoutSession(checkoutSessionId: string): Promise<StripeCheckoutSessionState> {
        const session = await this.stripe.checkout.sessions.retrieve(checkoutSessionId);

        return {
            checkoutSessionId: session.id,
            paymentStatus: session.payment_status,
            status: session.status,
        };
    }
}

export function createStripeCheckoutGateway(bindings: Pick<AppBindings, 'STRIPE_SECRET_KEY'>): StripeCheckoutGateway {
    if (!bindings.STRIPE_SECRET_KEY) {
        throw new CheckoutConfigurationError('Stripe secret key is not configured.');
    }

    return new StripeCheckoutGateway(
        new Stripe(bindings.STRIPE_SECRET_KEY, {
            apiVersion: STRIPE_API_VERSION,
            httpClient: Stripe.createFetchHttpClient(),
        }),
    );
}
