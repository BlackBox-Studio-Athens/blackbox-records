import * as React from 'react';
import { useId, useState } from 'react';
import { CalendarDays, PackageCheck, Save } from 'lucide-react';
import type { InternalStockDetail } from '../../lib/backend/internal-stock-api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import Switch from '../fields/Switch';
import SegmentedChoice from '../fields/SegmentedChoice';
import { athensToday, preorderPreview, shipEstimateText, type ShipEstimate } from './preorder-preview';

interface PreorderControlProps {
  preorder: InternalStockDetail['stock']['preorder'];
  disabled: boolean;
  busy: boolean;
  onSave(estimate: ShipEstimate | null): Promise<void>;
  /** Ending a pre-order first asks how many copies we have, so both ways out open that step. */
  onEnd(): void;
  today?: string;
}

const selectClass =
  'min-h-11 min-w-0 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export default function PreorderControl({
  preorder,
  disabled,
  busy,
  onSave,
  onEnd,
  today = athensToday(),
}: PreorderControlProps) {
  const id = useId();
  const [enabled, setEnabled] = useState(preorder?.open ?? false);
  const [kind, setKind] = useState<ShipEstimate['kind']>(preorder?.shipEstimate.kind ?? 'month');
  const [month, setMonth] = useState(
    preorder?.shipEstimate.kind === 'month' ? preorder.shipEstimate.month : today.slice(0, 7),
  );
  const [date, setDate] = useState(preorder?.shipEstimate.kind === 'date' ? preorder.shipEstimate.date : '');
  const months = Array.from({ length: 18 }, (_, index) => {
    const value = new Date(today.slice(0, 7) + '-01T00:00:00Z');
    value.setUTCMonth(value.getUTCMonth() + index);
    return value.toISOString().slice(0, 7);
  });
  if (!months.includes(month)) months.unshift(month);
  const tomorrow = new Date(today + 'T00:00:00Z');
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const estimate: ShipEstimate = kind === 'month' ? { kind, month, part: null } : { kind, date };
  const rows = enabled && (kind === 'month' || date) ? preorderPreview(estimate, today) : ['Not on pre-order'];
  const monthPassed = kind === 'month' && month < today.slice(0, 7);
  const monthLabel = (value: string) =>
    shipEstimateText({ kind: 'month', month: value, part: null }).replace('around ', '');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (enabled && !disabled && !busy) void onSave(estimate);
      }}
      className="min-w-0 border-t border-border pt-4"
    >
      <fieldset disabled={disabled || busy} aria-busy={busy ? 'true' : undefined} className="grid min-w-0 gap-4">
        <legend className="sr-only">Pre-order settings</legend>
        <Switch
          id={id + '-switch'}
          label="Pre-order"
          checked={enabled}
          description="Sell copies before they arrive. Release stage describes the music only: released music can still have physical copies on pre-order or read Coming Soon."
          onChange={(checked) => {
            if (!checked && preorder?.open) onEnd();
            else setEnabled(checked);
          }}
        />
        {enabled && (
          <>
            <p className="text-sm text-muted-foreground">
              For sale is how many people can pre-order. When the records arrive, press Copies arrived.
            </p>
            <SegmentedChoice
              label="When it ships"
              value={kind}
              options={[
                { value: 'month', label: 'About a month' },
                { value: 'date', label: 'Exact date' },
              ]}
              onChange={(next) => setKind(next as ShipEstimate['kind'])}
            />
            {kind === 'month' ? (
              <>
                <label className="grid min-w-0 gap-2" htmlFor={id + '-month'}>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                    Month
                  </span>
                  <select
                    id={id + '-month'}
                    className={selectClass}
                    value={month}
                    required
                    aria-describedby={id + '-help'}
                    onChange={(event) => setMonth(event.currentTarget.value)}
                  >
                    {months.map((value) => (
                      <option key={value} value={value}>
                        {monthLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <p id={id + '-help'} className="text-sm text-muted-foreground">
                  {!monthPassed && (
                    <>Shoppers see &quot;ships {shipEstimateText({ kind: 'month', month, part: null })}&quot;. </>
                  )}
                  The pre-order stays open until you press Copies arrived.
                </p>
                {monthPassed && (
                  <p role="alert" className="text-sm">
                    This month has passed. Shoppers see Pre-order without a date until you update it.
                  </p>
                )}
              </>
            ) : (
              <>
                <label className="grid min-w-0 gap-2" htmlFor={id + '-date'}>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                    Exact ship date
                  </span>
                  <Input
                    id={id + '-date'}
                    type="date"
                    className="min-h-11"
                    required
                    min={tomorrow.toISOString().slice(0, 10)}
                    value={date}
                    aria-describedby={id + '-help'}
                    onChange={(event) => setDate(event.currentTarget.value)}
                  />
                </label>
                <p id={id + '-help'} className="text-sm text-muted-foreground">
                  Shoppers see the date. On this date the pre-order ends by itself.
                </p>
                <p className="text-sm">
                  Enter an exact date only when you are sure of it. It ends the pre-order whether or not the copies
                  arrived.
                </p>
              </>
            )}
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={monthPassed}>
                <Save className="size-4" aria-hidden="true" />
                {busy ? 'Saving pre-order…' : 'Save pre-order'}
              </Button>
              {preorder?.open && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={onEnd}
                  aria-describedby={id + '-arrival'}
                >
                  <PackageCheck className="size-4" aria-hidden="true" />
                  Copies arrived
                </Button>
              )}
            </div>
            {preorder?.open && (
              <p id={id + '-arrival'} className="text-sm text-muted-foreground">
                Asks how many copies we have, then ends the pre-order. If the records are late, change the date instead:
                every waiting order gets an email.
              </p>
            )}
          </>
        )}
      </fieldset>
      <div className="mt-4 min-w-0 break-words text-sm" aria-live="polite">
        <p className="font-medium">What shoppers see</p>
        <ul className="mt-1 list-inside list-disc text-muted-foreground">
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </div>
    </form>
  );
}
