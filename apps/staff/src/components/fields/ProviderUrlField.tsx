import { useEffect, useState } from 'react';
import { Check, Link } from 'lucide-react';
import { parseHttpsUrl, parseServiceUrl, recognizeService, type LinkService } from '@blackbox/content-model';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { withHttps } from './field-values';
import { useDraftProblem } from './draft-problems';

type Reading = { ok: true; value: string; label: string | null } | { ok: false; message: string };

/** Reads a pasted link for one service, or any HTTPS page when `service` is "any". */
export function readServiceLink(service: LinkService | 'any', input: string, anyMessage: string): Reading {
  if (service !== 'any') return parseServiceUrl(service, input);
  const url = parseHttpsUrl(withHttps(input));
  return url
    ? { ok: true, value: url, label: recognizeService(url)?.label ?? null }
    : { ok: false, message: anyMessage };
}

/**
 * A link to a known service. It checks the address as it is pasted, names the recognised service,
 * and stores only an address that passes; a rejected paste stays visible with its message.
 */
export default function ProviderUrlField({
  path,
  label,
  service,
  value,
  required = true,
  description,
  anyMessage = 'Paste the full page address, starting with https://',
  errors = [],
  disabled = false,
  onChange,
  onBlur,
}: {
  path: string;
  label: string;
  service: LinkService | 'any';
  value: unknown;
  required?: boolean;
  description?: string;
  anyMessage?: string;
  errors?: string[];
  disabled?: boolean;
  onChange(value: string | null): void;
  onBlur?(): void;
}) {
  const stored = typeof value === 'string' ? value : '';
  const [text, setText] = useState(stored);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message && text !== stored) setText(stored);
  }, [stored]);
  useDraftProblem(path, message);
  const reading = text.trim() ? readServiceLink(service, text, anyMessage) : null;
  const recognised = reading?.ok ? reading.label : null;
  const id = `content-${path}`;
  const shown = message ? [message] : errors;
  return (
    <Field className="min-w-0" data-invalid={shown.length > 0}>
      <FieldLabel htmlFor={id} required={required} icon={Link}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        data-content-path={path}
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        className="min-h-11 text-base"
        value={text}
        disabled={disabled}
        aria-invalid={shown.length > 0 || undefined}
        aria-describedby={`${id}-status ${id}-error`}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          if (!next.trim()) {
            setMessage('');
            onChange(null);
            return;
          }
          const result = readServiceLink(service, next, anyMessage);
          setMessage(result.ok ? '' : result.message);
          if (result.ok) onChange(result.value);
        }}
        onBlur={() => {
          if (reading?.ok) setText(reading.value);
          onBlur?.();
        }}
      />
      <FieldDescription id={`${id}-status`} aria-live="polite">
        {recognised ? (
          <span className="inline-flex items-center gap-1.5 text-[var(--success,oklch(0.8_0.13_155))]">
            <Check aria-hidden="true" className="size-4" />
            {recognised}
          </span>
        ) : (
          (description ?? (required ? '' : 'Optional'))
        )}
      </FieldDescription>
      <FieldError id={`${id}-error`}>{shown.join(' ')}</FieldError>
    </Field>
  );
}
