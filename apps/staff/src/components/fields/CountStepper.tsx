import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { clampCount } from './field-values';

/** A whole number with − and + buttons and typed entry, held inside `min`…`max`. */
export default function CountStepper({
  id,
  label,
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  pad = 0,
  limitMessage,
  disabled = false,
  path,
  invalid = false,
  describedBy,
  onChange,
}: {
  id: string;
  /** Names the number for the − and + buttons, for example "hour". */
  label: string;
  value: number | null;
  min?: number;
  max?: number;
  step?: number;
  /** Shows at least this many digits, for example 2 for minutes. */
  pad?: number;
  /** Explains the upper limit when typing or + reaches it. */
  limitMessage?: string;
  disabled?: boolean;
  path?: string;
  invalid?: boolean;
  describedBy?: string;
  onChange(value: number): void;
}) {
  const show = (count: number | null) => (count === null ? '' : String(count).padStart(pad, '0'));
  const [text, setText] = useState(() => show(value));
  const [limited, setLimited] = useState<'min' | 'max' | null>(null);
  // Follow outside changes, such as minutes defaulting to 00 when the hour is set first;
  // a field the person just emptied keeps its blank text while they type.
  const emptied = useRef(false);
  useEffect(() => {
    if (text !== show(value) && !(emptied.current && text === '')) setText(show(value));
  }, [value]);
  function store(next: number) {
    const result = clampCount(next, min, max);
    setLimited(result.limited);
    setText(show(result.value));
    onChange(result.value);
  }
  const statusId = `${id}-limit`;
  return (
    <div className="grid gap-1">
      <div
        className="inline-flex min-h-11 w-fit items-stretch rounded-md border border-input aria-invalid:border-destructive"
        aria-invalid={invalid || undefined}
      >
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-11 rounded-none"
          disabled={disabled || (value !== null && value <= min)}
          aria-label={`Decrease ${label}`}
          onClick={() => store(value === null ? min : value - step)}
        >
          <Minus aria-hidden="true" className="size-4" />
        </Button>
        <Input
          id={id}
          data-content-path={path}
          inputMode="numeric"
          autoComplete="off"
          className="h-auto w-12 rounded-none border-0 border-x border-input text-center text-base tabular-nums shadow-none focus-visible:ring-inset"
          value={text}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, limited ? statusId : ''].filter(Boolean).join(' ') || undefined}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 9);
            emptied.current = digits === '';
            setText(digits);
            if (digits) store(Number(digits));
          }}
          onBlur={() => setText(show(value))}
        />
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-11 rounded-none"
          disabled={disabled || (value !== null && value >= max)}
          aria-label={`Increase ${label}`}
          onClick={() => store(value === null ? min : value + step)}
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <p id={statusId} aria-live="polite" className="text-sm text-muted-foreground empty:hidden">
        {limited === 'max' ? (limitMessage ?? `Up to ${max}.`) : limited === 'min' ? `At least ${min}.` : ''}
      </p>
    </div>
  );
}
