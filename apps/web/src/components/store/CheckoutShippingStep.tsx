import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CHECKOUT_SHIPPING_COPY, createCheckoutShippingGateView } from './checkout-shipping-step-state';

type CheckoutShippingStepProps = {
  checkoutClientMode: string | undefined;
};

export default function CheckoutShippingStep({ checkoutClientMode }: CheckoutShippingStepProps) {
  const view = createCheckoutShippingGateView(checkoutClientMode);

  return (
    <Card
      className="rounded-none border-border/70 bg-background/45 shadow-none"
      data-checkout-shipping-step
      data-checkout-shipping-ready={view.canContinueToPayment ? 'true' : 'false'}
    >
      <CardContent className="grid gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
            <h3 className="font-display text-3xl uppercase tracking-[0.08em] text-foreground">{view.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{CHECKOUT_SHIPPING_COPY.stepSupport}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'rounded-none border px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
              view.tone === 'ready' && 'border-foreground/30 bg-background/70 text-foreground',
              view.tone === 'empty' && 'border-border/70 bg-background/70 text-muted-foreground',
              view.tone === 'blocked' && 'border-amber-300/45 bg-amber-300/10 text-amber-100',
            )}
          >
            {view.badgeLabel}
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-2" aria-label="Checkout steps">
          <div className="border border-foreground/25 bg-background/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">1. Shipping details</p>
            <p className="text-xs uppercase tracking-[0.16em] text-foreground">{view.shippingDetail}</p>
          </div>
          <div className="border border-foreground/25 bg-background/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">2. Fulfillment</p>
            <p className="text-xs uppercase tracking-[0.16em] text-foreground">Manual BOX NOW</p>
          </div>
        </div>

        <div className="grid gap-2 border border-border/70 bg-background/70 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{view.fulfillmentDetail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
