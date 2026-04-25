import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type CheckoutOrderSummaryInput = {
  availabilityLabel: string;
  canBuy: boolean;
  image: string | null;
  imageAlt: string;
  itemHref: string;
  optionLabel: string | null;
  priceDisplay: string;
  subtitle: string;
  title: string;
};

export type CheckoutOrderSummaryView = CheckoutOrderSummaryInput & {
  securePaymentCopy: string;
  subtotalDisplay: string;
};

export const CHECKOUT_ORDER_SUMMARY_COPY = {
  backToItem: 'Back To Item',
  securePayment: 'Payment is handled securely by Stripe.',
  subtotal: 'Subtotal',
  title: 'Order Summary',
} as const;

export function createCheckoutOrderSummaryView(input: CheckoutOrderSummaryInput): CheckoutOrderSummaryView {
  return {
    ...input,
    securePaymentCopy: CHECKOUT_ORDER_SUMMARY_COPY.securePayment,
    subtotalDisplay: input.priceDisplay,
  };
}

export default function CheckoutOrderSummary(props: CheckoutOrderSummaryInput) {
  const view = createCheckoutOrderSummaryView(props);

  return (
    <Card className="rounded-none border-border/70 bg-[#101010] shadow-none" data-checkout-order-summary>
      <CardContent className="grid gap-5 p-5">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {CHECKOUT_ORDER_SUMMARY_COPY.title}
          </p>
          <Badge
            variant="outline"
            className={cn(
              'rounded-none border px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
              view.canBuy
                ? 'border-foreground/25 bg-background/70 text-foreground'
                : 'border-border/70 bg-background/70 text-muted-foreground',
            )}
          >
            {view.availabilityLabel}
          </Badge>
        </div>

        <article className="grid grid-cols-[84px_1fr] gap-4">
          <div className="aspect-square overflow-hidden border border-border/70 bg-muted/20">
            {view.image ? (
              <img className="h-full w-full object-cover" src={view.image} alt={view.imageAlt || view.title} />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <p className="font-display text-2xl uppercase tracking-[0.09em] text-foreground">{view.title}</p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{view.subtitle}</p>
            {view.optionLabel && (
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{view.optionLabel}</p>
            )}
            <p className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">{view.priceDisplay}</p>
          </div>
        </article>

        <div className="space-y-3 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {CHECKOUT_ORDER_SUMMARY_COPY.subtotal}
            </span>
            <span className="font-display text-3xl uppercase tracking-[0.08em] text-foreground">
              {view.subtotalDisplay}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{view.securePaymentCopy}</p>
        </div>

        <a
          href={view.itemHref}
          className="inline-flex min-h-11 items-center justify-center border border-border/80 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {CHECKOUT_ORDER_SUMMARY_COPY.backToItem}
        </a>
      </CardContent>
    </Card>
  );
}
