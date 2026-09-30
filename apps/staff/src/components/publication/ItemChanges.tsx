import { useId } from 'react';
import { ArrowRight, CheckCircle2, Circle, CircleAlert, Images, Info, RefreshCw, Store, Tag } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '../ui/item';
import { Spinner } from '../ui/spinner';
import { describePrice, shopIntent, type ItemCommerceState, type ItemPublicationStep } from '../../lib/item-commerce';

/** A settled step always explains its outcome; a running step may report progress. */
export type StepStatus =
  | { status: 'waiting' }
  | { status: 'running'; message?: string }
  | { status: 'done' | 'failed' | 'review'; message: string };
export type ItemStepState = { step: ItemPublicationStep } & StepStatus;

// The "What goes live" list of the item publish review.
export function ItemChangeRows({
  commerce,
  contentChanged,
  putOnSale,
  onPutOnSale,
  disabled,
}: {
  commerce: ItemCommerceState;
  contentChanged: boolean;
  putOnSale: boolean;
  onPutOnSale(value: boolean): void;
  disabled: boolean;
}) {
  const heading = useId();
  const saleId = useId();
  const draft = commerce.priceDraft;
  const intent = shopIntent(commerce.shop, putOnSale);
  return (
    <section aria-labelledby={heading} className="grid gap-3">
      <h3 id={heading} className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        What goes live
      </h3>
      <ItemGroup className="divide-y divide-border border-y border-border">
        {draft && (
          <Item size="sm" className="rounded-none px-0">
            <ItemMedia variant="icon">
              <Tag aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Price</ItemTitle>
              <ItemDescription className="flex flex-wrap items-center gap-2 text-foreground">
                <span className="text-muted-foreground line-through">
                  {commerce.livePrice ? describePrice(commerce.livePrice) : 'No price yet'}
                </span>
                <ArrowRight className="size-4" aria-label="changes to" />
                <strong className="text-base font-semibold">{describePrice(draft.price)}</strong>
              </ItemDescription>
              <ItemDescription>New orders pay the new price. Existing orders keep theirs.</ItemDescription>
            </ItemContent>
          </Item>
        )}
        {contentChanged && (
          <Item size="sm" className="rounded-none px-0">
            <ItemMedia variant="icon">
              <Images aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Details &amp; photos</ItemTitle>
              <ItemDescription>The differences are listed below.</ItemDescription>
            </ItemContent>
          </Item>
        )}
        {(intent === 'activate' || (intent === 'sync' && contentChanged)) && (
          <Item size="sm" className="rounded-none px-0">
            <ItemMedia variant="icon">
              <Store aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Shop checkout</ItemTitle>
              <ItemDescription>
                {intent === 'activate'
                  ? 'The item becomes buyable, with the saved title, description and cover.'
                  : 'Checkout shows the saved title, description and cover, matching the website.'}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant="secondary">Automatic</Badge>
            </ItemActions>
          </Item>
        )}
      </ItemGroup>
      {commerce.shop === 'ready_to_sell' && (
        <div className="flex items-start gap-3 rounded-md border border-border p-3">
          <Checkbox
            id={saleId}
            className="mt-0.5 size-5"
            checked={putOnSale}
            disabled={disabled}
            onCheckedChange={(checked) => onPutOnSale(checked === true)}
          />
          <label htmlFor={saleId} className="grid gap-1 text-sm">
            <span className="font-medium">Put this item on sale in the shop</span>
            <span className="text-muted-foreground">Leave unticked to publish without selling it yet.</span>
          </label>
        </div>
      )}
      <p className="flex gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Stock is not part of publishing. It changes as soon as you update it.
      </p>
    </section>
  );
}

const stepLabels: Record<ItemPublicationStep, string> = {
  price: 'Price',
  content: 'Website',
  item: 'Website and shop checkout',
};

export function ItemPublishProgress({
  steps,
  busy,
  onRetry,
}: {
  steps: ItemStepState[];
  busy: boolean;
  onRetry(): void;
}) {
  return (
    <ItemGroup aria-label="Publication progress" className="divide-y divide-border border-y border-border">
      {steps.map((state) => (
        <Item key={state.step} size="sm" className="rounded-none px-0">
          <ItemMedia>
            {state.status === 'done' ? (
              <CheckCircle2 className="size-6 cms-state-success" aria-label="Done" />
            ) : state.status === 'running' ? (
              <Spinner className="size-6" aria-hidden={false} aria-label="In progress" />
            ) : state.status === 'waiting' ? (
              <Circle className="size-6 text-muted-foreground" aria-label="Waiting" />
            ) : (
              <CircleAlert className="size-6 cms-state-error" aria-label="Not confirmed" />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="text-base">{stepLabels[state.step]}</ItemTitle>
            {'message' in state && state.message && (
              <ItemDescription
                role={state.status === 'failed' || state.status === 'review' ? 'alert' : undefined}
                className={state.status === 'failed' || state.status === 'review' ? 'cms-state-error' : undefined}
              >
                {state.message}
              </ItemDescription>
            )}
          </ItemContent>
          {state.status === 'failed' && state.step !== 'content' && (
            <ItemActions>
              <Button disabled={busy} onClick={onRetry}>
                <RefreshCw aria-hidden="true" />
                Retry
              </Button>
            </ItemActions>
          )}
        </Item>
      ))}
    </ItemGroup>
  );
}
