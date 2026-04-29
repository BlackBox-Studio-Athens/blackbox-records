import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  CHECKOUT_SHIPPING_COPY,
  createCheckoutShippingGateView,
  LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION,
  type CheckoutLockerSelection,
} from './checkout-shipping-step-state';

type CheckoutShippingStepProps = {
  checkoutClientMode: string | undefined;
  lockerSelection: CheckoutLockerSelection | null;
  onChangeLocker: () => void;
  onSelectLocker: (lockerSelection: CheckoutLockerSelection) => void;
};

export default function CheckoutShippingStep({
  checkoutClientMode,
  lockerSelection,
  onChangeLocker,
  onSelectLocker,
}: CheckoutShippingStepProps) {
  const view = createCheckoutShippingGateView({
    checkoutClientMode,
    lockerSelection,
  });

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
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">1. Locker</p>
            <p className="text-xs uppercase tracking-[0.16em] text-foreground">
              {view.canContinueToPayment ? 'Selected' : 'Required'}
            </p>
          </div>
          <div
            className={cn(
              'border px-3 py-2',
              view.canContinueToPayment ? 'border-foreground/25 bg-background/70' : 'border-border/60 bg-background/35',
            )}
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">2. Payment</p>
            <p className="text-xs uppercase tracking-[0.16em] text-foreground">
              {view.canContinueToPayment ? 'Ready below' : 'Locked'}
            </p>
          </div>
        </div>

        {view.canContinueToPayment && view.selectedLocker ? (
          <div className="grid gap-4 border border-border/70 bg-background/70 p-4" data-selected-locker-summary>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Selected locker</p>
              <p className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">
                {view.selectedLocker.locker_name_or_label}
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Greece</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{view.detail}</p>
              <Button
                type="button"
                variant="outline"
                className="rounded-none uppercase tracking-[0.16em]"
                onClick={onChangeLocker}
              >
                {CHECKOUT_SHIPPING_COPY.changeLocker}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 border border-border/70 bg-background/55 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>
            {view.isMockPickerAvailable ? (
              <Button
                type="button"
                className="w-full rounded-none uppercase tracking-[0.16em] sm:w-fit"
                onClick={() => onSelectLocker(LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION)}
              >
                {CHECKOUT_SHIPPING_COPY.mockSelect}
              </Button>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                The real BOX NOW picker is not configured yet. This checkout must stay closed until that integration
                exists.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
