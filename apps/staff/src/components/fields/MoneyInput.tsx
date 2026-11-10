import { useEffect, useState } from 'react';
import { formatEuro, parseEuroAmount } from '@blackbox/content-model';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { useDraftProblem } from './draft-problems';

/** The amount part of a stored price, without the euro sign: 1250 → "12.50". */
export const euroText = (cents: number | null | undefined) =>
  typeof cents === 'number' ? formatEuro(cents).replace('€', '') : '';

/**
 * A euro amount typed with at most two decimals and stored as integer cents.
 * An amount that cannot be read stays visible with its message and is never stored.
 */
export default function MoneyInput({
  id,
  value,
  label,
  disabled = false,
  invalid = false,
  describedBy,
  path,
  onChange,
  onKeyDown,
  onBlur,
  className,
}: {
  id: string;
  value: number | null;
  /** Accessible name when no visible label points at `id`. */
  label?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  path?: string;
  /** Receives cents, or null when the field is cleared. */
  onChange(cents: number | null): void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?(): void;
  className?: string;
}) {
  const [text, setText] = useState(() => euroText(value));
  const [message, setMessage] = useState('');
  useDraftProblem(id, message);
  useEffect(() => {
    const parsed = parseEuroAmount(text);
    if (!(parsed.ok && parsed.value === value) && !(text === '' && value === null) && !message)
      setText(euroText(value));
  }, [value]);
  const showInvalid = invalid || Boolean(message);
  return (
    <div className={className}>
      <InputGroup className="h-11 min-w-0" data-disabled={disabled}>
        <InputGroupAddon aria-hidden="true">€</InputGroupAddon>
        <InputGroupInput
          id={id}
          data-content-path={path}
          inputMode="decimal"
          autoComplete="off"
          className="text-base tabular-nums"
          placeholder="0.00"
          aria-label={label}
          value={text}
          disabled={disabled}
          aria-invalid={showInvalid || undefined}
          aria-describedby={[describedBy, message ? `${id}-money` : ''].filter(Boolean).join(' ') || undefined}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (!next.trim()) {
              setMessage('');
              onChange(null);
              return;
            }
            const parsed = parseEuroAmount(next);
            setMessage(parsed.ok ? '' : parsed.message);
            if (parsed.ok) onChange(parsed.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (!message) setText(euroText(value));
            onBlur?.();
          }}
        />
      </InputGroup>
      {message && (
        <p id={`${id}-money`} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
