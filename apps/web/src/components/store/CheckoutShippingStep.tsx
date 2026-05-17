import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createCheckoutShippingGateView } from './checkout-shipping-step-state';

type CheckoutShippingStepProps = {
  checkoutClientMode: string | undefined;
};

export default function CheckoutShippingStep({ checkoutClientMode }: CheckoutShippingStepProps) {
  const view = createCheckoutShippingGateView(checkoutClientMode);

  return (
    <Card
      className="rounded-none border-border/70 bg-[#111111] shadow-none"
      data-checkout-shipping-step
      data-checkout-shipping-ready={view.canContinueToPayment ? 'true' : 'false'}
    >
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Shipping</p>
            <h3 className="font-display text-2xl uppercase tracking-[0.08em] text-foreground sm:text-3xl">
              {view.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>
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

        <p className="text-xs leading-relaxed text-muted-foreground">No locker selection is needed before payment.</p>
      </CardContent>
    </Card>
  );
}
