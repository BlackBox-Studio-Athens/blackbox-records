export type paths = {
    "/api/checkout/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createCheckoutSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/checkout/sessions/{checkoutSessionId}/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCheckoutState"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/newsletter/registrations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["registerNewsletter"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/services/inquiries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitServicesInquiry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPublicApiDiscovery"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getStoreCapabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/delivery-quote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        lines: components["schemas"]["StartCheckoutLine"][];
                    };
                };
            };
            responses: {
                /** @description Current complete-cart delivery quote, or unavailable. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["DeliveryQuoteResponse"];
                    };
                };
                /** @description The delivery quote request is invalid. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["BackendErrorResponse"];
                    };
                };
                /** @description The delivery quote service is temporarily unavailable. */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["BackendErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/items/{storeItemSlug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getStoreItem"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/items/{storeItemSlug}/availability-alerts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["requestAvailabilityAlert"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/items/{storeItemSlug}/variants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listStoreItemVariants"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/listing-prices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listStoreListingPrices"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/openapi.json": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPublicApiDescription"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/store/withdrawals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitWithdrawal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        ApiAction: {
            href: string;
            /** @enum {string} */
            method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
            operationRef: string;
            parameters?: components["schemas"]["ApiActionParameters"];
            rel: string;
            type?: string;
        };
        ApiActionParameters: {
            body?: {
                [key: string]: unknown;
            };
            path?: {
                [key: string]: string | number | boolean | null;
            };
            query?: {
                [key: string]: string | number | boolean | null;
            };
        };
        ApiLink: {
            href: string;
            rel: string;
            type?: string;
        };
        AvailabilityAlertRequestBody: {
            /**
             * @description The shopper ticked: "Email me once when this can be bought or pre-ordered."
             * @enum {boolean}
             */
            consent: true;
            /** Format: email */
            email: string;
        };
        /** @description The same response for a new request and for an address already waiting. */
        AvailabilityAlertRequestResponse: {
            /** @enum {string} */
            status: "requested";
        };
        BackendErrorResponse: components["schemas"]["ProblemDetails"] & {
            error: string;
        };
        CheckoutState: {
            checkoutSessionId: string;
            orderSnapshot?: {
                lines: {
                    displayName: string;
                    optionLabel: string | null;
                    preorder: components["schemas"]["PublicStorePreorder"];
                    quantity: number;
                    storeItemSlug: string;
                }[];
                reference: string;
            };
            /** @enum {string|null} */
            orderStatus: "pending_payment" | "paid" | "not_paid" | "needs_review" | null;
            /** @enum {string} */
            paymentStatus: "paid" | "unpaid" | "no_payment_required";
            preorder: components["schemas"]["PublicStorePreorder"];
            shippingLocker: components["schemas"]["CheckoutStateShippingLocker"] | null;
            /** @enum {string} */
            state: "open" | "paid" | "processing" | "expired" | "unknown";
            /** @enum {string|null} */
            status: "open" | "complete" | "expired" | null;
        };
        CheckoutStateShippingLocker: {
            /** @enum {string} */
            country_code: "GR";
            locker_id: string;
            locker_name_or_label: string;
        };
        DeliveryQuoteResponse: {
            quote: {
                amountMinor: number;
                /** @enum {string} */
                currencyCode: "EUR";
                merchandiseGrossMinor: number | null;
                /** @enum {string} */
                taxCollectionMode?: "STRIPE_AUTOMATIC_TAX" | "NO_TAX_COLLECTED";
                /** @enum {string} */
                tier: "small" | "medium";
                totalAmountMinor: number | null;
            } | null;
        };
        NewsletterRegistrationBody: {
            /** @enum {boolean} */
            consentAccepted: true;
            /** Format: email */
            email: string;
        };
        NewsletterRegistrationResponse: {
            /** @enum {string} */
            status: "registered";
        };
        ProblemDetails: {
            code: string;
            detail: string;
            requestId?: string;
            status: number;
            title: string;
            type: string;
        };
        PublicApiDescription: {
            [key: string]: unknown;
        };
        PublicApiDiscovery: {
            links: components["schemas"]["ApiLink"][];
        };
        PublicShipEstimate: {
            /** @enum {string} */
            kind: "month";
            month: string;
            /** @enum {string|null} */
            part: "early" | "mid" | "late" | null;
        } | {
            date: string;
            /** @enum {string} */
            kind: "date";
        } | null;
        PublicStoreListingPrice: {
            /** @enum {string} */
            availabilityState: "stocked" | "coming_soon" | "repressing" | "sold_out" | "unavailable";
            displayPrice: string;
            /** @description `YYYY-MM` month, present only for Coming Soon or Repressing until that month has passed in Europe/Athens. */
            expectedMonth?: string;
            /** @description Copies left, present only when staff enabled the notice and few copies remain. */
            lowStockQuantity?: number;
            preorder: components["schemas"]["PublicStorePreorder"];
            /** @enum {string} */
            presentationState: "ready";
            storeItemSlug: string;
        } | {
            /** @enum {string} */
            availabilityState: "stocked" | "coming_soon" | "repressing" | "sold_out" | "unavailable";
            /** @description `YYYY-MM` month, present only for Coming Soon or Repressing until that month has passed in Europe/Athens. */
            expectedMonth?: string;
            preorder: components["schemas"]["PublicStorePreorder"];
            /** @enum {string} */
            presentationState: "unavailable";
            storeItemSlug: string;
        };
        PublicStoreOffer: {
            actions?: components["schemas"]["ApiAction"][];
            availability: {
                label: string;
                /** @enum {string} */
                status: "available";
            };
            /** @enum {boolean} */
            canCheckout: true;
            /** @enum {string} */
            catalogStatus: "ready";
            links?: components["schemas"]["ApiLink"][];
            /** @description Copies left, present only when staff enabled the notice and few copies remain. */
            lowStockQuantity?: number;
            preorder: components["schemas"]["PublicStorePreorder"];
            price: components["schemas"]["PublicStoreOfferPrice"];
            storeItemSlug: string;
            variantId: string;
        } | {
            actions?: components["schemas"]["ApiAction"][];
            availability: {
                label: string;
                /** @enum {string} */
                state: "coming_soon" | "repressing" | "sold_out" | "unavailable";
                /** @enum {string} */
                status: "sold_out";
            };
            /** @enum {boolean} */
            canCheckout: false;
            /** @enum {string} */
            catalogStatus: "sold_out";
            /** @description `YYYY-MM` month, present only for Coming Soon or Repressing until that month has passed in Europe/Athens. */
            expectedMonth?: string;
            links?: components["schemas"]["ApiLink"][];
            price: null;
            storeItemSlug: string;
            variantId: string;
        } | {
            actions?: components["schemas"]["ApiAction"][];
            availability: {
                label: string;
                /** @enum {string} */
                status: "unavailable";
            };
            /** @enum {boolean} */
            canCheckout: false;
            /** @enum {string} */
            catalogStatus: "catalog_drift";
            links?: components["schemas"]["ApiLink"][];
            price: null;
            storeItemSlug: string;
            variantId: string;
        };
        PublicStoreOfferPrice: {
            amountMinor: number;
            currencyCode: string;
            display: string;
            /** @enum {string} */
            kind: "fixed";
        } | {
            currencyCode: string;
            display: string;
            /** @enum {string} */
            kind: "pay_what_you_want";
            maximumAmountMinor: number;
            minimumAmountMinor: number;
            presetAmountMinor: number;
        };
        PublicStorePreorder: {
            shipEstimate: components["schemas"]["PublicShipEstimate"];
        } | null;
        ServicesInquiryBody: {
            bandOrProject?: string;
            /** Format: email */
            email: string;
            message: string;
            name: string;
            /** @enum {string} */
            service: "General" | "Tour Booking" | "Merch Printing" | "Vinyl Pressing" | "Share your demo";
            serviceDetails?: string;
        };
        ServicesInquiryResponse: {
            /** @enum {string} */
            status: "submitted";
        };
        StartCheckoutBody: {
            lines?: components["schemas"]["StartCheckoutLine"][];
            newsletterOptIn?: boolean;
            storeItemSlug?: string;
            variantId?: string;
        };
        StartCheckoutLine: {
            quantity: number;
            storeItemSlug: string;
            variantId: string;
        };
        StartCheckoutResponse: {
            /** Format: uri */
            checkoutUrl: string;
        };
        StoreCapabilities: {
            nativeCheckout: {
                enabled: boolean;
                unavailableReason: string | null;
            };
            pricing?: {
                /** @enum {string} */
                currencyCode: "EUR";
                deliveryCharges: {
                    medium: number;
                    small: number;
                };
                /** @enum {string} */
                taxCollectionMode?: "STRIPE_AUTOMATIC_TAX" | "NO_TAX_COLLECTED";
                vatDisclosure: string;
            };
        };
        WithdrawalDeclaration: {
            /** @enum {boolean} */
            confirmed: true;
            contract: string;
            /** Format: email */
            email: string;
            name: string;
            /** Format: uuid */
            submissionId: string;
        };
        WithdrawalReceipt: {
            receiptId: string;
            receiptText: string;
            /** @enum {string} */
            status: "received";
            /** Format: date-time */
            submittedAt: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    createCheckoutSession: {
        parameters: {
            query?: never;
            header?: {
                "idempotency-key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["StartCheckoutBody"];
            };
        };
        responses: {
            /** @description Created a hosted Stripe Checkout Session. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StartCheckoutResponse"];
                };
            };
            /** @description Invalid checkout request. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Store item not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Checkout unavailable or not configured. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Native checkout is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    getCheckoutState: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                checkoutSessionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sanitized Checkout Session state for shopper return UI. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckoutState"];
                };
            };
            /** @description Checkout is not configured. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    registerNewsletter: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["NewsletterRegistrationBody"];
            };
        };
        responses: {
            /** @description Registered a public newsletter contact. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsletterRegistrationResponse"];
                };
            };
            /** @description Invalid newsletter signup request. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Newsletter signup is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    submitServicesInquiry: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ServicesInquiryBody"];
            };
        };
        responses: {
            /** @description Submitted a Services inquiry for provider delivery. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ServicesInquiryResponse"];
                };
            };
            /** @description Invalid Services inquiry request. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Services inquiry submission is temporarily unavailable. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    getPublicApiDiscovery: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Public API navigation and description links. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicApiDiscovery"];
                };
            };
        };
    };
    getStoreCapabilities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Browser-safe public store capability state. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StoreCapabilities"];
                };
            };
        };
    };
    getStoreItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                storeItemSlug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Backend-known checkout eligibility for one store item. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicStoreOffer"];
                };
            };
            /** @description Store item not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    requestAvailabilityAlert: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                storeItemSlug: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityAlertRequestBody"];
            };
        };
        responses: {
            /** @description One email will be sent when the item can be bought or pre-ordered. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AvailabilityAlertRequestResponse"];
                };
            };
            /** @description Invalid email or consent, or the item is not Coming Soon or Repressing. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Store item not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Alerts for this item are temporarily unavailable. Retry later. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    listStoreItemVariants: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                storeItemSlug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Checkout-eligible variants for one store item. */
            200: {
                headers: {
                    /** @description RFC 8288 relationships for this response. */
                    Link?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicStoreOffer"][];
                };
            };
            /** @description Store item not found. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
    listStoreListingPrices: {
        parameters: {
            query?: {
                scope?: "preorders";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Browser-safe current Store listing-price presentation. */
            200: {
                headers: {
                    /** @description RFC 8288 relationships for this response. */
                    Link?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicStoreListingPrice"][];
                };
            };
        };
    };
    getPublicApiDescription: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Public OpenAPI 3.1 description. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicApiDescription"];
                };
            };
        };
    };
    submitWithdrawal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WithdrawalDeclaration"];
            };
        };
        responses: {
            /** @description Declaration durably recorded; acknowledgement delivery queued. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WithdrawalReceipt"];
                };
            };
            /** @description Invalid declaration. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Submission identity already used for another declaration. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Too many submissions. Email withdrawal remains available. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
            /** @description Recording unavailable. Email withdrawal remains available. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["BackendErrorResponse"];
                };
            };
        };
    };
}

