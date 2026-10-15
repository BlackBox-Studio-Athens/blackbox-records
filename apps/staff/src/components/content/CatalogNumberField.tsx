import { useEffect, useState } from 'react';
import { Check, Hash } from 'lucide-react';
import {
  catalogNumberFromOrdinal,
  catalogNumberMessage,
  parseCatalogNumber,
  type CatalogNumber,
  type ReleaseCatalogNumbers,
} from '@blackbox/content-model';
import { readReleaseCatalogNumbers } from '../../lib/backend/editorial-api';
import { Button } from '../ui/button';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';

export type CatalogNumberStatus =
  | { kind: 'empty'; next: CatalogNumber | null }
  | { kind: 'invalid' }
  | { kind: 'checking' }
  | { kind: 'unchecked' }
  | { kind: 'current' }
  | { kind: 'taken'; title: string; draft: boolean }
  | { kind: 'free'; number: CatalogNumber };

/** `numbers` is undefined while the list loads and null when it could not be read; saving checks again either way. */
export function catalogNumberStatus(
  value: unknown,
  numbers: ReleaseCatalogNumbers | null | undefined,
  recordId?: string,
): CatalogNumberStatus {
  if (value === undefined || value === null || value === '')
    return { kind: 'empty', next: numbers?.nextFreeNumber ?? null };
  const number = parseCatalogNumber(value);
  if (!number) return { kind: 'invalid' };
  if (numbers === undefined) return { kind: 'checking' };
  if (numbers === null) return { kind: 'unchecked' };
  const users = numbers.items.filter((item) => item.catalogNumber === number);
  const other = users.find((item) => item.releaseId !== recordId);
  if (other)
    return {
      kind: 'taken',
      title: other.title,
      draft: !users.some((item) => item.releaseId === other.releaseId && item.status === 'published'),
    };
  return users.length ? { kind: 'current' } : { kind: 'free', number };
}

// The stored value is always canonical (BBR#005); the input holds only its digits.
const digitsOf = (value: unknown) =>
  parseCatalogNumber(value)?.slice(4) ?? (typeof value === 'string' ? value.replace(/\D/g, '') : '');

/** A release catalog number: a fixed BBR# prefix, digits only, live availability and the next free number. */
export default function CatalogNumberField({
  base,
  value,
  recordId,
  errors = [],
  disabled = false,
  onChange,
  onBlur,
}: {
  base: string;
  value: unknown;
  /** The release being edited, so its own number reads as current rather than taken. */
  recordId?: string | undefined;
  errors?: string[];
  disabled?: boolean;
  onChange(value: string): void;
  onBlur?(): void;
}) {
  const [numbers, setNumbers] = useState<ReleaseCatalogNumbers | null>();
  const [digits, setDigits] = useState(() => digitsOf(value));
  useEffect(() => {
    const controller = new AbortController();
    setNumbers(undefined);
    readReleaseCatalogNumbers(base, controller.signal).then(setNumbers, () => {
      if (!controller.signal.aborted) setNumbers(null);
    });
    return () => controller.abort();
  }, [base, recordId]);
  useEffect(() => {
    // Follow outside changes (another record, "Use next") without fighting what is being typed.
    if (digitsOf(value) !== digits && parseCatalogNumber(value) !== catalogNumberFromOrdinal(Number(digits)))
      setDigits(digitsOf(value));
  }, [value, digits]);
  const status = catalogNumberStatus(value, numbers, recordId);
  const next = status.kind === 'empty' || status.kind === 'taken' ? numbers?.nextFreeNumber : undefined;
  const invalid = status.kind === 'invalid' || status.kind === 'taken' || errors.length > 0;
  const id = 'content-catalog_number';
  function store(input: string) {
    const typed = input.replace(/\D/g, '').slice(0, 6);
    setDigits(typed);
    onChange(typed ? (catalogNumberFromOrdinal(Number(typed)) ?? `BBR#${typed}`) : '');
  }
  return (
    <Field className="min-w-0" data-invalid={invalid}>
      <FieldLabel htmlFor={id} required icon={Hash}>
        Catalog number
      </FieldLabel>
      <InputGroup className="h-11 max-w-sm" data-disabled={disabled}>
        <InputGroupAddon className="tracking-[0.06em] tabular-nums">BBR#</InputGroupAddon>
        <InputGroupInput
          id={id}
          data-content-path="catalog_number"
          className="tracking-[0.06em] tabular-nums"
          inputMode="numeric"
          autoComplete="off"
          placeholder="001"
          value={digits}
          disabled={disabled}
          aria-required
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-status ${id}-error`}
          onChange={(event) => store(event.target.value)}
          onBlur={() => {
            const number = parseCatalogNumber(value);
            if (number) setDigits(number.slice(4));
            onBlur?.();
          }}
        />
        {next && !disabled && (
          <InputGroupAddon align="inline-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDigits(next.slice(4));
                onChange(next);
              }}
            >
              Use {next}
            </Button>
          </InputGroupAddon>
        )}
      </InputGroup>
      <p id={`${id}-status`} aria-live="polite" className="text-sm text-muted-foreground">
        {status.kind === 'empty' && (status.next ? `Next free number is ${status.next}.` : 'Each release has its own.')}
        {status.kind === 'checking' && 'Checking numbers in use…'}
        {status.kind === 'unchecked' && 'Numbers in use could not be checked. Saving checks again.'}
        {status.kind === 'current' && "This release's current number."}
        {status.kind === 'free' && (
          <span className="inline-flex items-center gap-1.5 text-[var(--success,oklch(0.8_0.13_155))]">
            <Check aria-hidden="true" className="size-4" />
            {status.number} is free.
          </span>
        )}
      </p>
      <FieldError id={`${id}-error`}>
        {status.kind === 'invalid'
          ? catalogNumberMessage
          : status.kind === 'taken'
            ? `${parseCatalogNumber(value)} is already used by ${status.title}${status.draft ? ' (draft)' : ''}. Pick another number.`
            : errors.join(' ')}
      </FieldError>
    </Field>
  );
}
