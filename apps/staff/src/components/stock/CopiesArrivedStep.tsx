import { useState } from 'react';
import { PackageCheck } from 'lucide-react';
import CountStepper from '../fields/CountStepper';
import { Button } from '../ui/button';
import { splitCopies } from './copies';

/**
 * Ends a pre-order by first asking how many copies we have. It starts with the planned number, shows the split as
 * staff type, warns when fewer copies came than were sold, and offers to stop when the records did not come.
 */
export default function CopiesArrivedStep({
  planned,
  soldNotSent,
  unit,
  busy,
  onSave,
  onCancel,
}: {
  planned: number;
  soldNotSent: number;
  unit: string;
  busy: boolean;
  onSave(have: number): void;
  onCancel(): void;
}) {
  const [have, setHave] = useState<number | null>(planned);
  const [stopping, setStopping] = useState(false);
  const split = splitCopies(have ?? 0, soldNotSent);

  if (stopping)
    return (
      <section aria-labelledby="copies-arrived-stop" className="grid gap-3 border border-border p-4">
        <h3 id="copies-arrived-stop" className="text-base font-semibold">
          Stop the pre-order?
        </h3>
        <p>The shop stops selling this record. For sale becomes 0.</p>
        {soldNotSent > 0 && (
          <p>
            The people who paid keep their orders ({soldNotSent} {unit}). You can refund them in{' '}
            <a className="underline" href="/orders/">
              Orders
            </a>
            .
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="destructive" disabled={busy} onClick={() => onSave(0)}>
            Stop pre-order
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => setStopping(false)}>
            Keep it open
          </Button>
        </div>
      </section>
    );

  return (
    <form
      aria-labelledby="copies-arrived-title"
      className="grid gap-3 border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (have !== null && !busy) onSave(have);
      }}
    >
      <h3 id="copies-arrived-title" className="text-base font-semibold">
        Copies arrived
      </h3>
      <label htmlFor="copies-arrived-have" className="font-medium">
        How many {unit} do we have now?
      </label>
      <CountStepper
        id="copies-arrived-have"
        label={unit}
        value={have}
        min={0}
        invalid={split.short > 0}
        describedBy="copies-arrived-hint copies-arrived-split"
        disabled={busy}
        onChange={setHave}
        onClear={() => setHave(null)}
      />
      <p id="copies-arrived-hint" className="text-sm text-muted-foreground">
        We filled in the number you planned ({planned - soldNotSent} for sale + {soldNotSent} sold). Change it if the
        delivery was different.
      </p>
      {have !== null && split.short > 0 ? (
        <p id="copies-arrived-split" role="alert" className="border border-destructive p-3 text-sm">
          <strong>{split.short} short.</strong> {split.short} {split.short === 1 ? 'person' : 'people'} who pre-ordered
          will not get a copy. For sale becomes 0.{' '}
          <a className="underline" href="/orders/">
            See their orders
          </a>
        </p>
      ) : (
        <p id="copies-arrived-split" aria-live="polite" className="grid gap-0.5 border-l-4 border-primary pl-3">
          <span>
            <strong>{soldNotSent}</strong> for people who pre-ordered
          </span>
          <span>
            <strong>{have === null ? '-' : split.forSale}</strong> for sale
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy || have === null}>
          <PackageCheck aria-hidden="true" />
          {busy ? 'Saving…' : split.short > 0 ? 'Save anyway' : 'Save and end pre-order'}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
          Not yet
        </Button>
        <Button type="button" variant="link" disabled={busy} onClick={() => setStopping(true)}>
          The records did not come
        </Button>
      </div>
    </form>
  );
}
