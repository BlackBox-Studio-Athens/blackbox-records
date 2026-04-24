import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createPublicCheckoutApi, type PublicCheckoutApi } from '@/lib/backend/public-checkout-api';
import { cn } from '@/lib/utils';
import {
  createCheckoutOfferView,
  createInitialCheckoutOfferView,
  loadCheckoutOfferState,
  type CheckoutOfferInitialAvailability,
  type CheckoutOfferStatusView,
} from './checkout-offer-status-state';

interface CheckoutOfferStatusProps {
  initialAvailability: CheckoutOfferInitialAvailability;
  storeItemSlug: string;
  api?: PublicCheckoutApi;
}

export default function CheckoutOfferStatus({ api, initialAvailability, storeItemSlug }: CheckoutOfferStatusProps) {
  const [view, setView] = useState<CheckoutOfferStatusView>(() => createInitialCheckoutOfferView(initialAvailability));

  useEffect(() => {
    let isActive = true;
    const checkoutApi = api ?? createPublicCheckoutApi();

    async function loadOffer() {
      const loadState = await loadCheckoutOfferState(checkoutApi, storeItemSlug);

      if (isActive) {
        setView(createCheckoutOfferView(loadState));
      }
    }

    void loadOffer();

    return () => {
      isActive = false;
    };
  }, [api, storeItemSlug]);

  return (
    <div className="space-y-4" data-checkout-offer-status>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Worker checkout state</p>
        <Badge
          variant="outline"
          className={cn(
            'rounded-none border px-2 py-1 text-[10px] uppercase tracking-[0.18em]',
            view.tone === 'ready' && 'border-foreground/30 bg-background/70 text-foreground',
            view.tone === 'unavailable' && 'border-border/70 bg-background/70 text-muted-foreground',
            view.tone === 'error' && 'border-amber-300/45 bg-amber-300/10 text-amber-100',
            view.tone === 'loading' && 'border-border/70 bg-background/50 text-muted-foreground',
          )}
        >
          {view.badgeLabel}
        </Badge>
      </div>

      <Card className="rounded-none border-border/70 bg-background/45 shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Availability</p>
              <p className="font-display text-2xl uppercase tracking-[0.08em] text-foreground">{view.statusLabel}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Variant</p>
              <p className="break-all font-mono text-xs text-muted-foreground">{view.variantId ?? 'Awaiting Worker read'}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{view.detail}</p>

          {!view.isReady && (
            <p className="border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
              Payment is not started from this panel. The next slice mounts embedded Checkout only after this Worker-read path is stable.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
